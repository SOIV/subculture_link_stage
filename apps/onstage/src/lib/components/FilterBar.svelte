<script lang="ts">
	import type { TagGroup } from '$lib/api';
	import { tagGroupLabel } from '$lib/format';
	import { localeHref, t, type Locale } from '$lib/i18n';

	let {
		locale,
		tagGroups,
		filters
	}: {
		locale: Locale;
		tagGroups: TagGroup[];
		filters: { country?: string; tags?: string; from?: string; to?: string };
	} = $props();

	// appearance-none + 오른쪽 여백으로 브라우저 기본 화살표를 지우고 배경 SVG 화살표로 대신한다
	// (셀렉트를 필터 칩처럼 알약 모양으로 통일하기 위해).
	const selectClass =
		"appearance-none rounded-full border border-slate-300 bg-white bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20viewBox=%270%200%2020%2020%27%20fill=%27none%27%3E%3Cpath%20d=%27M5%208l5%205%205-5%27%20stroke=%27%2394a3b8%27%20stroke-width=%271.5%27%20stroke-linecap=%27round%27%20stroke-linejoin=%27round%27/%3E%3C/svg%3E')] bg-[length:16px] bg-[right_0.6rem_center] bg-no-repeat py-1.5 pr-8 pl-3 text-sm font-medium dark:border-slate-600 dark:bg-slate-900";
	const dateClass =
		'rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium dark:border-slate-600 dark:bg-slate-900';
	const labelClass = 'flex flex-col gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400';
</script>

<!-- 자바스크립트 없이도 동작하는 일반 GET 폼이다 — 제출하면 그대로 이 페이지의 load가
	새 쿼리스트링으로 다시 실행된다. 태그는 한 번에 하나만 고를 수 있다(다중 선택은 이후 확장). -->
<form
	method="GET"
	class="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/[0.03] dark:shadow-none"
>
	<label class={labelClass}>
		{t(locale, 'filter.country')}
		<select name="country" value={filters.country ?? ''} class={selectClass}>
			<option value="">{t(locale, 'filter.country.all')}</option>
			<option value="KR">🇰🇷 {t(locale, 'filter.country.KR')}</option>
			<option value="JP">🇯🇵 {t(locale, 'filter.country.JP')}</option>
		</select>
	</label>

	<label class={labelClass}>
		{t(locale, 'filter.tags')}
		<select name="tags" value={filters.tags ?? ''} class={selectClass}>
			<option value="">{t(locale, 'filter.country.all')}</option>
			{#each tagGroups as group (group.id)}
				<optgroup label={tagGroupLabel(locale, group.slug, group.name)}>
					{#each group.tags as tag (tag.id)}
						<option value={tag.slug}>{tag.name}</option>
					{/each}
				</optgroup>
			{/each}
		</select>
	</label>

	<label class={labelClass}>
		{t(locale, 'filter.from')}
		<input type="date" name="from" value={filters.from ?? ''} class={dateClass} />
	</label>
	<label class={labelClass}>
		{t(locale, 'filter.to')}
		<input type="date" name="to" value={filters.to ?? ''} class={dateClass} />
	</label>

	<div class="flex gap-2">
		<button
			type="submit"
			class="rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-1.5 text-sm font-bold text-white shadow-md shadow-violet-600/20 transition-transform hover:scale-[1.03] hover:shadow-lg hover:shadow-violet-600/30"
		>
			{t(locale, 'filter.apply')}
		</button>
		<a
			href={localeHref(locale, '/')}
			class="rounded-full border border-slate-300 px-5 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
		>
			{t(locale, 'filter.reset')}
		</a>
	</div>
</form>
