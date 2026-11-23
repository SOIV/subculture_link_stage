<script lang="ts">
	import CalendarPlus from '@lucide/svelte/icons/calendar-plus';
	import { icsUrl } from '$lib/api';
	import { t, type Locale } from '$lib/i18n';
	import SubscribeMenu from './SubscribeMenu.svelte';

	let { locale }: { locale: Locale } = $props();
</script>

<footer class="mt-24 border-t border-zinc-900/[0.08] dark:border-white/[0.08]">
	<!-- 아래쪽은 아이폰 홈 바 영역만큼 더 비운다. -->
	<div
		class="mx-auto flex max-w-7xl flex-col gap-4 px-4 pt-10 pb-[calc(2.5rem+env(safe-area-inset-bottom))] text-sm text-zinc-500 sm:flex-row sm:items-start sm:justify-between sm:px-6 lg:px-8 dark:text-zinc-400"
	>
		<div class="max-w-xl space-y-2">
			<p class="font-display text-base font-semibold text-zinc-800 dark:text-zinc-100">
				{t(locale, 'site.name')}
			</p>
			<p>{t(locale, 'footer.about')}</p>
		</div>
		<!-- 글자 링크도 손가락으로 누르기 쉽게 위아래 여백을 눌리는 영역에 넣는다(-my로 줄 간격은 그대로). -->
		<div class="-my-2 flex flex-wrap gap-x-6 sm:my-0 sm:justify-end sm:gap-y-2">
			<SubscribeMenu
				{locale}
				url={icsUrl('all', { locale }).toString()}
				name="SCLS"
				placement="up"
				triggerClass="inline-flex min-h-11 items-center gap-2 transition-colors hover:text-zinc-900 sm:min-h-0 dark:hover:text-zinc-100"
			>
				<CalendarPlus class="size-4" aria-hidden="true" />
				{t(locale, 'footer.icsAll')}
			</SubscribeMenu>
			<a
				class="inline-flex min-h-11 items-center transition-colors hover:text-zinc-900 sm:min-h-0 dark:hover:text-zinc-100"
				href="https://github.com/SOIV/subculture_link_stage"
				target="_blank"
				rel="noreferrer"
			>
				{t(locale, 'footer.sourceLink')}
			</a>
		</div>
	</div>
</footer>
