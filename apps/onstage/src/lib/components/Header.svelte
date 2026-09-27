<script lang="ts">
	import { localeHref, t, type Locale } from '$lib/i18n';
	import LocaleSwitcher from './LocaleSwitcher.svelte';
	import ThemeToggle from './ThemeToggle.svelte';

	let { locale }: { locale: Locale } = $props();
</script>

<header
	class="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70"
>
	<div
		class="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6"
	>
		<a href={localeHref(locale, '/')} class="group flex flex-col leading-none">
			<span
				class="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-500 bg-clip-text font-display text-xl font-extrabold tracking-tight text-transparent transition-[filter] group-hover:brightness-110 dark:from-violet-400 dark:via-fuchsia-400 dark:to-pink-400"
			>
				{t(locale, 'site.name')}
			</span>
			<span class="mt-0.5 hidden text-xs font-medium text-slate-500 sm:block dark:text-slate-400">
				{t(locale, 'site.tagline')}
			</span>
		</a>
		<div class="flex flex-wrap items-center gap-4">
			<nav class="flex items-center gap-4 text-sm font-semibold text-slate-600 dark:text-slate-300">
				<a href={localeHref(locale, '/')} class="hover:text-violet-600 dark:hover:text-violet-400">
					{t(locale, 'nav.events')}
				</a>
				<a
					href={localeHref(locale, '/search')}
					class="hover:text-violet-600 dark:hover:text-violet-400"
				>
					{t(locale, 'nav.search')}
				</a>
			</nav>
			<ThemeToggle {locale} />
			<LocaleSwitcher {locale} />
		</div>
	</div>
</header>
