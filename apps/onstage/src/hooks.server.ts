import type { Handle } from '@sveltejs/kit';
import { DEFAULT_LOCALE, PREFIXED_LOCALES } from '$lib/i18n';

// src/app.html의 <html lang="en">을 실제 로케일로 바꾼다. 접두사 없는 경로는 기본 로케일(ko)이다.
export const handle: Handle = async ({ event, resolve }) => {
	const firstSegment = event.url.pathname.split('/')[1];
	const locale = PREFIXED_LOCALES.includes(firstSegment as (typeof PREFIXED_LOCALES)[number])
		? firstSegment
		: DEFAULT_LOCALE;

	return resolve(event, {
		transformPageChunk: ({ html }) => html.replace('lang="en"', `lang="${locale}"`)
	});
};
