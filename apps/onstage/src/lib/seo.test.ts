import { describe, expect, it } from 'vitest';
import { eventJsonLd } from './seo';
import { eventDetail, schedule } from './test-fixtures';

describe('JSON-LD 날짜', () => {
	it('종일 행사는 현지 날짜와 실제 마지막 날로 적는다(리뷰 R12 재현값)', () => {
		const event = eventDetail({
			startsAt: '2026-11-22T15:00:00Z',
			endsAt: '2026-11-24T15:00:00Z',
			isAllDay: true
		});
		expect(eventJsonLd(event, 'https://x.test/events/a')).toMatchObject({
			startDate: '2026-11-23',
			endDate: '2026-11-24'
		});
	});

	it('하루짜리 종일 행사는 endDate가 없다', () => {
		const event = eventDetail({
			startsAt: '2026-11-22T15:00:00Z',
			endsAt: '2026-11-23T15:00:00Z',
			isAllDay: true
		});
		const data = eventJsonLd(event, 'https://x.test/events/a');
		expect(data).toMatchObject({ startDate: '2026-11-23' });
		expect(data).not.toHaveProperty('endDate');
	});

	it('시각이 있는 행사는 화면과 같은 대표 기간(EVENT_START)의 시각을 쓴다', () => {
		const event = eventDetail({
			startsAt: '2026-11-22T15:00:00Z',
			endsAt: '2026-11-24T15:00:00Z',
			isAllDay: true,
			schedules: [
				schedule({
					type: 'EVENT_START',
					startsAt: '2026-11-23T01:00:00Z',
					endsAt: '2026-11-24T09:00:00Z'
				})
			]
		});
		expect(eventJsonLd(event, 'https://x.test/events/a')).toMatchObject({
			startDate: '2026-11-23T01:00:00Z',
			endDate: '2026-11-24T09:00:00Z'
		});
	});

	it('날짜를 모르면 만들지 않는다', () => {
		expect(eventJsonLd(eventDetail(), 'https://x.test/events/a')).toBeNull();
	});
});
