import type { Handle } from '@sveltejs/kit';
import { version } from '$app/environment';
import { DEFAULT_LOCALE, PREFIXED_LOCALES } from '$lib/i18n';

// src/app.html의 <html lang="en">을 실제 로케일로 바꾼다. 접두사 없는 경로는 기본 로케일(ko)이다.
export const handle: Handle = async ({ event, resolve }) => {
	const firstSegment = event.url.pathname.split('/')[1];
	const locale = PREFIXED_LOCALES.includes(firstSegment as (typeof PREFIXED_LOCALES)[number])
		? firstSegment
		: DEFAULT_LOCALE;

	const response = await resolve(event, {
		transformPageChunk: ({ html }) => html.replace('lang="en"', `lang="${locale}"`)
	});

	// 이 HTML을 그린 앱 버전. service worker는 자기 버전과 다른 HTML을 오프라인 저장본으로 담지 않는다
	// (지난 버전 worker가 새 버전 HTML을 담으면 오프라인에서 없는 앱 파일을 찾게 된다 — src/service-worker.ts).
	if (response.headers.get('content-type')?.includes('text/html')) {
		response.headers.set('x-scls-version', version);
	}
	return response;
};
