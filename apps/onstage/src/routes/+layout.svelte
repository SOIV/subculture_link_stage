<script lang="ts">
	import './layout.css';
	import { onMount } from 'svelte';
	import { beforeNavigate } from '$app/navigation';
	import favicon from '$lib/assets/favicon.svg';
	import { clearSaved, startPwa } from '$lib/pwa.svelte';

	let { children } = $props();

	// 오프라인 보기(src/service-worker.ts)를 돕는 것들. 새 버전 안내·데이터 저장·저장본 안내는
	// $lib/pwa.svelte.ts가 맡는다. 화면 안 이동은 오프라인에서도 그대로 한다 — 브라우저가 부르는 공개 API를
	// worker가 저장본으로 답한다(저장본이 없으면 오류 화면이 오프라인 안내를 띄운다).
	onMount(startPwa);

	beforeNavigate((navigation) => {
		if (navigation.willUnload || !navigation.to) return;
		const { url } = navigation.to;
		// 다른 사이트와 같은 페이지 안 이동(#…)은 그대로 둔다.
		if (url.origin !== location.origin) return;
		if (url.pathname === location.pathname && url.search === location.search) return;
		// 새 화면으로 넘어가면 지난 화면의 "저장본" 표시를 지운다(새 화면도 저장본이면 다시 켜진다).
		clearSaved();
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
{@render children()}
