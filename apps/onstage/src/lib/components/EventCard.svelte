<script lang="ts">
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import type { EventSummary } from '$lib/api';
	import {
		eventPeriod,
		formatCardPeriod,
		formatShortDate,
		scheduleTypeLabel,
		statusLabel
	} from '$lib/format';
	import { localeHref, t, tv, type Locale } from '$lib/i18n';
	import { nextSchedule } from '$lib/schedule';
	import { pickCardTags, type TagIndex } from '$lib/tags';
	import { accentColor } from '$lib/theme';
	import CountryBadge from './CountryBadge.svelte';

	let {
		event,
		locale,
		tagIndex,
		promoted = false
	}: { event: EventSummary; locale: Locale; tagIndex: TagIndex; promoted?: boolean } = $props();

	// 행사마다 일정 종류·태그 수가 달라 내용 양이 들쭉날쭉하다. 카드에는 핵심(기간·제목·장소·분류 칩)과
	// "지금 시점 기준 다음 일정 1개"만 싣고, 나머지 일정은 개수만 알려준 뒤 상세 페이지로 넘긴다.
	const MAX_TAG_CHIPS = 4;

	let period = $derived(eventPeriod(event));
	// 공식 표기가 없는 언어라 이 화면이 직접 옮긴 제목 — 번역 검수 전이라는 표시.
	let needsReview = $derived(event.translation?.status === 'REVIEW_REQUIRED');
	// 시리즈 단위로 같은 색이 나오게 한다 — 단독 행사는 자기 slug로 대신한다.
	let accent = $derived(accentColor(event.eventSeries?.slug ?? event.slug));
	let chips = $derived(pickCardTags(event.tags, tagIndex, MAX_TAG_CHIPS));
	let next = $derived(nextSchedule(event, new Date()));
	let moreSchedules = $derived(Math.max(0, event.schedules.length - 1));
	// 확정이 아닌 예외 상태(연기 등)만 표시한다 — 공개 행사는 대부분 확정이라 "확정" 표시는 잡음이다.
	let showStatus = $derived(event.status !== 'CONFIRMED');

	function ddayLabel(days: number) {
		return days === 0 ? t(locale, 'card.today') : tv(locale, 'card.dday', { n: days });
	}

	const badgeClass = 'rounded-md px-1.5 py-0.5 text-[10px] font-bold';
</script>

<a
	href={localeHref(locale, `/events/${event.slug}`)}
	style:--accent={accent}
	class="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white/90 shadow-sm backdrop-blur-sm transition-all duration-200 hover:-translate-y-1 hover:border-[var(--accent)]/40 hover:shadow-[var(--accent)]/15 hover:shadow-xl dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none"
>
	<div class="h-1.5 w-full shrink-0 bg-[var(--accent)]"></div>
	<div class="flex flex-1 flex-col p-4">
		<div
			class="flex items-center justify-between gap-2 text-xs font-medium text-slate-500 dark:text-slate-400"
		>
			<span class="flex min-w-0 items-center gap-2">
				<span class="shrink-0 whitespace-nowrap">
					<CountryBadge {locale} countryCode={event.countryCode} isOnline={event.isOnline} />
				</span>
				{#if promoted}
					<span
						class="{badgeClass} bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300"
					>
						{t(locale, 'ad.label')}
					</span>
				{/if}
				{#if showStatus}
					<span
						class="{badgeClass} bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
					>
						{statusLabel(locale, event.status)}
					</span>
				{/if}
			</span>
			<span
				class="rounded-full px-2 py-0.5 text-right font-semibold text-[var(--accent)]"
				style:background-color="color-mix(in oklch, var(--accent) 14%, transparent)"
			>
				{formatCardPeriod(locale, period, new Date())}
			</span>
		</div>

		<h3 class="mt-2 font-display text-lg leading-snug font-bold text-slate-900 dark:text-white">
			{event.title ?? event.slug}
			{#if needsReview}
				<span
					class="{badgeClass} ml-1 inline-block bg-amber-100 align-middle text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
					title={t(locale, 'detail.translationNotice')}
				>
					{t(locale, 'card.autoTranslated')}
				</span>
			{/if}
		</h3>

		{#if event.summary}
			<p class="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">{event.summary}</p>
		{/if}

		<p class="mt-2 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
			<MapPin class="size-4 shrink-0" aria-hidden="true" />
			<span class="min-w-0">{event.venue?.name ?? t(locale, 'card.venueUnknown')}</span>
		</p>

		{#if chips.shown.length > 0}
			<ul class="mt-3 flex flex-wrap gap-1.5">
				{#each chips.shown as chip (chip.slug)}
					<li
						class="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
					>
						{chip.name}
					</li>
				{/each}
				{#if chips.hidden > 0}
					<li
						class="rounded-full px-1.5 py-0.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500"
					>
						+{chips.hidden}
					</li>
				{/if}
			</ul>
		{/if}

		{#if next}
			<!-- 카드 높이가 달라도 이 영역은 항상 맨 아래에 붙는다(mt-auto). -->
			<div class="mt-auto pt-3">
				<div class="border-t border-slate-200/70 pt-3 dark:border-white/10">
					{#if next.kind === 'ongoing'}
						<p
							class="flex items-center gap-2 text-sm font-bold text-emerald-600 dark:text-emerald-400"
						>
							<span class="relative flex size-2" aria-hidden="true">
								<span
									class="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60"
								></span>
								<span class="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
							</span>
							{t(locale, 'card.inProgress')}
						</p>
					{:else}
						<div class="flex items-start justify-between gap-3">
							<div class="min-w-0 text-sm">
								<p
									class="text-[11px] font-bold tracking-wide text-slate-400 uppercase dark:text-slate-500"
								>
									{t(locale, 'card.next')}
								</p>
								<p class="mt-0.5 font-semibold text-slate-800 dark:text-slate-100">
									{scheduleTypeLabel(locale, next.schedule.type)}
								</p>
								<p class="text-slate-500 dark:text-slate-400">
									{formatShortDate(
										locale,
										next.startsAt,
										next.schedule.timezone,
										!next.schedule.isAllDay
									)}
								</p>
							</div>
							<span
								class="shrink-0 rounded-full px-2.5 py-1 text-xs font-extrabold whitespace-nowrap text-[var(--accent)]"
								style:background-color="color-mix(in oklch, var(--accent) 14%, transparent)"
							>
								{ddayLabel(next.days)}
							</span>
						</div>
					{/if}
					{#if moreSchedules > 0}
						<p
							class="mt-2 flex items-center gap-0.5 text-xs font-semibold text-slate-500 dark:text-slate-400"
						>
							{tv(locale, 'card.moreSchedules', { n: moreSchedules })}
							<ChevronRight class="size-3.5 text-[var(--accent)]" aria-hidden="true" />
						</p>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</a>
