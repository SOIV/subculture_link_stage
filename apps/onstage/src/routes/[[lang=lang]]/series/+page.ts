import { emptyList, listEvents, listEventSeries, listTagGroups, orFallback } from '$lib/api';
import { t } from '$lib/i18n';
import type { PageSeo } from '$lib/seo';
import type { PageLoad } from './$types';

// 행사 목록(시리즈 묶음). 공개 API에 시리즈별 회차 조회가 아직 없어 전체 행사를 받아 화면에서 묶는다
// ($lib/series.ts 위 설명). 묶기·정렬은 "지금" 시각에 따라 달라지므로 load가 아니라 화면에서 한다 —
// load는 날짜가 바뀌어도 다시 돌지 않는다.
export const load: PageLoad = async ({ fetch, parent }) => {
	const { locale } = await parent();

	// 태그 그룹은 분류 칩 이름에만 쓰므로 못 받아도 목록은 보여준다.
	const [series, events, tagGroups] = await Promise.all([
		listEventSeries(fetch, locale),
		listEvents(fetch, { locale }),
		orFallback(listTagGroups(fetch, locale), emptyList())
	]);

	const seo: PageSeo = {
		title: t(locale, 'nav.series'),
		description: t(locale, 'series.listDescription')
	};

	return { series, events, tagGroups, seo };
};
