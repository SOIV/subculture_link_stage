// service worker(src/service-worker.ts)의 캐시 도우미. 브라우저 전역(caches·fetch)에 직접 기대지 않고
// 인자로 받아서 단위 테스트(cache.test.ts)에서 가짜 캐시로 실패 상황을 재현할 수 있게 했다.
//
// 원칙: 캐시는 "덤"이다. 저장 공간이 모자라 저장이 실패하거나(QuotaExceededError) 캐시를 아예 열 수
// 없어도 네트워크에서 받은 정상 응답은 그대로 돌려준다.

/** 저장본에 붙이는 "저장한 시각"(ms) 헤더. 화면의 "마지막 확인 시각" 안내에 쓴다. */
export const SAVED_AT_HEADER = 'x-scls-saved-at';

export async function openCache(storage: CacheStorage, name: string): Promise<Cache | undefined> {
	try {
		return await storage.open(name);
	} catch {
		return undefined;
	}
}

export async function matchCache(
	cache: Cache | undefined,
	request: Request,
	options?: CacheQueryOptions
): Promise<Response | undefined> {
	if (!cache) return undefined;
	try {
		return await cache.match(request, options);
	} catch {
		return undefined;
	}
}

/**
 * 응답을 담고, 개수가 max를 넘으면 가장 오래된 것부터 지운다. 같은 주소를 다시 담으면 Cache.put이 기존
 * 항목을 지우고 맨 뒤(최신)에 넣는다. 먼저 지우고 넣지 않으므로 저장이 실패해도 기존 저장본은 남는다.
 * 실패하면 false를 돌려줄 뿐 예외를 던지지 않는다.
 */
export async function putTrimmed(
	cache: Cache | undefined,
	request: Request,
	response: Response,
	max: number
): Promise<boolean> {
	if (!cache) return false;
	try {
		await cache.put(request, response);
	} catch {
		return false;
	}
	try {
		const keys = await cache.keys();
		for (const key of keys.slice(0, Math.max(0, keys.length - max))) await cache.delete(key);
	} catch {
		// 정리는 다음 저장 때 다시 한다.
	}
	return true;
}

/** 저장 시각 헤더를 붙인 사본. 본문은 스트림을 그대로 넘긴다. */
export function withSavedAt(response: Response, savedAt: number): Response {
	const headers = new Headers(response.headers);
	headers.set(SAVED_AT_HEADER, String(savedAt));
	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers
	});
}

/** 저장본이 언제 저장됐는지(ms). 헤더가 없던 시절의 저장본은 Date 헤더로 대신하고, 그것도 없으면 null. */
export function savedAtOf(response: Response): number | null {
	const saved = Number(response.headers.get(SAVED_AT_HEADER));
	if (Number.isFinite(saved) && saved > 0) return saved;
	const date = Date.parse(response.headers.get('date') ?? '');
	return Number.isNaN(date) ? null : date;
}

export type NetworkFirstResult =
	| { response: Response; fromCache: false }
	| { response: Response; fromCache: true; savedAt: number | null };

export type NetworkFirstOptions = {
	request: Request;
	cache: Cache | undefined;
	fetch: (request: Request) => Promise<Response>;
	/** 응답을 받은 뒤에도 끝나야 하는 작업(캐시 저장)을 맡긴다. FetchEvent.waitUntil. */
	waitUntil: (promise: Promise<unknown>) => void;
	maxEntries: number;
	/** 저장본이 있을 때 네트워크를 기다리는 최대 시간. */
	timeoutMs: number;
	/** 이보다 오래된 저장본은 보여주지 않고 지운다. */
	maxAgeMs: number;
	now?: () => number;
	/** 받은 정상 응답을 저장할지. 기본은 200번대이고 opaque가 아닌 응답 전부. */
	shouldStore?: (response: Response) => boolean;
};

/**
 * 네트워크 먼저. 받은 정상 응답은 저장 시각을 붙여 캐시에 넣는다(실패해도 응답은 그대로 돌려준다).
 * 네트워크가 실패하거나 서버 오류(5xx)면 저장본을, 저장본이 있는데 네트워크가 timeoutMs 넘게 걸리면
 * 저장본을 먼저 돌려준다(받는 중인 응답은 끝까지 받아 캐시를 새로 고친다). 둘 다 없으면 undefined.
 * 저장본을 돌려줬는지(fromCache)와 저장 시각을 함께 알려 준다 — 화면에 "저장본" 안내를 띄우는 데 쓴다.
 */
export async function networkFirst(
	options: NetworkFirstOptions
): Promise<NetworkFirstResult | undefined> {
	const { request, cache, waitUntil, maxEntries, timeoutMs, maxAgeMs } = options;
	const now = options.now ?? Date.now;
	const shouldStore =
		options.shouldStore ?? ((response: Response) => response.ok && response.type !== 'opaque');

	let cached = await matchCache(cache, request, { ignoreVary: true });
	const savedAt = cached ? savedAtOf(cached) : null;
	if (cached && savedAt !== null && now() - savedAt > maxAgeMs) {
		// 너무 오래된 저장본은 최신 정보처럼 보일 위험이 커서 쓰지 않는다.
		waitUntil(cache!.delete(request, { ignoreVary: true }).catch(noop));
		cached = undefined;
	}

	// 꺼내서 부른다 — options.fetch(...)로 부르면 this가 options가 되어 브라우저의 fetch가
	// "Illegal invocation"으로 실패한다.
	const fetchFn = options.fetch;
	const network = fetchFn(request).then((response) => {
		if (shouldStore(response)) {
			waitUntil(putTrimmed(cache, request, withSavedAt(response.clone(), now()), maxEntries));
		}
		return response;
	});
	waitUntil(network.then(noop, noop));

	if (!cached) {
		return network.then(
			(response): NetworkFirstResult => ({ response, fromCache: false }),
			() => undefined
		);
	}

	const fallback: NetworkFirstResult = { response: cached, fromCache: true, savedAt };
	return new Promise<NetworkFirstResult>((resolve) => {
		const timer = setTimeout(() => resolve(fallback), timeoutMs);
		network.then(
			(response) => {
				clearTimeout(timer);
				resolve(response.status >= 500 ? fallback : { response, fromCache: false });
			},
			() => {
				clearTimeout(timer);
				resolve(fallback);
			}
		);
	});
}

/**
 * 저장본 먼저(앱 파일·글꼴처럼 내용이 바뀌지 않는 것). 없으면 받아서 담는다. 캐시를 못 열거나
 * 저장이 실패해도 네트워크 응답은 그대로 돌려준다. revalidate면 저장본을 돌려준 뒤 뒤에서 새로 받는다.
 */
export async function cacheFirst(options: {
	request: Request;
	cache: Cache | undefined;
	fetch: (request: Request) => Promise<Response>;
	waitUntil: (promise: Promise<unknown>) => void;
	maxEntries: number;
	revalidate?: boolean;
	shouldStore?: (response: Response) => boolean;
}): Promise<Response> {
	const { request, cache, waitUntil, maxEntries } = options;
	const shouldStore = options.shouldStore ?? ((response: Response) => response.ok);
	const cached = await matchCache(cache, request);
	if (cached && !options.revalidate) return cached;

	// 꺼내서 부른다 — options.fetch(...)로 부르면 this가 options가 되어 브라우저의 fetch가
	// "Illegal invocation"으로 실패한다.
	const fetchFn = options.fetch;
	const network = fetchFn(request).then((response) => {
		if (shouldStore(response)) {
			waitUntil(putTrimmed(cache, request, response.clone(), maxEntries));
		}
		return response;
	});
	if (cached) {
		waitUntil(network.then(noop, noop));
		return cached;
	}
	return network;
}

/** 저장본 HTML의 <html>에 저장 시각을 적어 보낸다. 앱이 읽어 "저장본·마지막 확인 시각"을 보여준다. */
export async function markHtmlAsSaved(
	response: Response,
	savedAt: number | null
): Promise<Response> {
	const html = await response.text();
	const marked = html.replace(/<html\b/i, `<html data-scls-saved-at="${savedAt ?? 0}"`);
	const headers = new Headers(response.headers);
	headers.delete('content-length');
	return new Response(marked, {
		status: response.status,
		statusText: response.statusText,
		headers
	});
}

function noop() {}
