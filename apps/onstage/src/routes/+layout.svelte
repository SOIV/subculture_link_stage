<script lang="ts">
	import './layout.css';
	import { afterNavigate, beforeNavigate } from '$app/navigation';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();

	// 오프라인 보기(src/service-worker.ts)를 돕는 두 가지:
	// 1) 화면 안에서 이동한 페이지는 HTML을 받지 않으므로, 이동이 끝나면 service worker에 그 주소를 담아 두라고 알린다.
	afterNavigate(({ type, to }) => {
		if (type === 'enter' || !to) return;
		navigator.serviceWorker?.controller?.postMessage({ type: 'cache-page', url: to.url.href });
	});
	// 2) 오프라인일 때는 화면 안 이동 대신 주소를 새로 연다 — 그래야 service worker가 저장해 둔 HTML(그 페이지의
	//    데이터가 함께 실린)을 꺼내 준다. 화면 안 이동은 공개 API를 직접 불러서, 저장본이 없으면 오류가 난다.
	beforeNavigate((navigation) => {
		if (navigator.onLine || navigation.willUnload || !navigation.to) return;
		if (navigation.type !== 'link' && navigation.type !== 'goto' && navigation.type !== 'form')
			return;
		const { url } = navigation.to;
		// 다른 사이트와 같은 페이지 안 이동(#…)은 그대로 둔다.
		if (url.origin !== location.origin) return;
		if (url.pathname === location.pathname && url.search === location.search) return;
		navigation.cancel();
		location.href = url.href;
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
{@render children()}
