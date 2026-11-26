// 행사 목록·시리즈 상세 load가 새 시리즈 API만 부르는지(전체 행사 목록 대체 경로를 지운 뒤의 회귀 시험).
import { describe, expect, it, vi } from 'vitest';

vi.mock('$env/static/public', () => ({ PUBLIC_API_BASE_URL: 'https://api.test/v1' }));

const { load: loadList } = await import('./+page');
const { load: loadDetail } = await import('./[slug]/+page');

type Route = (path: string) => { status: number; body: unknown } | 'network-error';

/** 부른 경로를 적어 두는 가짜 fetch. */
function fakeApi(route: Route) {
	const calls: string[] = [];
	const fetchFn = (async (input: URL) => {
		calls.push(input.pathname);
		const result = route(input.pathname);
		if (result === 'network-error') throw new TypeError('Failed to fetch');
		return new Response(JSON.stringify(result.body), {
			status: result.status,
			headers: { 'content-type': 'application/json' }
		});
	}) as unknown as typeof fetch;
	return { calls, fetchFn };
}

const ok = (data: unknown) => ({ status: 200, body: { success: true, data } });
const list = (items: unknown[] = []) => ok({ count: items.length, items });

// load에는 fetch·parent·params만 쓴다.
function event(fetchFn: typeof fetch, params: Record<string, string> = {}) {
	return { fetch: fetchFn, parent: async () => ({ locale: 'ko' }), params } as never;
}

describe('행사 목록 load', () => {
	it('시리즈 목록과 태그만 부른다(전체 행사 목록을 받지 않는다)', async () => {
		const { calls, fetchFn } = fakeApi((path) =>
			path === '/v1/event-series' ? list([{ id: 's1', slug: 'agf' }]) : list()
		);
		const data = (await loadList(event(fetchFn))) as Record<string, unknown>;
		expect(calls.sort()).toEqual(['/v1/event-series', '/v1/tags']);
		expect(data).not.toHaveProperty('events');
	});
});

describe('시리즈 상세 load', () => {
	it('시리즈 상세·회차·태그 세 번을 동시에 부른다', async () => {
		const { calls, fetchFn } = fakeApi((path) => {
			if (path === '/v1/event-series/agf') return ok({ id: 's1', slug: 'agf', title: 'AGF' });
			return list();
		});
		const data = (await loadDetail(event(fetchFn, { slug: 'agf' }))) as Record<string, unknown>;
		expect(calls.sort()).toEqual([
			'/v1/event-series/agf',
			'/v1/event-series/agf/events',
			'/v1/tags'
		]);
		expect(data.editions).toEqual([]);
	});

	it('없는 시리즈는 404', async () => {
		const { fetchFn } = fakeApi((path) =>
			path.startsWith('/v1/event-series/')
				? { status: 404, body: { success: false, error: 'EVENT_SERIES_NOT_FOUND' } }
				: list()
		);
		await expect(loadDetail(event(fetchFn, { slug: 'nope' }))).rejects.toMatchObject({
			status: 404
		});
	});

	it('통신 실패는 오류로 드러나고 /v1/events로 대신하지 않는다', async () => {
		const { calls, fetchFn } = fakeApi((path) =>
			path.startsWith('/v1/event-series/') ? 'network-error' : list()
		);
		await expect(loadDetail(event(fetchFn, { slug: 'agf' }))).rejects.toMatchObject({
			code: 'NETWORK_ERROR'
		});
		expect(calls).not.toContain('/v1/events');
		expect(calls).not.toContain('/v1/event-series');
	});
});
