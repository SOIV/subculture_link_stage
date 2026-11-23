import { afterEach, describe, expect, it } from 'vitest';
import { eventPeriod, formatCardPeriod, formatRange } from './format';
import { eventSummary, schedule } from './test-fixtures';

const ORIGINAL_TZ = process.env.TZ;
afterEach(() => {
	process.env.TZ = ORIGINAL_TZ;
});

describe('formatRange — 자정을 넘는 시각 일정', () => {
	// 리뷰 R05 재현값: 실행 환경 UTC, KST 11/23 23:30 ~ 11/24 00:30.
	const kst = {
		startsAt: '2026-11-23T14:30:00Z',
		endsAt: '2026-11-23T15:30:00Z',
		isAllDay: false,
		timezone: 'Asia/Seoul'
	};

	it.each(['UTC', 'Asia/Seoul', 'America/Los_Angeles'])(
		'실행 환경 시간대(%s)와 상관없이 끝 날짜(11/24)를 보여준다',
		(tz) => {
			process.env.TZ = tz;
			const text = formatRange('en', kst);
			expect(text).toContain('Nov 23');
			expect(text).toContain('Nov 24');
			expect(text).toContain('(KST)');
		}
	);

	it('JST 자정 넘김도 같다', () => {
		const text = formatRange('en', { ...kst, timezone: 'Asia/Tokyo' });
		expect(text).toContain('Nov 24');
		expect(text).toContain('(JST)');
	});

	it('같은 날(일정 시간대 기준)이면 끝은 시각만 붙인다', () => {
		const text = formatRange('en', {
			startsAt: '2026-11-23T01:00:00Z', // KST 10:00
			endsAt: '2026-11-23T09:00:00Z', // KST 18:00
			isAllDay: false,
			timezone: 'Asia/Seoul'
		});
		expect(text.match(/Nov 23/g)).toHaveLength(1);
		expect(text).toMatch(/~ 06:00 PM \(KST\)$/);
	});
});

describe('종일 일정의 배타적 종료', () => {
	// 리뷰 R06 재현값: 뉴욕 종일 3/7~3/8(배타적 종료 3/9 0시), 그 사이에 서머타임 시작.
	const newYork = {
		startsAt: '2026-03-07T05:00:00Z',
		endsAt: '2026-03-09T04:00:00Z',
		isAllDay: true,
		timezone: 'America/New_York'
	};

	it('서머타임 전환이 끼어도 마지막 날(3/8)을 보여준다', () => {
		expect(formatRange('en', newYork)).toBe('Sat, Mar 7, 2026 ~ Sun, Mar 8, 2026');
	});

	it('카드 기간도 같다', () => {
		expect(formatCardPeriod('en', newYork, new Date('2026-01-01T00:00:00Z'))).toMatch(
			/^Sat, March 7\s–\sSun, March 8, 2026$/
		);
	});

	it('하루짜리 종일 일정은 날짜 하나', () => {
		expect(
			formatRange('ko', {
				startsAt: '2026-11-22T15:00:00Z',
				endsAt: '2026-11-23T15:00:00Z',
				isAllDay: true,
				timezone: 'Asia/Seoul'
			})
		).toBe('2026년 11월 23일 (월)');
	});

	it('한국 종일 2일 행사', () => {
		expect(
			formatRange('ko', {
				startsAt: '2026-11-22T15:00:00Z',
				endsAt: '2026-11-24T15:00:00Z',
				isAllDay: true,
				timezone: 'Asia/Seoul'
			})
		).toBe('2026년 11월 23일 (월) ~ 2026년 11월 24일 (화)');
	});
});

describe('eventPeriod — 대표 기간의 빈 칸', () => {
	const topLevel = {
		startsAt: '2026-11-30T15:00:00Z', // KST 12/1
		endsAt: '2026-12-03T15:00:00Z', // 배타적 종료 → 마지막 날 12/3
		isAllDay: true
	};

	it('시작 일정에 종료가 없으면 최상위 종료를 쓴다(리뷰 R08 재현값)', () => {
		const event = eventSummary({
			...topLevel,
			schedules: [
				schedule({
					type: 'EVENT_START',
					startsAt: '2026-11-30T15:00:00Z',
					endsAt: null,
					isAllDay: true
				})
			]
		});
		expect(eventPeriod(event)).toEqual({ ...topLevel, timezone: 'Asia/Seoul' });
	});

	it('시작 일정의 시작이 비어 있으면 최상위 기간을 쓴다', () => {
		const event = eventSummary({
			...topLevel,
			countryCode: null,
			schedules: [schedule({ type: 'EVENT_START', timezone: 'Asia/Tokyo' })]
		});
		expect(eventPeriod(event)).toEqual({ ...topLevel, timezone: 'Asia/Tokyo' });
	});

	it('종일/시각 방식이 다르면 섞지 않고 최상위 기간 전체를 쓴다', () => {
		const event = eventSummary({
			...topLevel,
			schedules: [
				schedule({ type: 'EVENT_START', startsAt: '2026-12-01T01:00:00Z', isAllDay: false })
			]
		});
		expect(eventPeriod(event)).toMatchObject(topLevel);
	});

	it('완전한 시작 일정은 그대로 쓴다', () => {
		const start = schedule({
			type: 'EVENT_START',
			startsAt: '2026-12-01T01:00:00Z',
			endsAt: '2026-12-01T09:00:00Z',
			timezone: 'Asia/Tokyo'
		});
		const event = eventSummary({ ...topLevel, schedules: [start] });
		expect(eventPeriod(event)).toEqual({
			startsAt: start.startsAt,
			endsAt: start.endsAt,
			isAllDay: false,
			timezone: 'Asia/Tokyo'
		});
	});
});
