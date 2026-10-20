import type { RequestHandler } from './$types';

// Sitemap 줄은 절대 주소여야 해서 접속한 주소로 만든다(정적 파일로는 도메인이 바뀔 때마다 고쳐야 한다).
export const GET: RequestHandler = ({ url }) =>
	new Response(`User-agent: *\nDisallow:\n\nSitemap: ${url.origin}/sitemap.xml\n`, {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			'Cache-Control': 'public, max-age=3600'
		}
	});
