<script lang="ts">
	import { goto } from '$app/navigation';
	import Search from '@lucide/svelte/icons/search';
	import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
	import X from '@lucide/svelte/icons/x';
	import type { TagGroup } from '$lib/api';
	import { formQuery, hasActiveFilters, type ListFilters } from '$lib/filters';
	import { tagGroupLabel } from '$lib/format';
	import { localeHref, t, tv, type Locale } from '$lib/i18n';
	import { tagOptions } from '$lib/tags';

	let {
		locale,
		tagGroups,
		filters,
		count
	}: {
		locale: Locale;
		tagGroups: TagGroup[];
		filters: ListFilters;
		/** 지금 조건의 행사 수 — 휴대폰 필터 시트의 "N개 행사 보기" 버튼에 쓴다. */
		count: number;
	} = $props();

	let active = $derived(hasActiveFilters(filters));
	// 검색어를 뺀 조건 수(필터 버튼의 숫자 표시).
	let conditionCount = $derived(
		[filters.country, filters.from, filters.to, ...Object.values(filters.groups)].filter(Boolean)
			.length
	);

	// 좁은 화면(sm 미만)에서는 조건 6칸이 목록을 한참 밀어내므로, 검색 줄만 남기고 조건은 "필터" 버튼을
	// 누르면 아래에서 올라오는 시트에 담는다. 넓은 화면에서는 지금처럼 항상 펼쳐 둔다(같은 폼, 같은 칸).
	let sheetOpen = $state(false);
	let sheetToggle: HTMLButtonElement | undefined = $state();
	let sheetClose: HTMLButtonElement | undefined = $state();

	function closeSheet() {
		if (!sheetOpen) return;
		sheetOpen = false;
		sheetToggle?.focus();
	}

	// 시트가 열려 있는 동안 뒤 페이지가 스크롤되지 않게 하고, 화면이 넓어지면(가로 회전 등) 시트를 닫는다.
	$effect(() => {
		if (!sheetOpen) return;
		sheetClose?.focus();
		const root = document.documentElement;
		const previous = root.style.overflow;
		root.style.overflow = 'hidden';
		const wide = window.matchMedia('(min-width: 40rem)');
		const onWide = () => {
			if (wide.matches) sheetOpen = false;
		};
		wide.addEventListener('change', onWide);
		return () => {
			root.style.overflow = previous;
			wide.removeEventListener('change', onWide);
		};
	});

	function onWindowKeydown(event: KeyboardEvent) {
		if (sheetOpen && event.key === 'Escape') closeSheet();
	}

	// appearance-none + 오른쪽 여백으로 브라우저 기본 화살표를 지우고 배경 SVG 화살표로 대신한다
	// (셀렉트를 필터 칩처럼 알약 모양으로 통일하기 위해).
	// 휴대폰에서는 글자를 16px(text-base)로 둔다 — 그보다 작으면 iPhone이 입력칸을 누를 때 화면을 확대한다.
	const fieldBase =
		'h-11 w-full rounded-lg border border-zinc-900/[0.12] bg-white text-base text-zinc-800 sm:h-9 sm:text-sm transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none dark:border-white/[0.12] dark:bg-zinc-900 dark:text-zinc-100';
	const selectClass = `${fieldBase} appearance-none bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20viewBox=%270%200%2020%2020%27%20fill=%27none%27%3E%3Cpath%20d=%27M5%208l5%205%205-5%27%20stroke=%27%2394a3b8%27%20stroke-width=%271.5%27%20stroke-linecap=%27round%27%20stroke-linejoin=%27round%27/%3E%3C/svg%3E')] bg-[length:16px] bg-[right_0.6rem_center] bg-no-repeat pr-8 pl-3`;
	// iPhone은 빈 날짜 칸의 글자를 가운데로 몰아서 다른 칸과 줄이 어긋난다 — 왼쪽으로 맞춘다.
	const dateClass = `${fieldBase} px-3 [&::-webkit-date-and-time-value]:text-left`;
	const labelClass = 'flex min-w-0 flex-col gap-1.5 text-xs text-zinc-500 dark:text-zinc-400';

	// 하위 태그는 앞에 들여쓰기와 └ 표시를 붙여 상위 태그 아래에 속한다는 걸 보여준다.
	function optionLabel(name: string, depth: number) {
		return depth > 0 ? `${'  '.repeat(depth)}└ ${name}` : name;
	}

	// 일반 GET 폼이라 자바스크립트가 없어도 그대로 제출되지만, 있을 때는 비어 있는 조건을 뺀
	// 깔끔한 주소(/events?q=코믹)로 이동한다(빈 칸까지 실린 긴 쿼리스트링을 막는다).
	function onsubmit(event: SubmitEvent) {
		event.preventDefault();
		const query = formQuery(new FormData(event.currentTarget as HTMLFormElement));
		void goto(localeHref(locale, '/events') + (query ? `?${query}` : ''), {
			keepFocus: true,
			noScroll: true
		});
	}

	// 드롭다운·날짜는 바꾸는 즉시 적용한다(검색어는 Enter나 검색 버튼).
	function submitOnChange(event: Event) {
		(event.currentTarget as HTMLElement).closest('form')?.requestSubmit();
	}
</script>

<svelte:window onkeydown={onWindowKeydown} />

<!-- 자바스크립트가 꺼져 있으면 시트를 열 수 없으니 휴대폰에서도 조건 칸을 그대로 펼쳐 둔다. -->
<svelte:head>
	<noscript>
		<style>
			.filter-sheet {
				display: block !important;
				margin-top: 1rem;
			}
			.filter-sheet-only {
				display: none !important;
			}
		</style>
	</noscript>
</svelte:head>

<!-- 넓은 화면에서는 검색 한 줄 + 조건 6칸 한 줄로 끝난다(국가·태그 그룹·기간). -->
<form
	method="GET"
	action={localeHref(locale, '/events')}
	{onsubmit}
	class="sm:rounded-2xl sm:border sm:border-zinc-900/[0.08] sm:bg-white sm:p-5 sm:dark:border-white/[0.08] sm:dark:bg-zinc-900"
>
	<!-- 조건을 바꿔도 "끝난 행사 보기" 선택은 그대로 둔다(목록 오른쪽 위 스위치). -->
	{#if filters.showEnded}
		<input type="hidden" name="ended" value="1" />
	{/if}
	<div class="flex gap-2">
		<label class="relative min-w-0 flex-1">
			<span class="sr-only">{t(locale, 'search.placeholder')}</span>
			<Search
				class="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-zinc-400"
				aria-hidden="true"
			/>
			<input
				type="search"
				name="q"
				value={filters.q}
				placeholder={t(locale, 'search.placeholder')}
				autocomplete="off"
				enterkeyhint="search"
				class="h-11 w-full rounded-lg border border-zinc-900/[0.12] bg-white pr-3 pl-10 text-base transition-colors placeholder:text-zinc-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none sm:h-10 sm:pr-4 sm:text-sm dark:border-white/[0.12] dark:bg-zinc-900"
			/>
		</label>
		<button
			type="submit"
			class="h-11 shrink-0 rounded-lg bg-violet-600 px-4 text-sm font-medium text-white transition-colors hover:bg-violet-700 active:scale-[0.98] sm:h-10 sm:px-5 dark:bg-violet-500 dark:hover:bg-violet-400 dark:hover:text-zinc-950"
		>
			{t(locale, 'search.button')}
		</button>
		<button
			bind:this={sheetToggle}
			type="button"
			onclick={() => (sheetOpen = true)}
			aria-haspopup="dialog"
			aria-expanded={sheetOpen}
			aria-controls="filter-sheet"
			aria-label={conditionCount > 0
				? `${t(locale, 'filter.open')} (${conditionCount})`
				: t(locale, 'filter.open')}
			class="filter-sheet-only relative flex size-11 shrink-0 items-center justify-center rounded-lg border border-zinc-900/[0.12] text-zinc-700 transition-colors active:bg-zinc-100 sm:hidden dark:border-white/[0.12] dark:text-zinc-200 dark:active:bg-white/[0.06]"
		>
			<SlidersHorizontal class="size-5" aria-hidden="true" />
			{#if conditionCount > 0}
				<span
					class="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-violet-600 text-[11px] font-semibold text-white tabular-nums dark:bg-violet-500"
					aria-hidden="true">{conditionCount}</span
				>
			{/if}
		</button>
		{#if active}
			<a
				href={localeHref(locale, '/events')}
				class="hidden h-10 items-center rounded-lg px-3 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 sm:flex dark:text-zinc-300 dark:hover:bg-white/[0.06] dark:hover:text-zinc-50"
			>
				{t(locale, 'filter.reset')}
			</a>
		{/if}
	</div>

	{#if sheetOpen}
		<!-- 시트 뒤 어두운 막. 누르면 닫힌다(키보드는 Esc나 닫기 버튼). -->
		<div
			class="fixed inset-0 z-40 bg-zinc-950/40 sm:hidden"
			onclick={closeSheet}
			aria-hidden="true"
		></div>
	{/if}

	<!-- 같은 칸을 넓은 화면에서는 제자리에, 휴대폰에서는 아래에서 올라오는 시트로 보여준다. -->
	<div
		id="filter-sheet"
		role={sheetOpen ? 'dialog' : undefined}
		aria-modal={sheetOpen ? 'true' : undefined}
		aria-labelledby={sheetOpen ? 'filter-sheet-title' : undefined}
		class="filter-sheet {sheetOpen
			? 'fixed inset-x-0 bottom-0 z-50 max-h-[85dvh] animate-sheet-in overflow-y-auto overscroll-contain rounded-t-2xl bg-white px-4 pt-2 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[0_-8px_32px_rgba(0,0,0,0.12)] sm:static sm:z-auto sm:mt-4 sm:max-h-none sm:animate-none sm:overflow-visible sm:rounded-none sm:bg-transparent sm:p-0 sm:shadow-none dark:bg-zinc-900 sm:dark:bg-transparent'
			: 'hidden sm:mt-4 sm:block'}"
	>
		<div class="filter-sheet-only sm:hidden">
			<div
				class="mx-auto mb-2 h-1 w-10 rounded-full bg-zinc-300 dark:bg-zinc-700"
				aria-hidden="true"
			></div>
			<div class="mb-3 flex items-center justify-between">
				<h2 id="filter-sheet-title" class="text-base font-semibold text-zinc-900 dark:text-zinc-50">
					{t(locale, 'filter.open')}
				</h2>
				<button
					bind:this={sheetClose}
					type="button"
					onclick={closeSheet}
					aria-label={t(locale, 'filter.close')}
					class="-mr-2 flex size-11 items-center justify-center rounded-lg text-zinc-500 active:bg-zinc-100 dark:text-zinc-400 dark:active:bg-white/[0.06]"
				>
					<X class="size-5" aria-hidden="true" />
				</button>
			</div>
		</div>
		<div class="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
			<label class={labelClass}>
				{t(locale, 'filter.country')}
				<select
					name="country"
					value={filters.country}
					onchange={submitOnChange}
					class={selectClass}
				>
					<option value="">{t(locale, 'filter.all')}</option>
					<option value="KR">{t(locale, 'filter.country.KR')}</option>
					<option value="JP">{t(locale, 'filter.country.JP')}</option>
				</select>
			</label>

			<!-- 태그 그룹(행사 형식/참가 방식/티켓 방식)마다 드롭다운 하나씩, 각각 하나만 고른다.
			서로 다른 그룹에서 고른 조건은 모두 만족하는 행사만 나온다. -->
			{#each tagGroups as group (group.id)}
				<label class={labelClass}>
					{tagGroupLabel(locale, group.slug, group.name)}
					<select
						name={group.slug}
						value={filters.groups[group.slug] ?? ''}
						onchange={submitOnChange}
						class={selectClass}
					>
						<option value="">{t(locale, 'filter.all')}</option>
						{#each tagOptions(group) as option (option.slug)}
							<option value={option.slug}>{optionLabel(option.name, option.depth)}</option>
						{/each}
					</select>
				</label>
			{/each}

			<label class={labelClass}>
				{t(locale, 'filter.from')}
				<input
					type="date"
					name="from"
					value={filters.from}
					onchange={submitOnChange}
					class={dateClass}
				/>
			</label>
			<label class={labelClass}>
				{t(locale, 'filter.to')}
				<input
					type="date"
					name="to"
					value={filters.to}
					onchange={submitOnChange}
					class={dateClass}
				/>
			</label>
		</div>

		<!-- 조건은 바꾸는 즉시 뒤 목록에 반영된다. 이 버튼은 시트를 닫고 결과를 보러 가는 것뿐이다. -->
		<div class="filter-sheet-only mt-5 flex gap-2 sm:hidden">
			{#if active}
				<a
					href={localeHref(locale, '/events')}
					data-sveltekit-noscroll
					data-sveltekit-keepfocus
					class="flex h-12 items-center justify-center rounded-xl px-4 text-sm font-medium text-zinc-700 active:bg-zinc-100 dark:text-zinc-200 dark:active:bg-white/[0.06]"
				>
					{t(locale, 'filter.reset')}
				</a>
			{/if}
			<button
				type="button"
				onclick={closeSheet}
				class="h-12 flex-1 rounded-xl bg-violet-600 text-base font-medium text-white tabular-nums active:bg-violet-700 dark:bg-violet-500"
			>
				{tv(locale, 'filter.showResults', { n: count })}
			</button>
		</div>
	</div>
</form>
