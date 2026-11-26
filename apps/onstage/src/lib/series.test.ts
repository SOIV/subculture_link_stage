import { describe, expect, it } from 'vitest';
import type { EventSeriesSummary, EventSummary } from './api';
import {
	buildSeriesEntries,
	editionPhase,
	editionYear,
	groupBySeries,
	historyByYear,
	seriesCategoryTags,
	seriesOverview,
	sortSeriesEntries
} from './series';
import { buildTagIndex } from './tags';
import { eventSummary, schedule } from './test-fixtures';

// KST 2026-11-26 12:00
const NOW = new Date('2026-11-26T03:00:00Z');

/** 종일 행사 하나(KST). start·end는 YYYY-MM-DD, end는 마지막 날. */
function edition(
	slug: string,
	seriesSlug: string | null,
	start: string | null,
	end: string | null,
	overrides: Partial<EventSummary> = {}
): EventSummary {
	const toUtc = (day: string, plusDays = 0) => {
		const date = new Date(`${day}T00:00:00+09:00`);
		date.setUTCDate(date.getUTCDate() + plusDays);
		return date.toISOString();
	};
	return eventSummary({
		id: slug,
		slug,
		eventSeries: seriesSlug ? { id: `s-${seriesSlug}`, slug: seriesSlug } : null,
		startsAt: start ? toUtc(start) : null,
		// 종일 행사의 endsAt은 마지막 날 다음 날 0시다.
		endsAt: end ? toUtc(end, 1) : null,
		isAllDay: true,
		...overrides
	});
}

function seriesItem(slug: string, overrides: Partial<EventSeriesSummary> = {}): EventSeriesSummary {
	return {
		id: `s-${slug}`,
		slug,
		status: 'ACTIVE',
		locale: 'ko',
		title: slug,
		summary: null,
		foundedYear: null,
		officialUrl: null,
		...overrides
	};
}

describe('editionPhase — 회차 상태', () => {
	it('날짜로 예정·진행 중·종료를 나눈다(회차 시간대의 날짜 기준)', () => {
		expect(editionPhase(edition('a', 's', '2026-12-04', '2026-12-06'), NOW)).toBe('upcoming');
		expect(editionPhase(edition('b', 's', '2026-11-25', '2026-11-27'), NOW)).toBe('ongoing');
		expect(editionPhase(edition('c', 's', '2026-11-26', '2026-11-26'), NOW)).toBe('ongoing');
		expect(editionPhase(edition('d', 's', '2026-11-20', '2026-11-25'), NOW)).toBe('ended');
	});

	it('API가 ENDED로 준 회차는 날짜와 상관없이 종료다', () => {
		const event = edition('a', 's', '2026-12-04', '2026-12-06', { status: 'ENDED' });
		expect(editionPhase(event, NOW)).toBe('ended');
	});

	it('연기·취소는 날짜보다 상태를 따른다', () => {
		const past = edition('a', 's', '2026-10-01', '2026-10-02', { status: 'POSTPONED' });
		expect(editionPhase(past, NOW)).toBe('postponed');
		const future = edition('b', 's', '2026-12-04', '2026-12-06', { status: 'CANCELLED' });
		expect(editionPhase(future, NOW)).toBe('cancelled');
	});

	it('날짜가 없는 회차는 예정으로 본다', () => {
		expect(editionPhase(edition('a', 's', null, null), NOW)).toBe('upcoming');
	});

	it('KST 자정을 넘긴 직후에는 전날 끝난 회차가 종료다(UTC 날짜로 보지 않는다)', () => {
		// KST 2026-11-27 00:30 = UTC 2026-11-26 15:30
		const justAfterMidnight = new Date('2026-11-26T15:30:00Z');
		const event = edition('a', 's', '2026-11-25', '2026-11-26');
		expect(editionPhase(event, NOW)).toBe('ongoing');
		expect(editionPhase(event, justAfterMidnight)).toBe('ended');
	});
});

describe('groupBySeries — 시리즈별 묶기', () => {
	it('시리즈 slug로 묶고 단독 행사는 뺀다. 묶음 안은 시작이 이른 순이다', () => {
		const groups = groupBySeries([
			edition('cw-338', 'comic-world', '2026-10-24', '2026-10-25'),
			edition('solo', null, '2026-11-01', '2026-11-01'),
			edition('agf-2026', 'agf', '2026-12-04', '2026-12-06'),
			edition('cw-337', 'comic-world', '2026-10-03', '2026-10-04')
		]);
		expect([...groups.keys()].sort()).toEqual(['agf', 'comic-world']);
		expect(groups.get('comic-world')!.map((event) => event.slug)).toEqual(['cw-337', 'cw-338']);
	});
});

describe('seriesOverview — 다음·최근 회차', () => {
	it('다음 회차는 가장 가까운 진행 중·예정 회차, 최근 회차는 가장 늦게 끝난 회차다', () => {
		const overview = seriesOverview(
			[
				edition('2027', 's', '2027-03-26', '2027-03-28'),
				edition('2025', 's', '2025-11-01', '2025-11-02'),
				edition('2026-dec', 's', '2026-12-04', '2026-12-06'),
				edition('2026-oct', 's', '2026-10-03', '2026-10-04')
			],
			NOW
		);
		expect(overview.next?.event.slug).toBe('2026-dec');
		expect(overview.next?.phase).toBe('upcoming');
		expect(overview.latest?.slug).toBe('2026-oct');
		expect(overview.editionCount).toBe(4);
	});

	it('취소된 회차는 다음 회차로 고르지 않고, 연기된 회차는 고른다', () => {
		const overview = seriesOverview(
			[
				edition('cancelled', 's', '2026-12-01', '2026-12-02', { status: 'CANCELLED' }),
				edition('postponed', 's', '2026-12-10', '2026-12-11', { status: 'POSTPONED' })
			],
			NOW
		);
		expect(overview.next?.event.slug).toBe('postponed');
		expect(overview.next?.phase).toBe('postponed');
		expect(overview.latest).toBeNull();
	});

	it('국가는 최근 회차의 국가부터, 겹치지 않게 모은다', () => {
		const overview = seriesOverview(
			[
				edition('kr-old', 's', '2025-05-01', '2025-05-02', { countryCode: 'KR' }),
				edition('jp-new', 's', '2026-12-01', '2026-12-02', { countryCode: 'JP' }),
				edition('kr-mid', 's', '2026-01-01', '2026-01-02', { countryCode: 'KR' }),
				edition('online', 's', '2026-02-01', '2026-02-01', { countryCode: null, isOnline: true })
			],
			NOW
		);
		expect(overview.countries).toEqual(['JP', 'KR']);
		expect(overview.hasOnline).toBe(true);
	});

	it('회차가 없으면 다음·최근 회차가 없다', () => {
		const overview = seriesOverview([], NOW);
		expect(overview).toMatchObject({ next: null, latest: null, countries: [], editionCount: 0 });
	});
});

describe('sortSeriesEntries — 행사 목록 순서', () => {
	it('다음 회차가 빠른 순 → 다음 회차 없이 최근 회차가 늦은 순 → 회차 없는 시리즈(slug 순)', () => {
		const series = ['agf', 'anime-japan', 'comic-world', 'g-star', 'playx4', 'tokyo-game-show'].map(
			(slug) => seriesItem(slug)
		);
		const events = [
			edition('animejapan-2027', 'anime-japan', '2027-03-26', '2027-03-28'),
			edition('agf-2026', 'agf', '2026-12-04', '2026-12-06'),
			edition('g-star-2026', 'g-star', '2026-11-19', '2026-11-22'),
			edition('cw-338', 'comic-world', '2026-10-24', '2026-10-25'),
			// 진행 중인 회차가 가장 앞이다.
			edition('tgs-ongoing', 'tokyo-game-show', '2026-11-25', '2026-11-28')
		];
		const sorted = sortSeriesEntries(buildSeriesEntries(series, events, NOW));
		expect(sorted.map((entry) => entry.series.slug)).toEqual([
			'tokyo-game-show',
			'agf',
			'anime-japan',
			'g-star',
			'comic-world',
			'playx4'
		]);
	});
});

describe('historyByYear — 연도별 연혁', () => {
	it('최근 연도가 위, 한 해 안에서도 늦은 회차가 위다. 상태를 함께 준다', () => {
		const history = historyByYear(
			[
				edition('2025-a', 's', '2025-05-01', '2025-05-02'),
				edition('2026-dec', 's', '2026-12-04', '2026-12-06'),
				edition('2026-oct', 's', '2026-10-03', '2026-10-04'),
				edition('2026-cancel', 's', '2026-08-01', '2026-08-02', { status: 'CANCELLED' })
			],
			NOW
		);
		expect(history.map((group) => group.year)).toEqual(['2026', '2025']);
		expect(history[0].editions.map(({ event, phase }) => [event.slug, phase])).toEqual([
			['2026-dec', 'upcoming'],
			['2026-oct', 'ended'],
			['2026-cancel', 'cancelled']
		]);
	});

	it('날짜가 없는 회차는 맨 위 "날짜 미정" 묶음이다', () => {
		const history = historyByYear(
			[edition('dated', 's', '2026-10-03', '2026-10-04'), edition('tbd', 's', null, null)],
			NOW
		);
		expect(history.map((group) => group.year)).toEqual([null, '2026']);
		expect(history[0].editions[0].event.slug).toBe('tbd');
	});

	it('연도는 회차 시간대 기준이다(UTC로는 전해 12월 31일이어도 JST 1월 1일이면 다음 해)', () => {
		const event = eventSummary({
			startsAt: '2026-12-31T15:30:00Z',
			countryCode: 'JP',
			schedules: [
				schedule({
					type: 'EVENT_START',
					startsAt: '2026-12-31T15:30:00Z',
					timezone: 'Asia/Tokyo'
				})
			]
		});
		expect(editionYear(event)).toBe('2027');
	});
});

describe('seriesCategoryTags — 시리즈 분류 칩', () => {
	const index = buildTagIndex([
		{
			id: 'g1',
			slug: 'event-format',
			name: '행사 형식',
			tags: [
				{ id: 't1', slug: 'exhibition', name: '전시', parentTagId: null },
				{ id: 't2', slug: 'industry-exhibition', name: '산업 전시', parentTagId: 't1' },
				{ id: 't3', slug: 'performance', name: '공연', parentTagId: null }
			]
		},
		{
			id: 'g2',
			slug: 'ticketing',
			name: '티켓 방식',
			tags: [{ id: 't4', slug: 'paid', name: '유료', parentTagId: null }]
		}
	]);

	it('모든 회차의 행사 형식 태그만 모으고, 하위 태그가 있으면 상위 태그는 뺀다', () => {
		const chips = seriesCategoryTags(
			[
				edition('a', 's', null, null, { tags: ['exhibition', 'industry-exhibition', 'paid'] }),
				edition('b', 's', null, null, { tags: ['performance', 'paid'] })
			],
			index,
			3
		);
		expect(chips.shown.map((tag) => tag.slug)).toEqual(['industry-exhibition', 'performance']);
		expect(chips.hidden).toBe(0);
	});
});
