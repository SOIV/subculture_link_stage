// 날짜·시간 표시와 코드값(status/scheduleType/urlType/국가) → 사람이 읽는 문구 변환.
// API가 주는 코드값 자체는 packages/domain(scls-platform)의 TEXT+CHECK 목록과 같다.
import type { EventScheduleItem, EventSummary } from './api';
import { t, type Locale } from './i18n';

const COUNTRY_TIMEZONE: Record<string, string> = {
	KR: 'Asia/Seoul',
	JP: 'Asia/Tokyo'
};

export type TimeRange = {
	startsAt: string | null;
	endsAt: string | null;
	isAllDay: boolean;
	timezone: string;
};

/**
 * 카드/상세에 보여줄 대표 기간을 고른다. EVENT_START 일정이 있으면 그 timezone·isAllDay를
 * 그대로 쓴다(가장 신뢰할 수 있는 값). 없으면 최상위 startsAt/endsAt과 countryCode로 추정한
 * 타임존으로 대체한다(온라인 전용 등 국가가 없으면 UTC).
 */
export function eventPeriod(event: EventSummary): TimeRange {
	const start = event.schedules.find((schedule) => schedule.type === 'EVENT_START');
	if (start) {
		return {
			startsAt: start.startsAt,
			endsAt: start.endsAt,
			isAllDay: start.isAllDay,
			timezone: start.timezone
		};
	}
	return {
		startsAt: event.startsAt,
		endsAt: event.endsAt,
		isAllDay: event.isAllDay,
		timezone: (event.countryCode && COUNTRY_TIMEZONE[event.countryCode]) || 'UTC'
	};
}

function localeTag(locale: Locale) {
	return locale === 'ko' ? 'ko-KR' : locale === 'ja' ? 'ja-JP' : 'en-US';
}

// Intl의 짧은 타임존 이름은 en-US에서 "GMT+9"로만 나와 KST·JST를 알 수 없어, 취급하는 지역은 약칭을 직접 둔다.
const TIMEZONE_ABBREVIATION: Record<string, string> = {
	'Asia/Seoul': 'KST',
	'Asia/Tokyo': 'JST',
	UTC: 'UTC'
};

/** 시각 옆에 붙이는 타임존 표기. 약칭이 없는 지역은 "GMT+9"처럼 UTC 오프셋으로, 알 수 없는 문자열은 그대로 보여준다. */
export function timeZoneLabel(timeZone: string, at: Date): string {
	const abbreviation = TIMEZONE_ABBREVIATION[timeZone];
	if (abbreviation) return abbreviation;
	try {
		const parts = new Intl.DateTimeFormat('en-US', {
			timeZone,
			timeZoneName: 'shortOffset'
		}).formatToParts(at);
		return parts.find((part) => part.type === 'timeZoneName')?.value ?? timeZone;
	} catch {
		return timeZone;
	}
}

function dateFormatter(locale: Locale, timeZone: string, withTime: boolean) {
	return new Intl.DateTimeFormat(localeTag(locale), {
		timeZone,
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		weekday: 'short',
		...(withTime ? { hour: '2-digit', minute: '2-digit' } : {})
	});
}

function timeFormatter(locale: Locale, timeZone: string) {
	return new Intl.DateTimeFormat(localeTag(locale), {
		timeZone,
		hour: '2-digit',
		minute: '2-digit'
	});
}

/**
 * 사람이 읽는 기간 문자열. 종일 일정은 날짜만, 시각이 있으면 시간까지 보여준다. 종일 일정의
 * endsAt은 "마지막 날 다음 날 00:00"(배타적 종료) 관례이므로(apps/api의 seed-events.ts와 동일)
 * 표시 전에 하루를 뺀다. EventScheduleItem도 같은 4개 필드 모양이라 그대로 넘길 수 있다.
 * 시각이 들어가는 일정은 끝에 타임존(KST 등)을 한 번 붙인다.
 */
export function formatRange(locale: Locale, range: TimeRange): string {
	if (!range.startsAt) return t(locale, 'card.dateUnknown');

	const start = new Date(range.startsAt);
	const zone = range.isAllDay ? '' : ` (${timeZoneLabel(range.timezone, start)})`;
	const longFormatter = dateFormatter(locale, range.timezone, !range.isAllDay);
	if (!range.endsAt) return longFormatter.format(start) + zone;

	const rawEnd = new Date(range.endsAt);
	const end = range.isAllDay ? new Date(rawEnd.getTime() - 24 * 60 * 60 * 1000) : rawEnd;
	if (end.getTime() <= start.getTime()) return longFormatter.format(start) + zone;

	// 자정 기준 UTC 비교라 타임존 경계의 극히 드문 사례에서는 실제 표시 날짜와 하루 어긋날 수
	// 있지만, "같은 날이면 시각만 붙인다"는 표시 단순화가 목적이라 문제되지 않는다.
	const sameDay = start.toDateString() === end.toDateString();
	if (sameDay && !range.isAllDay) {
		return `${longFormatter.format(start)} ~ ${timeFormatter(locale, range.timezone).format(end)}${zone}`;
	}
	return `${longFormatter.format(start)} ~ ${longFormatter.format(end)}${zone}`;
}

export function formatSchedule(locale: Locale, schedule: EventScheduleItem): string {
	return formatRange(locale, schedule);
}

/**
 * 카드용 짧은 기간 표기: 시각 없이 날짜만 보여주고(같은 달이면 뒤쪽 달은 생략), 올해가 아니면
 * 연도를 붙인다. 시각과 전체 날짜는 카드의 "다음 일정"과 상세 페이지에서 보여준다.
 */
export function formatCardPeriod(locale: Locale, range: TimeRange, now: Date): string {
	if (!range.startsAt) return t(locale, 'card.dateUnknown');

	const start = new Date(range.startsAt);
	const yearOf = (date: Date) =>
		new Intl.DateTimeFormat('en-CA', { timeZone: range.timezone, year: 'numeric' }).format(date);
	const formatter = new Intl.DateTimeFormat(localeTag(locale), {
		timeZone: range.timezone,
		...(yearOf(start) === yearOf(now) ? {} : { year: 'numeric' }),
		month: 'long',
		day: 'numeric',
		weekday: 'short'
	});
	if (!range.endsAt) return formatter.format(start);

	// 종일 일정의 endsAt은 "마지막 날 다음 날 0시"(배타적 종료)라 표시 전에 하루를 뺀다(formatRange와 동일).
	const rawEnd = new Date(range.endsAt);
	const end = range.isAllDay ? new Date(rawEnd.getTime() - 24 * 60 * 60 * 1000) : rawEnd;
	if (end.getTime() <= start.getTime()) return formatter.format(start);
	// 같은 날로 접히면 Intl이 날짜 하나만 돌려준다(예: 하루짜리 행사의 시작·종료 시각이 다른 경우).
	return formatter.formatRange(start, end);
}

/** 카드·목록의 한 줄 일정 표기용 짧은 날짜(연도 없이 월·일·요일, 종일이 아니면 시각과 타임존까지). */
export function formatShortDate(
	locale: Locale,
	iso: string,
	timeZone: string,
	withTime: boolean
): string {
	const at = new Date(iso);
	const text = new Intl.DateTimeFormat(localeTag(locale), {
		timeZone,
		month: 'long',
		day: 'numeric',
		weekday: 'short',
		...(withTime ? { hour: '2-digit', minute: '2-digit' } : {})
	}).format(at);
	return withTime ? `${text} (${timeZoneLabel(timeZone, at)})` : text;
}

export function statusLabel(locale: Locale, status: string): string {
	return t(locale, `status.${status}`);
}

export function scheduleTypeLabel(locale: Locale, type: string): string {
	return t(locale, `schedule.${type}`);
}

/** 티켓 판매 대상(국내/해외) 문구. 대상이 정해지지 않은(전체) 일정은 null이라 호출하는 쪽이 칩을 그리지 않는다. */
export function audienceLabel(locale: Locale, audience: string | null): string | null {
	return audience ? t(locale, `ticket.audience.${audience}`) : null;
}

/**
 * 일정 줄 아래에 붙이는 보조 문구: "해외 · 프리리저브 (티켓피아)"처럼 대상과 이름을 이어 붙인다.
 * 둘 다 없으면 null이다. 같은 종류의 일정(국내·해외 티켓 판매 등)을 구별하는 용도다.
 */
export function scheduleQualifier(
	locale: Locale,
	schedule: { audience: string | null; title: string | null }
): string | null {
	const parts = [audienceLabel(locale, schedule.audience), schedule.title].filter(Boolean);
	return parts.length > 0 ? parts.join(' · ') : null;
}

// 화면에 늘어놓는 통화 순서. 한국·일본 행사가 대상이라 원·엔을 먼저 두고, 나머지는 코드 순이다.
const CURRENCY_ORDER = ['KRW', 'JPY'];

// 한국어는 통화 기호보다 "329,000원"처럼 단위를 뒤에 붙이는 쓰임이 자연스럽다(Intl은 엔을 "JP¥"로 보여준다).
const KO_CURRENCY_UNIT: Record<string, string> = { KRW: '원', JPY: '엔' };

/**
 * { KRW: 329000, JPY: 35000 }을 화면 언어에 맞춰 보여준다(한국어 "329,000원 / 35,000엔",
 * 그 밖은 "₩329,000 / ¥35,000"). 비어 있으면 null.
 */
export function formatPrices(locale: Locale, prices: Record<string, number>): string | null {
	const entries = Object.entries(prices).sort(([a], [b]) => {
		const rank = (code: string) => {
			const index = CURRENCY_ORDER.indexOf(code);
			return index === -1 ? CURRENCY_ORDER.length : index;
		};
		return rank(a) - rank(b) || a.localeCompare(b);
	});
	if (entries.length === 0) return null;
	return entries
		.map(([currency, amount]) => {
			const koUnit = locale === 'ko' ? KO_CURRENCY_UNIT[currency] : undefined;
			if (koUnit) return `${amount.toLocaleString('ko-KR')}${koUnit}`;
			try {
				return new Intl.NumberFormat(localeTag(locale), {
					style: 'currency',
					currency,
					maximumFractionDigits: 0
				}).format(amount);
			} catch {
				// 알 수 없는 통화 코드면 숫자와 코드를 그대로 보여준다.
				return `${amount.toLocaleString(localeTag(locale))} ${currency}`;
			}
		})
		.join(' / ');
}

export function urlTypeLabel(locale: Locale, type: string): string {
	return t(locale, `url.${type}`);
}

export function tagGroupLabel(locale: Locale, groupSlug: string, fallback: string): string {
	const key = `group.${groupSlug}`;
	const label = t(locale, key);
	return label === key ? fallback : label;
}

/** isOnline은 호출하는 쪽에서 따로 판단한다 — 국가가 없다고 해서 항상 온라인 행사는
 * 아니므로(예: 아직 장소 미정) 이 함수에서 온라인 여부를 추측하지 않는다. */
export function countryLabel(locale: Locale, countryCode: string | null): string {
	if (!countryCode) return '—';
	const key = `filter.country.${countryCode}`;
	const label = t(locale, key);
	return label === key ? countryCode : label;
}
