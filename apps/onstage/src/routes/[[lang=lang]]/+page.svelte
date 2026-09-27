<script lang="ts">
	import EventCard from '$lib/components/EventCard.svelte';
	import FilterBar from '$lib/components/FilterBar.svelte';
	import { icsUrl } from '$lib/api';
	import { t } from '$lib/i18n';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let locale = $derived(data.locale);
</script>

<div class="space-y-6">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<h1 class="text-2xl font-bold tracking-tight">{t(locale, 'nav.events')}</h1>
		<a
			href={icsUrl('custom', { locale, ...data.filters }).toString()}
			class="rounded-lg border border-violet-300 px-3 py-1.5 text-sm font-semibold text-violet-700 hover:bg-violet-50 dark:border-violet-700 dark:text-violet-300 dark:hover:bg-violet-950"
		>
			{t(locale, 'subscribe.title')}
		</a>
	</div>

	<FilterBar {locale} tagGroups={data.tagGroups.items} filters={data.filters} />

	<p class="text-sm text-slate-500 dark:text-slate-400">
		{data.events.count}{t(locale, 'list.count')}
	</p>

	{#if data.events.items.length === 0}
		<p
			class="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500 dark:border-slate-700"
		>
			{t(locale, 'list.empty')}
		</p>
	{:else}
		<div class="grid gap-4 sm:grid-cols-2">
			{#each data.events.items as event (event.id)}
				<EventCard {event} {locale} />
			{/each}
		</div>
	{/if}
</div>
