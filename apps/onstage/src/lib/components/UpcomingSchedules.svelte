<script lang="ts">
	// 메인 페이지 "티켓·신청 일정": 여러 행사의 티켓 오픈·추첨·신청 일정을 날짜순으로 한 목록에 모은다.
	// 행사 단위가 아니라 일정 단위로 보여주는 것이 SCLS의 차별점이라 메인에 따로 뺐다.
	import {
		formatShortDate,
		scheduleQualifier,
		scheduleStatusLabel,
		scheduleTypeLabel
	} from '$lib/format';
	import { localeHref, t, tv, type Locale } from '$lib/i18n';
	import { isPostponed, type ScheduleEntry } from '$lib/schedule';
	import { accentColor } from '$lib/theme';

	let { entries, locale }: { entries: ScheduleEntry[]; locale: Locale } = $props();

	function ddayLabel(days: number) {
		return days === 0 ? t(locale, 'card.today') : tv(locale, 'card.dday', { n: days });
	}
</script>

<!-- 넓은 화면에서는 메인 페이지 오른쪽 열에 놓이므로 한 줄에 다 넣지 않고 두 줄로 쌓는다
	(일정 종류·D-day / 행사 이름 / 구분·날짜). -->
<section
	class="overflow-hidden rounded-2xl border border-zinc-900/[0.08] bg-white dark:border-white/[0.08] dark:bg-zinc-900"
>
	<div class="px-5 pt-5 pb-3">
		<h2 class="font-display text-lg font-semibold text-zinc-900 dark:text-zinc-50">
			{t(locale, 'home.schedules')}
		</h2>
		<p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
			{t(locale, 'home.schedules.desc')}
		</p>
	</div>

	{#if entries.length === 0}
		<p class="px-5 pb-5 text-sm text-zinc-500 dark:text-zinc-400">
			{t(locale, 'home.schedules.empty')}
		</p>
	{:else}
		<ul class="divide-y divide-zinc-900/[0.06] pb-2 dark:divide-white/[0.06]">
			{#each entries as entry (`${entry.event.id}:${entry.schedule.type}:${entry.startsAt}:${entry.schedule.audience ?? ''}:${entry.schedule.title ?? ''}`)}
				{@const accent = accentColor(entry.event.eventSeries?.slug ?? entry.event.slug)}
				{@const qualifier = scheduleQualifier(locale, entry.schedule)}
				<li>
					<a
						href={localeHref(locale, `/events/${entry.event.slug}`)}
						style:--accent={accent}
						class="flex gap-3 px-5 py-3 transition-colors hover:bg-zinc-50 dark:hover:bg-white/[0.04]"
					>
						<span class="w-1 shrink-0 self-stretch rounded-full bg-[var(--accent)]"></span>
						<span class="min-w-0 flex-1 text-sm">
							<span class="flex items-start justify-between gap-3">
								<span class="font-medium text-zinc-900 dark:text-zinc-100">
									{scheduleTypeLabel(locale, entry.schedule.type)}
								</span>
								{#if isPostponed(entry.schedule)}
									<!-- 연기된 일정은 적힌 날짜가 더는 맞지 않아 D-day 대신 상태를 보여준다. -->
									<span
										class="shrink-0 rounded-md bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"
									>
										{scheduleStatusLabel(locale, entry.schedule.status)}
									</span>
								{:else}
									<span
										class="shrink-0 rounded-md px-1.5 py-0.5 text-xs font-medium tabular-nums {entry.days ===
										0
											? 'bg-violet-600 text-white dark:bg-violet-500'
											: 'bg-zinc-100 text-zinc-700 dark:bg-white/[0.08] dark:text-zinc-200'}"
									>
										{ddayLabel(entry.days)}
									</span>
								{/if}
							</span>
							<span class="block truncate text-zinc-600 dark:text-zinc-400">
								{entry.event.title ?? entry.event.slug}
							</span>
							<span class="mt-0.5 block text-xs text-zinc-500 tabular-nums dark:text-zinc-400">
								{formatShortDate(
									locale,
									entry.startsAt,
									entry.schedule.timezone,
									!entry.schedule.isAllDay
								)}{#if qualifier}<span class="text-zinc-400 dark:text-zinc-500">
										·
									</span>{qualifier}{/if}
							</span>
						</span>
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</section>
