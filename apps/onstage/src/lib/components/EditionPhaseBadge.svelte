<script lang="ts">
	import { t, type Locale } from '$lib/i18n';
	import type { EditionPhase } from '$lib/series';

	let { locale, phase }: { locale: Locale; phase: EditionPhase } = $props();

	// 진행 중은 초록, 예정은 보라(사이트 포인트 색), 연기·취소는 주의(노랑·빨강), 종료는 무채색이다.
	const TONE: Record<EditionPhase, string> = {
		ongoing: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
		upcoming: 'bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-300',
		postponed: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
		cancelled: 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300',
		ended: 'bg-zinc-100 text-zinc-600 dark:bg-white/10 dark:text-zinc-300'
	};
</script>

<span
	class="inline-block shrink-0 rounded-md px-2 py-1 text-xs font-medium whitespace-nowrap {TONE[
		phase
	]}"
>
	{t(locale, `phase.${phase}`)}
</span>
