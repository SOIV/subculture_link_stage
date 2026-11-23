// 오프라인 보기(src/service-worker.ts)와 앱 사이의 연결. 루트 레이아웃이 브라우저에서 한 번 startPwa()를
// 부르고, 화면의 안내(OfflineNotice·UpdateNotice)는 아래 pwa 상태를 읽는다.
//
// - 새 버전: 새 service worker가 설치돼 기다리면 updateReady가 켜진다. 사용자가 새로 고침을 누르면
//   기다리던 worker에 넘겨받으라고 알리고, 넘겨받으면(controllerchange) 한 번만 새로 고친다. 다른 탭에서
//   넘겨받은 경우에도 이 탭의 지난 앱 파일이 새 worker와 섞이지 않게 같이 새로 고친다.
// - 처음 방문한 페이지 저장: 첫 방문의 HTML 요청은 아직 worker를 거치지 않는다. worker가 처음 이
//   페이지를 맡는 순간(controllerchange) 지금 주소와 이 언어의 시작 화면을 저장해 달라고 보낸다.
// - 저장본 안내: worker가 네트워크 대신 저장본을 돌려줬으면 그 저장 시각을 savedAt에 둔다. 처음 연
//   페이지가 저장본이면 worker가 <html data-scls-saved-at>에 적어 보낸다. 화면 이동을 시작하면 지운다.
import { localeHref, PREFIXED_LOCALES, DEFAULT_LOCALE, type Locale } from './i18n';

export const pwa = $state({
	/** 새 버전이 설치돼 기다리는 중. */
	updateReady: false,
	/** 지금 화면에 저장본이 쓰였으면 그 저장 시각(ms, 모르면 0). 아니면 null. */
	savedAt: null as number | null
});

// 오래 열어 둔 화면(설치한 앱)도 새 버전을 알아채도록, 다시 볼 때와 일정 간격으로 확인한다.
const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;

let started = false;

export function startPwa() {
	if (started) return;
	started = true;

	const savedAttr = document.documentElement.dataset.sclsSavedAt;
	if (savedAttr !== undefined) markSaved(Number(savedAttr) || 0);

	if (!('serviceWorker' in navigator)) return;
	const container = navigator.serviceWorker;
	let controlled = Boolean(container.controller);
	let reloading = false;

	container.addEventListener('controllerchange', () => {
		if (!controlled) {
			// 처음 설치된 worker가 이 페이지를 맡았다 — 지금 페이지를 저장해 둔다.
			controlled = true;
			requestCachePages([location.href, location.origin + startUrl()]);
			return;
		}
		// 새 버전이 넘겨받았다. 지난 앱 파일로 계속 돌지 않게 한 번만 새로 고친다.
		if (reloading) return;
		reloading = true;
		location.reload();
	});

	container.addEventListener('message', (event: MessageEvent) => {
		const data: unknown = event.data;
		if (typeof data !== 'object' || data === null) return;
		if ((data as { type?: unknown }).type !== 'saved-response') return;
		const savedAt = (data as { savedAt?: unknown }).savedAt;
		markSaved(typeof savedAt === 'number' ? savedAt : 0);
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

/** 화면 안에서 이동을 마친 페이지의 HTML을 저장해 달라고 worker에 알린다. */
export function requestCachePages(urls: string[]) {
	const unique = urls.filter((url, index) => urls.indexOf(url) === index);
	navigator.serviceWorker?.controller?.postMessage({ type: 'cache-page', urls: unique });
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
