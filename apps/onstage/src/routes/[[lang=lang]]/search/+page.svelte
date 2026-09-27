<script lang="ts">
	import EventCard from '$lib/components/EventCard.svelte';
	import { t } from '$lib/i18n';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let locale = $derived(data.locale);
</script>

<div class="space-y-8">
	<section class="space-y-2 pt-2">
		<p class="text-xs font-bold tracking-[0.25em] text-violet-600 uppercase dark:text-violet-400">
			{t(locale, 'site.tagline')}
		</p>
		<h1 class="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
			{t(locale, 'nav.search')}
		</h1>
	</section>

	<form method="GET" class="flex gap-2">
		<input
			type="search"
			name="q"
			value={data.q}
			placeholder={t(locale, 'search.placeholder')}
			class="flex-1 rounded-full border border-slate-300 bg-white/90 px-4 py-2.5 text-sm shadow-sm backdrop-blur-sm focus:border-violet-400 focus:outline-none dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none"
		/>
		<button
			type="submit"
			class="rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-violet-600/20 transition-transform hover:scale-[1.03] hover:shadow-lg hover:shadow-violet-600/30"
		>
			{t(locale, 'search.button')}
		</button>
	</form>

	{#if data.results}
		<p class="text-sm text-slate-500 dark:text-slate-400">
			{t(locale, 'search.resultsFor')} "{data.q}" — {data.results.count}{t(locale, 'list.count')}
		</p>
		{#if data.results.items.length === 0}
			<p
				class="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500 dark:border-slate-700"
			>
				{t(locale, 'search.empty')}
			</p>
		{:else}
			<div class="grid gap-4 sm:grid-cols-2">
				{#each data.results.items as event (event.id)}
					<EventCard {event} {locale} />
				{/each}
			</div>
		{/if}
	{/if}
</div>
