<script lang="ts">
	import EventCard from '$lib/components/EventCard.svelte';
	import { t } from '$lib/i18n';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let locale = $derived(data.locale);
</script>

<div class="space-y-6">
	<h1 class="text-2xl font-bold tracking-tight">{t(locale, 'nav.search')}</h1>

	<form method="GET" class="flex gap-2">
		<input
			type="search"
			name="q"
			value={data.q}
			placeholder={t(locale, 'search.placeholder')}
			class="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
		/>
		<button
			type="submit"
			class="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500"
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
				class="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500 dark:border-slate-700"
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
