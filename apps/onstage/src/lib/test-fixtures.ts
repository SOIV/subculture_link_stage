// 단위 테스트용 행사·일정 데이터를 만든다. 테스트에서만 쓴다.
import type { EventDetail, EventScheduleItem, EventSummary } from './api';

export function schedule(overrides: Partial<EventScheduleItem> = {}): EventScheduleItem {
	return {
		type: 'TICKET_OPEN',
		title: null,
		audience: null,
		startsAt: null,
		endsAt: null,
		timezone: 'Asia/Seoul',
		isAllDay: false,
		status: 'SCHEDULED',
		...overrides
	};
}

export function eventSummary(overrides: Partial<EventSummary> = {}): EventSummary {
	return {
		id: 'event-1',
		slug: 'test-event',
		status: 'CONFIRMED',
		locale: 'ko',
		title: '테스트 행사',
		summary: null,
		translation: null,
		countryCode: 'KR',
		isOnline: false,
		startsAt: null,
		endsAt: null,
		isAllDay: false,
		venue: null,
		eventSeries: null,
		schedules: [],
		tags: [],
		officialUrl: 'https://example.com',
		...overrides
	};
}

export function eventDetail(overrides: Partial<EventDetail> = {}): EventDetail {
	return {
		...eventSummary(),
		venue: {
			id: 'v1',
			slug: 'coex',
			name: 'COEX',
			address: null,
			latitude: null,
			longitude: null,
			officialUrl: null
		},
		description: null,
		organizers: [],
		urls: [],
		ticket: { types: [], channels: [] },
		...overrides
	};
}
