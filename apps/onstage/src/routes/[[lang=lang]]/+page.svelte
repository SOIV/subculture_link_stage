<script lang="ts">
	import { goto } from '$app/navigation';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import CalendarPlus from '@lucide/svelte/icons/calendar-plus';
	import Search from '@lucide/svelte/icons/search';
	import { icsUrl } from '$lib/api';
	import CountryBadge from '$lib/components/CountryBadge.svelte';
	import EventCard from '$lib/components/EventCard.svelte';
	import PromotedEvents from '$lib/components/PromotedEvents.svelte';
	import SubscribeMenu from '$lib/components/SubscribeMenu.svelte';
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
		'inline-flex h-10 items-center gap-2 rounded-full border border-zinc-900/[0.08] bg-white px-3.5 text-sm text-zinc-700 transition-colors hover:border-zinc-900/[0.16] hover:text-zinc-900 sm:h-8 sm:px-3 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-zinc-200 dark:hover:border-white/[0.16] dark:hover:text-zinc-50';
	const subscribeButtonClass =
		'inline-flex h-11 items-center gap-2 rounded-lg border border-zinc-900/[0.08] bg-white px-3 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-50 sm:h-9 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-zinc-100 dark:hover:bg-white/[0.08]';
	const sectionTitleClass = 'font-display text-xl font-semibold tracking-tight sm:text-2xl';
</script>

<!-- 넓은 화면에서는 두 열이다: 왼쪽(소개·검색, 곧 열리는 행사, 추천 행사)과 오른쪽(티켓·신청 일정,
	캘린더 구독). 좁은 화면에서는 같은 순서 그대로 한 줄로 쌓인다. -->
<div
	class="grid gap-x-10 gap-y-12 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_24rem]"
>
	<div class="min-w-0 space-y-14">
		<section>
			<p class="text-sm font-medium text-violet-700 dark:text-violet-400">
				{t(locale, 'site.tagline')}
			</p>
			<h1
				class="mt-3 max-w-3xl font-display text-4xl leading-[1.1] font-semibold tracking-tight text-zinc-900 sm:text-5xl dark:text-zinc-50"
			>
				{t(locale, 'home.hero.title')}
			</h1>
			<p class="mt-4 max-w-2xl text-base text-zinc-600 sm:text-lg dark:text-zinc-300">
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
						class="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-zinc-400"
						aria-hidden="true"
					/>
					<input
						type="search"
						name="q"
						placeholder={t(locale, 'search.placeholder')}
						autocomplete="off"
						enterkeyhint="search"
						class="h-12 w-full rounded-xl border border-zinc-900/[0.12] bg-white pr-4 pl-11 text-base shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors placeholder:text-zinc-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none dark:border-white/[0.12] dark:bg-zinc-900 dark:shadow-none"
					/>
				</label>
				<button
					type="submit"
					class="h-12 rounded-xl bg-violet-600 px-6 text-base font-medium text-white transition-colors hover:bg-violet-700 active:scale-[0.98] dark:bg-violet-500 dark:hover:bg-violet-400 dark:hover:text-zinc-950"
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
					class="-my-3 inline-flex shrink-0 items-center gap-1 py-3 text-sm font-medium text-violet-700 transition-colors hover:text-violet-900 dark:text-violet-400 dark:hover:text-violet-300"
				>
					{t(locale, 'home.viewAll')}
					<ArrowRight class="size-4" aria-hidden="true" />
				</a>
			</div>
			{#if upcoming.length === 0}
				<p
					class="rounded-2xl border border-dashed border-zinc-300 p-8 text-center text-zinc-500 dark:border-zinc-700"
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
	</div>

	<aside class="min-w-0 space-y-4 lg:sticky lg:top-24 lg:self-start">
		<UpcomingSchedules entries={actionSchedules} {locale} />

		<section
			class="rounded-2xl border border-zinc-900/[0.08] bg-white p-5 dark:border-white/[0.08] dark:bg-zinc-900"
		>
			<h2
				class="flex items-center gap-2 font-display text-lg font-semibold text-zinc-900 dark:text-zinc-50"
			>
				<CalendarPlus class="size-[18px] text-violet-600 dark:text-violet-400" aria-hidden="true" />
				{t(locale, 'home.subscribe.title')}
			</h2>
			<p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
				{t(locale, 'home.subscribe.desc')}
			</p>
			<div class="mt-4 flex flex-wrap gap-2">
				<SubscribeMenu
					{locale}
					url={icsUrl('all', { locale }).toString()}
					name="SCLS"
					triggerClass={subscribeButtonClass}
				>
					<CalendarPlus class="size-4 text-zinc-500 dark:text-zinc-400" aria-hidden="true" />
					{t(locale, 'filter.all')}
				</SubscribeMenu>
				{#each countries as code (code)}
					<SubscribeMenu
						{locale}
						url={icsUrl(code, { locale }).toString()}
						name="SCLS"
						triggerClass={subscribeButtonClass}
					>
						<CountryBadge {locale} countryCode={code} />
					</SubscribeMenu>
				{/each}
				{#if hasOnline}
					<SubscribeMenu
						{locale}
						url={icsUrl('online', { locale }).toString()}
						name="SCLS"
						triggerClass={subscribeButtonClass}
					>
						<CountryBadge {locale} countryCode={null} isOnline />
					</SubscribeMenu>
				{/if}
			</div>
		</section>
	</aside>
</div>
