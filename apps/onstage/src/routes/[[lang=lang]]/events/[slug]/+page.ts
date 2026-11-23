import { error } from '@sveltejs/kit';
import { emptyList, getEvent, listEventSeries, listTagGroups, orFallback } from '$lib/api';
import { metaDescription, type PageSeo } from '$lib/seo';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, parent, params }) => {
	const { locale } = await parent();

	// 태그·시리즈는 이름을 붙이는 데만 쓰므로, 못 받으면 slug를 그대로 보여주고 행사 본문은 막지 않는다.
	const [event, tagGroups, series] = await Promise.all([
		getEvent(fetch, params.slug, locale),
		orFallback(listTagGroups(fetch, locale), emptyList()),
		orFallback(listEventSeries(fetch, locale), emptyList())
	]);
	if (!event) error(404, '행사를 찾을 수 없습니다 / イベントが見つかりません / Event not found');

	// 행사 응답의 tags/eventSeries는 slug만 주므로(§public-event-shape.ts) 사람이 읽는
	// 이름은 각각 /v1/tags, /v1/event-series에서 만든 lookup으로 붙인다.
	const tagNames = new Map<string, string>();
	for (const group of tagGroups.items) {
		for (const tag of group.tags) tagNames.set(tag.slug, tag.name);
	}
	const seriesTitles = new Map(series.items.map((item) => [item.slug, item.title ?? item.slug]));

	const seo: PageSeo = {
		title: event.title ?? event.slug,
		description: event.summary ? metaDescription(event.summary) : undefined
	};

	return { event, tagNames, seriesTitles, seo };
};
