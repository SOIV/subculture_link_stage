<script lang="ts">
	import { localeHref, t, type Locale } from '$lib/i18n';
	import LocaleSwitcher from './LocaleSwitcher.svelte';

	let { locale }: { locale: Locale } = $props();
</script>

<header
	class="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90"
>
	<div class="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
		<a
			href={localeHref(locale, '/')}
			class="text-lg font-bold tracking-tight text-violet-600 dark:text-violet-400"
		>
			{t(locale, 'site.name')}
		</a>
		<div class="flex flex-wrap items-center gap-4">
			<nav class="flex items-center gap-4 text-sm font-medium text-slate-600 dark:text-slate-300">
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
			<LocaleSwitcher {locale} />
		</div>
	</div>
</header>
