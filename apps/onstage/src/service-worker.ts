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
//   저장본을 보여줄 때는 앱에 알려서 "저장본·마지막 확인 시각"을 띄운다(src/lib/pwa.svelte.ts).
// - 새 버전은 설치 후 바로 넘겨받지 않고 기다린다. 열린 탭은 지난 버전의 앱 파일로 돌고 있어서, 이때
//   지난 캐시를 지우면 그 탭이 아직 받지 않은 화면 파일을 찾지 못한다. 앱이 "새 버전" 안내를 띄우고
//   사용자가 누르면(또는 모든 탭이 닫히면) 넘겨받은 뒤 지난 버전 캐시를 지우고, 열린 탭은 한 번 새로 고친다.
// - 캐시 이름은 scls-onstage-로 시작한다. 정리할 때 이 앱이 만든 캐시만 지운다(같은 주소의 다른 앱 보호).
// - 캐시 저장이 실패해도(저장 공간 부족 등) 네트워크 응답은 그대로 돌려준다(src/lib/sw/cache.ts).
import { PUBLIC_API_BASE_URL } from '$env/static/public';
import { build, files, version } from '$service-worker';
import {
	cacheFirst,
	markHtmlAsSaved,
	matchCache,
	networkFirst,
	openCache,
	putTrimmed,
	savedAtOf,
	withSavedAt,
	type NetworkFirstResult
} from '$lib/sw/cache';

const sw = self as unknown as ServiceWorkerGlobalScope;

const CACHE_PREFIX = 'scls-onstage-';
const ASSET_CACHE = `${CACHE_PREFIX}assets-${version}`;
const PAGE_CACHE = `${CACHE_PREFIX}pages-${version}`;
const API_CACHE = `${CACHE_PREFIX}api-${version}`;
// 글꼴은 앱 버전과 상관없어 배포해도 그대로 둔다. 개수만 제한한다.
const FONT_CACHE = `${CACHE_PREFIX}fonts`;
const CURRENT = [ASSET_CACHE, PAGE_CACHE, API_CACHE, FONT_CACHE];
// 접두사를 붙이기 전(2026-11 첫 PWA 배포)에 쓰던 캐시 이름. 이 앱이 만든 것만 정확히 골라 지운다.
const LEGACY_CACHE = /^(?:(?:assets|pages|api)-\d+|fonts)$/;

// 오래 쌓이지 않게 개수를 제한한다(오래된 것부터 지운다).
const MAX_PAGES = 60;
const MAX_API = 150;
const MAX_FONTS = 30;
// 화면 안에서 이동한 페이지는 HTML을 따로 받아 담는다(아래 message). 이보다 최근 저장본이 있으면 다시 받지 않는다.
const PAGE_REFRESH_MS = 10 * 60 * 1000;
// 캐시가 있을 때 네트워크를 기다리는 최대 시간. 느린 행사장 통신에서는 이만큼 기다린 뒤 저장본을 보여준다.
const NETWORK_TIMEOUT_MS = 4000;
// 페이지·API 저장본을 보여주는 최대 기간. 일정·예매 정보는 바뀌므로 이보다 오래된 저장본은 지운다.
const MAX_SAVED_AGE_MS = 14 * 24 * 60 * 60 * 1000;
// 서버가 HTML 응답에 붙이는 앱 버전(src/hooks.server.ts). 다른 버전의 HTML은 이 버전 캐시에 담지 않는다.
const VERSION_HEADER = 'x-scls-version';

const PRECACHE = [...build, ...files];
const PRECACHE_SET = new Set(PRECACHE);
const API_BASE = new URL(PUBLIC_API_BASE_URL);
const API_PATH = API_BASE.pathname.replace(/\/$/, '');

sw.addEventListener('install', (event) => {
	// skipWaiting()을 부르지 않는다 — 위 설명처럼 열린 탭이 없거나 사용자가 새로 고침을 고를 때 넘겨받는다.
	event.waitUntil(caches.open(ASSET_CACHE).then((cache) => cache.addAll(PRECACHE)));
});

sw.addEventListener('activate', (event) => {
	event.waitUntil(
		(async () => {
			for (const key of await caches.keys()) {
				const ours = key.startsWith(CACHE_PREFIX) || LEGACY_CACHE.test(key);
				if (ours && !CURRENT.includes(key)) await caches.delete(key);
			}
			// 처음 설치될 때 지금 열린 페이지도 바로 맡는다(앱이 이때 그 페이지를 저장해 달라고 알린다).
			await sw.clients.claim();
		})()
	);
});

// 앱(src/lib/pwa.svelte.ts)이 보내는 요청:
// - skip-waiting: 사용자가 "새 버전" 안내에서 새로 고침을 눌렀다. 기다리던 새 버전이 넘겨받는다.
// - cache-page: 이 주소들의 HTML을 담아 둔다. 화면 안 이동(클라이언트 라우팅)과 처음 방문한 페이지는
//   HTML 요청이 이 worker를 거치지 않아서 그대로는 오프라인 보관이 안 된다. 서버에서 그린 HTML에는
//   그 페이지의 API 응답이 함께 실려 있어 오프라인에서도 그대로 다시 그려진다.
sw.addEventListener('message', (event) => {
	const data: unknown = event.data;
	if (typeof data !== 'object' || data === null) return;
	const type = (data as { type?: unknown }).type;
	if (type === 'skip-waiting') {
		event.waitUntil(sw.skipWaiting());
		return;
	}
	if (type !== 'cache-page') return;
	const urls = (data as { urls?: unknown }).urls;
	if (!Array.isArray(urls)) return;
	const targets = urls
		.filter((value): value is string => typeof value === 'string')
		.map((value) => new URL(value, sw.location.origin))
		.filter((url) => url.origin === sw.location.origin);
	event.waitUntil(Promise.all(targets.map(cachePage)));
});

/** 이 버전의 앱이 그린 HTML인지. 버전 표시가 없으면(개발 서버 등) 이 버전으로 본다. */
function isOwnVersion(response: Response): boolean {
	const responseVersion = response.headers.get(VERSION_HEADER);
	if (!responseVersion || responseVersion === version) return true;
	// 서버에는 이미 새 버전이 올라가 있다 — 새 worker를 받아 오게 한다(앱이 "새 버전" 안내를 띄운다).
	sw.registration.update().catch(() => {});
	return false;
}

function isStorablePage(response: Response): boolean {
	return (
		response.ok &&
		response.type !== 'opaque' &&
		Boolean(response.headers.get('content-type')?.includes('text/html')) &&
		isOwnVersion(response)
	);
}

async function cachePage(url: URL) {
	const cache = await openCache(caches, PAGE_CACHE);
	if (!cache) return;
	const request = new Request(url.href, { headers: { accept: 'text/html' } });
	const cached = await matchCache(cache, request, { ignoreVary: true });
	const savedAt = cached ? savedAtOf(cached) : null;
	if (savedAt !== null && Date.now() - savedAt < PAGE_REFRESH_MS) return;
	try {
		const response = await fetch(request);
		if (isStorablePage(response)) {
			await putTrimmed(cache, request, withSavedAt(response, Date.now()), MAX_PAGES);
		}
	} catch {
		// 오프라인이면 다음 기회에 담는다.
	}
}

sw.addEventListener('fetch', (event) => {
	const { request } = event;
	if (request.method !== 'GET') return;
	const url = new URL(request.url);
	const waitUntil = (promise: Promise<unknown>) => event.waitUntil(promise);

	if (url.origin === sw.location.origin) {
		if (PRECACHE_SET.has(url.pathname)) {
			event.respondWith(
				openCache(caches, ASSET_CACHE).then((cache) =>
					cacheFirst({ request, cache, fetch, waitUntil, maxEntries: Number.MAX_SAFE_INTEGER })
				)
			);
			return;
		}
		if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
			event.respondWith(
				respondNetworkFirst(event, PAGE_CACHE, MAX_PAGES, isStorablePage).then((result) => {
					if (!result) return offlinePage(url);
					if (!result.fromCache) return result.response;
					// 저장본 HTML이면 <html>에 저장 시각을 적어 앱이 안내를 띄우게 한다.
					return markHtmlAsSaved(result.response.clone(), result.savedAt).catch(
						() => result.response
					);
				})
			);
			return;
		}
		// 매니페스트와 SvelteKit 페이지 데이터(지금은 서버 load가 없어 쓰이지 않지만 생기면)도 마지막으로
		// 받은 것을 보관한다. 그 밖의 요청(개발 서버 파일 등)은 건드리지 않는다.
		if (!url.pathname.endsWith('/manifest.webmanifest') && !url.pathname.endsWith('/__data.json')) {
			return;
		}
		event.respondWith(
			respondNetworkFirst(event, PAGE_CACHE, MAX_PAGES).then((result) =>
				result ? notifyIfSaved(event, result) : Response.error()
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
			respondNetworkFirst(event, API_CACHE, MAX_API).then((result) =>
				result ? notifyIfSaved(event, result) : Response.error()
			)
		);
		return;
	}

	// 제목용 글꼴(Google Fonts). 바뀔 일이 거의 없어 저장본을 먼저 쓰고 뒤에서 새로 받는다.
	// 글꼴 CSS는 crossorigin 없는 <link>로 받아 opaque 응답이라 그것도 담는다.
	if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
		event.respondWith(
			openCache(caches, FONT_CACHE).then((cache) =>
				cacheFirst({
					request,
					cache,
					fetch,
					waitUntil,
					maxEntries: MAX_FONTS,
					revalidate: true,
					shouldStore: (response) => response.ok || response.type === 'opaque'
				})
			)
		);
	}
});

async function respondNetworkFirst(
	event: FetchEvent,
	cacheName: string,
	maxEntries: number,
	shouldStore?: (response: Response) => boolean
): Promise<NetworkFirstResult | undefined> {
	return networkFirst({
		request: event.request,
		cache: await openCache(caches, cacheName),
		fetch,
		waitUntil: (promise) => event.waitUntil(promise),
		maxEntries,
		timeoutMs: NETWORK_TIMEOUT_MS,
		maxAgeMs: MAX_SAVED_AGE_MS,
		shouldStore
	});
}

/** 저장본을 돌려줬으면 요청한 탭에 저장 시각을 알린다(앱이 "저장본" 안내를 띄운다). */
function notifyIfSaved(event: FetchEvent, result: NetworkFirstResult): Response {
	if (result.fromCache && event.clientId) {
		event.waitUntil(
			sw.clients
				.get(event.clientId)
				.then((client) =>
					client?.postMessage({
						type: 'saved-response',
						url: event.request.url,
						savedAt: result.savedAt
					})
				)
				.catch(() => {})
		);
	}
	return result.response;
}

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
