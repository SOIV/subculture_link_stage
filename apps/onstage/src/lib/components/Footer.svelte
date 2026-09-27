<script lang="ts">
	import { icsUrl } from '$lib/api';
	import { t, type Locale } from '$lib/i18n';

	let { locale }: { locale: Locale } = $props();
</script>

<footer
	class="mt-16 border-t border-slate-200 py-8 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400"
>
	<div class="mx-auto max-w-5xl space-y-3 px-4">
		<p>{t(locale, 'footer.about')}</p>
		<div class="flex flex-wrap gap-x-6 gap-y-1">
			<a
				class="hover:text-violet-600 dark:hover:text-violet-400"
				href={icsUrl('all', { locale }).toString()}
			>
				{t(locale, 'footer.icsAll')}
			</a>
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
