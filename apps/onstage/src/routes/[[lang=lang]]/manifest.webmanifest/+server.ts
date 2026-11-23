import { DEFAULT_LOCALE, localeHref, t, type Locale } from '$lib/i18n';
import type { RequestHandler } from './$types';

// 홈 화면 설치 정보(웹 앱 매니페스트). 언어마다 주소가 따로 있어(/manifest.webmanifest, /ja/…, /en/…)
// 설치한 언어의 메인 화면으로 열린다. id는 언어와 상관없이 같게 둬서 한 기기에 앱이 하나만 설치된다.
// 아이콘은 디자인 확정 전 임시 아이콘이다(static/icons).
export const GET: RequestHandler = ({ params }) => {
	const locale = (params.lang as Locale | undefined) ?? DEFAULT_LOCALE;
	const manifest = {
		id: '/',
		name: t(locale, 'site.name'),
		short_name: 'SCLS',
		description: t(locale, 'site.tagline'),
		lang: locale,
		start_url: localeHref(locale, '/'),
		scope: '/',
		display: 'standalone',
		// 배경·상단 막대 색은 라이트 화면 배경(zinc-50)과 같다 — 실행 직후 첫 화면 색이기도 하다.
		background_color: '#fafafa',
		theme_color: '#fafafa',
		icons: [
			{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
			{ src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
			{
				src: '/icons/icon-maskable-512.png',
				sizes: '512x512',
				type: 'image/png',
				purpose: 'maskable'
			},
			{ src: '/icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }
		]
	};
	return new Response(JSON.stringify(manifest), {
		headers: {
			'Content-Type': 'application/manifest+json; charset=utf-8',
			'Cache-Control': 'public, max-age=86400'
		}
	});
};
