import { error } from '@sveltejs/kit';
import { emptyList, listEvents, listEventSeries, listTagGroups, orFallback } from '$lib/api';
import { tv } from '$lib/i18n';
import { metaDescription, type PageSeo } from '$lib/seo';
import type { PageLoad } from './$types';

// 시리즈 상세와 연혁. 공개 API에 시리즈 상세(/event-series/:slug)와 시리즈별 회차 조회가 아직 없어서
// 시리즈 목록에서 이 slug를 찾고, 전체 행사 목록에서 이 시리즈 회차만 고른다($lib/series.ts 위 설명).
// 두 요청은 행사 목록·일정 목록 화면과 같은 주소라 오프라인 저장본(service worker)도 함께 쓴다.
export const load: PageLoad = async ({ fetch, parent, params }) => {
	const { locale } = await parent();

	const [seriesList, events, tagGroups] = await Promise.all([
		listEventSeries(fetch, locale),
		listEvents(fetch, { locale }),
		orFallback(listTagGroups(fetch, locale), emptyList())
	]);

	const series = seriesList.items.find((item) => item.slug === params.slug);
	if (!series) error(404, '행사를 찾을 수 없습니다 / イベントが見つかりません / Event not found');

	const editions = events.items.filter((event) => event.eventSeries?.slug === series.slug);
	const title = series.title ?? series.slug;
	const seo: PageSeo = {
		title,
		description: series.summary
			? metaDescription(series.summary)
			: tv(locale, 'series.metaDescription', { title })
	};

	return { series, editions, tagGroups, seo };
};
