<script lang="ts">
	// 오류 화면. 오프라인에서 저장된 적 없는 페이지로 이동하거나 앱 껍데기로 열면(공개 API도 저장본도 없음)
	// 여기로 온다 — 그때는 오류 대신 "아직 저장되지 않은 페이지" 안내를 보여준다. 기기가 온라인으로 알고 있어도
	// API 요청이 통신 실패면(code — src/hooks.client.ts) 같은 안내다.
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { DEFAULT_LOCALE, localeHref, t, type Locale } from '$lib/i18n';

	let locale = $derived((page.data.locale as Locale | undefined) ?? DEFAULT_LOCALE);
	let offline = $derived(browser && (!navigator.onLine || page.error?.code === 'NETWORK_ERROR'));
</script>

<div class="mx-auto max-w-xl py-10 text-center">
	{#if !offline}
		<p class="text-sm font-medium text-zinc-500 tabular-nums dark:text-zinc-400">{page.status}</p>
	{/if}
	<h1
		class="mt-2 font-display text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50"
	>
		{offline
			? t(locale, 'offline.title')
			: t(locale, page.status === 404 ? 'error.notFound' : 'error.title')}
	</h1>
	<p class="mt-3 text-zinc-600 dark:text-zinc-300">
		{offline ? t(locale, 'offline.unsaved') : t(locale, 'error.desc')}
	</p>
	<a
		href={localeHref(locale, '/')}
		class="mt-6 inline-flex h-11 items-center rounded-xl bg-violet-600 px-5 text-sm font-medium text-white transition-colors hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-400 dark:hover:text-zinc-950"
	>
		{t(locale, 'error.home')}
	</a>
</div>
