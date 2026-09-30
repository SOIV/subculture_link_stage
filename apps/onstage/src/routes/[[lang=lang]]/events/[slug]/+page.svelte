<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import CalendarDays from '@lucide/svelte/icons/calendar-days';
	import Link from '@lucide/svelte/icons/link';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import Mic from '@lucide/svelte/icons/mic';
	import Tag from '@lucide/svelte/icons/tag';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import { formatSchedule, scheduleTypeLabel, statusLabel, urlTypeLabel } from '$lib/format';
	import { localeHref, t } from '$lib/i18n';
	import { accentColor } from '$lib/theme';
	import CountryBadge from '$lib/components/CountryBadge.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let locale = $derived(data.locale);
	let event = $derived(data.event);
	// 공식 표기가 없는 언어라 이 화면이 직접 옮긴 제목/설명 — 번역 검수 전이라는 표시.
	let needsReview = $derived(event.translation?.status === 'REVIEW_REQUIRED');
	// 시리즈 단위로 같은 색이 나오게 한다(목록 카드와 동일한 기준) — 단독 행사는 자기 slug로 대신한다.
	let accent = $derived(accentColor(event.eventSeries?.slug ?? event.slug));
	// API가 정렬을 보장하지 않으므로(§public-events.ts) 화면에서 시간순으로 정렬한다.
	let sortedSchedules = $derived(
		[...event.schedules].sort((a, b) => (a.startsAt ?? '').localeCompare(b.startsAt ?? ''))
	);
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
		'rounded-full border border-violet-300 px-4 py-2 text-sm font-bold text-violet-700 hover:bg-violet-50 dark:border-violet-700 dark:text-violet-300 dark:hover:bg-violet-950';
	const infoCardClass =
		'rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.03] dark:shadow-none';
	const sectionHeadingClass =
		'mb-3 flex items-center gap-1.5 text-sm font-bold tracking-wide text-slate-500 uppercase dark:text-slate-400';
</script>

<svelte:head>
	<title>{event.title ?? event.slug} · {t(locale, 'site.name')}</title>
	{#if event.summary}<meta name="description" content={event.summary} />{/if}
</svelte:head>

<article class="space-y-8">
	<a
		href={localeHref(locale, '/events')}
		class="inline-flex items-center gap-1 text-sm font-bold text-violet-600 hover:underline dark:text-violet-400"
	>
		<ArrowLeft class="size-4" aria-hidden="true" />
		{t(locale, 'detail.backToList')}
	</a>

	<!-- 시리즈 포인트 색을 배경 그라디언트 띠로 깔아 행사마다 다른 정체성을 준다(목록 카드의
		상단 컬러바와 같은 색). -->
	<header
		style:--accent={accent}
		class="-mx-4 -mt-2 space-y-3 rounded-b-3xl bg-gradient-to-br from-[var(--accent)]/20 via-[var(--accent)]/5 to-transparent px-4 pt-6 pb-8 sm:-mx-6 sm:rounded-3xl sm:px-8"
	>
		<div
			class="flex flex-wrap items-center gap-2 text-xs font-bold tracking-wide text-slate-600 uppercase dark:text-slate-300"
		>
			<span class="rounded-full bg-white/70 px-2.5 py-1 dark:bg-white/10"
				>{statusLabel(locale, event.status)}</span
			>
			<span class="rounded-full bg-white/70 px-2.5 py-1 dark:bg-white/10">
				<CountryBadge {locale} countryCode={event.countryCode} isOnline={event.isOnline} />
			</span>
			{#if event.eventSeries}
				<span class="rounded-full bg-white/70 px-2.5 py-1 dark:bg-white/10">
					{t(locale, 'detail.series')} · {data.seriesTitles.get(event.eventSeries.slug) ??
						event.eventSeries.slug}
				</span>
			{/if}
		</div>
		<h1 class="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
			{event.title ?? event.slug}
		</h1>
		{#if event.summary}
			<p class="text-lg text-slate-700 dark:text-slate-200">{event.summary}</p>
		{/if}
		{#if needsReview}
			<p class="flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400">
				<TriangleAlert class="size-3.5 shrink-0" aria-hidden="true" />
				{t(locale, 'detail.translationNotice')}
			</p>
		{/if}
	</header>

	<p class="leading-relaxed whitespace-pre-line text-slate-700 dark:text-slate-300">
		{event.description ?? t(locale, 'detail.noDescription')}
	</p>

	<div class="grid gap-4 sm:grid-cols-2">
		<section class={infoCardClass}>
			<h2 class={sectionHeadingClass}>
				<MapPin class="size-4" aria-hidden="true" />{t(locale, 'detail.venue')}
			</h2>
			{#if event.venue}
				<p class="font-semibold">{event.venue.name}</p>
				{#if event.venue.address}
					<p class="mt-0.5 text-sm text-slate-600 dark:text-slate-400">{event.venue.address}</p>
				{/if}
				{#if mapHref}
					<a
						href={mapHref}
						target="_blank"
						rel="noreferrer"
						class="mt-1 inline-block text-sm font-semibold text-violet-600 hover:underline dark:text-violet-400"
					>
						{t(locale, 'detail.map')}
					</a>
				{/if}
			{:else}
				<p class="text-sm text-slate-500 dark:text-slate-400">{t(locale, 'card.venueUnknown')}</p>
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
							<span class="font-semibold">{organizer.name}</span>
							<span class="text-slate-400">· {t(locale, `role.${organizer.role}`)}</span>
						</li>
					{/each}
				</ul>
			{:else}
				<p class="text-sm text-slate-500 dark:text-slate-400">—</p>
			{/if}
		</section>
	</div>

	<section class={infoCardClass}>
		<h2 class={sectionHeadingClass}>
			<CalendarDays class="size-4" aria-hidden="true" />{t(locale, 'detail.schedule')}
		</h2>
		<ul class="-mx-4 divide-y divide-slate-200/70 sm:-mx-0 dark:divide-white/10">
			{#each sortedSchedules as schedule, index (index)}
				<li class="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm sm:px-0">
					<span class="font-semibold">{scheduleTypeLabel(locale, schedule.type)}</span>
					<span class="text-slate-500 dark:text-slate-400">{formatSchedule(locale, schedule)}</span>
				</li>
			{/each}
		</ul>
	</section>

	{#if event.tags.length > 0}
		<section>
			<h2 class={sectionHeadingClass}>
				<Tag class="size-4" aria-hidden="true" />{t(locale, 'detail.tags')}
			</h2>
			<div class="flex flex-wrap gap-2">
				{#each event.tags as slug (slug)}
					<span
						class="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-300"
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
