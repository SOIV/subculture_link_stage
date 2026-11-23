// 일정의 시간대 기준 "날짜" 계산. 서버(Cloudflare Workers, UTC)와 보는 사람의 브라우저 시간대가 달라도
// 같은 결과가 나오도록 Date의 로컬 시간대 메서드(toDateString, getDate 등)는 쓰지 않는다.

const DAY_MS = 24 * 60 * 60 * 1000;

const dayFormatters = new Map<string, Intl.DateTimeFormat>();

function dayFormatter(timeZone: string): Intl.DateTimeFormat {
	let formatter = dayFormatters.get(timeZone);
	if (!formatter) {
		const options: Intl.DateTimeFormatOptions = {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit'
		};
		try {
			formatter = new Intl.DateTimeFormat('en-CA', { ...options, timeZone });
		} catch {
			// 알 수 없는 타임존 문자열이면 UTC 기준으로 대신한다.
			formatter = new Intl.DateTimeFormat('en-CA', { ...options, timeZone: 'UTC' });
		}
		dayFormatters.set(timeZone, formatter);
	}
	return formatter;
}

/** 그 시간대에서 date가 속한 날짜(YYYY-MM-DD). */
export function dayKey(date: Date, timeZone: string): string {
	const parts = dayFormatter(timeZone).formatToParts(date);
	const part = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
	return `${part('year')}-${part('month')}-${part('day')}`;
}

/** 그 시간대의 "날짜"를 1970-01-01부터 센 일수로 바꾼다(날짜끼리 빼면 일수 차이). */
export function dayNumber(date: Date, timeZone: string): number {
	const [year, month, day] = dayKey(date, timeZone).split('-').map(Number);
	return Math.floor(Date.UTC(year, month - 1, day) / DAY_MS);
}

/** 같은 시간대에서 두 시각이 같은 날짜인지. */
export function isSameDay(a: Date, b: Date, timeZone: string): boolean {
	return dayKey(a, timeZone) === dayKey(b, timeZone);
}

/**
 * 종일 일정의 배타적 종료("마지막 날 다음 날 0시")를 마지막 날 안의 시각으로 바꾼다. 하루를 24시간으로
 * 빼면 서머타임이 바뀌는 날에 날짜가 어긋나므로, 종료 시각 바로 전(1ms 전)을 쓴다 — 그 시각이 일정
 * 시간대에서 속한 날짜가 마지막 날이다.
 */
export function inclusiveAllDayEnd(exclusiveEnd: Date): Date {
	return new Date(exclusiveEnd.getTime() - 1);
}
