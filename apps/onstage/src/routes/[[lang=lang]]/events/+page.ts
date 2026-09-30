import { listEvents, listTagGroups } from '$lib/api';
import type { ListFilters } from '$lib/filters';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, parent, url }) => {
	const { locale } = await parent();

	// 비어 있는 값은 "조건 없음"으로 본다(?q=&country= 처럼 빈 칸이 실려 와도 문제없게).
	const param = (name: string) => url.searchParams.get(name)?.trim() ?? '';

	// 태그 그룹 slug와 같은 이름의 조건이 그룹별 선택값이다. 그룹 목록이 있어야 어떤 이름이
	// 태그 조건인지 알 수 있어서 먼저 불러온다. 목록에 없는 태그 값은 무시한다.
	const tagGroups = await listTagGroups(fetch, locale);
	const groups: Record<string, string> = {};
	for (const group of tagGroups.items) {
		const value = param(group.slug);
		if (value && group.tags.some((tag) => tag.slug === value)) groups[group.slug] = value;
	}

	const filters: ListFilters = {
		q: param('q'),
		country: param('country'),
		from: param('from'),
		to: param('to'),
		groups
	};

	const events = await listEvents(fetch, {
		locale,
		q: filters.q || undefined,
		country: filters.country || undefined,
		from: filters.from || undefined,
		to: filters.to || undefined,
		// 서로 다른 그룹에서 고른 태그는 API가 "모두 만족"으로 처리한다.
		tags: Object.values(groups).join(',') || undefined
	});

	return { events, tagGroups, filters };
};
