<script lang="ts">
	import CalendarPlus from '@lucide/svelte/icons/calendar-plus';
	import { icsUrl } from '$lib/api';
	import { t, type Locale } from '$lib/i18n';
	import SubscribeMenu from './SubscribeMenu.svelte';

	let { locale }: { locale: Locale } = $props();
</script>

<footer class="mt-24 border-t border-zinc-900/[0.08] dark:border-white/[0.08]">
	<div
		class="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-10 text-sm text-zinc-500 sm:flex-row sm:items-start sm:justify-between sm:px-6 lg:px-8 dark:text-zinc-400"
	>
		<div class="max-w-xl space-y-2">
			<p class="font-display text-base font-semibold text-zinc-800 dark:text-zinc-100">
				{t(locale, 'site.name')}
			</p>
			<p>{t(locale, 'footer.about')}</p>
		</div>
		<div class="flex flex-wrap gap-x-6 gap-y-2 sm:justify-end">
			<SubscribeMenu
				{locale}
				url={icsUrl('all', { locale }).toString()}
				name="SCLS"
				placement="up"
				triggerClass="inline-flex items-center gap-2 transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
			>
				<CalendarPlus class="size-4" aria-hidden="true" />
				{t(locale, 'footer.icsAll')}
			</SubscribeMenu>
			<a
				class="transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
				href="https://github.com/SOIV/subculture_link_stage"
				target="_blank"
				rel="noreferrer"
			>
				{t(locale, 'footer.sourceLink')}
			</a>
		</div>
	</div>
</footer>
