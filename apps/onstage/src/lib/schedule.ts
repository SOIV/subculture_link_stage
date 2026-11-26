// 일정(schedule)을 바탕으로 한 표시 계산: 카드의 "다음 일정", 진행 중 여부, 메인 페이지의 임박 일정.
// 날짜 비교는 각 일정의 타임존 기준 "날짜"로 한다 — D-day가 한국/일본 자정 기준으로 세어지고,
// 시·분 단위로는 서버·브라우저 렌더가 어긋날 일이 없도록 일 단위로만 계산한다.
import type { EventScheduleItem, EventScheduleType, EventSummary } from './api';
import { dayNumber } from './dates';
import { eventPeriod, type TimeRange } from './format';

// 이미 끝났거나(COMPLETED — 매진 등으로 일찍 끝난 판매 포함) 취소된 일정은 "다음 일정"·추천에서 뺀다.
// 연기(POSTPONED)된 일정은 남겨 두되 화면이 D-day 대신 "연기"를 보여준다(적힌 날짜가 더는 맞지 않으므로).
// 상태의 뜻은 docs/plan/04-database-design.md의 event_schedules "상태와 기간의 뜻".
const INACTIVE_SCHEDULE_STATUSES = ['COMPLETED', 'CANCELLED'];

/** 아직 챙길 수 있는 일정인지(끝나거나 취소되지 않음). */
export function isActiveSchedule(schedule: EventScheduleItem): boolean {
	return !INACTIVE_SCHEDULE_STATUSES.includes(schedule.status);
}

export function isPostponed(schedule: EventScheduleItem): boolean {
	return schedule.status === 'POSTPONED';
}

/** now 기준으로 iso 시각의 날짜가 며칠 뒤인지(오늘이면 0, 지났으면 음수). */
export function daysUntil(iso: string, timeZone: string, now: Date): number {
	return dayNumber(new Date(iso), timeZone) - dayNumber(now, timeZone);
}

/** 기간의 마지막 날. 종일 일정의 endsAt은 "마지막 날 다음 날 0시"라 하루를 뺀다. */
export function lastDayOf(range: TimeRange): number | null {
	const end = range.endsAt ?? range.startsAt;
	if (!end) return null;
	const day = dayNumber(new Date(end), range.timezone);
	if (!(range.isAllDay && range.endsAt && range.startsAt)) return day;
	return Math.max(day - 1, dayNumber(new Date(range.startsAt), range.timezone));
}

/** 행사 기간의 마지막 날이 지났는지. 날짜를 모르는 행사는 끝나지 않은 것으로 본다(목록에서 숨기지 않게). */
export function hasEnded(event: EventSummary, now: Date): boolean {
	const range = eventPeriod(event);
	const last = lastDayOf(range);
	return last !== null && last < dayNumber(now, range.timezone);
}

/** 아직 끝나지 않은(진행 중이거나 앞으로 열릴) 행사인지. 날짜가 없는 행사와 취소된 행사는 false. */
export function isUpcomingOrOngoing(event: EventSummary, now: Date): boolean {
	if (event.status === 'CANCELLED') return false;
	const range = eventPeriod(event);
	const last = lastDayOf(range);
	return last !== null && last >= dayNumber(now, range.timezone);
}

export type NextSchedule =
	| { kind: 'ongoing' }
	| { kind: 'upcoming'; schedule: EventScheduleItem; startsAt: string; days: number };

/**
 * 카드에 보여줄 "다음 일정". 행사 기간 안이면 진행 중, 아니면 아직 시작하지 않은(오늘 포함) 일정 중
 * 가장 이른 것. 끝났거나 취소된 일정은 건너뛴다. 남은 일정이 없거나 행사가 취소됐으면 null.
 * 연기된 행사는 적힌 기간이 맞지 않으므로 "진행 중"이라고 하지 않는다.
 */
export function nextSchedule(event: EventSummary, now: Date): NextSchedule | null {
	if (event.status === 'CANCELLED') return null;
	const range = eventPeriod(event);
	const last = lastDayOf(range);
	if (event.status !== 'POSTPONED' && range.startsAt && last !== null) {
		const today = dayNumber(now, range.timezone);
		if (dayNumber(new Date(range.startsAt), range.timezone) <= today && today <= last) {
			return { kind: 'ongoing' };
		}
	}

	let best: { schedule: EventScheduleItem; startsAt: string; days: number; time: number } | null =
		null;
	for (const schedule of event.schedules) {
		if (!schedule.startsAt || !isActiveSchedule(schedule)) continue;
		const days = daysUntil(schedule.startsAt, schedule.timezone, now);
		if (days < 0) continue;
		const time = new Date(schedule.startsAt).getTime();
		if (!best || time < best.time) best = { schedule, startsAt: schedule.startsAt, days, time };
	}
	return best
		? { kind: 'upcoming', schedule: best.schedule, startsAt: best.startsAt, days: best.days }
		: null;
}

// 메인 페이지 "티켓·신청 일정"에 모아 보여줄 일정 종류 — 사람이 놓치면 안 되는 접수·마감·발표 일정.
const ACTION_SCHEDULE_TYPES: EventScheduleType[] = [
	'TICKET_OPEN',
	'TICKET_CLOSE',
	'LOTTERY_OPEN',
	'LOTTERY_CLOSE',
	'LOTTERY_RESULT',
	'REGISTRATION_OPEN',
	'REGISTRATION_CLOSE'
];

export type ScheduleEntry = {
	event: EventSummary;
	schedule: EventScheduleItem;
	startsAt: string;
	days: number;
};

/**
 * 여러 행사의 티켓·추첨·신청 일정 중 앞으로 다가오는 것을 날짜순으로 최대 limit개. 취소된 행사,
 * 끝났거나 취소된 일정은 뺀다(연기된 일정은 남기고 화면이 "연기"로 표시한다).
 */
export function upcomingActionSchedules(
	events: EventSummary[],
	now: Date,
	limit: number
): ScheduleEntry[] {
	const entries: (ScheduleEntry & { time: number })[] = [];
	for (const event of events) {
		if (event.status === 'CANCELLED') continue;
		for (const schedule of event.schedules) {
			if (!schedule.startsAt || !ACTION_SCHEDULE_TYPES.includes(schedule.type)) continue;
			if (!isActiveSchedule(schedule)) continue;
			const days = daysUntil(schedule.startsAt, schedule.timezone, now);
			if (days >= 0) {
				entries.push({
					event,
					schedule,
					startsAt: schedule.startsAt,
					days,
					time: new Date(schedule.startsAt).getTime()
				});
			}
		}
	}
	entries.sort((a, b) => a.time - b.time);
	return entries
		.slice(0, limit)
		.map(({ event, schedule, startsAt, days }) => ({ event, schedule, startsAt, days }));
}
