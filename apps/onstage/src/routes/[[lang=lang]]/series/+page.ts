import {
	emptyList,
	listEvents,
	listEventSeries,
	listTagGroups,
	orFallback,
	type EventSummary
} from '$lib/api';
import { t } from '$lib/i18n';
import type { PageSeo } from '$lib/seo';
import { hasSeriesSummary } from '$lib/series';
import type { PageLoad } from './$types';

// 행사 목록(시리즈 묶음). 카드의 개최국·다음 회차·최근 회차는 시리즈 목록 API의 요약 칸으로 그린다.
// 요약 칸이 없는 이전 API(배포 전)면 전체 행사 목록을 받아 화면에서 묶는다($lib/series.ts 위 설명).
// 예정·진행 중과 순서는 "지금" 시각에 따라 달라지므로 load가 아니라 화면에서 계산한다 — load는 날짜가
// 바뀌어도 다시 돌지 않는다.
export const load: PageLoad = async ({ fetch, parent }) => {
	const { locale } = await parent();

	// 태그 그룹은 분류 칩 이름에만 쓰므로 못 받아도 목록은 보여준다.
	const [series, tagGroups] = await Promise.all([
		listEventSeries(fetch, locale),
		orFallback(listTagGroups(fetch, locale), emptyList())
	]);

	let events: EventSummary[] = [];
	if (series.items.some((item) => !hasSeriesSummary(item))) {
		events = (await listEvents(fetch, { locale })).items;
	}

	const seo: PageSeo = {
		title: t(locale, 'nav.series'),
		description: t(locale, 'series.listDescription')
	};

	return { series, events, tagGroups, seo };
};
