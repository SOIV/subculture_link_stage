// 오프라인 보기(src/service-worker.ts)와 앱 사이의 연결. 루트 레이아웃이 브라우저에서 한 번 startPwa()를
// 부르고, 화면의 안내(OfflineNotice·UpdateNotice)는 아래 pwa 상태를 읽는다.
//
// - 새 버전: 새 service worker가 설치돼 기다리면 updateReady가 켜진다. 사용자가 새로 고침을 누르면
//   기다리던 worker에 넘겨받으라고 알리고, 넘겨받으면(controllerchange) 한 번만 새로 고친다. 다른 탭에서
//   넘겨받은 경우에도 이 탭의 지난 앱 파일이 새 worker와 섞이지 않게 같이 새로 고친다.
// - 오프라인 저장(데이터): 서버에서 그린 페이지는 HTML에 실려 온 API 응답을 worker의 API 저장본으로
//   넘긴다($lib/offline-data.ts — 네트워크 요청 없음). 화면 안 이동은 브라우저가 API를 직접 부르므로
//   worker가 받는 길에 저장한다. 오프라인에서 저장된 HTML이 없는 주소를 열면 worker가 앱 껍데기를 주고,
//   앱이 그 API 저장본으로 화면을 그린다. 같은 페이지 HTML을 다시 받아 저장하던 것은 지웠다(리뷰 R10).
// - 처음 방문한 페이지 저장: 첫 방문의 HTML 요청은 아직 worker를 거치지 않는다. worker가 처음 이
//   페이지를 맡는 순간(controllerchange) 지금 페이지의 데이터를 넘기고, 이 언어의 시작 화면 데이터를
//   미리 받아 둔다(preloadData — 브라우저가 API를 직접 불러 worker가 저장한다).
// - 저장본 안내: worker가 네트워크 대신 저장본을 돌려줬으면 그 저장 시각을 savedAt에 둔다. 처음 연
//   페이지가 저장본이면 worker가 <html data-scls-saved-at>에 적어 보낸다. 화면 이동을 시작하면 지운다.
import { browser } from '$app/environment';
import { preloadData } from '$app/navigation';
import { PUBLIC_API_BASE_URL } from '$env/static/public';
import { localeHref, PREFIXED_LOCALES, DEFAULT_LOCALE, type Locale } from './i18n';
import { readServerFetched } from './offline-data';

export const pwa = $state({
	/** 새 버전이 설치돼 기다리는 중. */
	updateReady: false,
	/** 지금 화면에 저장본이 쓰였으면 그 저장 시각(ms, 모르면 0). 아니면 null. */
	savedAt: null as number | null
});

// 오래 열어 둔 화면(설치한 앱)도 새 버전을 알아채도록, 다시 볼 때와 일정 간격으로 확인한다.
const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;

let started = false;

// 서버에서 그린 첫 페이지의 API 응답. SvelteKit은 하이드레이션 때 그 <script data-sveltekit-fetched>를
// 읽고 지우므로, 이 모듈을 처음 불러올 때(루트 레이아웃과 함께 — 페이지 load가 돌기 전) 미리 꺼내 둔다.
const serverFetched = browser
	? readServerFetched(
			document.querySelectorAll('script[data-sveltekit-fetched]'),
			PUBLIC_API_BASE_URL
		)
	: [];

// worker의 "저장본을 줬어요" 알림은 앱 껍데기로 열린 화면에서 첫 화면의 load가 API를 부르는 동안 온다.
// 그때는 아직 startPwa(루트 레이아웃 onMount) 전이라, 이 모듈을 불러올 때 바로 듣기 시작한다.
if (browser && 'serviceWorker' in navigator) {
	navigator.serviceWorker.addEventListener('message', (event: MessageEvent) => {
		const data: unknown = event.data;
		if (typeof data !== 'object' || data === null) return;
		if ((data as { type?: unknown }).type !== 'saved-response') return;
		const savedAt = (data as { savedAt?: unknown }).savedAt;
		markSaved(typeof savedAt === 'number' ? savedAt : 0);
	});
}

export function startPwa() {
	if (started) return;
	started = true;

	const savedAttr = document.documentElement.dataset.sclsSavedAt;
	if (savedAttr !== undefined) markSaved(Number(savedAttr) || 0);

	if (!('serviceWorker' in navigator)) return;
	const container = navigator.serviceWorker;
	let controlled = Boolean(container.controller);
	let reloading = false;

	// 이미 worker가 맡은 페이지면 지금 데이터를 넘긴다(서버에서 그린 페이지일 때만 있다).
	if (controlled) saveServerData(container.controller);

	container.addEventListener('controllerchange', () => {
		if (!controlled) {
			// 처음 설치된 worker가 이 페이지를 맡았다 — 지금 페이지와 시작 화면의 데이터를 저장해 둔다.
			controlled = true;
			saveServerData(container.controller);
			const start = startUrl();
			if (location.pathname !== start) preloadData(start).catch(() => {});
			return;
		}
		// 새 버전이 넘겨받았다. 지난 앱 파일로 계속 돌지 않게 한 번만 새로 고친다.
		if (reloading) return;
		reloading = true;
		location.reload();
	});

	void container.ready.then((registration) => {
		watchForUpdate(registration);
		let lastCheck = Date.now();
		const check = () => {
			if (Date.now() - lastCheck < UPDATE_CHECK_INTERVAL_MS) return;
			lastCheck = Date.now();
			registration.update().catch(() => {});
		};
		document.addEventListener('visibilitychange', () => {
			if (document.visibilityState === 'visible') check();
		});
		setInterval(check, UPDATE_CHECK_INTERVAL_MS);
	});
}

function watchForUpdate(registration: ServiceWorkerRegistration) {
	// 지난 버전의 탭이 열려 있는 동안에만 기다린다(controller가 있음). 처음 설치는 안내할 필요가 없다.
	if (registration.waiting && navigator.serviceWorker.controller) pwa.updateReady = true;
	registration.addEventListener('updatefound', () => {
		const worker = registration.installing;
		worker?.addEventListener('statechange', () => {
			if (worker.state === 'installed' && navigator.serviceWorker.controller) {
				pwa.updateReady = true;
			}
		});
	});
}

/** "새로 고침"을 눌렀을 때. 기다리던 worker가 넘겨받으면 controllerchange에서 새로 고친다. */
export async function applyUpdate() {
	const registration = await navigator.serviceWorker?.getRegistration();
	if (registration?.waiting) {
		registration.waiting.postMessage({ type: 'skip-waiting' });
	} else {
		location.reload();
	}
}

/**
 * 서버에서 그린 이 페이지의 API 응답(HTML에 실려 온 것)을 worker의 API 저장본으로 넘긴다. 저장본 HTML로
 * 열린 페이지는 데이터도 예전 것이라 넘기지 않는다(더 최근 저장본을 덮지 않게).
 */
function saveServerData(worker: ServiceWorker | null) {
	if (!worker || document.documentElement.dataset.sclsSavedAt !== undefined) return;
	if (serverFetched.length > 0) worker.postMessage({ type: 'store-api', entries: serverFetched });
}

/** 화면 이동을 시작하면 지난 화면의 저장본 표시를 지운다(새 화면에서 저장본을 쓰면 다시 켜진다). */
export function clearSaved() {
	pwa.savedAt = null;
}

function markSaved(savedAt: number) {
	// 여러 응답이 저장본이면 가장 오래된 시각을 보여준다(화면의 정보가 그때까지만 확인된 것).
	if (pwa.savedAt === null || (savedAt > 0 && (pwa.savedAt === 0 || savedAt < pwa.savedAt))) {
		pwa.savedAt = savedAt;
	}
}

function startUrl(): string {
	const first = location.pathname.split('/')[1];
	const locale = (PREFIXED_LOCALES as readonly string[]).includes(first)
		? (first as Locale)
		: DEFAULT_LOCALE;
	return localeHref(locale, '/');
}
