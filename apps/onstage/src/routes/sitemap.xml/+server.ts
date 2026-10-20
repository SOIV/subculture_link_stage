import { listEvents } from '$lib/api';
import { DEFAULT_LOCALE, LOCALES, localeHref } from '$lib/i18n';
import type { RequestHandler } from './$types';

const HREFLANG: Record<(typeof LOCALES)[number], string> = { ko: 'ko-KR', ja: 'ja-JP', en: 'en' };

function escapeXml(value: string) {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

// 로케일별 주소와 서로를 가리키는 alternate 링크를 한 항목으로 만든다.
function urlEntries(origin: string, path: string) {
	const alternates = [
		...LOCALES.map(
			(locale) =>
				`<xhtml:link rel="alternate" hreflang="${HREFLANG[locale]}" href="${escapeXml(origin + localeHref(locale, path))}"/>`
		),
		`<xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(origin + localeHref(DEFAULT_LOCALE, path))}"/>`
	].join('');
	return LOCALES.map(
		(locale) => `<url><loc>${escapeXml(origin + localeHref(locale, path))}</loc>${alternates}</url>`
	);
}

// 접속한 주소(origin)를 그대로 쓰므로 정식 도메인으로 바뀌어도 손댈 곳이 없다. 공개 API에 수정 시각이
// 없어 lastmod는 넣지 않는다.
export const GET: RequestHandler = async ({ fetch, url }) => {
	const { items } = await listEvents(fetch, { locale: DEFAULT_LOCALE });

	const paths = [
		'/',
		'/events',
		...items.map((event) => `/events/${encodeURIComponent(event.slug)}`)
	];
	const body =
		'<?xml version="1.0" encoding="UTF-8"?>' +
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">' +
		paths.flatMap((path) => urlEntries(url.origin, path)).join('') +
		'</urlset>';

	return new Response(body, {
		headers: {
			'Content-Type': 'application/xml; charset=utf-8',
			'Cache-Control': 'public, max-age=3600'
		}
	});
};
