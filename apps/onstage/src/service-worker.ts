/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
/// <reference types="@sveltejs/kit" />

// 오프라인 보기용 service worker. SvelteKit이 이 파일을 /service-worker.js로 빌드하고 자동으로 등록한다.
// 목표는 "한 번 본 페이지와 목록을 통신이 끊겨도 다시 볼 수 있게"까지다(사람이 몰려 통신이 불안한 행사장).
// 웹 푸시 알림은 서버 작업이 필요해 여기 넣지 않았다(docs/devlog/future-feature-discussions.md#record-4).
//
// - 앱 파일(_app/immutable/…)과 static 파일: 설치할 때 미리 받아 두고 캐시에서 바로 꺼낸다.
// - 페이지(HTML)와 공개 API 응답: 네트워크 먼저. 받으면 캐시에 넣고, 못 받거나 늦으면 캐시를 보여준다.
//   서버에서 그린 HTML에는 API 응답이 함께 실려 오므로, 새로고침한 페이지도 HTML 캐시만으로 다시 그려진다.
//   화면 안에서 이동할 때는 브라우저가 API를 직접 부르므로 API 응답도 따로 담아 둔다.
// - 캐시 이름에 빌드 버전이 붙어 새로 배포하면 지난 버전 캐시는 지운다. 지난 HTML은 지난 앱 파일을
//   가리켜서 새 버전에서는 쓸 수 없기 때문이다(그래서 배포 뒤에는 다시 본 페이지부터 오프라인 보관된다).
import { PUBLIC_API_BASE_URL } from '$env/static/public';
import { build, files, version } from '$service-worker';

const sw = self as unknown as ServiceWorkerGlobalScope;

const ASSET_CACHE = `assets-${version}`;
const PAGE_CACHE = `pages-${version}`;
const API_CACHE = `api-${version}`;
const FONT_CACHE = 'fonts';
const CURRENT = [ASSET_CACHE, PAGE_CACHE, API_CACHE, FONT_CACHE];

// 오래 쌓이지 않게 개수를 제한한다(오래된 것부터 지운다).
const MAX_PAGES = 60;
const MAX_API = 150;
// 화면 안에서 이동한 페이지는 HTML을 따로 받아 담는다(아래 message). 이보다 최근 저장본이 있으면 다시 받지 않는다.
const PAGE_REFRESH_MS = 10 * 60 * 1000;
// 캐시가 있을 때 네트워크를 기다리는 최대 시간. 느린 행사장 통신에서는 이만큼 기다린 뒤 저장본을 보여준다.
const NETWORK_TIMEOUT_MS = 4000;

const PRECACHE = [...build, ...files];
const PRECACHE_SET = new Set(PRECACHE);
const API_BASE = new URL(PUBLIC_API_BASE_URL);
const API_PATH = API_BASE.pathname.replace(/\/$/, '');

sw.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(ASSET_CACHE)
			.then((cache) => cache.addAll(PRECACHE))
			.then(() => sw.skipWaiting())
	);
});

sw.addEventListener('activate', (event) => {
	event.waitUntil(
		(async () => {
			for (const key of await caches.keys()) {
				if (!CURRENT.includes(key)) await caches.delete(key);
			}
			await sw.clients.claim();
		})()
	);
});

// 화면 안 이동(클라이언트 라우팅)은 HTML을 받지 않아서 그대로는 오프라인 보관이 안 된다. 그래서 이동이
// 끝나면 페이지가 주소를 알려 주고(src/routes/+layout.svelte), 여기서 그 주소의 HTML을 받아 담는다.
// 서버에서 그린 HTML에는 그 페이지의 API 응답이 함께 실려 있어 오프라인에서도 그대로 다시 그려진다.
sw.addEventListener('message', (event) => {
	const data: unknown = event.data;
	if (
		typeof data !== 'object' ||
		data === null ||
		(data as { type?: unknown }).type !== 'cache-page' ||
		typeof (data as { url?: unknown }).url !== 'string'
	) {
		return;
	}
	const url = new URL((data as { url: string }).url);
	if (url.origin !== sw.location.origin) return;
	event.waitUntil(cachePage(url));
});

async function cachePage(url: URL) {
	const cache = await caches.open(PAGE_CACHE);
	const request = new Request(url.href, { headers: { accept: 'text/html' } });
	const cached = await cache.match(request, { ignoreVary: true });
	const savedAt = Date.parse(cached?.headers.get('date') ?? '');
	if (cached && Date.now() - savedAt < PAGE_REFRESH_MS) return;
	try {
		const response = await fetch(request);
		if (response.ok && response.headers.get('content-type')?.includes('text/html')) {
			await putTrimmed(cache, request, response, MAX_PAGES);
		}
	} catch {
		// 오프라인이면 다음 기회에 담는다.
	}
}

sw.addEventListener('fetch', (event) => {
	const { request } = event;
	if (request.method !== 'GET') return;
	const url = new URL(request.url);

	if (url.origin === sw.location.origin) {
		if (PRECACHE_SET.has(url.pathname)) {
			event.respondWith(cacheFirst(request, ASSET_CACHE));
			return;
		}
		if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
			event.respondWith(
				networkFirst(event, request, PAGE_CACHE, MAX_PAGES).then(
					(response) => response ?? offlinePage(url)
				)
			);
			return;
		}
		// 매니페스트와 SvelteKit 페이지 데이터(지금은 서버 load가 없어 쓰이지 않지만 생기면)도 마지막으로
		// 받은 것을 보관한다. 그 밖의 요청(개발 서버 파일 등)은 건드리지 않는다.
		if (!url.pathname.endsWith('/manifest.webmanifest') && !url.pathname.endsWith('/__data.json')) {
			return;
		}
		event.respondWith(
			networkFirst(event, request, PAGE_CACHE, MAX_PAGES).then(
				(response) => response ?? Response.error()
			)
		);
		return;
	}

	// 공개 API(GET만). 캘린더 구독 파일(.ics)은 캘린더 앱이 받는 것이라 담지 않는다.
	if (
		url.origin === API_BASE.origin &&
		url.pathname.startsWith(API_PATH + '/') &&
		!url.pathname.endsWith('.ics')
	) {
		event.respondWith(
			networkFirst(event, request, API_CACHE, MAX_API).then(
				(response) => response ?? Response.error()
			)
		);
		return;
	}

	// 제목용 글꼴(Google Fonts). 바뀔 일이 거의 없어 저장본을 먼저 쓰고 뒤에서 새로 받는다.
	if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
		event.respondWith(staleWhileRevalidate(event, request, FONT_CACHE));
	}
});

async function cacheFirst(request: Request, cacheName: string): Promise<Response> {
	const cache = await caches.open(cacheName);
	const cached = await cache.match(request);
	if (cached) return cached;
	const response = await fetch(request);
	if (response.ok) await cache.put(request, response.clone());
	return response;
}

/**
 * 네트워크 먼저. 받은 응답(200)은 캐시에 넣는다. 네트워크가 실패하거나 서버 오류(5xx)면 저장본을,
 * 저장본이 있는데 네트워크가 NETWORK_TIMEOUT_MS 넘게 걸리면 저장본을 먼저 돌려준다(받는 중인 응답은
 * 끝까지 받아 캐시를 새로 고친다). 둘 다 없으면 undefined.
 */
async function networkFirst(
	event: FetchEvent,
	request: Request,
	cacheName: string,
	maxEntries: number
): Promise<Response | undefined> {
	const cache = await caches.open(cacheName);
	const cached = await cache.match(request, { ignoreVary: true });

	const network = fetch(request).then(async (response) => {
		if (response.ok && response.type !== 'opaque') {
			await putTrimmed(cache, request, response.clone(), maxEntries);
		}
		return response;
	});
	event.waitUntil(network.then(noop, noop));

	if (!cached) return network.catch(() => undefined);

	return new Promise<Response>((resolve) => {
		const timer = setTimeout(() => resolve(cached), NETWORK_TIMEOUT_MS);
		network.then(
			(response) => {
				clearTimeout(timer);
				resolve(response.status >= 500 ? cached : response);
			},
			() => {
				clearTimeout(timer);
				resolve(cached);
			}
		);
	});
}

async function staleWhileRevalidate(
	event: FetchEvent,
	request: Request,
	cacheName: string
): Promise<Response> {
	const cache = await caches.open(cacheName);
	const cached = await cache.match(request);
	const network = fetch(request).then(async (response) => {
		if (response.ok || response.type === 'opaque') await cache.put(request, response.clone());
		return response;
	});
	event.waitUntil(network.then(noop, noop));
	return cached ?? network;
}

// 같은 주소를 다시 넣으면 맨 뒤(최신)로 보내고, 개수가 넘치면 가장 오래된 것부터 지운다.
async function putTrimmed(cache: Cache, request: Request, response: Response, max: number) {
	await cache.delete(request, { ignoreVary: true });
	await cache.put(request, response);
	const keys = await cache.keys();
	for (const key of keys.slice(0, Math.max(0, keys.length - max))) await cache.delete(key);
}

function noop() {}

// 한 번도 본 적 없는 페이지를 오프라인에서 열었을 때 보여줄 안내. 앱 파일 없이 혼자 그려지는 HTML이다.
const OFFLINE_TEXT = {
	ko: {
		title: '오프라인 상태예요',
		body: '이 페이지는 아직 저장된 적이 없어서 지금은 볼 수 없어요. 전에 본 페이지는 통신이 끊겨도 열 수 있어요.',
		home: '메인으로',
		retry: '다시 시도'
	},
	ja: {
		title: 'オフラインです',
		body: 'このページはまだ保存されていないため、今は表示できません。以前に表示したページはオフラインでも開けます。',
		home: 'トップへ',
		retry: '再読み込み'
	},
	en: {
		title: "You're offline",
		body: "This page hasn't been saved yet, so it can't be shown right now. Pages you've viewed before still open offline.",
		home: 'Go to home',
		retry: 'Try again'
	}
} as const;

function offlinePage(url: URL): Response {
	const first = url.pathname.split('/')[1];
	const locale = first === 'ja' || first === 'en' ? first : 'ko';
	const text = OFFLINE_TEXT[locale];
	const home = locale === 'ko' ? '/' : `/${locale}`;
	const html = `<!doctype html><html lang="${locale}"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#fafafa"><title>${text.title} · SCLS Onstage</title>
<style>
:root{color-scheme:light dark}
body{margin:0;min-height:100dvh;display:grid;place-items:center;padding:24px;box-sizing:border-box;
font-family:system-ui,sans-serif;background:#fafafa;color:#18181b}
@media (prefers-color-scheme:dark){body{background:#09090b;color:#f4f4f5}p{color:#a1a1aa}}
main{max-width:28rem}h1{font-size:1.5rem;margin:0 0 .5rem}p{color:#52525b;line-height:1.6;margin:0 0 1.5rem}
a,button{display:inline-flex;align-items:center;height:44px;padding:0 16px;border-radius:12px;font:inherit;
font-weight:500;text-decoration:none;border:0;cursor:pointer;margin-right:8px}
a{background:#7c3aed;color:#fff}button{background:transparent;color:inherit;box-shadow:inset 0 0 0 1px #d4d4d8}
</style></head><body><main><h1>${text.title}</h1><p>${text.body}</p>
<a href="${home}">${text.home}</a><button type="button" onclick="location.reload()">${text.retry}</button>
</main></body></html>`;
	return new Response(html, {
		status: 503,
		headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }
	});
}
