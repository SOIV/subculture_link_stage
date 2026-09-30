<script lang="ts">
	import { page } from '$app/state';
	import { localeHref, stripLocale, t, type Locale } from '$lib/i18n';
	import SettingsMenu from './SettingsMenu.svelte';

	let { locale }: { locale: Locale } = $props();

	// 행사 목록(/events)과 그 하위 상세 페이지에서는 "행사" 메뉴를 강조한다.
	let inEvents = $derived(stripLocale(page.url.pathname).startsWith('/events'));
</script>

<header
	class="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70"
>
	<div class="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
		<a href={localeHref(locale, '/')} class="group flex items-center leading-none">
			<span
				class="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-500 bg-clip-text font-display text-xl font-extrabold tracking-tight text-transparent transition-[filter] group-hover:brightness-110 dark:from-violet-400 dark:via-fuchsia-400 dark:to-pink-400"
			>
				{t(locale, 'site.name')}
			</span>
		</a>
		<div class="flex items-center gap-3 sm:gap-5">
			<nav class="flex items-center text-sm font-semibold">
				<a
					href={localeHref(locale, '/events')}
					aria-current={inEvents ? 'page' : undefined}
					class="transition-colors {inEvents
						? 'text-violet-600 dark:text-violet-400'
						: 'text-slate-600 hover:text-violet-600 dark:text-slate-300 dark:hover:text-violet-400'}"
				>
					{t(locale, 'nav.events')}
				</a>
			</nav>
			<SettingsMenu {locale} />
		</div>
	</div>
</header>
