// SCLS 공개 API(`/v1`)의 얇은 클라이언트. Onstage는 이 공개 API만 소비하고 내부 DB나
// Private `scls-platform`의 패키지에는 전혀 접근하지 않는다(docs/plan/03-architecture-and-domain.md
// §3.2.1). 응답 형태는 scls-platform의 apps/api/src/routes/public-*.ts, lib/public-event-shape.ts를
// 그대로 따른다 — 필드를 추가/변경하면 그쪽과 여기를 함께 맞춰야 한다.
import { browser } from '$app/environment';
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
	/** 판매가 "소진 시 마감"인지(마감일이 없거나 그 전에 끝날 수 있음). 이전 API 응답에는 없을 수 있다. */
	untilSoldOut?: boolean;
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

/** 시리즈 카드에 보여줄 회차 하나(다음 회차·최근 회차). 자세한 내용은 /events/{slug}로 본다. */
export type EventSeriesEventRef = {
	id: string;
	slug: string;
	status: EventStatus;
	title: string | null;
	countryCode: string | null;
	isOnline: boolean;
	startsAt: string | null;
	endsAt: string | null;
	isAllDay: boolean;
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
	/** 회차 개최국(최근 회차부터, 중복 없이). 온라인 전용 회차는 국가가 없어 빠진다. */
	countryCodes: string[];
	/** 공개 회차 수(끝난·취소 회차 포함). */
	eventCount: number;
	/** 아직 끝나지 않은 가장 이른 확정 회차, 없으면 연기 회차. */
	nextEvent: EventSeriesEventRef | null;
	/** 가장 늦게 시작한 끝난 회차(취소 제외). */
	latestEvent: EventSeriesEventRef | null;
	/** 공개 회차들의 태그 slug(카드 분류 칩). */
	tags: string[];
};

export type EventSeriesDetail = EventSeriesSummary & { description: string | null };

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

/**
 * API 호출 실패. code로 원인을 구분한다:
 * - API가 돌려준 오류 코드(예: EVENT_NOT_FOUND, VALIDATION_ERROR) — status는 HTTP 상태
 * - HTTP_<상태>: 오류 응답이 API 형식이 아님(프록시의 HTML 5xx·429 등)
 * - NETWORK_ERROR: 응답을 받지 못함(status 0)
 * - TIMEOUT: REQUEST_TIMEOUT_MS 안에 끝나지 않음(status 0)
 * - INVALID_RESPONSE: 성공 응답인데 JSON이 아니거나 모양이 다름
 */
export class ScLsApiError extends Error {
	constructor(
		public readonly code: string,
		public readonly status: number,
		options?: { cause?: unknown }
	) {
		super(`SCLS API error: ${code} (${status})`, options);
	}

	/** 사용자가 넣은 조건이 잘못된 경우(400·422). 서버 장애와 달리 입력을 고치라고 안내한다. */
	get isClientInput(): boolean {
		return this.status === 400 || this.status === 422;
	}
}

// 첫 화면(SSR)과 캐시 없는 화면 이동이 외부 API 지연에 끝없이 묶이지 않게 한다. service worker는
// 저장본이 있으면 4초 뒤에 저장본을 돌려주므로 이보다 짧으면 안 된다.
const REQUEST_TIMEOUT_MS = 10_000;

type Validator<T> = (data: unknown) => data is T;

function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function isEnvelope(body: unknown): body is ApiEnvelope<unknown> {
	if (!isObject(body)) return false;
	if (body.success === true) return 'data' in body;
	return body.success === false && typeof body.error === 'string';
}

/** { count, items: [] } 모양의 목록 응답. 항목 하나하나는 검사하지 않는다(계약은 scls-platform과 함께 맞춘다). */
function isList<T>(data: unknown): data is { count: number; items: T[] } {
	return isObject(data) && Array.isArray(data.items);
}

function isEventDetail(data: unknown): data is EventDetail {
	return isObject(data) && typeof data.slug === 'string' && Array.isArray(data.schedules);
}

async function request<T>(url: URL, fetchFn: typeof fetch, validate: Validator<T>): Promise<T> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
	try {
		let res: Response;
		try {
			res = await fetchFn(url, { signal: controller.signal });
		} catch (cause) {
			throw new ScLsApiError(controller.signal.aborted ? 'TIMEOUT' : 'NETWORK_ERROR', 0, { cause });
		}

		let body: unknown = null;
		if (res.headers.get('content-type')?.includes('json')) {
			try {
				body = await res.json();
			} catch (cause) {
				if (controller.signal.aborted) throw new ScLsApiError('TIMEOUT', 0, { cause });
				body = null;
			}
		}

		if (!res.ok) {
			// 오류 응답이 API 형식이면 그 코드를, 아니면 HTTP 상태로 구분한다.
			const code = isEnvelope(body) && !body.success ? body.error : `HTTP_${res.status}`;
			throw new ScLsApiError(code, res.status);
		}
		if (!isEnvelope(body)) throw new ScLsApiError('INVALID_RESPONSE', res.status);
		if (!body.success) throw new ScLsApiError(body.error, res.status);
		if (!validate(body.data)) throw new ScLsApiError('INVALID_RESPONSE', res.status);
		return body.data;
	} finally {
		clearTimeout(timer);
	}
}

/** 화면에 꼭 필요하지 않은 데이터(태그 이름, 시리즈 이름 등). 못 받아도 본문은 보여주도록 fallback을 쓴다. */
export async function orFallback<T>(promise: Promise<T>, fallback: T): Promise<T> {
	try {
		return await promise;
	} catch (error) {
		console.warn('[scls] 부가 데이터를 받지 못해 기본값을 씁니다', error);
		return fallback;
	}
}

/** orFallback에 쓰는 빈 목록. */
export function emptyList<T>(): { count: number; items: T[] } {
	return { count: 0, items: [] };
}

// 태그·시리즈 목록은 자주 바뀌지 않는데 화면을 옮길 때마다 다시 받았다. 브라우저에서는 언어별로 잠시
// 재사용하고, 같은 요청이 동시에 나가면 하나로 합친다. 서버(SSR)에서는 요청끼리 모듈이 공유되므로 쓰지
// 않는다 — 그리고 SSR에서 load의 fetch로 받은 응답은 HTML에 실려 하이드레이션 때 다시 받지 않는다.
const SHARED_TTL_MS = 10 * 60 * 1000;
const shared = new Map<string, { at: number; promise: Promise<unknown> }>();

function sharedRequest<T>(key: string, load: () => Promise<T>): Promise<T> {
	if (!browser) return load();
	const hit = shared.get(key);
	if (hit && Date.now() - hit.at < SHARED_TTL_MS) return hit.promise as Promise<T>;
	const promise = load();
	shared.set(key, { at: Date.now(), promise });
	promise.catch(() => {
		if (shared.get(key)?.promise === promise) shared.delete(key);
	});
	return promise;
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
	return request(url, fetchFn, isList<EventSummary>);
}

/** 존재하지 않거나(잘못된 slug) 공개 대상이 아닌(DRAFT/취소 등) 행사는 null이다. */
export async function getEvent(fetchFn: typeof fetch, slug: string, locale: Locale) {
	const url = buildUrl(`/events/${encodeURIComponent(slug)}`, { locale });
	try {
		return await request(url, fetchFn, isEventDetail);
	} catch (error) {
		if (error instanceof ScLsApiError && error.code === 'EVENT_NOT_FOUND') return null;
		throw error;
	}
}

export async function listEventSeries(fetchFn: typeof fetch, locale: Locale) {
	const url = buildUrl('/event-series', { locale });
	return sharedRequest(url.href, () => request(url, fetchFn, isList<EventSeriesSummary>));
}

function isSeriesDetail(data: unknown): data is EventSeriesDetail {
	return isObject(data) && typeof data.slug === 'string';
}

/** 시리즈 상세. 없는(또는 공개하지 않는) 시리즈는 null. */
export async function getEventSeries(fetchFn: typeof fetch, slug: string, locale: Locale) {
	const url = buildUrl(`/event-series/${encodeURIComponent(slug)}`, { locale });
	try {
		return await request(url, fetchFn, isSeriesDetail);
	} catch (error) {
		if (error instanceof ScLsApiError && error.code === 'EVENT_SERIES_NOT_FOUND') return null;
		throw error;
	}
}

/** 시리즈의 회차 목록(연혁용 — 끝난·취소 회차 포함, 기본은 최근 회차부터). 없는 시리즈는 null. */
export async function listEventSeriesEvents(
	fetchFn: typeof fetch,
	slug: string,
	locale: Locale,
	options: { order?: 'asc' | 'desc' } = {}
) {
	const url = buildUrl(`/event-series/${encodeURIComponent(slug)}/events`, {
		locale,
		order: options.order
	});
	try {
		return await request(url, fetchFn, isList<EventSummary>);
	} catch (error) {
		if (error instanceof ScLsApiError && error.code === 'EVENT_SERIES_NOT_FOUND') return null;
		throw error;
	}
}

export async function listVenues(fetchFn: typeof fetch, locale: Locale, country?: string) {
	const url = buildUrl('/venues', { locale, country });
	return request(url, fetchFn, isList<Venue>);
}

export async function listTagGroups(fetchFn: typeof fetch, locale: Locale) {
	const url = buildUrl('/tags', { locale });
	return sharedRequest(url.href, () => request(url, fetchFn, isList<TagGroup>));
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
