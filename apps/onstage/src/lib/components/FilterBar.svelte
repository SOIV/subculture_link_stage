<script lang="ts">
	import { goto } from '$app/navigation';
	import Search from '@lucide/svelte/icons/search';
	import type { TagGroup } from '$lib/api';
	import { formQuery, hasActiveFilters, type ListFilters } from '$lib/filters';
	import { tagGroupLabel } from '$lib/format';
	import { localeHref, t, type Locale } from '$lib/i18n';
	import { tagOptions } from '$lib/tags';

	let {
		locale,
		tagGroups,
		filters
	}: {
		locale: Locale;
		tagGroups: TagGroup[];
		filters: ListFilters;
	} = $props();

	let active = $derived(hasActiveFilters(filters));

	// appearance-none + 오른쪽 여백으로 브라우저 기본 화살표를 지우고 배경 SVG 화살표로 대신한다
	// (셀렉트를 필터 칩처럼 알약 모양으로 통일하기 위해).
	const fieldBase =
		'h-9 w-full rounded-lg border border-zinc-900/[0.12] bg-white text-sm text-zinc-800 transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none dark:border-white/[0.12] dark:bg-zinc-900 dark:text-zinc-100';
	const selectClass = `${fieldBase} appearance-none bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20viewBox=%270%200%2020%2020%27%20fill=%27none%27%3E%3Cpath%20d=%27M5%208l5%205%205-5%27%20stroke=%27%2394a3b8%27%20stroke-width=%271.5%27%20stroke-linecap=%27round%27%20stroke-linejoin=%27round%27/%3E%3C/svg%3E')] bg-[length:16px] bg-[right_0.6rem_center] bg-no-repeat pr-8 pl-3`;
	const dateClass = `${fieldBase} px-3`;
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

<!-- 넓은 화면에서는 검색 한 줄 + 조건 6칸 한 줄로 끝난다(국가·태그 그룹·기간). -->
<form
	method="GET"
	action={localeHref(locale, '/events')}
	{onsubmit}
	class="space-y-4 rounded-2xl border border-zinc-900/[0.08] bg-white p-4 sm:p-5 dark:border-white/[0.08] dark:bg-zinc-900"
>
	<div class="flex gap-2">
		<label class="relative flex-1">
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
				class="h-10 w-full rounded-lg border border-zinc-900/[0.12] bg-white pr-4 pl-10 text-sm transition-colors placeholder:text-zinc-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none dark:border-white/[0.12] dark:bg-zinc-900"
			/>
		</label>
		<button
			type="submit"
			class="h-10 rounded-lg bg-violet-600 px-5 text-sm font-medium text-white transition-colors hover:bg-violet-700 active:scale-[0.98] dark:bg-violet-500 dark:hover:bg-violet-400 dark:hover:text-zinc-950"
		>
			{t(locale, 'search.button')}
		</button>
		{#if active}
			<a
				href={localeHref(locale, '/events')}
				class="flex h-10 items-center rounded-lg px-3 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-white/[0.06] dark:hover:text-zinc-50"
			>
				{t(locale, 'filter.reset')}
			</a>
		{/if}
	</div>

	<div class="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
		<label class={labelClass}>
			{t(locale, 'filter.country')}
			<select name="country" value={filters.country} onchange={submitOnChange} class={selectClass}>
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
			<input type="date" name="to" value={filters.to} onchange={submitOnChange} class={dateClass} />
		</label>
	</div>
</form>
