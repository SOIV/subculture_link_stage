<script lang="ts">
	import CalendarPlus from '@lucide/svelte/icons/calendar-plus';
	import { icsUrl } from '$lib/api';
	import EventCard from '$lib/components/EventCard.svelte';
	import FilterBar from '$lib/components/FilterBar.svelte';
	import SubscribeMenu from '$lib/components/SubscribeMenu.svelte';
	import { t, tv } from '$lib/i18n';
	import { buildTagIndex } from '$lib/tags';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let locale = $derived(data.locale);
	let tagIndex = $derived(buildTagIndex(data.tagGroups.items));

	let countText = $derived(
		(data.filters.q ? `${tv(locale, 'list.searchResults', { q: data.filters.q })} · ` : '') +
			`${data.events.count}${t(locale, 'list.count')}`
	);

	// 구독 링크는 지금 고른 조건(국가·태그·기간)을 그대로 담는다. 검색어는 구독에 반영되지 않는다.
	let subscribeHref = $derived(
		icsUrl('custom', {
			locale,
			country: data.filters.country || undefined,
			tags: Object.values(data.filters.groups).join(',') || undefined,
			from: data.filters.from || undefined,
			to: data.filters.to || undefined
		}).toString()
	);
</script>

<div class="space-y-6">
	<h1 class="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
		{t(locale, 'nav.events')}
	</h1>

	<FilterBar {locale} tagGroups={data.tagGroups.items} filters={data.filters} />

	<div class="flex flex-wrap items-center justify-between gap-3">
		<p class="text-sm text-slate-500 dark:text-slate-400" aria-live="polite">{countText}</p>
		<SubscribeMenu
			{locale}
			url={subscribeHref}
			name="SCLS"
			triggerClass="inline-flex items-center gap-1.5 rounded-full border border-violet-300 px-4 py-2 text-sm font-bold text-violet-700 hover:bg-violet-50 dark:border-violet-700 dark:text-violet-300 dark:hover:bg-violet-950"
		>
			<CalendarPlus class="size-4" aria-hidden="true" />
			{t(locale, 'subscribe.title')}
		</SubscribeMenu>
	</div>

	{#if data.events.items.length === 0}
		<p
			class="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500 dark:border-slate-700"
		>
			{t(locale, 'list.empty')}
		</p>
	{:else}
		<div class="grid gap-4 sm:grid-cols-2">
			{#each data.events.items as event (event.id)}
				<EventCard {event} {locale} {tagIndex} />
			{/each}
		</div>
	{/if}
</div>
