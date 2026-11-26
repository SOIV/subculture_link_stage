<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import CalendarDays from '@lucide/svelte/icons/calendar-days';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import History from '@lucide/svelte/icons/history';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import CountryBadge from '$lib/components/CountryBadge.svelte';
	import EditionPhaseBadge from '$lib/components/EditionPhaseBadge.svelte';
	import EventCard from '$lib/components/EventCard.svelte';
	import { eventPeriod, formatHistoryPeriod } from '$lib/format';
	import { localeHref, t, tv } from '$lib/i18n';
	import { now } from '$lib/clock.svelte';
	import {
		compareByStart,
		editionPhase,
		historyByYear,
		editionTags,
		isAheadPhase,
		seriesCategoryTags,
		seriesOverview
	} from '$lib/series';
	import { buildTagIndex } from '$lib/tags';
	import { accentColor } from '$lib/theme';
	import { safeExternalUrl } from '$lib/url';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let locale = $derived(data.locale);
	let series = $derived(data.series);
	let tagIndex = $derived(buildTagIndex(data.tagGroups.items));
	let accent = $derived(accentColor(series.slug));
	let officialHref = $derived(safeExternalUrl(series.officialUrl));
	let chips = $derived(seriesCategoryTags(editionTags(data.editions), tagIndex, 6));

	// 회차 상태(예정·진행 중·종료)는 날짜에 따라 바뀌므로 공통 시계(now)로 화면에서 계산한다.
	let overview = $derived(seriesOverview(data.editions, now()));
	// 진행 중·예정·연기 회차를 시작이 이른 순으로(API 정렬에 기대지 않는다).
	let upcoming = $derived(
		data.editions.filter((event) => isAheadPhase(editionPhase(event, now()))).sort(compareByStart)
	);
	let history = $derived(historyByYear(data.editions, now()));

	const sectionHeadingClass =
		'mb-3 flex items-center gap-2 text-sm font-medium text-zinc-500 dark:text-zinc-400';
</script>

<article class="space-y-8">
	<div class="-mt-3 flex">
		<a
			href={localeHref(locale, '/series')}
			class="-mb-3 inline-flex items-center gap-1 py-3 text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
		>
			<ArrowLeft class="size-4" aria-hidden="true" />
			{t(locale, 'series.backToList')}
		</a>
	</div>

	<header
		style:--accent={accent}
		class="overflow-hidden rounded-2xl border border-zinc-900/[0.08] bg-white dark:border-white/[0.08] dark:bg-zinc-900"
	>
		<div class="h-1 w-full bg-[var(--accent)]"></div>
		<div class="space-y-3 p-5 sm:p-8">
			{#if overview.countries.length > 0 || overview.hasOnline || chips.shown.length > 0}
				<div class="flex flex-wrap items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
					{#each overview.countries as country (country)}
						<span class="rounded-md bg-zinc-100 px-2 py-1 dark:bg-white/[0.08]">
							<CountryBadge {locale} countryCode={country} />
						</span>
					{/each}
					{#if overview.hasOnline}
						<span class="rounded-md bg-zinc-100 px-2 py-1 dark:bg-white/[0.08]">
							<CountryBadge {locale} countryCode={null} isOnline />
						</span>
					{/if}
					{#each chips.shown as chip (chip.slug)}
						<span class="rounded-md bg-zinc-100 px-2 py-1 dark:bg-white/[0.08]">{chip.name}</span>
					{/each}
				</div>
			{/if}
			<h1
				class="font-display text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50"
			>
				{series.title ?? series.slug}
			</h1>
			{#if series.summary}
				<p class="max-w-3xl text-lg text-zinc-600 dark:text-zinc-300">{series.summary}</p>
			{/if}
			<div
				class="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-zinc-600 dark:text-zinc-400"
			>
				{#if series.foundedYear}
					<span class="tabular-nums"
						>{tv(locale, 'series.founded', { year: series.foundedYear })}</span
					>
				{/if}
				{#if overview.editionCount > 0}
					<span class="tabular-nums">
						{overview.editionCount === 1
							? t(locale, 'series.editionCount.one')
							: tv(locale, 'series.editionCount', { n: overview.editionCount })}
					</span>
				{/if}
				{#if officialHref}
					<a
						href={officialHref}
						target="_blank"
						rel="noopener noreferrer"
						class="-my-2.5 inline-flex items-center gap-1 py-2.5 font-medium text-violet-700 hover:underline dark:text-violet-400"
					>
						{t(locale, 'url.OFFICIAL_SITE')}
						<ExternalLink class="size-3.5" aria-hidden="true" />
					</a>
				{/if}
			</div>
		</div>
	</header>

	{#if series.description}
		<!-- 시리즈 소개(새 시리즈 상세 API에만 있다). 비어 있으면 자리를 두지 않는다. -->
		<p class="max-w-3xl leading-relaxed whitespace-pre-line text-zinc-700 dark:text-zinc-300">
			{series.description}
		</p>
	{/if}

	<section aria-labelledby="series-upcoming">
		<h2 id="series-upcoming" class={sectionHeadingClass}>
			<CalendarDays class="size-4" aria-hidden="true" />
			{t(locale, 'series.upcoming')}
		</h2>
		{#if upcoming.length === 0}
			<p
				class="rounded-2xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700"
			>
				{t(locale, 'series.upcoming.empty')}
			</p>
		{:else}
			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each upcoming as event (event.id)}
					<EventCard {event} {locale} {tagIndex} />
				{/each}
			</div>
		{/if}
	</section>

	<section aria-labelledby="series-history">
		<h2 id="series-history" class={sectionHeadingClass}>
			<History class="size-4" aria-hidden="true" />
			{t(locale, 'series.history')}
		</h2>
		{#if history.length === 0}
			<p
				class="rounded-2xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700"
			>
				{t(locale, 'series.noEditions')}
			</p>
		{:else}
			<div
				class="overflow-hidden rounded-2xl border border-zinc-900/[0.08] bg-white dark:border-white/[0.08] dark:bg-zinc-900"
			>
				{#each history as group (group.year ?? 'undated')}
					<div class="border-t border-zinc-900/[0.06] first:border-t-0 dark:border-white/[0.06]">
						<h3
							class="bg-zinc-50 px-5 py-2 text-sm font-semibold text-zinc-700 tabular-nums dark:bg-white/[0.03] dark:text-zinc-200"
						>
							{group.year
								? tv(locale, 'series.year', { year: group.year })
								: t(locale, 'series.yearUnknown')}
						</h3>
						<ul class="divide-y divide-zinc-900/[0.06] dark:divide-white/[0.06]">
							{#each group.editions as { event, phase } (event.id)}
								<li>
									<a
										href={localeHref(locale, `/events/${event.slug}`)}
										class="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-zinc-900/[0.03] dark:hover:bg-white/[0.04]"
									>
										<div class="min-w-0 flex-1">
											<p class="font-medium text-zinc-900 dark:text-zinc-100">
												{event.title ?? event.slug}
											</p>
											<p
												class="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-zinc-500 dark:text-zinc-400"
											>
												<span class="tabular-nums">
													{formatHistoryPeriod(locale, eventPeriod(event))}
												</span>
												<span class="inline-flex min-w-0 items-center gap-1">
													<MapPin class="size-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
													{event.isOnline
														? t(locale, 'card.online')
														: (event.venue?.name ?? t(locale, 'card.venueUnknown'))}
												</span>
											</p>
										</div>
										<EditionPhaseBadge {locale} {phase} />
										<ChevronRight
											class="size-4 shrink-0 text-zinc-400 dark:text-zinc-500"
											aria-hidden="true"
										/>
									</a>
								</li>
							{/each}
						</ul>
					</div>
				{/each}
			</div>
			<p class="mt-3 text-xs text-zinc-500 dark:text-zinc-400">{t(locale, 'series.historyNote')}</p>
		{/if}
	</section>
</article>
