import { error } from '@sveltejs/kit';
import {
	emptyList,
	getEventSeries,
	listEventSeriesEvents,
	listTagGroups,
	orFallback
} from '$lib/api';
import { tv } from '$lib/i18n';
import { metaDescription, type PageSeo } from '$lib/seo';
import type { PageLoad } from './$types';

const NOT_FOUND = '행사를 찾을 수 없습니다 / イベントが見つかりません / Event not found';

// 시리즈 상세와 연혁. 요청한 주소는 service worker가 오프라인 저장본으로도 담는다.
export const load: PageLoad = async ({ fetch, parent, params }) => {
	const { locale } = await parent();

	// 태그 그룹은 분류 칩·회차 카드의 태그 이름에만 쓰므로 못 받아도 보여준다.
	const [series, editionList, tagGroups] = await Promise.all([
		getEventSeries(fetch, params.slug, locale),
		listEventSeriesEvents(fetch, params.slug, locale),
		orFallback(listTagGroups(fetch, locale), emptyList())
	]);
	if (!series || !editionList) error(404, NOT_FOUND);
	const editions = editionList.items;

	const title = series.title ?? series.slug;
	const seo: PageSeo = {
		title,
		description: series.summary
			? metaDescription(series.summary)
			: tv(locale, 'series.metaDescription', { title })
	};

	return { series, editions, tagGroups, seo };
};
