<script lang="ts">
	import SeriesCard from '$lib/components/SeriesCard.svelte';
	import { t, tv } from '$lib/i18n';
	import { now } from '$lib/clock.svelte';
	import { buildSeriesCards, sortSeriesCards } from '$lib/series';
	import { buildTagIndex } from '$lib/tags';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let locale = $derived(data.locale);
	let tagIndex = $derived(buildTagIndex(data.tagGroups.items));
	// 다음·최근 회차와 순서는 날짜에 따라 바뀌므로 공통 시계(now)로 화면에서 계산한다.
	// 요약 칸이 없는 이전 API일 때만 events(전체 행사 목록)가 있다(+page.ts).
	let cards = $derived(sortSeriesCards(buildSeriesCards(data.series.items, data.events, now())));
</script>

<div class="space-y-5 sm:space-y-6">
	<div class="space-y-2">
		<h1
			class="font-display text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50"
		>
			{t(locale, 'nav.series')}
		</h1>
		<p class="max-w-2xl text-zinc-600 dark:text-zinc-400">{t(locale, 'series.listDescription')}</p>
	</div>

	<p class="text-sm text-zinc-500 tabular-nums dark:text-zinc-400">
		{tv(locale, 'series.count', { n: cards.length })}
	</p>

	{#if cards.length === 0}
		<p
			class="rounded-2xl border border-dashed border-zinc-300 p-8 text-center text-zinc-500 dark:border-zinc-700"
		>
			{t(locale, 'series.empty')}
		</p>
	{:else}
		<ul class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each cards as card (card.series.id)}
				<li><SeriesCard {card} {locale} {tagIndex} /></li>
			{/each}
		</ul>
	{/if}
</div>
