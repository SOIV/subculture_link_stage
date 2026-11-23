// 검색엔진·링크 미리보기용 메타 정보. 각 페이지의 load가 PageSeo를 `seo`로 돌려주면
// [[lang=lang]]/+layout.svelte가 한 곳에서 <head>에 그린다(페이지마다 <title>·description을
// 따로 쓰면 태그가 겹친다).
import type { EventDetail } from './api';
import { dayKey, inclusiveAllDayEnd } from './dates';
import { eventPeriod, type TimeRange } from './format';
import type { Locale } from './i18n';

export type PageSeo = {
	/** 사이트 이름 앞에 붙는 페이지 제목. 없으면 사이트 이름만 쓴다. */
	title?: string;
	/** 없으면 사이트 소개 문구(site.tagline)를 쓴다. */
	description?: string;
	/** 검색 결과 같은 조건별 페이지처럼 색인에 넣지 않을 페이지. */
	noindex?: boolean;
};

export const OG_LOCALE: Record<Locale, string> = { ko: 'ko_KR', ja: 'ja_JP', en: 'en_US' };

const DESCRIPTION_MAX_LENGTH = 160;

/** 줄바꿈과 겹친 공백을 접고 160자 안으로 줄인다(검색 결과·링크 미리보기에서 잘리는 길이). */
export function metaDescription(text: string): string {
	const flat = text.replace(/\s+/g, ' ').trim();
	if (flat.length <= DESCRIPTION_MAX_LENGTH) return flat;
	return flat.slice(0, DESCRIPTION_MAX_LENGTH - 1).trimEnd() + '…';
}

const EVENT_STATUS_URL: Record<string, string> = {
	CANCELLED: 'https://schema.org/EventCancelled',
	POSTPONED: 'https://schema.org/EventPostponed'
};

/**
 * JSON-LD의 startDate/endDate. 화면과 같은 대표 기간(eventPeriod)을 쓴다. 종일 행사는 시각 없이 그
 * 행사 시간대의 날짜(YYYY-MM-DD)로, 끝은 배타적 종료가 아니라 실제 마지막 날로 적는다(Google 행사
 * 구조화 데이터의 날짜만 아는 행사 형식). 시각이 있는 행사는 정확한 시각을 그대로 쓴다.
 */
export function jsonLdDates(range: TimeRange): { startDate: string; endDate?: string } | null {
	if (!range.startsAt) return null;
	if (!range.isAllDay) {
		return { startDate: range.startsAt, ...(range.endsAt ? { endDate: range.endsAt } : {}) };
	}
	const startDate = dayKey(new Date(range.startsAt), range.timezone);
	if (!range.endsAt) return { startDate };
	const endDate = dayKey(inclusiveAllDayEnd(new Date(range.endsAt)), range.timezone);
	return endDate > startDate ? { startDate, endDate } : { startDate };
}

/**
 * 행사 상세의 schema.org Event 구조화 데이터. 검색엔진이 행사 정보를 읽을 수 있게 하는 용도라
 * 필수 항목(시작 일시, 오프라인이면 장소)이 없으면 틀린 값을 만들지 않고 null을 돌려준다.
 * 장소 주소가 없으면 schema.org로는 맞지만 Google 행사 검색 결과의 필수 항목(location.address)은
 * 채우지 못한다 — 주소는 Backstage에서 장소에 넣는다.
 */
export function eventJsonLd(event: EventDetail, url: string): Record<string, unknown> | null {
	const dates = jsonLdDates(eventPeriod(event));
	if (!dates) return null;

	const location = event.isOnline
		? { '@type': 'VirtualLocation', url: event.officialUrl }
		: event.venue
			? {
					'@type': 'Place',
					name: event.venue.name,
					...(event.venue.address ? { address: event.venue.address } : {}),
					...(event.venue.latitude != null && event.venue.longitude != null
						? {
								geo: {
									'@type': 'GeoCoordinates',
									latitude: event.venue.latitude,
									longitude: event.venue.longitude
								}
							}
						: {})
				}
			: null;
	if (!location) return null;

	return {
		'@context': 'https://schema.org',
		'@type': 'Event',
		name: event.title ?? event.slug,
		url,
		...(event.summary ? { description: metaDescription(event.summary) } : {}),
		...dates,
		eventStatus: EVENT_STATUS_URL[event.status] ?? 'https://schema.org/EventScheduled',
		eventAttendanceMode: event.isOnline
			? 'https://schema.org/OnlineEventAttendanceMode'
			: 'https://schema.org/OfflineEventAttendanceMode',
		location
	};
}

/** `{@html}`로 <head>에 넣을 JSON-LD <script> 태그. `<`를 이스케이프해 데이터가 </script>로 빠져나가지 못하게 한다. */
export function jsonLdScript(data: Record<string, unknown>): string {
	const json = JSON.stringify(data).replace(/</g, '\\u003c');
	return `<script type="application/ld+json">${json}</script>`;
}
