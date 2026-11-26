import { describe, expect, it } from 'vitest';
import type { EventSeriesEventRef, EventSeriesSummary, EventStatus, EventSummary } from './api';
import {
	cardFromSummary,
	editionPhase,
	editionTags,
	editionYear,
	historyByYear,
	seriesCategoryTags,
	seriesOverview,
	sortSeriesCards
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
		countryCodes: [],
		eventCount: 0,
		nextEvent: null,
		latestEvent: null,
		tags: [],
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

describe('sortSeriesCards — 행사 목록 순서', () => {
	it('다음 회차가 빠른 순 → 다음 회차 없이 최근 회차가 늦은 순 → 회차 없는 시리즈(slug 순)', () => {
		const ref = (slug: string, start: string, end: string, status: EventStatus = 'CONFIRMED') =>
			eventRef({
				slug,
				status,
				startsAt: `${start}T15:00:00.000Z`,
				endsAt: `${end}T15:00:00.000Z`
			});
		const series = [
			seriesItem('agf', { nextEvent: ref('agf-2026', '2026-12-03', '2026-12-06') }),
			seriesItem('anime-japan', { nextEvent: ref('animejapan-2027', '2027-03-25', '2027-03-28') }),
			seriesItem('comic-world', {
				latestEvent: ref('cw-338', '2026-10-23', '2026-10-25', 'ENDED')
			}),
			seriesItem('g-star', {
				latestEvent: ref('g-star-2026', '2026-11-18', '2026-11-22', 'ENDED')
			}),
			seriesItem('playx4'),
			// 진행 중인 회차가 가장 앞이다.
			seriesItem('tokyo-game-show', { nextEvent: ref('tgs-ongoing', '2026-11-24', '2026-11-28') })
		];
		const sorted = sortSeriesCards(series.map((item) => cardFromSummary(item, NOW)));
		expect(sorted.map((card) => card.series.slug)).toEqual([
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
			editionTags([
				edition('a', 's', null, null, { tags: ['exhibition', 'industry-exhibition', 'paid'] }),
				edition('b', 's', null, null, { tags: ['performance', 'paid'] })
			]),
			index,
			3
		);
		expect(chips.shown.map((tag) => tag.slug)).toEqual(['industry-exhibition', 'performance']);
		expect(chips.hidden).toBe(0);
	});

	it('행사 목록 카드는 시리즈 목록 API의 tags로 분류 칩을 고른다', () => {
		// 2026-11-27 운영 API의 agf 항목 tags 그대로.
		const card = cardFromSummary(
			seriesItem('agf', {
				tags: ['exhibition', 'industry-exhibition', 'joint-live', 'performance', 'offline', 'paid']
			}),
			NOW
		);
		const chips = seriesCategoryTags(card.tags, index, 3);
		expect(chips.shown.map((tag) => tag.slug)).toEqual(['industry-exhibition', 'performance']);
	});
});

// 새 API(scls-platform 30d694e)의 /v1/event-series 항목 모양 그대로(JSON이라 날짜는 문자열).
function eventRef(overrides: Partial<EventSeriesEventRef> = {}): EventSeriesEventRef {
	return {
		id: 'e1',
		slug: 'agf-2026',
		status: 'CONFIRMED',
		title: 'Anime x Game Festival 2026',
		countryCode: 'KR',
		isOnline: false,
		startsAt: '2026-12-03T15:00:00.000Z',
		endsAt: '2026-12-06T15:00:00.000Z',
		isAllDay: true,
		...overrides
	};
}

describe('시리즈 목록 API의 요약 칸', () => {
	it('요약으로 카드를 만든다 — 다음 회차의 날짜 기준 시간대는 개최국 시간대다', () => {
		const card = cardFromSummary(
			seriesItem('agf', {
				eventCount: 3,
				countryCodes: ['KR', 'JP'],
				nextEvent: eventRef(),
				latestEvent: eventRef({
					slug: 'agf-2025',
					status: 'ENDED',
					startsAt: '2025-12-05T15:00:00.000Z',
					endsAt: '2025-12-07T15:00:00.000Z'
				}),
				tags: ['exhibition']
			}),
			NOW
		);
		expect(card.next?.edition.slug).toBe('agf-2026');
		expect(card.next?.phase).toBe('upcoming');
		expect(card.next?.edition.range.timezone).toBe('Asia/Seoul');
		expect(card.latest?.slug).toBe('agf-2025');
		expect(card).toMatchObject({ countries: ['KR', 'JP'], editionCount: 3, tags: ['exhibition'] });
	});

	it('화면을 열어 둔 사이 다음 회차가 끝났으면 최근 회차로 옮긴다', () => {
		const card = cardFromSummary(
			seriesItem('g-star', {
				nextEvent: eventRef({
					slug: 'g-star-2026',
					startsAt: '2026-11-18T15:00:00.000Z',
					endsAt: '2026-11-22T15:00:00.000Z'
				})
			}),
			NOW
		);
		expect(card.next).toBeNull();
		expect(card.latest?.slug).toBe('g-star-2026');
	});

	it('연기·진행 중 회차는 다음 회차로 남는다', () => {
		const postponed = cardFromSummary(
			seriesItem('a', {
				nextEvent: eventRef({
					status: 'POSTPONED',
					startsAt: '2026-10-01T00:00:00.000Z',
					endsAt: null
				})
			}),
			NOW
		);
		expect(postponed.next?.phase).toBe('postponed');
		const ongoing = cardFromSummary(
			seriesItem('b', {
				nextEvent: eventRef({
					startsAt: '2026-11-24T15:00:00.000Z',
					endsAt: '2026-11-27T15:00:00.000Z'
				})
			}),
			NOW
		);
		expect(ongoing.next?.phase).toBe('ongoing');
	});

	it('회차 없는 시리즈는 다음·최근 회차가 없고 맨 뒤로 간다', () => {
		const sorted = sortSeriesCards(
			[seriesItem('playx4'), seriesItem('agf', { eventCount: 1, nextEvent: eventRef() })].map(
				(item) => cardFromSummary(item, NOW)
			)
		);
		expect(sorted.map((card) => card.series.slug)).toEqual(['agf', 'playx4']);
		expect(sorted[1]).toMatchObject({ next: null, latest: null, editionCount: 0 });
	});
});

describe('시리즈 회차 API의 연혁(끝난·취소 회차 포함)', () => {
	it('API가 최근 회차부터 줘도 연도별로 묶고, 끝난·취소 회차를 그 상태로 보여준다', () => {
		const fromApi = [
			edition('cw-339', 'comic-world', '2027-01-09', '2027-01-10'),
			edition('cw-338', 'comic-world', '2026-10-24', '2026-10-25', { status: 'ENDED' }),
			edition('cw-336', 'comic-world', '2026-08-01', '2026-08-02', { status: 'CANCELLED' }),
			edition('cw-330', 'comic-world', '2025-12-20', '2025-12-21', { status: 'ENDED' })
		];
		const history = historyByYear(fromApi, NOW);
		expect(history.map((group) => group.year)).toEqual(['2027', '2026', '2025']);
		expect(history[1].editions.map(({ event, phase }) => [event.slug, phase])).toEqual([
			['cw-338', 'ended'],
			['cw-336', 'cancelled']
		]);
		const overview = seriesOverview(fromApi, NOW);
		expect(overview.next?.event.slug).toBe('cw-339');
		expect(overview.latest?.slug).toBe('cw-338');
		expect(overview.editionCount).toBe(4);
	});
});
