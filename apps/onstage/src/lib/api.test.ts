import { describe, expect, it, vi } from 'vitest';

vi.mock('$env/static/public', () => ({ PUBLIC_API_BASE_URL: 'https://api.test/v1' }));

const {
	getEvent,
	getEventSeries,
	isMissingRoute,
	listEventSeriesEvents,
	listEvents,
	orFallback,
	ScLsApiError
} = await import('./api');

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

describe('시리즈 API — 새 경로와 배포 전 API', () => {
	it('없는 시리즈(EVENT_SERIES_NOT_FOUND 404)는 null', async () => {
		const response = () => jsonResponse({ success: false, error: 'EVENT_SERIES_NOT_FOUND' }, 404);
		expect(await getEventSeries(fetchReturning(response()), 'nope', 'ko')).toBeNull();
		expect(await listEventSeriesEvents(fetchReturning(response()), 'nope', 'ko')).toBeNull();
	});

	it('배포 전 API의 "없는 경로" 404(API 형식이 아님)는 던지고 isMissingRoute로 알아본다', async () => {
		// 2026-11-26 운영 API가 /v1/event-series/comic-world에 실제로 돌려준 본문.
		const response = jsonResponse(
			{
				message: 'Route GET:/v1/event-series/comic-world?locale=ko not found',
				error: 'Not Found',
				statusCode: 404
			},
			404
		);
		const error = await errorOf(getEventSeries(fetchReturning(response), 'comic-world', 'ko'));
		expect(error).toMatchObject({ code: 'HTTP_404' });
		expect(isMissingRoute(error)).toBe(true);
		expect(isMissingRoute(new ScLsApiError('EVENT_SERIES_NOT_FOUND', 404))).toBe(false);
	});

	it('그 404에 CORS 헤더가 없어 fetch가 실패하는 경우(브라우저·서버 렌더)도 없는 경로로 본다', async () => {
		const corsBlocked = (async () => {
			throw new TypeError('CORS error: No Access-Control-Allow-Origin header');
		}) as unknown as typeof fetch;
		const error = await errorOf(listEventSeriesEvents(corsBlocked, 'comic-world', 'ko'));
		expect(error).toMatchObject({ code: 'NETWORK_ERROR' });
		expect(isMissingRoute(error)).toBe(true);
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
