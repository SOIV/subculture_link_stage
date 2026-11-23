<script lang="ts">
	// 헤더 바로 아래 안내 두 가지(오프라인 보기는 src/service-worker.ts가 맡는다):
	// - 통신이 끊겼다(navigator.onLine).
	// - 화면에 저장본이 쓰였다(worker가 알려 준 pwa.savedAt). 통신이 되는 것처럼 보여도 API만 응답하지 않거나
	//   너무 느리면 저장본을 보여주므로, 네트워크 상태와 따로 본다. 언제 저장한 내용인지 함께 알린다.
	import { onMount } from 'svelte';
	import WifiOff from '@lucide/svelte/icons/wifi-off';
	import History from '@lucide/svelte/icons/history';
	import { formatSavedAt } from '$lib/format';
	import { t, tv, type Locale } from '$lib/i18n';
	import { pwa } from '$lib/pwa.svelte';

	let { locale }: { locale: Locale } = $props();

	// 서버에서는 항상 온라인으로 그리고, 브라우저에서 마운트한 뒤 실제 상태를 따른다.
	let offline = $state(false);
	let savedAt = $derived(pwa.savedAt);

	onMount(() => {
		const update = () => (offline = !navigator.onLine);
		update();
		window.addEventListener('online', update);
		window.addEventListener('offline', update);
		return () => {
			window.removeEventListener('online', update);
			window.removeEventListener('offline', update);
		};
	});
</script>

{#if offline || savedAt !== null}
	<div class="mx-auto w-full max-w-7xl px-4 pt-3 sm:px-6 lg:px-8">
		<div
			role="status"
			class="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl bg-amber-100 px-4 py-3 text-sm text-amber-900 dark:bg-amber-500/15 dark:text-amber-200"
		>
			<p class="flex min-w-0 flex-1 items-start gap-2">
				{#if offline}
					<WifiOff class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
				{:else}
					<History class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
				{/if}
				<span>
					{t(locale, offline ? 'offline.notice' : 'saved.notice')}
					{#if savedAt}
						<span class="whitespace-nowrap tabular-nums">
							({tv(locale, 'saved.checkedAt', { time: formatSavedAt(locale, savedAt) })})
						</span>
					{/if}
				</span>
			</p>
			{#if !offline && savedAt !== null}
				<button
					type="button"
					onclick={() => location.reload()}
					class="-my-1 h-9 shrink-0 rounded-lg px-3 font-medium underline-offset-2 hover:underline"
				>
					{t(locale, 'saved.retry')}
				</button>
			{/if}
		</div>
	</div>
{/if}
