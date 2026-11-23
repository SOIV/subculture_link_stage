import { emptyList, listEvents, listTagGroups, orFallback, ScLsApiError } from '$lib/api';
import type { ListFilters } from '$lib/filters';
import { t } from '$lib/i18n';
import type { PageSeo } from '$lib/seo';
import type { PageLoad } from './$types';

// 태그 그룹이 아닌 조건 이름. 이 밖의 이름은 태그 그룹 slug일 수 있다.
const FIXED_PARAMS = ['q', 'country', 'from', 'to', 'ended'];

/** 날짜 입력값(YYYY-MM-DD)이 실제로 있는 날짜인지. */
function isValidDate(value: string): boolean {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
	const date = new Date(`${value}T00:00:00Z`);
	return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

export const load: PageLoad = async ({ fetch, parent, url }) => {
	const { locale } = await parent();

	// 비어 있는 값은 "조건 없음"으로 본다(?q=&country= 처럼 빈 칸이 실려 와도 문제없게).
	const param = (name: string) => url.searchParams.get(name)?.trim() ?? '';

	// 날짜 칸에 이상한 값이 들어오면(주소를 직접 고친 경우 등) API 오류로 화면 전체를 막지 않고
	// 그 조건만 빼고 찾은 뒤, 그 칸에 안내를 붙인다(FilterBar).
	const invalidFields = (['from', 'to'] as const).filter(
		(name) => param(name) && !isValidDate(param(name))
	);
	const dateParam = (name: 'from' | 'to') => (invalidFields.includes(name) ? '' : param(name));

	// 태그 그룹 slug와 같은 이름의 조건이 그룹별 선택값이다. 그룹 목록이 있어야 어떤 이름이 태그 조건인지
	// 알 수 있다. 태그 조건이 없을 수 있는 주소(그룹이 아닌 조건만 있음)는 그룹 목록과 행사 목록을 동시에
	// 받고, 그룹 목록을 못 받아도 행사는 보여준다. 태그 조건이 있을 수 있으면 그룹 목록을 먼저 받는다.
	const maybeTagged = [...url.searchParams.keys()].some(
		(name) => !FIXED_PARAMS.includes(name) && param(name)
	);
	const tagGroupsPromise = maybeTagged
		? listTagGroups(fetch, locale)
		: orFallback(listTagGroups(fetch, locale), emptyList());

	const groups: Record<string, string> = {};
	if (maybeTagged) {
		for (const group of (await tagGroupsPromise).items) {
			const value = param(group.slug);
			if (value && group.tags.some((tag) => tag.slug === value)) groups[group.slug] = value;
		}
	}

	const filters: ListFilters = {
		q: param('q'),
		country: param('country'),
		from: dateParam('from'),
		to: dateParam('to'),
		groups,
		showEnded: param('ended') === '1'
	};

	// 조건이 잘못돼 API가 거절하면(400·422) 오류 화면 대신 빈 결과와 "조건을 확인해 달라"는 안내를 보여준다.
	let invalidQuery = false;
	const eventsPromise = listEvents(fetch, {
		locale,
		q: filters.q || undefined,
		country: filters.country || undefined,
		from: filters.from || undefined,
		to: filters.to || undefined,
		// 서로 다른 그룹에서 고른 태그는 API가 "모두 만족"으로 처리한다.
		tags: Object.values(groups).join(',') || undefined
	}).catch((error: unknown) => {
		if (error instanceof ScLsApiError && error.isClientInput) {
			invalidQuery = true;
			return emptyList<never>();
		}
		throw error;
	});

	// 끝난 행사를 숨기는 것(?ended=1이 아니면)은 화면(+page.svelte)에서 한다. 날짜가 바뀌면 다시
	// 계산해야 하는데, load는 다시 돌지 않기 때문이다.
	const [events, tagGroups] = await Promise.all([eventsPromise, tagGroupsPromise]);

	// 검색어·필터를 건 결과 페이지는 조합이 무한히 많아 색인에 넣지 않는다(조건 없는 목록만 색인).
	const isFiltered = Boolean(
		filters.q ||
		filters.country ||
		filters.from ||
		filters.to ||
		filters.showEnded ||
		invalidFields.length > 0 ||
		Object.keys(groups).length > 0
	);
	const seo: PageSeo = { title: t(locale, 'nav.events'), noindex: isFiltered };

	return { events, tagGroups, filters, invalidFields, invalidQuery, seo };
};
