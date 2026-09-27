import { listEvents, listTagGroups } from '$lib/api';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, parent, url }) => {
	const { locale } = await parent();

	const filters = {
		country: url.searchParams.get('country') ?? undefined,
		tags: url.searchParams.get('tags') ?? undefined,
		from: url.searchParams.get('from') ?? undefined,
		to: url.searchParams.get('to') ?? undefined
	};

	const [events, tagGroups] = await Promise.all([
		listEvents(fetch, { locale, ...filters }),
		listTagGroups(fetch, locale)
	]);

	return { events, tagGroups, filters };
};
