// 행사 목록(시리즈 묶음)과 시리즈 상세·연혁에 쓰는 계산.
//
// 공개 API(scls-platform 30d694e부터)에서 받는 것:
// - /v1/event-series: 시리즈마다 카드용 요약(개최국·회차 수·다음 회차·최근 회차)
// - /v1/event-series/{slug}: 시리즈 상세(설명 포함)
// - /v1/event-series/{slug}/events: 그 시리즈의 회차 전부(끝난·취소 회차 포함) — 연혁
// 그 전 API에는 요약 칸과 두 경로가 없다. 그때는 전체 행사 목록(/v1/events, 확정·연기 회차만)을 받아
// eventSeries.slug로 묶어 같은 모양을 만든다(아래 cardFromEditions). 배포 순서가 어긋나도 화면이
// 깨지지 않게 하려는 대체 경로이고, 행사가 늘면 페이지마다 전체 목록을 받게 되므로(2026-11-23 리뷰
// R16) 새 API가 배포된 뒤에는 쓰이지 않는다.
//
// 날짜는 모두 회차 시간대 기준 "날짜"로 비교한다($lib/dates.ts) — 서버(UTC)와 브라우저 결과가 같다.
import type { EventSeriesEventRef, EventSeriesSummary, EventStatus, EventSummary } from './api';
import { dayKey, dayNumber } from './dates';
import { countryTimezone, eventPeriod, type TimeRange } from './format';
import { lastDayOf } from './schedule';
import { pickCardTags, type TagIndex, type TagInfo } from './tags';

/** 회차의 지금 상태. 연기는 적힌 날짜가 더는 맞지 않아 날짜로 판단하지 않는다. */
export type EditionPhase = 'ongoing' | 'upcoming' | 'postponed' | 'ended' | 'cancelled';

/** 상태와 기간으로 회차의 지금 상태를 정한다. */
export function phaseOf(status: string, range: TimeRange, now: Date): EditionPhase {
	if (status === 'CANCELLED') return 'cancelled';
	if (status === 'POSTPONED') return 'postponed';
	if (status === 'ENDED' || status === 'ARCHIVED') return 'ended';
	const last = lastDayOf(range);
	// 날짜가 아직 없는 회차는 앞으로 열릴 회차로 본다(목록에서 "일정 미정"으로 보인다).
	if (last === null || !range.startsAt) return 'upcoming';
	const today = dayNumber(now, range.timezone);
	if (last < today) return 'ended';
	return dayNumber(new Date(range.startsAt), range.timezone) <= today ? 'ongoing' : 'upcoming';
}

export function editionPhase(event: EventSummary, now: Date): EditionPhase {
	return phaseOf(event.status, eventPeriod(event), now);
}

/** 아직 챙길 수 있는 회차(진행 중·예정·연기). */
export function isAheadPhase(phase: EditionPhase): boolean {
	return phase === 'ongoing' || phase === 'upcoming' || phase === 'postponed';
}

/** 시작이 이른 순. 날짜 없는 회차는 맨 뒤, 같으면 slug 순(서버·브라우저 결과가 같게). */
function compareRanges(
	a: { slug: string; range: TimeRange },
	b: { slug: string; range: TimeRange }
) {
	const at = a.range.startsAt ? new Date(a.range.startsAt).getTime() : null;
	const bt = b.range.startsAt ? new Date(b.range.startsAt).getTime() : null;
	if (at !== bt) {
		if (at === null) return 1;
		if (bt === null) return -1;
		return at - bt;
	}
	return a.slug.localeCompare(b.slug);
}

export function compareByStart(a: EventSummary, b: EventSummary): number {
	return compareRanges(
		{ slug: a.slug, range: eventPeriod(a) },
		{ slug: b.slug, range: eventPeriod(b) }
	);
}

/** 카드에 쓰는 회차 한 줄. API 요약의 회차든 회차 목록의 회차든 같은 모양으로 바꿔 쓴다. */
export type EditionBrief = {
	slug: string;
	title: string | null;
	status: EventStatus;
	isOnline: boolean;
	range: TimeRange;
};

export function briefFromEvent(event: EventSummary): EditionBrief {
	return {
		slug: event.slug,
		title: event.title,
		status: event.status,
		isOnline: event.isOnline,
		range: eventPeriod(event)
	};
}

/** API 요약의 회차는 일정이 없어 시간대를 개최국으로 정한다(한국·일본 외에는 UTC). */
export function briefFromRef(ref: EventSeriesEventRef): EditionBrief {
	return {
		slug: ref.slug,
		title: ref.title,
		status: ref.status,
		isOnline: ref.isOnline,
		range: {
			startsAt: ref.startsAt,
			endsAt: ref.endsAt,
			isAllDay: ref.isAllDay,
			timezone: countryTimezone(ref.isOnline ? null : ref.countryCode)
		}
	};
}

/** 행사를 시리즈 slug별로 묶는다. 시리즈가 없는 단독 행사는 뺀다. 묶음 안은 시작이 이른 순이다. */
export function groupBySeries(events: EventSummary[]): Map<string, EventSummary[]> {
	const groups = new Map<string, EventSummary[]>();
	for (const event of events) {
		const slug = event.eventSeries?.slug;
		if (!slug) continue;
		const list = groups.get(slug);
		if (list) list.push(event);
		else groups.set(slug, [event]);
	}
	for (const list of groups.values()) list.sort(compareByStart);
	return groups;
}

export type SeriesOverview = {
	/** 가장 가까운 진행 중·예정·연기 회차. 없으면 null. */
	next: { event: EventSummary; phase: EditionPhase } | null;
	/** 가장 최근에 끝난 회차. 없으면 null. */
	latest: EventSummary | null;
	/** 회차가 열린(열릴) 국가 코드. 최근 회차의 국가가 앞이다. */
	countries: string[];
	/** 온라인 회차가 있는지. */
	hasOnline: boolean;
	editionCount: number;
};

/** 회차 목록으로 만든 요약(시리즈 상세, 그리고 요약 칸이 없는 이전 API의 행사 목록). */
export function seriesOverview(editions: EventSummary[], now: Date): SeriesOverview {
	const sorted = [...editions].sort(compareByStart);
	let next: SeriesOverview['next'] = null;
	let latest: EventSummary | null = null;
	for (const event of sorted) {
		const phase = editionPhase(event, now);
		if (!next && isAheadPhase(phase)) next = { event, phase };
		if (phase === 'ended') latest = event;
	}
	const countries: string[] = [];
	for (const event of [...sorted].reverse()) {
		if (!event.isOnline && event.countryCode && !countries.includes(event.countryCode)) {
			countries.push(event.countryCode);
		}
	}
	return {
		next,
		latest,
		countries,
		hasOnline: sorted.some((event) => event.isOnline),
		editionCount: sorted.length
	};
}

/** 행사 목록 카드 하나에 필요한 것. */
export type SeriesCardData = {
	series: EventSeriesSummary;
	next: { edition: EditionBrief; phase: EditionPhase } | null;
	latest: EditionBrief | null;
	countries: string[];
	hasOnline: boolean;
	editionCount: number;
	/** 분류 칩을 고를 태그 slug(회차 태그를 모은 것). 모르면 빈 배열. */
	tags: string[];
};

/** API가 카드용 요약 칸을 주는지(30d694e 이후 API). 없으면 회차 목록으로 요약을 만들어야 한다. */
export function hasSeriesSummary(series: EventSeriesSummary): boolean {
	return (
		Array.isArray(series.countryCodes) &&
		series.nextEvent !== undefined &&
		series.latestEvent !== undefined
	);
}

/** API 요약으로 카드를 만든다. 상태(예정·진행 중)는 날짜가 바뀌면 달라지므로 화면에서 다시 정한다. */
export function cardFromSummary(series: EventSeriesSummary, now: Date): SeriesCardData {
	let next: SeriesCardData['next'] = null;
	let latest = series.latestEvent ? briefFromRef(series.latestEvent) : null;
	if (series.nextEvent) {
		const edition = briefFromRef(series.nextEvent);
		const phase = phaseOf(edition.status, edition.range, now);
		// 응답을 받은 뒤 날짜가 바뀌어 끝난 회차면(열어 둔 화면) 최근 회차로 옮긴다.
		if (isAheadPhase(phase)) next = { edition, phase };
		else if (phase === 'ended' && (!latest || compareRanges(latest, edition) < 0)) latest = edition;
	}
	return {
		series,
		next,
		latest,
		countries: series.countryCodes ?? [],
		hasOnline: Boolean(series.nextEvent?.isOnline || series.latestEvent?.isOnline),
		editionCount: series.eventCount ?? 0,
		tags: series.tags ?? []
	};
}

/** 회차 목록으로 카드를 만든다(요약 칸이 없는 이전 API). */
export function cardFromEditions(
	series: EventSeriesSummary,
	editions: EventSummary[],
	now: Date
): SeriesCardData {
	const overview = seriesOverview(editions, now);
	return {
		series,
		next: overview.next
			? { edition: briefFromEvent(overview.next.event), phase: overview.next.phase }
			: null,
		latest: overview.latest ? briefFromEvent(overview.latest) : null,
		countries: overview.countries,
		hasOnline: overview.hasOnline,
		editionCount: overview.editionCount,
		tags: editionTags(editions)
	};
}

/**
 * 행사 목록 카드들. 요약 칸이 있는 시리즈는 그것으로, 없는 시리즈는 events(전체 행사 목록)를 묶어서
 * 만든다. 새 API면 events는 비어 있어도 된다.
 */
export function buildSeriesCards(
	series: EventSeriesSummary[],
	events: EventSummary[],
	now: Date
): SeriesCardData[] {
	const groups = groupBySeries(events);
	return series.map((item) =>
		hasSeriesSummary(item)
			? cardFromSummary(item, now)
			: cardFromEditions(item, groups.get(item.slug) ?? [], now)
	);
}

/**
 * 행사 목록 순서: 다음 회차가 있는 시리즈를 그 회차가 빠른 순으로(진행 중이 가장 앞), 그다음 다음
 * 회차가 없는 시리즈를 최근 회차가 늦은 순으로, 공개된 회차가 하나도 없는 시리즈는 맨 뒤에 slug 순.
 */
export function sortSeriesCards(cards: SeriesCardData[]): SeriesCardData[] {
	const rank = (card: SeriesCardData) => (card.next ? 0 : card.latest ? 1 : 2);
	return [...cards].sort((a, b) => {
		const byRank = rank(a) - rank(b);
		if (byRank !== 0) return byRank;
		if (a.next && b.next) {
			const byNext = compareRanges(a.next.edition, b.next.edition);
			if (byNext !== 0) return byNext;
		} else if (a.latest && b.latest) {
			const byLatest = compareRanges(b.latest, a.latest);
			if (byLatest !== 0) return byLatest;
		}
		return a.series.slug.localeCompare(b.series.slug);
	});
}

export type HistoryYear = {
	/** 회차 시간대 기준 시작 연도(예: "2026"). 날짜가 없는 회차 묶음은 null. */
	year: string | null;
	editions: { event: EventSummary; phase: EditionPhase }[];
};

/** 회차 시작 연도(그 회차 시간대 기준). 날짜가 없으면 null. */
export function editionYear(event: EventSummary): string | null {
	const range = eventPeriod(event);
	return range.startsAt ? dayKey(new Date(range.startsAt), range.timezone).slice(0, 4) : null;
}

/**
 * 연도별 연혁. 최근 연도가 위, 한 해 안에서도 늦은 회차가 위다(새 회차가 맨 위에 쌓인다). 날짜가
 * 아직 없는 회차는 앞으로 열릴 회차라 맨 위에 따로 묶는다. API 정렬에 기대지 않고 여기서 정렬한다.
 */
export function historyByYear(editions: EventSummary[], now: Date): HistoryYear[] {
	const sorted = [...editions].sort((a, b) => compareByStart(b, a));
	const undated: HistoryYear = { year: null, editions: [] };
	const years: HistoryYear[] = [];
	for (const event of sorted) {
		const year = editionYear(event);
		const item = { event, phase: editionPhase(event, now) };
		if (year === null) {
			undated.editions.push(item);
			continue;
		}
		const last = years.at(-1);
		if (last?.year === year) last.editions.push(item);
		else years.push({ year, editions: [item] });
	}
	return undated.editions.length > 0 ? [undated, ...years] : years;
}

/** 회차들의 태그 slug를 겹치지 않게 모은다. */
export function editionTags(editions: EventSummary[]): string[] {
	return [...new Set(editions.flatMap((event) => event.tags))];
}

// 시리즈 카드에 보여줄 분류는 "행사 형식" 그룹 태그만 쓴다(참가 방식·티켓 방식은 회차마다 다를 수 있다).
const CATEGORY_GROUP = 'event-format';

/** 시리즈의 분류 칩. 태그 중 행사 형식 태그만 골라, 상위 태그는 하위 태그가 있으면 뺀다. */
export function seriesCategoryTags(
	tagSlugs: string[],
	index: TagIndex,
	max: number
): { shown: TagInfo[]; hidden: number } {
	const slugs = tagSlugs.filter((slug) => index.get(slug)?.groupSlug === CATEGORY_GROUP);
	return pickCardTags(slugs, index, max);
}
