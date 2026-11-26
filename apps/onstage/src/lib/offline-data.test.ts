import { describe, expect, it } from 'vitest';
import { readServerFetched, type FetchedScript } from './offline-data';

const API = 'https://api.test/v1';

/** SvelteKit이 서버 렌더 HTML에 싣는 <script data-sveltekit-fetched> 흉내. */
function script(attrs: Record<string, string>, payload: unknown): FetchedScript {
	return {
		getAttribute: (name) => attrs[name] ?? null,
		hasAttribute: (name) => name in attrs,
		textContent: typeof payload === 'string' ? payload : JSON.stringify(payload)
	};
}

const json = { 'content-type': 'application/json; charset=utf-8' };
const body = JSON.stringify({ success: true, data: { count: 0, items: [] } });

describe('readServerFetched — HTML에 실려 온 API 응답 꺼내기', () => {
	it('공개 API의 200 JSON 응답을 주소·본문·형식 그대로 꺼낸다', () => {
		const entries = readServerFetched(
			[
				script(
					{ 'data-url': `${API}/events?locale=ko`, 'data-ttl': '60' },
					{ status: 200, statusText: '', headers: json, body }
				)
			],
			API + '/'
		);
		expect(entries).toEqual([
			{ url: `${API}/events?locale=ko`, body, contentType: json['content-type'] }
		]);
	});

	it('다른 주소·오류 응답·JSON이 아닌 것·이진 본문·요청 본문이 있는 것·깨진 내용은 건너뛴다', () => {
		const ok = { status: 200, statusText: '', headers: json, body };
		const entries = readServerFetched(
			[
				script({ 'data-url': 'https://other.test/v1/events' }, ok),
				script({ 'data-url': `${API}-evil/events` }, ok),
				script({ 'data-url': `${API}/events/nope` }, { ...ok, status: 404 }),
				script({ 'data-url': `${API}/calendars/all.ics` }, { ...ok, headers: {} }),
				script({ 'data-url': `${API}/tags`, 'data-b64': '' }, ok),
				script({ 'data-url': `${API}/tags`, 'data-hash': 'abc' }, ok),
				script({ 'data-url': `${API}/tags` }, '{not json'),
				script({}, ok)
			],
			API
		);
		expect(entries).toEqual([]);
	});
});
