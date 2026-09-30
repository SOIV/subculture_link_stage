<script lang="ts">
	import { goto } from '$app/navigation';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import CalendarPlus from '@lucide/svelte/icons/calendar-plus';
	import Search from '@lucide/svelte/icons/search';
	import { icsUrl } from '$lib/api';
	import CountryBadge from '$lib/components/CountryBadge.svelte';
	import EventCard from '$lib/components/EventCard.svelte';
	import PromotedEvents from '$lib/components/PromotedEvents.svelte';
	import UpcomingSchedules from '$lib/components/UpcomingSchedules.svelte';
	import { localeHref, t } from '$lib/i18n';
	import { isUpcomingOrOngoing, upcomingActionSchedules } from '$lib/schedule';
	import { buildTagIndex, topTagsWithEvents } from '$lib/tags';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let locale = $derived(data.locale);
	let tagIndex = $derived(buildTagIndex(data.tagGroups.items));

	const UPCOMING_LIMIT = 6;
	const SCHEDULE_LIMIT = 6;

	// 아직 끝나지 않은(진행 중 포함) 행사. API가 시작일 순으로 주므로 그대로 앞에서 자른다.
	let upcoming = $derived(
		data.events.items
			.filter((event) => isUpcomingOrOngoing(event, new Date()))
			.slice(0, UPCOMING_LIMIT)
	);
	let actionSchedules = $derived(
		upcomingActionSchedules(data.events.items, new Date(), SCHEDULE_LIMIT)
	);

	// 바로가기·구독 버튼은 행사 데이터에서 만든다(하드코딩 없음) — 국가는 등록된 행사가 있는 국가만,
	// 분류는 첫 태그 그룹(행사 형식)의 최상위 태그 중 행사가 있는 것만 보여줘서 빈 결과로 이어지지 않게 한다.
	let countries = $derived([
		...new Set(
			data.events.items
				.map((event) => event.countryCode)
				.filter((code): code is string => Boolean(code))
		)
	]);
	let hasOnline = $derived(data.events.items.some((event) => event.isOnline));
	let categoryGroup = $derived(data.tagGroups.items[0]);
	let categoryTags = $derived(
		categoryGroup ? topTagsWithEvents(categoryGroup, tagIndex, data.events.items) : []
	);

	// 이 검색창은 행사 목록의 필터와 완전히 분리되어 있다. 검색어(q)만 넘기므로 필터를 하나도 고르지
	// 않아도 전체 행사에서 찾고, 목록 화면에 남아 있던 필터 조건은 따라가지 않는다.
	function onSearch(event: SubmitEvent) {
		event.preventDefault();
		const q = new FormData(event.currentTarget as HTMLFormElement).get('q');
		const query = typeof q === 'string' ? q.trim() : '';
		void goto(
			localeHref(locale, '/events') + (query ? `?${new URLSearchParams({ q: query })}` : '')
		);
	}

	const chipClass =
		'inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/80 px-3.5 py-1.5 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur-sm transition-colors hover:border-violet-300 hover:text-violet-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:shadow-none dark:hover:border-violet-500/50 dark:hover:text-violet-300';
	const subscribeButtonClass =
		'inline-flex items-center gap-1.5 rounded-full border border-violet-300 bg-white/80 px-4 py-2 text-sm font-bold text-violet-700 hover:bg-white dark:border-violet-500/40 dark:bg-white/5 dark:text-violet-200 dark:hover:bg-white/10';
	const sectionTitleClass = 'font-display text-2xl font-extrabold tracking-tight sm:text-3xl';
</script>

<div class="space-y-14">
	<section class="pt-6 sm:pt-12">
		<p class="text-xs font-bold tracking-[0.25em] text-violet-600 uppercase dark:text-violet-400">
			{t(locale, 'site.tagline')}
		</p>
		<h1
			class="mt-3 max-w-3xl font-display text-4xl leading-[1.1] font-extrabold tracking-tight sm:text-6xl"
		>
			{t(locale, 'home.hero.title')}
		</h1>
		<p class="mt-4 max-w-2xl text-base text-slate-600 sm:text-lg dark:text-slate-300">
			{t(locale, 'home.hero.desc')}
		</p>

		<form
			method="GET"
			action={localeHref(locale, '/events')}
			role="search"
			onsubmit={onSearch}
			class="mt-8 flex max-w-2xl gap-2"
		>
			<label class="relative flex-1">
				<span class="sr-only">{t(locale, 'search.placeholder')}</span>
				<Search
					class="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-slate-400"
					aria-hidden="true"
				/>
				<input
					type="search"
					name="q"
					placeholder={t(locale, 'search.placeholder')}
					autocomplete="off"
					enterkeyhint="search"
					class="w-full rounded-full border border-slate-300 bg-white py-3.5 pr-5 pl-12 text-base shadow-sm focus:border-violet-400 focus:outline-none dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none"
				/>
			</label>
			<button
				type="submit"
				class="rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-7 py-3.5 text-base font-bold text-white shadow-md shadow-violet-600/20 transition-transform hover:scale-[1.03] hover:shadow-lg hover:shadow-violet-600/30"
			>
				{t(locale, 'search.button')}
			</button>
		</form>

		{#if countries.length > 0 || categoryTags.length > 0}
			<div class="mt-4 flex flex-wrap gap-2">
				{#each countries as code (code)}
					<a
						href={localeHref(locale, `/events?country=${encodeURIComponent(code)}`)}
						class={chipClass}
					>
						<CountryBadge {locale} countryCode={code} />
					</a>
				{/each}
				{#each categoryTags as tag (tag.id)}
					<a
						href={localeHref(
							locale,
							`/events?${encodeURIComponent(categoryGroup.slug)}=${encodeURIComponent(tag.slug)}`
						)}
						class={chipClass}
					>
						{tag.name}
					</a>
				{/each}
			</div>
		{/if}
	</section>

	<section class="space-y-4">
		<div class="flex items-end justify-between gap-3">
			<h2 class={sectionTitleClass}>{t(locale, 'home.upcoming')}</h2>
			<a
				href={localeHref(locale, '/events')}
				class="inline-flex items-center gap-1 text-sm font-bold text-violet-600 hover:underline dark:text-violet-400"
			>
				{t(locale, 'home.viewAll')}
				<ArrowRight class="size-4" aria-hidden="true" />
			</a>
		</div>
		{#if upcoming.length === 0}
			<p
				class="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500 dark:border-slate-700"
			>
				{t(locale, 'home.upcoming.empty')}
			</p>
		{:else}
			<div class="grid gap-4 sm:grid-cols-2">
				{#each upcoming as event (event.id)}
					<EventCard {event} {locale} {tagIndex} />
				{/each}
			</div>
		{/if}
	</section>

	<PromotedEvents events={data.promoted} {locale} {tagIndex} />

	<UpcomingSchedules entries={actionSchedules} {locale} />

	<section
		class="rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-100 via-fuchsia-50 to-pink-100 p-6 sm:p-8 dark:border-violet-500/20 dark:from-violet-500/15 dark:via-fuchsia-500/10 dark:to-pink-500/10"
	>
		<h2 class="{sectionTitleClass} flex items-center gap-2">
			<CalendarPlus class="size-7 text-violet-600 dark:text-violet-300" aria-hidden="true" />
			{t(locale, 'home.subscribe.title')}
		</h2>
		<p class="mt-2 max-w-2xl text-slate-600 dark:text-slate-300">
			{t(locale, 'home.subscribe.desc')}
		</p>
		<div class="mt-5 flex flex-wrap gap-2">
			<a href={icsUrl('all', { locale }).toString()} class={subscribeButtonClass}>
				<CalendarPlus class="size-4" aria-hidden="true" />
				{t(locale, 'filter.all')}
			</a>
			{#each countries as code (code)}
				<a href={icsUrl(code, { locale }).toString()} class={subscribeButtonClass}>
					<CalendarPlus class="size-4" aria-hidden="true" />
					<CountryBadge {locale} countryCode={code} />
				</a>
			{/each}
			{#if hasOnline}
				<a href={icsUrl('online', { locale }).toString()} class={subscribeButtonClass}>
					<CalendarPlus class="size-4" aria-hidden="true" />
					{t(locale, 'card.online')}
				</a>
			{/if}
		</div>
	</section>
</div>
