import { describe, expect, it, vi } from 'vitest';

vi.mock('$env/static/public', () => ({ PUBLIC_API_BASE_URL: 'https://api.test/v1' }));

const { getEvent, getEventSeries, listEventSeriesEvents, listEvents, orFallback, ScLsApiError } =
	await import('./api');

function jsonResponse(body: unknown, status = 200, contentType = 'application/json') {
	return new Response(JSON.stringify(body), { status, headers: { 'content-type': contentType } });
}

function fetchReturning(response: Response): typeof fetch {
	return (async () => response) as unknown as typeof fetch;
}

async function errorOf(promise: Promise<unknown>) {
	try {
		await promise;
	} catch (error) {
		return error;
	}
	throw new Error('실패해야 하는데 성공했다');
}

describe('request — 응답 검사', () => {
	it('HTTP 500이면 본문이 success:true여도 실패로 본다(리뷰 R09 재현값)', async () => {
		const error = await errorOf(
			listEvents(
				fetchReturning(jsonResponse({ success: true, data: { count: 0, items: [] } }, 500)),
				{
					locale: 'ko'
				}
			)
		);
		expect(error).toBeInstanceOf(ScLsApiError);
		expect(error).toMatchObject({ code: 'HTTP_500', status: 500 });
	});

	it('프록시의 HTML 5xx는 HTTP 상태로 구분한다', async () => {
		const html = new Response('<html>Bad gateway</html>', {
			status: 502,
			headers: { 'content-type': 'text/html' }
		});
		const error = await errorOf(listEvents(fetchReturning(html), { locale: 'ko' }));
		expect(error).toMatchObject({ code: 'HTTP_502', status: 502 });
	});

	it('API 형식의 오류 응답은 그 코드를 쓴다', async () => {
		const response = jsonResponse({ success: false, error: 'VALIDATION_ERROR' }, 400);
		const error = await errorOf(listEvents(fetchReturning(response), { locale: 'ko' }));
		expect(error).toMatchObject({ code: 'VALIDATION_ERROR', status: 400, isClientInput: true });
	});

	it('모양이 다른 성공 응답은 INVALID_RESPONSE', async () => {
		const error = await errorOf(
			listEvents(fetchReturning(jsonResponse({ foo: 1 })), { locale: 'ko' })
		);
		expect(error).toMatchObject({ code: 'INVALID_RESPONSE' });
		const noItems = await errorOf(
			listEvents(fetchReturning(jsonResponse({ success: true, data: { count: 1 } })), {
				locale: 'ko'
			})
		);
		expect(noItems).toMatchObject({ code: 'INVALID_RESPONSE' });
	});

	it('응답을 못 받으면 NETWORK_ERROR', async () => {
		const failing = (async () => {
			throw new TypeError('Failed to fetch');
		}) as unknown as typeof fetch;
		const error = await errorOf(listEvents(failing, { locale: 'ko' }));
		expect(error).toMatchObject({ code: 'NETWORK_ERROR', status: 0 });
	});

	it('제한 시간이 지나면 TIMEOUT', async () => {
		vi.useFakeTimers();
		try {
			const hanging = ((_url: URL, init?: RequestInit) =>
				new Promise<Response>((_resolve, reject) => {
					init?.signal?.addEventListener('abort', () =>
						reject(new DOMException('aborted', 'AbortError'))
					);
				})) as unknown as typeof fetch;
			const pending = errorOf(listEvents(hanging, { locale: 'ko' }));
			await vi.advanceTimersByTimeAsync(10_000);
			expect(await pending).toMatchObject({ code: 'TIMEOUT' });
		} finally {
			vi.useRealTimers();
		}
	});

	it('정상 응답은 data를 돌려준다', async () => {
		const data = { count: 0, items: [] };
		expect(
			await listEvents(fetchReturning(jsonResponse({ success: true, data })), { locale: 'ko' })
		).toEqual(data);
	});

	it('없는 행사(EVENT_NOT_FOUND 404)는 null', async () => {
		const response = jsonResponse({ success: false, error: 'EVENT_NOT_FOUND' }, 404);
		expect(await getEvent(fetchReturning(response), 'nope', 'ko')).toBeNull();
	});
});

describe('시리즈 API', () => {
	it('없는 시리즈(EVENT_SERIES_NOT_FOUND 404)는 null', async () => {
		const response = () => jsonResponse({ success: false, error: 'EVENT_SERIES_NOT_FOUND' }, 404);
		expect(await getEventSeries(fetchReturning(response()), 'nope', 'ko')).toBeNull();
		expect(await listEventSeriesEvents(fetchReturning(response()), 'nope', 'ko')).toBeNull();
	});

	it('없는 경로의 404(API 형식 NOT_FOUND, 2026-11-27부터 CORS 포함)는 null이 아니라 오류다', async () => {
		// 2026-11-27 운영 API가 /v1/nope에 실제로 돌려준 본문.
		const response = jsonResponse({ success: false, error: 'NOT_FOUND' }, 404);
		const error = await errorOf(getEventSeries(fetchReturning(response), 'comic-world', 'ko'));
		expect(error).toBeInstanceOf(ScLsApiError);
		expect(error).toMatchObject({ code: 'NOT_FOUND', status: 404 });
	});

	it('통신 실패는 그대로 네트워크 오류로 던진다(전체 행사 목록 대체 경로로 넘어가지 않는다)', async () => {
		const calls: string[] = [];
		const offline = (async (input: URL) => {
			calls.push(input.pathname);
			throw new TypeError('Failed to fetch');
		}) as unknown as typeof fetch;
		const error = await errorOf(listEventSeriesEvents(offline, 'comic-world', 'ko'));
		expect(error).toMatchObject({ code: 'NETWORK_ERROR', status: 0 });
		expect(calls).toEqual(['/v1/event-series/comic-world/events']);
	});

	it('시리즈 상세는 description을 포함해 돌려준다', async () => {
		const data = { id: 's1', slug: 'agf', title: 'AGF', description: '소개' };
		expect(
			await getEventSeries(fetchReturning(jsonResponse({ success: true, data })), 'agf', 'ko')
		).toEqual(data);
	});
});

describe('orFallback', () => {
	it('부가 데이터가 실패하면 기본값을 쓴다', async () => {
		vi.spyOn(console, 'warn').mockImplementation(() => {});
		expect(await orFallback(Promise.reject(new Error('x')), 'fallback')).toBe('fallback');
	});
});
