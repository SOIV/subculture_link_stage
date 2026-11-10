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
	<h1
		class="font-display text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50"
	>
		{t(locale, 'nav.events')}
	</h1>

	<FilterBar {locale} tagGroups={data.tagGroups.items} filters={data.filters} />

	<div class="flex flex-wrap items-center justify-between gap-3">
		<p class="text-sm text-zinc-500 tabular-nums dark:text-zinc-400" aria-live="polite">
			{countText}
		</p>
		<SubscribeMenu
			{locale}
			url={subscribeHref}
			name="SCLS"
			triggerClass="inline-flex h-9 items-center gap-2 rounded-lg border border-zinc-900/[0.08] bg-white px-3 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-50 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-zinc-100 dark:hover:bg-white/[0.08]"
		>
			<CalendarPlus class="size-4 text-zinc-500 dark:text-zinc-400" aria-hidden="true" />
			{t(locale, 'subscribe.title')}
		</SubscribeMenu>
	</div>

	{#if data.events.items.length === 0}
		<p
			class="rounded-2xl border border-dashed border-zinc-300 p-8 text-center text-zinc-500 dark:border-zinc-700"
		>
			{t(locale, 'list.empty')}
		</p>
	{:else}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each data.events.items as event (event.id)}
				<EventCard {event} {locale} {tagIndex} />
			{/each}
		</div>
	{/if}
</div>
