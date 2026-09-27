<script lang="ts">
	import type { EventSummary } from '$lib/api';
	import { eventPeriod, formatRange } from '$lib/format';
	import { localeHref, t, type Locale } from '$lib/i18n';
	import { accentColor } from '$lib/theme';
	import CountryBadge from './CountryBadge.svelte';

	let { event, locale }: { event: EventSummary; locale: Locale } = $props();

	let period = $derived(eventPeriod(event));
	// 공식 표기가 없는 언어라 이 화면이 직접 옮긴 제목 — 번역 검수 전이라는 표시.
	let needsReview = $derived(event.translation?.status === 'REVIEW_REQUIRED');
	// 시리즈 단위로 같은 색이 나오게 한다 — 단독 행사는 자기 slug로 대신한다.
	let accent = $derived(accentColor(event.eventSeries?.slug ?? event.slug));
</script>

<a
	href={localeHref(locale, `/events/${event.slug}`)}
	style:--accent={accent}
	class="group block overflow-hidden rounded-2xl border border-slate-200/70 bg-white/70 backdrop-blur-sm transition-all duration-200 hover:-translate-y-1 hover:border-[var(--accent)]/40 hover:shadow-[var(--accent)]/15 hover:shadow-xl dark:border-white/10 dark:bg-white/[0.04]"
>
	<div class="h-1.5 w-full bg-[var(--accent)]"></div>
	<div class="p-4">
		<div
			class="flex items-center justify-between gap-2 text-xs font-medium text-slate-500 dark:text-slate-400"
		>
			<span class="shrink-0 whitespace-nowrap">
				<CountryBadge {locale} countryCode={event.countryCode} isOnline={event.isOnline} />
			</span>
			<span
				class="rounded-full px-2 py-0.5 text-right font-semibold text-[var(--accent)]"
				style:background-color="color-mix(in oklch, var(--accent) 14%, transparent)"
			>
				{formatRange(locale, period)}
			</span>
		</div>
		<h3 class="mt-2 font-display text-lg leading-snug font-bold text-slate-900 dark:text-white">
			{event.title ?? event.slug}
			{#if needsReview}
				<span class="ml-1 align-middle text-[10px] font-bold text-amber-600 dark:text-amber-400"
					>MT</span
				>
			{/if}
		</h3>
		{#if event.summary}
			<p class="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">{event.summary}</p>
		{/if}
		<p class="mt-2 flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
			<span aria-hidden="true">📍</span>
			{event.venue?.name ?? t(locale, 'card.venueUnknown')}
		</p>
	</div>
</a>
