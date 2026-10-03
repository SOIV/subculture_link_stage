<script lang="ts">
	import CalendarPlus from '@lucide/svelte/icons/calendar-plus';
	import { icsUrl } from '$lib/api';
	import { t, type Locale } from '$lib/i18n';
	import SubscribeMenu from './SubscribeMenu.svelte';

	let { locale }: { locale: Locale } = $props();
</script>

<footer class="mt-20 border-t border-slate-200/70 dark:border-white/10">
	<div
		class="mx-auto max-w-5xl space-y-3 px-4 py-8 text-sm text-slate-500 sm:px-6 dark:text-slate-400"
	>
		<p class="font-display text-base font-bold text-slate-700 dark:text-slate-200">
			{t(locale, 'site.name')}
		</p>
		<p>{t(locale, 'footer.about')}</p>
		<div class="flex flex-wrap gap-x-6 gap-y-1 pt-1">
			<SubscribeMenu
				{locale}
				url={icsUrl('all', { locale }).toString()}
				name="SCLS"
				placement="up"
				triggerClass="inline-flex items-center gap-1.5 hover:text-violet-600 dark:hover:text-violet-400"
			>
				<CalendarPlus class="size-4" aria-hidden="true" />
				{t(locale, 'footer.icsAll')}
			</SubscribeMenu>
			<a
				class="hover:text-violet-600 dark:hover:text-violet-400"
				href="https://github.com/SOIV/subculture_link_stage"
				target="_blank"
				rel="noreferrer"
			>
				{t(locale, 'footer.sourceLink')}
			</a>
		</div>
	</div>
</footer>
