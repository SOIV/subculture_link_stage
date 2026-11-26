import { error } from '@sveltejs/kit';
import {
	emptyList,
	getEventSeries,
	isMissingRoute,
	listEvents,
	listEventSeries,
	listEventSeriesEvents,
	listTagGroups,
	orFallback,
	type EventSeriesSummary,
	type EventSummary
} from '$lib/api';
import { tv, type Locale } from '$lib/i18n';
import { metaDescription, type PageSeo } from '$lib/seo';
import type { PageLoad } from './$types';

type SeriesPage = {
	series: EventSeriesSummary & { description?: string | null };
	editions: EventSummary[];
};

const NOT_FOUND = '행사를 찾을 수 없습니다 / イベントが見つかりません / Event not found';

/** 시리즈 상세 API와 시리즈 회차 API(끝난·취소 회차 포함). 이 경로가 없는 이전 API면 null. */
async function fromSeriesApi(
	fetchFn: typeof fetch,
	slug: string,
	locale: Locale
): Promise<SeriesPage | null> {
	try {
		const [series, editions] = await Promise.all([
			getEventSeries(fetchFn, slug, locale),
			listEventSeriesEvents(fetchFn, slug, locale)
		]);
		if (!series || !editions) error(404, NOT_FOUND);
		return { series, editions: editions.items };
	} catch (cause) {
		if (isMissingRoute(cause)) return null;
		throw cause;
	}
}

/**
 * 이전 API(배포 전)용: 시리즈 목록에서 이 slug를 찾고 전체 행사 목록에서 이 시리즈 회차만 고른다.
 * 이 API는 확정·연기 회차만 주므로 처음부터 끝난·취소로 넣은 회차는 연혁에 없다.
 */
async function fromEventList(
	fetchFn: typeof fetch,
	slug: string,
	locale: Locale
): Promise<SeriesPage> {
	const [seriesList, events] = await Promise.all([
		listEventSeries(fetchFn, locale),
		listEvents(fetchFn, { locale })
	]);
	const series = seriesList.items.find((item) => item.slug === slug);
	if (!series) error(404, NOT_FOUND);
	return { series, editions: events.items.filter((event) => event.eventSeries?.slug === slug) };
}

// 시리즈 상세와 연혁. 요청한 주소는 service worker가 오프라인 저장본으로도 담는다.
export const load: PageLoad = async ({ fetch, parent, params }) => {
	const { locale } = await parent();

	// 태그 그룹은 분류 칩·회차 카드의 태그 이름에만 쓰므로 못 받아도 보여준다.
	const tagGroupsPromise = orFallback(listTagGroups(fetch, locale), emptyList());
	const page =
		(await fromSeriesApi(fetch, params.slug, locale)) ??
		(await fromEventList(fetch, params.slug, locale));
	const tagGroups = await tagGroupsPromise;

	const { series, editions } = page;
	const title = series.title ?? series.slug;
	const seo: PageSeo = {
		title,
		description: series.summary
			? metaDescription(series.summary)
			: tv(locale, 'series.metaDescription', { title })
	};

	return { series, editions, tagGroups, seo };
};
