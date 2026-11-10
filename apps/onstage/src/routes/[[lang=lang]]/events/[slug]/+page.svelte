<script lang="ts">
	import { page } from '$app/state';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import CalendarDays from '@lucide/svelte/icons/calendar-days';
	import Link from '@lucide/svelte/icons/link';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import Mic from '@lucide/svelte/icons/mic';
	import Tag from '@lucide/svelte/icons/tag';
	import Ticket from '@lucide/svelte/icons/ticket';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import {
		audienceLabel,
		formatPrices,
		formatSchedule,
		scheduleQualifier,
		scheduleTypeLabel,
		statusLabel,
		urlTypeLabel
	} from '$lib/format';
	import { localeHref, t } from '$lib/i18n';
	import { eventJsonLd, jsonLdScript } from '$lib/seo';
	import { accentColor } from '$lib/theme';
	import CountryBadge from '$lib/components/CountryBadge.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let locale = $derived(data.locale);
	let event = $derived(data.event);
	let jsonLd = $derived.by(() => {
		const data = eventJsonLd(event, page.url.origin + localeHref(locale, `/events/${event.slug}`));
		return data ? jsonLdScript(data) : null;
	});
	// 공식 표기가 없는 언어라 이 화면이 직접 옮긴 제목/설명 — 번역 검수 전이라는 표시.
	let needsReview = $derived(event.translation?.status === 'REVIEW_REQUIRED');
	// 시리즈 단위로 같은 색이 나오게 한다(목록 카드와 동일한 기준) — 단독 행사는 자기 slug로 대신한다.
	let accent = $derived(accentColor(event.eventSeries?.slug ?? event.slug));
	// API가 정렬을 보장하지 않으므로(§public-events.ts) 화면에서 시간순으로 정렬한다. 같은 시각이면 국내 →
	// 해외 → 대상 없음(전체) 순이다(같은 시각에 열리는 판매처별 일정이 있을 때 순서가 흔들리지 않게).
	const audienceRank = { DOMESTIC: 0, OVERSEAS: 1 } as const;
	let sortedSchedules = $derived(
		[...event.schedules].sort(
			(a, b) =>
				(a.startsAt ?? '').localeCompare(b.startsAt ?? '') ||
				(a.audience ? audienceRank[a.audience] : 2) - (b.audience ? audienceRank[b.audience] : 2)
		)
	);
	// 예매처는 국내 → 해외 순으로 묶어 보여준다. 대상이 늘면 이 배열에 추가한다.
	const audienceOrder = ['DOMESTIC', 'OVERSEAS'] as const;
	let channelGroups = $derived(
		audienceOrder
			.map((audience) => ({
				audience,
				channels: event.ticket.channels.filter((channel) => channel.audience === audience)
			}))
			.filter((group) => group.channels.length > 0)
	);
	let hasTicketInfo = $derived(event.ticket.types.length > 0 || event.ticket.channels.length > 0);
	let mapHref = $derived.by(() => {
		const venue = event.venue;
		if (!venue) return null;
		if (venue.latitude != null && venue.longitude != null) {
			return `https://www.google.com/maps/search/?api=1&query=${venue.latitude},${venue.longitude}`;
		}
		if (venue.address)
			return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue.address)}`;
		return null;
	});

	const linkButtonClass =
		'inline-flex h-9 items-center rounded-lg border border-zinc-900/[0.08] bg-white px-3 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-50 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-zinc-100 dark:hover:bg-white/[0.08]';
	const infoCardClass =
		'rounded-2xl border border-zinc-900/[0.08] bg-white p-5 dark:border-white/[0.08] dark:bg-zinc-900';
	const sectionHeadingClass =
		'mb-3 flex items-center gap-2 text-sm font-medium text-zinc-500 dark:text-zinc-400';
</script>

<svelte:head>
	{#if jsonLd}
		<!-- jsonLdScript가 `<`를 이스케이프하므로 데이터가 </script>로 빠져나갈 수 없다. -->
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html jsonLd}
	{/if}
</svelte:head>

<article class="space-y-8">
	<a
		href={localeHref(locale, '/events')}
		class="inline-flex items-center gap-1 text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
	>
		<ArrowLeft class="size-4" aria-hidden="true" />
		{t(locale, 'detail.backToList')}
	</a>

	<!-- 시리즈 색은 목록 카드처럼 맨 위 얇은 띠에만 쓴다. -->
	<header
		style:--accent={accent}
		class="overflow-hidden rounded-2xl border border-zinc-900/[0.08] bg-white dark:border-white/[0.08] dark:bg-zinc-900"
	>
		<div class="h-1 w-full bg-[var(--accent)]"></div>
		<div class="space-y-3 p-5 sm:p-8">
			<div class="flex flex-wrap items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
				<span class="rounded-md bg-zinc-100 px-2 py-1 dark:bg-white/[0.08]"
					>{statusLabel(locale, event.status)}</span
				>
				<span class="rounded-md bg-zinc-100 px-2 py-1 dark:bg-white/[0.08]">
					<CountryBadge {locale} countryCode={event.countryCode} isOnline={event.isOnline} />
				</span>
				{#if event.eventSeries}
					<span class="rounded-md bg-zinc-100 px-2 py-1 dark:bg-white/[0.08]">
						{t(locale, 'detail.series')} · {data.seriesTitles.get(event.eventSeries.slug) ??
							event.eventSeries.slug}
					</span>
				{/if}
			</div>
			<h1
				class="font-display text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50"
			>
				{event.title ?? event.slug}
			</h1>
			{#if event.summary}
				<p class="max-w-3xl text-lg text-zinc-600 dark:text-zinc-300">{event.summary}</p>
			{/if}
			{#if needsReview}
				<p class="flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400">
					<TriangleAlert class="size-3.5 shrink-0" aria-hidden="true" />
					{t(locale, 'detail.translationNotice')}
				</p>
			{/if}
		</div>
	</header>

	<p class="max-w-3xl leading-relaxed whitespace-pre-line text-zinc-700 dark:text-zinc-300">
		{event.description ?? t(locale, 'detail.noDescription')}
	</p>

	<div class="grid gap-4 sm:grid-cols-2">
		<section class={infoCardClass}>
			<h2 class={sectionHeadingClass}>
				<MapPin class="size-4" aria-hidden="true" />{t(locale, 'detail.venue')}
			</h2>
			{#if event.venue}
				<p class="font-medium">{event.venue.name}</p>
				{#if event.venue.address}
					<p class="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">{event.venue.address}</p>
				{/if}
				{#if mapHref}
					<a
						href={mapHref}
						target="_blank"
						rel="noreferrer"
						class="mt-2 inline-block text-sm font-medium text-violet-700 transition-colors hover:text-violet-900 dark:text-violet-400 dark:hover:text-violet-300"
					>
						{t(locale, 'detail.map')}
					</a>
				{/if}
			{:else}
				<p class="text-sm text-zinc-500 dark:text-zinc-400">{t(locale, 'card.venueUnknown')}</p>
			{/if}
		</section>

		<section class={infoCardClass}>
			<h2 class={sectionHeadingClass}>
				<Mic class="size-4" aria-hidden="true" />{t(locale, 'detail.organizers')}
			</h2>
			{#if event.organizers.length > 0}
				<ul class="space-y-1 text-sm">
					{#each event.organizers as organizer (organizer.id)}
						<li>
							<span class="font-medium">{organizer.name}</span>
							<span class="text-zinc-400">· {t(locale, `role.${organizer.role}`)}</span>
						</li>
					{/each}
				</ul>
			{:else}
				<p class="text-sm text-zinc-500 dark:text-zinc-400">—</p>
			{/if}
		</section>
	</div>

	<section class={infoCardClass}>
		<h2 class={sectionHeadingClass}>
			<CalendarDays class="size-4" aria-hidden="true" />{t(locale, 'detail.schedule')}
		</h2>
		<ul class="divide-y divide-zinc-900/[0.06] dark:divide-white/[0.06]">
			{#each sortedSchedules as schedule, index (index)}
				{@const qualifier = scheduleQualifier(locale, schedule)}
				<li class="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
					<span class="min-w-0">
						<span class="block font-medium">{scheduleTypeLabel(locale, schedule.type)}</span>
						{#if qualifier}
							<span class="block text-xs text-zinc-500 dark:text-zinc-400">{qualifier}</span>
						{/if}
					</span>
					<span class="text-zinc-600 tabular-nums dark:text-zinc-400"
						>{formatSchedule(locale, schedule)}</span
					>
				</li>
			{/each}
		</ul>
	</section>

	{#if hasTicketInfo}
		<section class={infoCardClass}>
			<h2 class={sectionHeadingClass}>
				<Ticket class="size-4" aria-hidden="true" />{t(locale, 'detail.ticket')}
			</h2>

			{#if event.ticket.types.length > 0}
				<h3 class="mb-1 text-xs text-zinc-500 dark:text-zinc-400">
					{t(locale, 'ticket.types')}
				</h3>
				<ul class="divide-y divide-zinc-900/[0.06] dark:divide-white/[0.06]">
					{#each event.ticket.types as ticketType (ticketType.id)}
						<li
							class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 py-2.5 text-sm"
						>
							<span class="min-w-0">
								<span class="block font-medium">{ticketType.name}</span>
								{#if ticketType.note}
									<span class="block text-xs text-zinc-500 dark:text-zinc-400"
										>{ticketType.note}</span
									>
								{/if}
							</span>
							<span class="font-medium tabular-nums">
								{formatPrices(locale, ticketType.prices) ?? t(locale, 'ticket.priceTbd')}
							</span>
						</li>
					{/each}
				</ul>
			{/if}

			{#each channelGroups as group (group.audience)}
				<h3 class="mt-4 mb-2 text-xs text-zinc-500 dark:text-zinc-400">
					{t(locale, 'ticket.channels')} · {audienceLabel(locale, group.audience)}
				</h3>
				<ul class="flex flex-wrap gap-x-3 gap-y-2">
					{#each group.channels as channel (channel.id)}
						<li class="text-sm">
							{#if channel.url}
								<a href={channel.url} target="_blank" rel="noreferrer" class={linkButtonClass}>
									{channel.name}
								</a>
							{:else}
								<span
									class="inline-flex h-9 items-center rounded-lg border border-dashed border-zinc-900/[0.12] px-3 text-sm text-zinc-600 dark:border-white/[0.12] dark:text-zinc-300"
								>
									{channel.name}
								</span>
							{/if}
							{#if channel.note}
								<span class="mt-0.5 block px-1 text-xs text-zinc-500 dark:text-zinc-400"
									>{channel.note}</span
								>
							{/if}
						</li>
					{/each}
				</ul>
			{/each}
		</section>
	{/if}

	{#if event.tags.length > 0}
		<section>
			<h2 class={sectionHeadingClass}>
				<Tag class="size-4" aria-hidden="true" />{t(locale, 'detail.tags')}
			</h2>
			<div class="flex flex-wrap gap-2">
				{#each event.tags as slug (slug)}
					<span
						class="rounded-md bg-zinc-100 px-2 py-1 text-xs text-zinc-700 dark:bg-white/[0.08] dark:text-zinc-200"
					>
						{data.tagNames.get(slug) ?? slug}
					</span>
				{/each}
			</div>
		</section>
	{/if}

	<section>
		<h2 class={sectionHeadingClass}>
			<Link class="size-4" aria-hidden="true" />{t(locale, 'detail.links')}
		</h2>
		<div class="flex flex-wrap gap-2">
			{#if event.urls.length > 0}
				{#each event.urls as link (link.url)}
					<a href={link.url} target="_blank" rel="noreferrer" class={linkButtonClass}>
						{link.label ?? urlTypeLabel(locale, link.type)}
					</a>
				{/each}
			{:else}
				<a href={event.officialUrl} target="_blank" rel="noreferrer" class={linkButtonClass}>
					{urlTypeLabel(locale, 'OFFICIAL_SITE')}
				</a>
			{/if}
		</div>
	</section>
</article>
