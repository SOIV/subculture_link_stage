<script lang="ts">
	import { page } from '$app/state';
	import { localeHref, stripLocale, t, type Locale } from '$lib/i18n';
	import SettingsMenu from './SettingsMenu.svelte';

	let { locale }: { locale: Locale } = $props();

	// 행사 목록(/events)과 그 하위 상세 페이지에서는 "행사" 메뉴를 강조한다.
	let inEvents = $derived(stripLocale(page.url.pathname).startsWith('/events'));
</script>

<!-- 화면 위에 붙이지 않고 본문과 같은 폭의 막대를 살짝 띄워 둔다. 바깥 래퍼는 투명해서
	스크롤하면 위쪽 틈으로 본문이 비친다. 막대 양 끝은 본문 카드의 양 끝과 맞춘다. -->
<header class="sticky top-0 z-20 pt-3 sm:pt-4">
	<div class="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
		<div
			class="flex h-14 items-center justify-between gap-3 rounded-2xl border border-zinc-900/[0.08] bg-white/85 pr-2 pl-4 shadow-[0_8px_24px_rgba(0,0,0,0.06)] backdrop-blur-md sm:pl-5 dark:border-white/[0.08] dark:bg-zinc-900/80 dark:shadow-[0_8px_24px_rgba(0,0,0,0.3)]"
		>
			<a
				href={localeHref(locale, '/')}
				class="rounded-md font-display text-lg leading-none font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
			>
				{t(locale, 'site.name')}
			</a>
			<div class="flex items-center gap-1">
				<nav class="flex items-center">
					<a
						href={localeHref(locale, '/events')}
						aria-current={inEvents ? 'page' : undefined}
						class="flex h-9 items-center rounded-lg px-3 text-sm font-medium transition-colors {inEvents
							? 'bg-zinc-900/[0.06] text-zinc-900 dark:bg-white/[0.08] dark:text-zinc-50'
							: 'text-zinc-600 hover:bg-zinc-900/[0.04] hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-white/[0.06] dark:hover:text-zinc-50'}"
					>
						{t(locale, 'nav.events')}
					</a>
				</nav>
				<span class="mx-1 h-5 w-px bg-zinc-900/10 dark:bg-white/10" aria-hidden="true"></span>
				<SettingsMenu {locale} />
			</div>
		</div>
	</div>
</header>
