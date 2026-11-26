// 행사 목록(시리즈 묶음)과 시리즈 상세·연혁에 쓰는 계산.
//
// 공개 API에는 아직 "시리즈 상세"와 "시리즈별 회차 목록"이 없다(2026-11-26 기준 /v1/event-series는
// 시리즈 이름·시작 연도·공식 사이트만 준다). 그래서 지금은 전체 행사 목록(/v1/events)을 받아
// eventSeries.slug로 묶는다. 행사가 늘면 이 방식은 페이지마다 전체 목록을 받게 되므로(2026-11-23 리뷰
// R16과 같은 문제) API에 시리즈 상세·시리즈별 회차 조회가 생기면 load만 그쪽으로 바꾸고 아래 계산은
// 그대로 쓴다(docs/plan/11-roadmap-and-success.md Phase 1 "행사 목록(시리즈)·행사 상세와 연혁").
//
// 공개 API는 확정·연기 행사만 내보낸다(끝난 확정 행사는 ENDED로 바꿔서). 관리자가 처음부터 ENDED·취소로
// 넣은 회차는 오지 않으므로 연혁은 "공개된 회차"까지만이다. 취소 상태도 오면 그대로 표시하도록 다룬다.
//
// 날짜는 모두 회차 시간대 기준 "날짜"로 비교한다($lib/dates.ts) — 서버(UTC)와 브라우저 결과가 같다.
import type { EventSeriesSummary, EventSummary } from './api';
import { dayKey, dayNumber } from './dates';
import { eventPeriod } from './format';
import { lastDayOf } from './schedule';
import { pickCardTags, type TagIndex, type TagInfo } from './tags';

/** 회차의 지금 상태. 연기는 적힌 날짜가 더는 맞지 않아 날짜로 판단하지 않는다. */
export type EditionPhase = 'ongoing' | 'upcoming' | 'postponed' | 'ended' | 'cancelled';

export function editionPhase(event: EventSummary, now: Date): EditionPhase {
	if (event.status === 'CANCELLED') return 'cancelled';
	if (event.status === 'POSTPONED') return 'postponed';
	if (event.status === 'ENDED' || event.status === 'ARCHIVED') return 'ended';
	const range = eventPeriod(event);
	const last = lastDayOf(range);
	// 날짜가 아직 없는 회차는 앞으로 열릴 회차로 본다(목록에서 "일정 미정"으로 보인다).
	if (last === null || !range.startsAt) return 'upcoming';
	const today = dayNumber(now, range.timezone);
	if (last < today) return 'ended';
	return dayNumber(new Date(range.startsAt), range.timezone) <= today ? 'ongoing' : 'upcoming';
}

/** 아직 챙길 수 있는 회차(진행 중·예정·연기). */
export function isAheadPhase(phase: EditionPhase): boolean {
	return phase === 'ongoing' || phase === 'upcoming' || phase === 'postponed';
}

function startTime(event: EventSummary): number | null {
	const { startsAt } = eventPeriod(event);
	return startsAt ? new Date(startsAt).getTime() : null;
}

/** 시작이 이른 순. 날짜 없는 회차는 맨 뒤, 같으면 slug 순(서버·브라우저 결과가 같게). */
export function compareByStart(a: EventSummary, b: EventSummary): number {
	const at = startTime(a);
	const bt = startTime(b);
	if (at !== bt) {
		if (at === null) return 1;
		if (bt === null) return -1;
		return at - bt;
	}
	return a.slug.localeCompare(b.slug);
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

export type SeriesEntry = {
	series: EventSeriesSummary;
	editions: EventSummary[];
	overview: SeriesOverview;
};

/** 시리즈 목록과 행사 목록을 합쳐 카드에 쓸 묶음을 만든다(정렬은 sortSeriesEntries). */
export function buildSeriesEntries(
	series: EventSeriesSummary[],
	events: EventSummary[],
	now: Date
): SeriesEntry[] {
	const groups = groupBySeries(events);
	return series.map((item) => {
		const editions = groups.get(item.slug) ?? [];
		return { series: item, editions, overview: seriesOverview(editions, now) };
	});
}

/**
 * 행사 목록 순서: 다음 회차가 있는 시리즈를 그 회차가 빠른 순으로(진행 중이 가장 앞), 그다음 다음
 * 회차가 없는 시리즈를 최근 회차가 늦은 순으로, 공개된 회차가 하나도 없는 시리즈는 맨 뒤에 slug 순.
 */
export function sortSeriesEntries(entries: SeriesEntry[]): SeriesEntry[] {
	const rank = (entry: SeriesEntry) => (entry.overview.next ? 0 : entry.overview.latest ? 1 : 2);
	return [...entries].sort((a, b) => {
		const byRank = rank(a) - rank(b);
		if (byRank !== 0) return byRank;
		if (a.overview.next && b.overview.next) {
			const byNext = compareByStart(a.overview.next.event, b.overview.next.event);
			if (byNext !== 0) return byNext;
		} else if (a.overview.latest && b.overview.latest) {
			const byLatest = compareByStart(b.overview.latest, a.overview.latest);
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
 * 아직 없는 회차는 앞으로 열릴 회차라 맨 위에 따로 묶는다.
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

// 시리즈 카드에 보여줄 분류는 "행사 형식" 그룹 태그만 쓴다(참가 방식·티켓 방식은 회차마다 다를 수 있다).
const CATEGORY_GROUP = 'event-format';

/** 시리즈의 분류 칩. 모든 회차의 행사 형식 태그를 모아, 상위 태그는 하위 태그가 있으면 뺀다. */
export function seriesCategoryTags(
	editions: EventSummary[],
	index: TagIndex,
	max: number
): { shown: TagInfo[]; hidden: number } {
	const slugs = new Set<string>();
	for (const event of editions) {
		for (const slug of event.tags) {
			if (index.get(slug)?.groupSlug === CATEGORY_GROUP) slugs.add(slug);
		}
	}
	return pickCardTags([...slugs], index, max);
}
