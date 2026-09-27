import { error } from '@sveltejs/kit';
import { getEvent, listEventSeries, listTagGroups } from '$lib/api';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, parent, params }) => {
	const { locale } = await parent();

	const [event, tagGroups, series] = await Promise.all([
		getEvent(fetch, params.slug, locale),
		listTagGroups(fetch, locale),
		listEventSeries(fetch, locale)
	]);
	if (!event) error(404, '행사를 찾을 수 없습니다 / イベントが見つかりません / Event not found');

	// 행사 응답의 tags/eventSeries는 slug만 주므로(§public-event-shape.ts) 사람이 읽는
	// 이름은 각각 /v1/tags, /v1/event-series에서 만든 lookup으로 붙인다.
	const tagNames = new Map<string, string>();
	for (const group of tagGroups.items) {
		for (const tag of group.tags) tagNames.set(tag.slug, tag.name);
	}
	const seriesTitles = new Map(series.items.map((item) => [item.slug, item.title ?? item.slug]));

	return { event, tagNames, seriesTitles };
};
