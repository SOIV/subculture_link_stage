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

	const fieldClass =
		'rounded border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950';
	const labelClass = 'flex flex-col gap-1 text-xs font-medium text-slate-600 dark:text-slate-400';
</script>

<!-- 자바스크립트 없이도 동작하는 일반 GET 폼이다 — 제출하면 그대로 이 페이지의 load가
	새 쿼리스트링으로 다시 실행된다. 태그는 한 번에 하나만 고를 수 있다(다중 선택은 이후 확장). -->
<form
	method="GET"
	class="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900"
>
	<label class={labelClass}>
		{t(locale, 'filter.country')}
		<select name="country" value={filters.country ?? ''} class={fieldClass}>
			<option value="">{t(locale, 'filter.country.all')}</option>
			<option value="KR">{t(locale, 'filter.country.KR')}</option>
			<option value="JP">{t(locale, 'filter.country.JP')}</option>
		</select>
	</label>

	<label class={labelClass}>
		{t(locale, 'filter.tags')}
		<select name="tags" value={filters.tags ?? ''} class={fieldClass}>
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
		<input type="date" name="from" value={filters.from ?? ''} class={fieldClass} />
	</label>
	<label class={labelClass}>
		{t(locale, 'filter.to')}
		<input type="date" name="to" value={filters.to ?? ''} class={fieldClass} />
	</label>

	<div class="flex gap-2">
		<button
			type="submit"
			class="rounded-lg bg-violet-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-violet-500"
		>
			{t(locale, 'filter.apply')}
		</button>
		<a
			href={localeHref(locale, '/')}
			class="rounded-lg border border-slate-300 px-4 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
		>
			{t(locale, 'filter.reset')}
		</a>
	</div>
</form>
