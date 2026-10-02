// SCLS 공개 API(`/v1`)의 얇은 클라이언트. Onstage는 이 공개 API만 소비하고 내부 DB나
// Private `scls-platform`의 패키지에는 전혀 접근하지 않는다(docs/plan/03-architecture-and-domain.md
// §3.2.1). 응답 형태는 scls-platform의 apps/api/src/routes/public-*.ts, lib/public-event-shape.ts를
// 그대로 따른다 — 필드를 추가/변경하면 그쪽과 여기를 함께 맞춰야 한다.
import { PUBLIC_API_BASE_URL } from '$env/static/public';
import type { Locale } from './i18n';

type ApiEnvelope<T> =
	{ success: true; data: T } | { success: false; error: string; issues?: unknown };

export type EventStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED' | 'POSTPONED' | 'ENDED' | 'ARCHIVED';

export type EventScheduleType =
	| 'EVENT_START'
	| 'EVENT_END'
	| 'TICKET_OPEN'
	| 'TICKET_CLOSE'
	| 'LOTTERY_OPEN'
	| 'LOTTERY_CLOSE'
	| 'LOTTERY_RESULT'
	| 'REGISTRATION_OPEN'
	| 'REGISTRATION_CLOSE'
	| 'STREAM_START'
	| 'STREAM_END'
	| 'ARCHIVE_END'
	| 'MERCH_OPEN'
	| 'MERCH_CLOSE'
	| 'ANNOUNCEMENT';

export type EventUrlType = 'OFFICIAL_SITE' | 'TICKET' | 'STREAMING' | 'SNS' | 'PRESS' | 'OTHER';

/** 티켓 판매 대상. "해외"는 개최국 기준이다. */
export type TicketAudience = 'DOMESTIC' | 'OVERSEAS';

export type EventScheduleItem = {
	type: EventScheduleType;
	/** 같은 종류의 일정을 구별하는 짧은 이름(예: "프리리저브"). 없으면 null. */
	title: string | null;
	/** 티켓 판매 일정의 대상. null이면 전체. */
	audience: TicketAudience | null;
	startsAt: string | null;
	endsAt: string | null;
	timezone: string;
	isAllDay: boolean;
	status: string;
};

export type EventTranslation = {
	source: string;
	status: string;
	sourceLocale: string | null;
} | null;

export type EventVenueSummary = { id: string; slug: string; name: string };
export type EventVenueDetail = EventVenueSummary & {
	address: string | null;
	latitude: number | null;
	longitude: number | null;
	officialUrl: string | null;
};

export type EventSummary = {
	id: string;
	slug: string;
	status: EventStatus;
	locale: Locale;
	title: string | null;
	summary: string | null;
	translation: EventTranslation;
	countryCode: string | null;
	isOnline: boolean;
	startsAt: string | null;
	endsAt: string | null;
	isAllDay: boolean;
	venue: EventVenueSummary | null;
	eventSeries: { id: string; slug: string } | null;
	schedules: EventScheduleItem[];
	tags: string[];
	officialUrl: string;
};

export type TicketType = {
	id: string;
	name: string;
	/** 통화 코드 → 금액(예: { KRW: 329000, JPY: 35000 }). 가격을 모르면 비어 있다. */
	prices: Record<string, number>;
	note: string | null;
};

export type TicketChannel = {
	id: string;
	name: string;
	url: string | null;
	audience: TicketAudience;
	note: string | null;
};

// venue만 상세 형태(주소·좌표 포함)로 넓히고, 상세에서만 권종·예매처(ticket)를 준다(scls-platform의
// toPublicEventDetail과 대응).
export type EventDetail = Omit<EventSummary, 'venue'> & {
	venue: EventVenueDetail | null;
	description: string | null;
	organizers: { id: string; slug: string; name: string; role: string }[];
	urls: { type: EventUrlType; url: string; label: string | null; isPrimary: boolean }[];
	ticket: { types: TicketType[]; channels: TicketChannel[] };
};

export type EventSeriesSummary = {
	id: string;
	slug: string;
	status: string;
	locale: Locale;
	title: string | null;
	summary: string | null;
	foundedYear: number | null;
	officialUrl: string | null;
};

export type Venue = {
	id: string;
	slug: string;
	name: string;
	countryCode: string;
	address: string | null;
	latitude: number | null;
	longitude: number | null;
	officialUrl: string | null;
};

export type Tag = { id: string; slug: string; name: string; parentTagId: string | null };
export type TagGroup = { id: string; slug: string; name: string; tags: Tag[] };

function buildUrl(path: string, params: Record<string, string | undefined> = {}) {
	const url = new URL(PUBLIC_API_BASE_URL.replace(/\/$/, '') + path);
	for (const [key, value] of Object.entries(params)) {
		if (value !== undefined && value !== '') url.searchParams.set(key, value);
	}
	return url;
}

class ScLsApiError extends Error {
	constructor(
		public readonly code: string,
		public readonly status: number
	) {
		super(`SCLS API error: ${code} (${status})`);
	}
}

async function request<T>(url: URL, fetchFn: typeof fetch): Promise<T> {
	const res = await fetchFn(url);
	const body = (await res.json()) as ApiEnvelope<T>;
	if (!body.success) throw new ScLsApiError(body.error, res.status);
	return body.data;
}

export type EventListFilters = {
	locale: Locale;
	/** 이름 검색어. 모든 언어의 제목과 slug에서 부분 일치로 찾는다. */
	q?: string;
	country?: string;
	/** 쉼표로 구분한 태그 slug. 같은 그룹의 태그끼리는 "또는", 서로 다른 그룹 사이는 "그리고"다. */
	tags?: string;
	from?: string;
	to?: string;
};

export async function listEvents(fetchFn: typeof fetch, filters: EventListFilters) {
	const url = buildUrl('/events', filters);
	return request<{ count: number; items: EventSummary[] }>(url, fetchFn);
}

/** 존재하지 않거나(잘못된 slug) 공개 대상이 아닌(DRAFT/취소 등) 행사는 null이다. */
export async function getEvent(fetchFn: typeof fetch, slug: string, locale: Locale) {
	const url = buildUrl(`/events/${encodeURIComponent(slug)}`, { locale });
	try {
		return await request<EventDetail>(url, fetchFn);
	} catch (error) {
		if (error instanceof ScLsApiError && error.code === 'EVENT_NOT_FOUND') return null;
		throw error;
	}
}

export async function listEventSeries(fetchFn: typeof fetch, locale: Locale) {
	const url = buildUrl('/event-series', { locale });
	return request<{ count: number; items: EventSeriesSummary[] }>(url, fetchFn);
}

export async function listVenues(fetchFn: typeof fetch, locale: Locale, country?: string) {
	const url = buildUrl('/venues', { locale, country });
	return request<{ count: number; items: Venue[] }>(url, fetchFn);
}

export async function listTagGroups(fetchFn: typeof fetch, locale: Locale) {
	const url = buildUrl('/tags', { locale });
	return request<{ count: number; items: TagGroup[] }>(url, fetchFn);
}

/** /v1/calendars/*.ics URL을 만든다. kind는 'all' | 'online' | 2글자 국가 코드 | 'custom'. */
export function icsUrl(
	kind: 'all' | 'online' | 'custom' | string,
	filters: Partial<EventListFilters> = {}
) {
	const file =
		kind === 'all' || kind === 'online' || kind === 'custom'
			? `${kind}.ics`
			: `${kind.toLowerCase()}.ics`;
	return buildUrl(`/calendars/${file}`, kind === 'custom' ? filters : { locale: filters.locale });
}
