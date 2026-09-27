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
	class="relative flex min-h-screen flex-col bg-violet-50/40 text-slate-900 dark:bg-slate-950 dark:text-slate-100"
>
	<!-- 브랜드 톤(보라/핑크)의 은은한 배경 광원. 콘텐츠 뒤에 고정해 가독성에 영향 없이
		"관리자 대시보드"보다는 팬 이벤트 사이트 분위기를 준다. 라이트 모드는 흰 배경 위라
		더 진하게 줘야 보인다(어두운 배경보다 훨씬 덜 도드라짐) — dark:는 반대로 줄인다. -->
	<div class="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
		<div
			class="absolute -top-40 -left-40 h-[32rem] w-[32rem] rounded-full bg-violet-400/50 blur-3xl dark:bg-violet-500/10"
		></div>
		<div
			class="absolute top-1/3 -right-40 h-[28rem] w-[28rem] rounded-full bg-pink-400/40 blur-3xl dark:bg-pink-500/10"
		></div>
	</div>

	<Header {locale} />
	<main class="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
		{@render children()}
	</main>
	<Footer {locale} />
</div>
