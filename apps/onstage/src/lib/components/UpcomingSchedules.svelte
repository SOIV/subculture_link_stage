<script lang="ts">
	// 메인 페이지 "티켓·신청 일정": 여러 행사의 티켓 오픈·추첨·신청 일정을 날짜순으로 한 목록에 모은다.
	// 행사 단위가 아니라 일정 단위로 보여주는 것이 SCLS의 차별점이라 메인에 따로 뺐다.
	import { formatShortDate, scheduleQualifier, scheduleTypeLabel } from '$lib/format';
	import { localeHref, t, tv, type Locale } from '$lib/i18n';
	import type { ScheduleEntry } from '$lib/schedule';
	import { accentColor } from '$lib/theme';

	let { entries, locale }: { entries: ScheduleEntry[]; locale: Locale } = $props();

	function ddayLabel(days: number) {
		return days === 0 ? t(locale, 'card.today') : tv(locale, 'card.dday', { n: days });
	}
</script>

<section class="space-y-4">
	<div>
		<h2 class="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
			{t(locale, 'home.schedules')}
		</h2>
		<p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
			{t(locale, 'home.schedules.desc')}
		</p>
	</div>

	{#if entries.length === 0}
		<p
			class="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700"
		>
			{t(locale, 'home.schedules.empty')}
		</p>
	{:else}
		<ul
			class="divide-y divide-slate-200/70 overflow-hidden rounded-2xl border border-slate-200 bg-white/90 shadow-sm backdrop-blur-sm dark:divide-white/10 dark:border-white/10 dark:bg-white/[0.03] dark:shadow-none"
		>
			{#each entries as entry (`${entry.event.id}:${entry.schedule.type}:${entry.startsAt}:${entry.schedule.audience ?? ''}:${entry.schedule.title ?? ''}`)}
				{@const accent = accentColor(entry.event.eventSeries?.slug ?? entry.event.slug)}
				<li>
					<a
						href={localeHref(locale, `/events/${entry.event.slug}`)}
						style:--accent={accent}
						class="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-slate-50 dark:hover:bg-white/5"
					>
						<span class="w-1 shrink-0 self-stretch rounded-full bg-[var(--accent)]"></span>
						<span class="min-w-0 flex-1">
							<span class="block text-sm font-bold text-slate-900 dark:text-white">
								{scheduleTypeLabel(locale, entry.schedule.type)}
							</span>
							<span class="block truncate text-sm text-slate-600 dark:text-slate-400">
								{entry.event.title ?? entry.event.slug}
							</span>
							{#if scheduleQualifier(locale, entry.schedule)}
								<span
									class="block truncate text-xs font-semibold text-violet-600 dark:text-violet-300"
								>
									{scheduleQualifier(locale, entry.schedule)}
								</span>
							{/if}
						</span>
						<span class="shrink-0 text-right text-sm">
							<span class="block font-semibold text-slate-700 dark:text-slate-200">
								{formatShortDate(
									locale,
									entry.startsAt,
									entry.schedule.timezone,
									!entry.schedule.isAllDay
								)}
							</span>
							<span
								class="mt-0.5 inline-block rounded-full px-2 py-0.5 text-xs font-extrabold text-[var(--accent)]"
								style:background-color="color-mix(in oklch, var(--accent) 14%, transparent)"
							>
								{ddayLabel(entry.days)}
							</span>
						</span>
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</section>
