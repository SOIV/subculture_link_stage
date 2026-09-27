import { searchEvents } from '$lib/api';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, parent, url }) => {
	const { locale } = await parent();
	const q = url.searchParams.get('q')?.trim() ?? '';
	if (!q) return { q, results: null };

	const results = await searchEvents(fetch, q, locale);
	return { q, results };
};
