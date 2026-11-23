import { describe, expect, it } from 'vitest';
import { hasEnded, isUpcomingOrOngoing, nextSchedule, upcomingActionSchedules } from './schedule';
import { eventSummary, schedule } from './test-fixtures';

// KST 2026-11-23 12:00
const NOW = new Date('2026-11-23T03:00:00Z');
const TOMORROW_KST = '2026-11-24T01:00:00Z';

describe('취소·종료된 일정', () => {
	it('취소된 티켓 일정은 티켓·신청 일정에서 뺀다(리뷰 R07 재현값)', () => {
		const event = eventSummary({
			schedules: [schedule({ type: 'TICKET_OPEN', startsAt: TOMORROW_KST, status: 'CANCELLED' })]
		});
		expect(upcomingActionSchedules([event], NOW, 6)).toEqual([]);
	});

	it('매진 등으로 일찍 끝난(COMPLETED) 미래 일정도 뺀다', () => {
		const event = eventSummary({
			schedules: [schedule({ type: 'TICKET_OPEN', startsAt: TOMORROW_KST, status: 'COMPLETED' })]
		});
		expect(upcomingActionSchedules([event], NOW, 6)).toEqual([]);
		expect(nextSchedule(event, NOW)).toBeNull();
	});

	it('카드의 다음 일정은 취소된 일정을 건너뛰고 그다음 일정을 고른다', () => {
		const later = schedule({ type: 'LOTTERY_RESULT', startsAt: '2026-11-30T01:00:00Z' });
		const event = eventSummary({
			schedules: [
				schedule({ type: 'TICKET_OPEN', startsAt: TOMORROW_KST, status: 'CANCELLED' }),
				later
			]
		});
		expect(nextSchedule(event, NOW)).toMatchObject({ kind: 'upcoming', schedule: later, days: 7 });
	});

	it('연기된 일정은 남겨 둔다(화면이 D-day 대신 "연기"로 표시)', () => {
		const postponed = schedule({
			type: 'TICKET_OPEN',
			startsAt: TOMORROW_KST,
			status: 'POSTPONED'
		});
		const event = eventSummary({ schedules: [postponed] });
		expect(upcomingActionSchedules([event], NOW, 6)).toHaveLength(1);
		expect(nextSchedule(event, NOW)).toMatchObject({ kind: 'upcoming', schedule: postponed });
	});

	it('취소된 행사의 일정은 추천하지 않는다', () => {
		const event = eventSummary({
			status: 'CANCELLED',
			startsAt: TOMORROW_KST,
			schedules: [schedule({ type: 'TICKET_OPEN', startsAt: TOMORROW_KST })]
		});
		expect(upcomingActionSchedules([event], NOW, 6)).toEqual([]);
		expect(nextSchedule(event, NOW)).toBeNull();
		expect(isUpcomingOrOngoing(event, NOW)).toBe(false);
	});
});

describe('D-day는 일정 시간대의 날짜로 센다', () => {
	it('KST 자정 직전과 직후', () => {
		const event = eventSummary({
			schedules: [schedule({ type: 'TICKET_OPEN', startsAt: '2026-11-23T15:00:00Z' })] // KST 11/24 00:00
		});
		// KST 11/23 23:59 → D-1, KST 11/24 00:00 → 오늘
		expect(upcomingActionSchedules([event], new Date('2026-11-23T14:59:00Z'), 6)[0].days).toBe(1);
		expect(upcomingActionSchedules([event], new Date('2026-11-23T15:00:00Z'), 6)[0].days).toBe(0);
	});
});

describe('대표 기간의 빈 칸(리뷰 R08 재현값)', () => {
	const event = eventSummary({
		startsAt: '2026-11-30T15:00:00Z', // KST 12/1
		endsAt: '2026-12-03T15:00:00Z', // 마지막 날 12/3
		isAllDay: true,
		schedules: [schedule({ type: 'EVENT_START', startsAt: '2026-11-30T15:00:00Z', isAllDay: true })]
	});

	it('12/2에는 끝나지 않았고 진행 중이다', () => {
		const dec2 = new Date('2026-12-02T03:00:00Z');
		expect(hasEnded(event, dec2)).toBe(false);
		expect(nextSchedule(event, dec2)).toEqual({ kind: 'ongoing' });
	});

	it('12/4에 끝난다', () => {
		expect(hasEnded(event, new Date('2026-12-03T16:00:00Z'))).toBe(true);
	});
});
