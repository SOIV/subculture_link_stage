<script lang="ts">
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import type { EventSummary } from '$lib/api';
	import {
		eventPeriod,
		formatCardPeriod,
		formatShortDate,
		scheduleQualifier,
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

	const badgeClass = 'rounded px-1.5 py-0.5 text-[11px] leading-4 font-medium';
</script>

<!-- 시리즈 색은 맨 위 얇은 띠 하나에만 쓴다(일정 목록의 왼쪽 띠와 같은 색). 나머지는 무채색이다. -->
<a
	href={localeHref(locale, `/events/${event.slug}`)}
	style:--accent={accent}
	class="group flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-900/[0.08] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-[border-color,box-shadow] duration-150 hover:border-zinc-900/[0.16] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] dark:border-white/[0.08] dark:bg-zinc-900 dark:shadow-none dark:hover:border-white/[0.16]"
>
	<div class="h-1 w-full shrink-0 bg-[var(--accent)]"></div>
	<div class="flex flex-1 flex-col p-5">
		<div class="flex items-center justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-400">
			<span class="flex min-w-0 items-center gap-2">
				<span class="shrink-0 whitespace-nowrap">
					<CountryBadge {locale} countryCode={event.countryCode} isOnline={event.isOnline} />
				</span>
				{#if promoted}
					<span class="{badgeClass} bg-zinc-100 text-zinc-500 dark:bg-white/10 dark:text-zinc-300">
						{t(locale, 'ad.label')}
					</span>
				{/if}
			</span>
			<span class="text-right tabular-nums">
				{formatCardPeriod(locale, period, new Date())}
			</span>
		</div>

		<h3
			class="mt-3 font-display text-lg leading-snug font-semibold text-zinc-900 dark:text-zinc-50"
		>
			{event.title ?? event.slug}
			<!-- 행사 상태(종료·연기 등)와 자동 번역 표시는 제목 바로 뒤에 나란히 둔다. 종료는 경고가 아니라 무채색이다. -->
			{#if showStatus}
				<span
					class="{badgeClass} ml-1 inline-block align-middle {event.status === 'ENDED'
						? 'bg-zinc-100 text-zinc-600 dark:bg-white/10 dark:text-zinc-300'
						: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300'}"
				>
					{statusLabel(locale, event.status)}
				</span>
			{/if}
			{#if needsReview}
				<span
					class="{badgeClass} ml-1 inline-block bg-amber-100 align-middle text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"
					title={t(locale, 'detail.translationNotice')}
				>
					{t(locale, 'card.autoTranslated')}
				</span>
			{/if}
		</h3>

		{#if event.summary}
			<p class="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">{event.summary}</p>
		{/if}

		<p class="mt-2 flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
			<MapPin class="size-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
			<span class="min-w-0">{event.venue?.name ?? t(locale, 'card.venueUnknown')}</span>
		</p>

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
					<li class="px-1 py-0.5 text-xs text-zinc-400 dark:text-zinc-500">
						+{chips.hidden}
					</li>
				{/if}
			</ul>
		{/if}

		{#if next}
			<!-- 다음 일정은 위 내용에 바로 이어 붙인다(상단 기준) — "일정 더 보기" 줄이 없는 카드도
			     구분선 위치가 같은 줄의 다른 카드와 맞는다. 남는 높이는 아래 "더 보기" 줄 위로 간다. -->
			<div class="pt-4">
				<div class="border-t border-zinc-900/[0.06] pt-4 dark:border-white/[0.06]">
					{#if next.kind === 'ongoing'}
						<p
							class="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400"
						>
							<span class="size-2 rounded-full bg-emerald-500" aria-hidden="true"></span>
							{t(locale, 'card.inProgress')}
						</p>
					{:else}
						<div class="flex items-start justify-between gap-3">
							<div class="min-w-0 text-sm">
								<p class="text-xs text-zinc-500 dark:text-zinc-400">
									{t(locale, 'card.next')}
								</p>
								<p class="mt-1 font-medium text-zinc-900 dark:text-zinc-100">
									{scheduleTypeLabel(locale, next.schedule.type)}
								</p>
								{#if scheduleQualifier(locale, next.schedule)}
									<p class="text-xs text-zinc-500 dark:text-zinc-400">
										{scheduleQualifier(locale, next.schedule)}
									</p>
								{/if}
								<p class="mt-0.5 text-zinc-600 tabular-nums dark:text-zinc-400">
									{formatShortDate(
										locale,
										next.startsAt,
										next.schedule.timezone,
										!next.schedule.isAllDay
									)}
								</p>
							</div>
							<span
								class="shrink-0 rounded-md px-2 py-1 text-xs font-medium whitespace-nowrap tabular-nums {next.days ===
								0
									? 'bg-violet-600 text-white dark:bg-violet-500'
									: 'bg-zinc-100 text-zinc-700 dark:bg-white/[0.08] dark:text-zinc-200'}"
							>
								{ddayLabel(next.days)}
							</span>
						</div>
					{/if}
				</div>
			</div>
			{#if moreSchedules > 0}
				<!-- "더 보기" 줄은 카드 맨 아래에 붙는다(mt-auto) — 같은 줄 카드끼리 이 줄 위치도 맞는다. -->
				<p
					class="mt-auto flex items-center gap-1 pt-3 text-xs text-zinc-500 transition-colors group-hover:text-zinc-900 dark:text-zinc-400 dark:group-hover:text-zinc-100"
				>
					{tv(locale, 'card.moreSchedules', { n: moreSchedules })}
					<ChevronRight class="size-3.5" aria-hidden="true" />
				</p>
			{/if}
		{/if}
	</div>
</a>
