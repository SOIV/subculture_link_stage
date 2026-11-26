// 서버에서 그린 페이지의 API 응답을 오프라인 저장본으로 넘기기(src/service-worker.ts의 store-api).
//
// SvelteKit은 서버 렌더 때 load의 fetch로 받은 응답을 HTML 안 <script type="application/json"
// data-sveltekit-fetched data-url="…">에 실어 보낸다(하이드레이션 때 다시 받지 않으려고). 그 내용을 그대로
// service worker의 API 저장본에 넣으면, 이 페이지를 다시 그리는 데 필요한 데이터가 네트워크 요청 없이
// 저장된다. 예전에는 같은 페이지 HTML을 한 번 더 받아 저장해서 서버가 API를 다시 불렀다(2026-11-23 리뷰 R10).
//
// SvelteKit은 하이드레이션 때 이 script를 읽고 지우므로 그 전에 읽어야 한다($lib/pwa.svelte.ts).
// 이 형식은 SvelteKit 내부 형식이다(@sveltejs/kit src/runtime/server/page/serialize_data.js). 모양이 다르면
// 조용히 건너뛴다 — 그 경우에도 화면 안 이동에서 브라우저가 직접 받은 API 응답은 따로 저장된다.
import type { SavedApiEntry } from './sw/cache';

/** <script data-sveltekit-fetched>에서 읽는 데 필요한 것만. 테스트에서는 가짜 객체를 넘긴다. */
export type FetchedScript = {
	getAttribute(name: string): string | null;
	hasAttribute(name: string): boolean;
	textContent: string | null;
};

/** 공개 API(apiBase 아래)의 GET 200 JSON 응답만 고른다. */
export function readServerFetched(
	scripts: Iterable<FetchedScript>,
	apiBase: string
): SavedApiEntry[] {
	const base = apiBase.replace(/\/$/, '') + '/';
	const entries: SavedApiEntry[] = [];
	for (const script of scripts) {
		const url = script.getAttribute('data-url');
		// data-b64: 본문이 이진 데이터, data-hash: 헤더·본문이 있는 요청(GET 조회가 아님).
		if (!url?.startsWith(base) || script.hasAttribute('data-b64')) continue;
		if (script.hasAttribute('data-hash')) continue;
		let payload: unknown;
		try {
			payload = JSON.parse(script.textContent ?? '');
		} catch {
			continue;
		}
		if (typeof payload !== 'object' || payload === null) continue;
		const { status, headers, body } = payload as Record<string, unknown>;
		if (status !== 200 || typeof body !== 'string') continue;
		const contentType =
			typeof headers === 'object' && headers !== null
				? (headers as Record<string, unknown>)['content-type']
				: undefined;
		if (typeof contentType !== 'string' || !contentType.includes('json')) continue;
		entries.push({ url, body, contentType });
	}
	return entries;
}
