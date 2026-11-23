<script lang="ts">
	import { page } from '$app/state';
	import EventCard from '$lib/components/EventCard.svelte';
	import FilterBar from '$lib/components/FilterBar.svelte';
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

	// "끝난 행사 보기" 스위치: 지금 조건은 그대로 두고 ?ended=1만 켜고 끈다(자바스크립트 없이도 동작하는 링크).
	// 캘린더 구독은 이 페이지에 따로 두지 않는다 — 페이지 맨 아래(푸터)에서 구독할 수 있다.
	let endedToggleHref = $derived.by(() => {
		const params = new URLSearchParams(page.url.search);
		if (data.filters.showEnded) params.delete('ended');
		else params.set('ended', '1');
		const query = params.toString();
		return page.url.pathname + (query ? `?${query}` : '');
	});
</script>

<div class="space-y-5 sm:space-y-6">
	<h1
		class="font-display text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50"
	>
		{t(locale, 'nav.events')}
	</h1>

	<FilterBar
		{locale}
		tagGroups={data.tagGroups.items}
		filters={data.filters}
		count={data.events.count}
	/>

	<div class="flex flex-wrap items-center justify-between gap-3">
		<p class="text-sm text-zinc-500 tabular-nums dark:text-zinc-400" aria-live="polite">
			{countText}
		</p>
		<a
			href={endedToggleHref}
			role="switch"
			aria-checked={data.filters.showEnded}
			data-sveltekit-noscroll
			data-sveltekit-keepfocus
			class="-mr-2 inline-flex h-11 items-center gap-2.5 rounded-lg px-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-900/[0.04] sm:mr-0 sm:h-9 dark:text-zinc-200 dark:hover:bg-white/[0.06]"
		>
			<span
				class="relative h-5 w-9 shrink-0 rounded-full transition-colors {data.filters.showEnded
					? 'bg-violet-600 dark:bg-violet-500'
					: 'bg-zinc-300 dark:bg-zinc-600'}"
				aria-hidden="true"
			>
				<span
					class="absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow-sm transition-transform {data
						.filters.showEnded
						? 'translate-x-4'
						: ''}"
				></span>
			</span>
			{t(locale, 'list.showEnded')}
			{#if data.endedCount > 0}
				<span class="text-zinc-400 tabular-nums dark:text-zinc-500">{data.endedCount}</span>
			{/if}
		</a>
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
