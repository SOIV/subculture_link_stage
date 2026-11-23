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
		transformPageChunk: ({ html }) => html.replace('lang="en"', `lang="${locale}"`),
		// load의 fetch로 받은 API 응답을 HTML에 실을 때 content-type도 함께 싣는다. $lib/api.ts가
		// JSON 응답인지 확인하는 데 쓰며, 허용하지 않으면 SSR에서 이 헤더를 읽을 때 오류가 난다.
		filterSerializedResponseHeaders: (name) => name === 'content-type'
	});

	// 이 HTML을 그린 앱 버전. service worker는 자기 버전과 다른 HTML을 오프라인 저장본으로 담지 않는다
	// (지난 버전 worker가 새 버전 HTML을 담으면 오프라인에서 없는 앱 파일을 찾게 된다 — src/service-worker.ts).
	if (response.headers.get('content-type')?.includes('text/html')) {
		response.headers.set('x-scls-version', version);
	}

	// 기본 보안 헤더. 페이지의 콘텐츠 보안 정책(CSP, frame-ancestors 포함)은 vite.config.ts의 kit.csp가
	// 붙인다. 정적 파일(_app/·static/)은 Cloudflare가 바로 내보내 여기를 거치지 않는다.
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	return response;
};
