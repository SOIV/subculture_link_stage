<script lang="ts">
	import { page } from '$app/state';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import EventCard from '$lib/components/EventCard.svelte';
	import FilterBar from '$lib/components/FilterBar.svelte';
	import { t, tv } from '$lib/i18n';
	import { now } from '$lib/clock.svelte';
	import { hasEnded } from '$lib/schedule';
	import { buildTagIndex } from '$lib/tags';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let locale = $derived(data.locale);
	let tagIndex = $derived(buildTagIndex(data.tagGroups.items));

	// 기본은 끝난 행사를 빼고 보여준다(?ended=1이면 전부). 숨긴 개수는 스위치 옆에 알려준다.
	// now()는 날짜가 바뀌면 다시 계산되게 하는 공통 시계다($lib/clock.svelte.ts).
	let ended = $derived.by(() => {
		const at = now();
		return data.events.items.filter((event) => hasEnded(event, at));
	});
	let items = $derived(
		data.filters.showEnded
			? data.events.items
			: data.events.items.filter((event) => !ended.includes(event))
	);

	let countText = $derived(
		(data.filters.q ? `${tv(locale, 'list.searchResults', { q: data.filters.q })} · ` : '') +
			`${items.length}${t(locale, 'list.count')}`
	);

	// "끝난 행사 보기" 스위치: 지금 조건은 그대로 두고 ?ended=1만 켜고 끈다(자바스크립트 없이도 동작하는 링크).
	// 캘린더 구독은 이 페이지에 따로 두지 않는다 — 페이지 맨 아래(푸터)에서 구독할 수 있다.
	let endedToggleHref = $derived.by(() => {
		const params = new SvelteURLSearchParams(page.url.search);
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
		count={items.length}
		invalidFields={data.invalidFields}
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
			{#if ended.length > 0}
				<span class="text-zinc-400 tabular-nums dark:text-zinc-500">{ended.length}</span>
			{/if}
		</a>
	</div>

	{#if items.length === 0}
		<p
			class="rounded-2xl border border-dashed border-zinc-300 p-8 text-center text-zinc-500 dark:border-zinc-700"
		>
			{t(locale, data.invalidQuery ? 'list.invalidQuery' : 'list.empty')}
		</p>
	{:else}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each items as event (event.id)}
				<EventCard {event} {locale} {tagIndex} />
			{/each}
		</div>
	{/if}
</div>
