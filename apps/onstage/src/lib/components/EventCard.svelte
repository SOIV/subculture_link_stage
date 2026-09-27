<script lang="ts">
	import type { EventSummary } from '$lib/api';
	import { countryLabel, eventPeriod, formatRange } from '$lib/format';
	import { localeHref, t, type Locale } from '$lib/i18n';

	let { event, locale }: { event: EventSummary; locale: Locale } = $props();

	let period = $derived(eventPeriod(event));
	// 공식 표기가 없는 언어라 이 화면이 직접 옮긴 제목 — 번역 검수 전이라는 표시.
	let needsReview = $derived(event.translation?.status === 'REVIEW_REQUIRED');
</script>

<a
	href={localeHref(locale, `/events/${event.slug}`)}
	class="block rounded-xl border border-slate-200 p-4 transition-shadow hover:shadow-md dark:border-slate-800"
>
	<div
		class="flex items-center justify-between gap-2 text-xs font-medium text-slate-500 dark:text-slate-400"
	>
		<span class="shrink-0 whitespace-nowrap"
			>{event.isOnline ? t(locale, 'card.online') : countryLabel(locale, event.countryCode)}</span
		>
		<span class="rounded-full bg-slate-100 px-2 py-0.5 text-right dark:bg-slate-800"
			>{formatRange(locale, period)}</span
		>
	</div>
	<h3 class="mt-2 text-base font-semibold text-slate-900 dark:text-slate-100">
		{event.title ?? event.slug}
		{#if needsReview}
			<span class="ml-1 align-middle text-[10px] font-normal text-amber-600 dark:text-amber-400"
				>MT</span
			>
		{/if}
	</h3>
	{#if event.summary}
		<p class="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">{event.summary}</p>
	{/if}
	<p class="mt-2 text-sm text-slate-500 dark:text-slate-400">
		{event.venue?.name ?? t(locale, 'card.venueUnknown')}
	</p>
</a>
