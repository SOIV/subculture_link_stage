<script lang="ts">
	// 오류 화면. 오프라인에서 저장된 적 없는 페이지로 이동하면(공개 API를 못 불러) 여기로 온다 —
	// 그때는 오류 대신 오프라인 안내를 보여준다(헤더 아래 안내 줄과 같은 문구).
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { DEFAULT_LOCALE, localeHref, t, type Locale } from '$lib/i18n';

	let locale = $derived((page.data.locale as Locale | undefined) ?? DEFAULT_LOCALE);
	let offline = $derived(browser && !navigator.onLine);
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
		{offline ? t(locale, 'offline.notice') : t(locale, 'error.desc')}
	</p>
	<a
		href={localeHref(locale, '/')}
		class="mt-6 inline-flex h-11 items-center rounded-xl bg-violet-600 px-5 text-sm font-medium text-white transition-colors hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-400 dark:hover:text-zinc-950"
	>
		{t(locale, 'error.home')}
	</a>
</div>
