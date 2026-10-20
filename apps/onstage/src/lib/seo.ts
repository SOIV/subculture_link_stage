// 검색엔진·링크 미리보기용 메타 정보. 각 페이지의 load가 PageSeo를 `seo`로 돌려주면
// [[lang=lang]]/+layout.svelte가 한 곳에서 <head>에 그린다(페이지마다 <title>·description을
// 따로 쓰면 태그가 겹친다).
import type { EventDetail } from './api';
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
 * 행사 상세의 schema.org Event 구조화 데이터. 검색엔진이 행사 정보를 읽을 수 있게 하는 용도라
 * 필수 항목(시작 일시, 오프라인이면 장소)이 없으면 틀린 값을 만들지 않고 null을 돌려준다.
 */
export function eventJsonLd(event: EventDetail, url: string): Record<string, unknown> | null {
	if (!event.startsAt) return null;

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
		startDate: event.startsAt,
		...(event.endsAt ? { endDate: event.endsAt } : {}),
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
