<script lang="ts">
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import { formatCardPeriod } from '$lib/format';
	import { localeHref, t, tv, type Locale } from '$lib/i18n';
	import { now } from '$lib/clock.svelte';
	import { daysUntil } from '$lib/schedule';
	import { seriesCategoryTags, type SeriesCardData } from '$lib/series';
	import type { TagIndex } from '$lib/tags';
	import { accentColor } from '$lib/theme';
	import CountryBadge from './CountryBadge.svelte';
	import EditionPhaseBadge from './EditionPhaseBadge.svelte';

	let { card, locale, tagIndex }: { card: SeriesCardData; locale: Locale; tagIndex: TagIndex } =
		$props();

	const MAX_TAG_CHIPS = 3;

	let series = $derived(card.series);
	// 회차 카드(EventCard)와 같은 색 — 둘 다 시리즈 slug에서 만든다.
	let accent = $derived(accentColor(series.slug));
	let chips = $derived(seriesCategoryTags(card.tags, tagIndex, MAX_TAG_CHIPS));
	// 다음 회차를 먼저 보여주고, 없으면 최근(끝난) 회차를 보여준다.
	let shown = $derived(
		card.next
			? { label: 'series.next', edition: card.next.edition, phase: card.next.phase }
			: card.latest
				? { label: 'series.latest', edition: card.latest, phase: 'ended' as const }
				: null
	);
	let days = $derived.by(() => {
		if (shown?.phase !== 'upcoming') return null;
		const { range } = shown.edition;
		return range.startsAt ? daysUntil(range.startsAt, range.timezone, now()) : null;
	});
</script>

<!-- 카드 전체가 시리즈 상세로 가는 링크다(안에 다른 링크를 두지 않는다). 모양은 회차 카드(EventCard)와 맞춘다. -->
<a
	href={localeHref(locale, `/series/${series.slug}`)}
	style:--accent={accent}
	class="group flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-900/[0.08] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-[border-color,box-shadow] duration-150 hover:border-zinc-900/[0.16] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] dark:border-white/[0.08] dark:bg-zinc-900 dark:shadow-none dark:hover:border-white/[0.16]"
>
	<div class="h-1 w-full shrink-0 bg-[var(--accent)]"></div>
	<div class="flex flex-1 flex-col p-5">
		<div
			class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400"
		>
			{#each card.countries as country (country)}
				<CountryBadge {locale} countryCode={country} />
			{/each}
			{#if card.hasOnline}
				<CountryBadge {locale} countryCode={null} isOnline />
			{/if}
			{#if series.foundedYear}
				<span class="tabular-nums"
					>{tv(locale, 'series.founded', { year: series.foundedYear })}</span
				>
			{/if}
		</div>

		<h2
			class="mt-3 font-display text-lg leading-snug font-semibold text-zinc-900 dark:text-zinc-50"
		>
			{series.title ?? series.slug}
		</h2>

		{#if series.summary}
			<p class="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">{series.summary}</p>
		{/if}

		{#if chips.shown.length > 0}
			<ul class="mt-3 flex flex-wrap gap-1.5">
				{#each chips.shown as chip (chip.slug)}
					<li
						class="rounded-md bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-white/[0.06] dark:text-zinc-300"
					>
						{chip.name}
					</li>
				{/each}
				{#if chips.hidden > 0}
					<li class="px-1 py-0.5 text-xs text-zinc-400 dark:text-zinc-500">+{chips.hidden}</li>
				{/if}
			</ul>
		{/if}

		<div class="pt-4">
			<div class="border-t border-zinc-900/[0.06] pt-4 dark:border-white/[0.06]">
				{#if shown}
					<div class="flex items-start justify-between gap-3">
						<div class="min-w-0 text-sm">
							<p class="text-xs text-zinc-500 dark:text-zinc-400">{t(locale, shown.label)}</p>
							<p class="mt-1 font-medium text-zinc-900 dark:text-zinc-100">
								{shown.edition.title ?? shown.edition.slug}
							</p>
							<p class="mt-0.5 text-zinc-600 tabular-nums dark:text-zinc-400">
								{formatCardPeriod(locale, shown.edition.range, now())}
							</p>
						</div>
						{#if days !== null}
							<span
								class="shrink-0 rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium whitespace-nowrap text-zinc-700 tabular-nums dark:bg-white/[0.08] dark:text-zinc-200"
							>
								{days === 0 ? t(locale, 'card.today') : tv(locale, 'card.dday', { n: days })}
							</span>
						{:else}
							<EditionPhaseBadge {locale} phase={shown.phase} />
						{/if}
					</div>
				{:else}
					<p class="text-sm text-zinc-500 dark:text-zinc-400">{t(locale, 'series.noEditions')}</p>
				{/if}
			</div>
		</div>

		{#if card.editionCount > 0}
			<p
				class="mt-auto flex items-center gap-1 pt-3 text-xs text-zinc-500 transition-colors group-hover:text-zinc-900 dark:text-zinc-400 dark:group-hover:text-zinc-100"
			>
				{card.editionCount === 1
					? t(locale, 'series.editionCount.one')
					: tv(locale, 'series.editionCount', { n: card.editionCount })}
				<ChevronRight class="size-3.5" aria-hidden="true" />
			</p>
		{/if}
	</div>
</a>
