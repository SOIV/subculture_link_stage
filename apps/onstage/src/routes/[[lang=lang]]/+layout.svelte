<script lang="ts">
	import { page } from '$app/state';
	import Footer from '$lib/components/Footer.svelte';
	import Header from '$lib/components/Header.svelte';
	import OfflineNotice from '$lib/components/OfflineNotice.svelte';
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
	<link rel="manifest" href={localeHref(locale, '/manifest.webmanifest')} />
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

<!-- 배경은 무채색 한 장이다. 색은 보라 포인트 하나와 행사 시리즈 색 띠(카드·일정 목록)에만 쓴다.
	본문 폭(max-w-7xl)은 헤더·푸터와 같아서 세 영역의 양 끝이 한 줄로 맞는다. -->
<!-- 노치가 있는 폰을 가로로 돌리면 좌우가 가려지므로 그만큼 비운다(viewport-fit=cover — src/app.html). -->
<div
	class="flex min-h-dvh flex-col bg-zinc-50 pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)] text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100"
>
	<Header {locale} />
	<OfflineNotice {locale} />
	<main class="mx-auto w-full max-w-7xl flex-1 px-4 pt-8 pb-8 sm:px-6 sm:pt-12 lg:px-8">
		{@render children()}
	</main>
	<Footer {locale} />
</div>
