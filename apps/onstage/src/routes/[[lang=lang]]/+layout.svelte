<script lang="ts">
	import { page } from '$app/state';
	import Footer from '$lib/components/Footer.svelte';
	import Header from '$lib/components/Header.svelte';
	import { DEFAULT_LOCALE, LOCALES, localeHref, stripLocale, t } from '$lib/i18n';
	import { OG_LOCALE } from '$lib/seo';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();
	let locale = $derived(data.locale);
	let basePath = $derived(stripLocale(page.url.pathname));

	// 제목·설명은 각 페이지의 load가 돌려주는 seo를 따르고, 없으면 사이트 기본값이다.
	let seo = $derived(page.data.seo ?? {});
	let siteName = $derived(t(locale, 'site.name'));
	let title = $derived(seo.title ? `${seo.title} · ${siteName}` : siteName);
	let description = $derived(seo.description ?? t(locale, 'site.tagline'));
	// 정식 도메인이 정해지기 전에도 접속한 주소를 그대로 따라가므로 도메인을 바꿔도 손댈 곳이 없다.
	let canonical = $derived(page.url.origin + localeHref(locale, basePath));

	const HREFLANG: Record<(typeof LOCALES)[number], string> = { ko: 'ko-KR', ja: 'ja-JP', en: 'en' };

	// <html lang>은 첫 응답에서만 hooks.server.ts가 맞춰 준다 — 설정 메뉴로 언어를 바꿔 페이지가
	// 클라이언트에서 이동할 때는 여기서 따라가게 한다(글자 모양 선택과 스크린리더 발음이 lang을 따른다).
	$effect(() => {
		document.documentElement.lang = locale;
	});
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	{#if seo.noindex}<meta name="robots" content="noindex,follow" />{/if}
	<link rel="canonical" href={canonical} />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content={siteName} />
	<meta property="og:title" content={seo.title ?? siteName} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={canonical} />
	<meta property="og:locale" content={OG_LOCALE[locale]} />
	{#each LOCALES.filter((target) => target !== locale) as target (target)}
		<meta property="og:locale:alternate" content={OG_LOCALE[target]} />
	{/each}
	<meta name="twitter:card" content="summary" />
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
	<!-- 브랜드 톤(보라/핑크)의 은은한 배경 광원 — 카드 사이 빈 공간에서만 보이면 된다.
		카드 자체는 각 컴포넌트에서 거의 불투명한 흰색(예: bg-white/90)을 써서 광원이
		비쳐도 글자 대비는 그대로 유지한다. -->
	<div class="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
		<div
			class="absolute -top-40 -left-40 h-[32rem] w-[32rem] rounded-full bg-violet-400/25 blur-3xl dark:bg-violet-500/10"
		></div>
		<div
			class="absolute top-1/3 -right-40 h-[28rem] w-[28rem] rounded-full bg-pink-400/20 blur-3xl dark:bg-pink-500/10"
		></div>
	</div>

	<Header {locale} />
	<main class="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
		{@render children()}
	</main>
	<Footer {locale} />
</div>
