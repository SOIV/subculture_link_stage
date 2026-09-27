import type { LayoutLoad } from './$types';
import { DEFAULT_LOCALE, type Locale } from '$lib/i18n';

export const load: LayoutLoad = ({ params }) => {
	const locale = ((params.lang as Locale | undefined) ?? DEFAULT_LOCALE) satisfies Locale;
	return { locale };
};
