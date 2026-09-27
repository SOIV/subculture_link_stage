<script lang="ts">
	import { page } from '$app/state';
	import Footer from '$lib/components/Footer.svelte';
	import Header from '$lib/components/Header.svelte';
	import { DEFAULT_LOCALE, LOCALES, localeHref, stripLocale, t } from '$lib/i18n';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();
	let locale = $derived(data.locale);
	let basePath = $derived(stripLocale(page.url.pathname));

	const HREFLANG: Record<(typeof LOCALES)[number], string> = { ko: 'ko-KR', ja: 'ja-JP', en: 'en' };
</script>

<svelte:head>
	<title>{t(locale, 'site.name')}</title>
	<meta name="description" content={t(locale, 'site.tagline')} />
	<link rel="canonical" href={page.url.origin + localeHref(locale, basePath)} />
	{#each LOCALES as target (target)}
		<link
			rel="alternate"
			hreflang={HREFLANG[target]}
			href={page.url.origin + localeHref(target, basePath)}
		/>
	{/each}
	<link
		rel="alternate"
		hreflang="x-default"
		href={page.url.origin + localeHref(DEFAULT_LOCALE, basePath)}
	/>
</svelte:head>

<div
	class="flex min-h-screen flex-col bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100"
>
	<Header {locale} />
	<main class="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
		{@render children()}
	</main>
	<Footer {locale} />
</div>
