<script lang="ts">
	import { page } from '$app/state';
	import { LOCALES, localeHref, stripLocale, type Locale } from '$lib/i18n';

	let { locale }: { locale: Locale } = $props();

	// 언어를 바꿀 때 현재 페이지와 필터(쿼리스트링)는 그대로 유지한다.
	function hrefFor(target: Locale) {
		return localeHref(target, stripLocale(page.url.pathname)) + page.url.search;
	}
</script>

<div class="flex items-center gap-1 rounded-full border border-slate-200 p-1 dark:border-slate-700">
	{#each LOCALES as target (target)}
		<a
			href={hrefFor(target)}
			aria-current={target === locale ? 'true' : undefined}
			class="rounded-full px-2 py-1 text-xs font-semibold uppercase transition-colors {target ===
			locale
				? 'bg-violet-600 text-white'
				: 'text-slate-500 hover:text-violet-600 dark:text-slate-400 dark:hover:text-violet-400'}"
		>
			{target}
		</a>
	{/each}
</div>
