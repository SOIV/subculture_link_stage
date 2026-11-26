import { describe, expect, it, vi } from 'vitest';
import {
	cacheFirst,
	markHtmlAsSaved,
	networkFirst,
	putTrimmed,
	SAVED_AT_HEADER,
	savedAtOf,
	storeApiEntries,
	withSavedAt
} from './cache';

/** 메모리에 담는 가짜 Cache. failPut이면 put이 저장 공간 부족 오류를 던진다. */
class MemoryCache {
	entries = new Map<string, Response>();
	failPut = false;
	failMatch = false;

	async match(request: Request) {
		if (this.failMatch) throw new Error('match failed');
		return this.entries.get(request.url)?.clone();
	}
	async put(request: Request, response: Response) {
		if (this.failPut) throw new DOMException('quota', 'QuotaExceededError');
		// 실제 Cache.put처럼 같은 주소는 지우고 맨 뒤에 넣는다.
		await response.arrayBuffer().catch(() => {});
		this.entries.delete(request.url);
		this.entries.set(request.url, response);
	}
	async delete(request: Request | string) {
		return this.entries.delete(typeof request === 'string' ? request : request.url);
	}
	async keys() {
		return [...this.entries.keys()].map((url) => new Request(url));
	}
}

/** put으로 넣은 본문을 다시 읽을 수 있게 보관하는 버전. */
class ReadableMemoryCache extends MemoryCache {
	override async put(request: Request, response: Response) {
		if (this.failPut) throw new DOMException('quota', 'QuotaExceededError');
		const body = await response.text();
		this.entries.delete(request.url);
		this.entries.set(
			request.url,
			new Response(body, { status: response.status, headers: response.headers })
		);
	}
}

function asCache(cache: MemoryCache) {
	return cache as unknown as Cache;
}

function collectWaitUntil() {
	const pending: Promise<unknown>[] = [];
	return {
		waitUntil: (promise: Promise<unknown>) => void pending.push(promise),
		settle: () => Promise.allSettled(pending)
	};
}

const URL_A = 'https://api.test/v1/events';
const NOW = Date.UTC(2026, 10, 23, 12, 0, 0);

describe('networkFirst', () => {
	it('캐시 저장이 QuotaExceededError로 실패해도 정상 네트워크 응답을 돌려준다', async () => {
		const cache = new MemoryCache();
		cache.failPut = true;
		const { waitUntil, settle } = collectWaitUntil();
		const result = await networkFirst({
			request: new Request(URL_A),
			cache: asCache(cache),
			fetch: async () => new Response('{"ok":1}', { status: 200 }),
			waitUntil,
			maxEntries: 10,
			timeoutMs: 4000,
			maxAgeMs: Infinity,
			now: () => NOW
		});
		await settle();
		expect(result?.fromCache).toBe(false);
		expect(result?.response.status).toBe(200);
		expect(await result?.response.text()).toBe('{"ok":1}');
	});

	it('저장이 실패하면 기존 저장본을 잃지 않는다', async () => {
		const cache = new ReadableMemoryCache();
		await cache.put(new Request(URL_A), withSavedAt(new Response('old'), NOW - 1000));
		cache.failPut = true;
		const { waitUntil, settle } = collectWaitUntil();
		await networkFirst({
			request: new Request(URL_A),
			cache: asCache(cache),
			fetch: async () => new Response('new'),
			waitUntil,
			maxEntries: 10,
			timeoutMs: 4000,
			maxAgeMs: Infinity,
			now: () => NOW
		});
		await settle();
		expect(await (await cache.match(new Request(URL_A)))?.text()).toBe('old');
	});

	it('캐시를 열지 못해도 네트워크로 응답한다', async () => {
		const cache = new MemoryCache();
		cache.failMatch = true;
		const { waitUntil, settle } = collectWaitUntil();
		const result = await networkFirst({
			request: new Request(URL_A),
			cache: asCache(cache),
			fetch: async () => new Response('net'),
			waitUntil,
			maxEntries: 10,
			timeoutMs: 4000,
			maxAgeMs: Infinity
		});
		await settle();
		expect(await result?.response.text()).toBe('net');
		const noCache = await networkFirst({
			request: new Request(URL_A),
			cache: undefined,
			fetch: async () => new Response('net2'),
			waitUntil,
			maxEntries: 10,
			timeoutMs: 4000,
			maxAgeMs: Infinity
		});
		expect(await noCache?.response.text()).toBe('net2');
	});

	it('받은 응답은 저장 시각을 붙여 저장한다', async () => {
		const cache = new ReadableMemoryCache();
		const { waitUntil, settle } = collectWaitUntil();
		await networkFirst({
			request: new Request(URL_A),
			cache: asCache(cache),
			fetch: async () => new Response('net'),
			waitUntil,
			maxEntries: 10,
			timeoutMs: 4000,
			maxAgeMs: Infinity,
			now: () => NOW
		});
		await settle();
		const stored = await cache.match(new Request(URL_A));
		expect(stored?.headers.get(SAVED_AT_HEADER)).toBe(String(NOW));
	});

	it('HTTP 500이면 저장본과 저장 시각을 돌려준다', async () => {
		const cache = new ReadableMemoryCache();
		await cache.put(new Request(URL_A), withSavedAt(new Response('saved'), NOW - 60_000));
		const { waitUntil, settle } = collectWaitUntil();
		const result = await networkFirst({
			request: new Request(URL_A),
			cache: asCache(cache),
			fetch: async () => new Response('error', { status: 500 }),
			waitUntil,
			maxEntries: 10,
			timeoutMs: 4000,
			maxAgeMs: Infinity,
			now: () => NOW
		});
		await settle();
		expect(result).toMatchObject({ fromCache: true, savedAt: NOW - 60_000 });
		expect(await result?.response.text()).toBe('saved');
	});

	it('저장본이 없으면 HTTP 500도 그대로 돌려주고 저장하지 않는다', async () => {
		const cache = new ReadableMemoryCache();
		const { waitUntil, settle } = collectWaitUntil();
		const result = await networkFirst({
			request: new Request(URL_A),
			cache: asCache(cache),
			fetch: async () => new Response('error', { status: 500 }),
			waitUntil,
			maxEntries: 10,
			timeoutMs: 4000,
			maxAgeMs: Infinity
		});
		await settle();
		expect(result?.response.status).toBe(500);
		expect(cache.entries.size).toBe(0);
	});

	it('네트워크가 늦으면 저장본을 먼저 돌려준다', async () => {
		vi.useFakeTimers();
		try {
			const cache = new ReadableMemoryCache();
			await cache.put(new Request(URL_A), withSavedAt(new Response('saved'), NOW));
			const { waitUntil } = collectWaitUntil();
			const pending = networkFirst({
				request: new Request(URL_A),
				cache: asCache(cache),
				fetch: () => new Promise<Response>(() => {}),
				waitUntil,
				maxEntries: 10,
				timeoutMs: 4000,
				maxAgeMs: Infinity,
				now: () => NOW
			});
			await vi.advanceTimersByTimeAsync(4000);
			const result = await pending;
			expect(result?.fromCache).toBe(true);
		} finally {
			vi.useRealTimers();
		}
	});

	it('보존 기간이 지난 저장본은 쓰지 않는다', async () => {
		const cache = new ReadableMemoryCache();
		await cache.put(new Request(URL_A), withSavedAt(new Response('stale'), NOW - 20 * 86_400_000));
		const { waitUntil, settle } = collectWaitUntil();
		const result = await networkFirst({
			request: new Request(URL_A),
			cache: asCache(cache),
			fetch: async () => {
				throw new TypeError('offline');
			},
			waitUntil,
			maxEntries: 10,
			timeoutMs: 4000,
			maxAgeMs: 14 * 86_400_000,
			now: () => NOW
		});
		await settle();
		expect(result).toBeUndefined();
		expect(cache.entries.size).toBe(0);
	});
});

describe('cacheFirst', () => {
	it('저장 실패에도 네트워크 응답을 돌려준다', async () => {
		const cache = new MemoryCache();
		cache.failPut = true;
		const { waitUntil, settle } = collectWaitUntil();
		const response = await cacheFirst({
			request: new Request('https://app.test/_app/a.js'),
			cache: asCache(cache),
			fetch: async () => new Response('js'),
			waitUntil,
			maxEntries: 10
		});
		await settle();
		expect(await response.text()).toBe('js');
	});
});

describe('putTrimmed', () => {
	it('개수를 넘으면 가장 오래된 것부터 지운다', async () => {
		const cache = new MemoryCache();
		for (const name of ['a', 'b', 'c']) {
			await putTrimmed(
				asCache(cache),
				new Request(`https://x.test/${name}`),
				new Response(name),
				2
			);
		}
		expect([...cache.entries.keys()]).toEqual(['https://x.test/b', 'https://x.test/c']);
	});
});

describe('저장 시각 표시', () => {
	it('저장본 HTML의 <html>에 저장 시각을 적는다', async () => {
		const response = await markHtmlAsSaved(
			new Response('<!doctype html><html lang="ko"><body></body></html>', {
				headers: { 'content-type': 'text/html', 'content-length': '50' }
			}),
			NOW
		);
		expect(await response.text()).toContain(`<html data-scls-saved-at="${NOW}" lang="ko">`);
		expect(response.headers.get('content-length')).toBeNull();
	});

	it('저장 시각 헤더가 없으면 Date 헤더로 대신한다', () => {
		const date = 'Mon, 23 Nov 2026 12:00:00 GMT';
		expect(savedAtOf(new Response('', { headers: { date } }))).toBe(Date.parse(date));
		expect(savedAtOf(new Response(''))).toBeNull();
	});
});

describe('fetch 호출 방식', () => {
	// 브라우저의 fetch는 다른 this로 부르면 "Illegal invocation"으로 실패한다(service worker에서 실제로 겪음).
	function strictFetch(this: unknown) {
		if (this !== undefined && this !== globalThis) throw new TypeError('Illegal invocation');
		return Promise.resolve(new Response('ok'));
	}

	it('networkFirst는 fetch를 옵션 객체의 메서드로 부르지 않는다', async () => {
		const { waitUntil, settle } = collectWaitUntil();
		const result = await networkFirst({
			request: new Request(URL_A),
			cache: undefined,
			fetch: strictFetch as unknown as typeof fetch,
			waitUntil,
			maxEntries: 10,
			timeoutMs: 4000,
			maxAgeMs: Infinity
		});
		await settle();
		expect(await result?.response.text()).toBe('ok');
	});

	it('cacheFirst도 같다', async () => {
		const { waitUntil, settle } = collectWaitUntil();
		const response = await cacheFirst({
			request: new Request(URL_A),
			cache: undefined,
			fetch: strictFetch as unknown as typeof fetch,
			waitUntil,
			maxEntries: 10
		});
		await settle();
		expect(await response.text()).toBe('ok');
	});
});

describe('storeApiEntries — 앱이 넘겨준 API 응답 저장(리뷰 R10)', () => {
	const isApiUrl = (url: URL) =>
		url.origin === 'https://api.test' && url.pathname.startsWith('/v1/');
	const entry = (url: string, body = '{"success":true,"data":{"count":0,"items":[]}}') => ({
		url,
		body,
		contentType: 'application/json; charset=utf-8'
	});
	const store = (cache: MemoryCache, entries: unknown, savedAt = NOW) =>
		storeApiEntries({
			cache: asCache(cache),
			entries,
			isApiUrl,
			savedAt,
			maxEntries: 10,
			maxBodyLength: 1000
		});

	it('저장 시각을 붙여 담고, 공개 API가 아니거나 너무 크거나 모양이 다른 항목은 버린다', async () => {
		const cache = new ReadableMemoryCache();
		const stored = await store(cache, [
			entry(URL_A),
			entry('https://other.test/v1/events'),
			entry('https://api.test/v1/huge', 'x'.repeat(1001)),
			{ url: 'https://api.test/v1/tags', body: 1 },
			entry('not a url')
		]);
		expect(stored).toBe(1);
		expect([...cache.entries.keys()]).toEqual([URL_A]);
		const saved = cache.entries.get(URL_A)!;
		expect(saved.headers.get(SAVED_AT_HEADER)).toBe(String(NOW));
		expect(saved.headers.get('content-type')).toContain('json');
		expect(await saved.clone().json()).toEqual({ success: true, data: { count: 0, items: [] } });
	});

	it('더 최근 저장본은 덮어쓰지 않는다', async () => {
		const cache = new ReadableMemoryCache();
		await store(cache, [entry(URL_A, '"new"')], NOW);
		expect(await store(cache, [entry(URL_A, '"old"')], NOW - 1000)).toBe(0);
		expect(await cache.entries.get(URL_A)!.clone().text()).toBe('"new"');
	});

	it('entries가 배열이 아니거나 캐시를 못 열면 아무것도 하지 않는다', async () => {
		expect(await store(new MemoryCache(), 'nope')).toBe(0);
		expect(
			await storeApiEntries({
				cache: undefined,
				entries: [entry(URL_A)],
				isApiUrl,
				savedAt: NOW,
				maxEntries: 10,
				maxBodyLength: 1000
			})
		).toBe(0);
	});

	it('오프라인 흐름: 서버 렌더 페이지에서 넘겨받은 응답을 화면 안 이동이 저장본으로 받는다', async () => {
		const cache = new ReadableMemoryCache();
		// 1) 온라인: 서버에서 그린 페이지의 API 응답을 넘겨받는다(storeApiEntries는 fetch를 받지 않는다).
		await store(cache, [entry(URL_A)], NOW);
		// 2) 오프라인: 앱(껍데기로 열렸거나 화면 안 이동)이 같은 주소를 부르면 저장본과 저장 시각이 온다.
		const { waitUntil, settle } = collectWaitUntil();
		const result = await networkFirst({
			request: new Request(URL_A),
			cache: asCache(cache),
			fetch: async () => {
				throw new TypeError('Failed to fetch');
			},
			waitUntil,
			maxEntries: 10,
			timeoutMs: 4000,
			maxAgeMs: 14 * 24 * 60 * 60 * 1000,
			now: () => NOW + 60_000
		});
		await settle();
		expect(result).toMatchObject({ fromCache: true, savedAt: NOW });
		expect(await result!.response.json()).toMatchObject({ success: true });
	});

	it('넘겨받은 저장본도 14일이 지나면 쓰지 않는다', async () => {
		const cache = new ReadableMemoryCache();
		await store(cache, [entry(URL_A)], NOW);
		const { waitUntil, settle } = collectWaitUntil();
		const result = await networkFirst({
			request: new Request(URL_A),
			cache: asCache(cache),
			fetch: async () => {
				throw new TypeError('Failed to fetch');
			},
			waitUntil,
			maxEntries: 10,
			timeoutMs: 4000,
			maxAgeMs: 14 * 24 * 60 * 60 * 1000,
			now: () => NOW + 15 * 24 * 60 * 60 * 1000
		});
		await settle();
		expect(result).toBeUndefined();
	});
});
