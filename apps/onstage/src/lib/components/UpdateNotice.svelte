<script lang="ts">
	// 새 버전이 설치돼 기다리는 중이면 알린다. 누르면 새 버전이 넘겨받고 화면을 한 번 새로 고친다
	// ($lib/pwa.svelte.ts). 누르지 않아도 이 사이트의 탭을 모두 닫았다 열면 새 버전으로 열린다.
	import RefreshCw from '@lucide/svelte/icons/refresh-cw';
	import { t, type Locale } from '$lib/i18n';
	import { applyUpdate, pwa } from '$lib/pwa.svelte';

	let { locale }: { locale: Locale } = $props();
	let pending = $state(false);

	function update() {
		pending = true;
		void applyUpdate();
	}
</script>

{#if pwa.updateReady}
	<div class="mx-auto w-full max-w-7xl px-4 pt-3 sm:px-6 lg:px-8">
		<div
			role="status"
			class="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl bg-violet-50 px-4 py-3 text-sm text-violet-900 dark:bg-violet-500/15 dark:text-violet-200"
		>
			<p class="flex min-w-0 flex-1 items-start gap-2">
				<RefreshCw class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
				{t(locale, 'update.available')}
			</p>
			<button
				type="button"
				onclick={update}
				disabled={pending}
				class="-my-1 h-9 shrink-0 rounded-lg bg-violet-600 px-3 font-medium text-white transition-colors hover:bg-violet-700 disabled:opacity-60 dark:bg-violet-500 dark:hover:bg-violet-400 dark:hover:text-zinc-950"
			>
				{t(locale, 'update.apply')}
			</button>
		</div>
	</div>
{/if}
