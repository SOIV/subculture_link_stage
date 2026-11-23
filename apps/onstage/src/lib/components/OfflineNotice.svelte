<script lang="ts">
	// 통신이 끊기면 헤더 바로 아래에 "저장된 내용을 보여 주는 중" 안내를 띄운다. 오프라인 보기는
	// src/service-worker.ts가 맡고, 이 안내는 보이는 정보가 최신이 아닐 수 있다는 것만 알린다.
	import { onMount } from 'svelte';
	import WifiOff from '@lucide/svelte/icons/wifi-off';
	import { t, type Locale } from '$lib/i18n';

	let { locale }: { locale: Locale } = $props();

	// 서버에서는 항상 온라인으로 그리고, 브라우저에서 마운트한 뒤 실제 상태를 따른다.
	let offline = $state(false);

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

{#if offline}
	<div class="mx-auto w-full max-w-7xl px-4 pt-3 sm:px-6 lg:px-8">
		<p
			role="status"
			class="flex items-start gap-2 rounded-xl bg-amber-100 px-4 py-3 text-sm text-amber-900 dark:bg-amber-500/15 dark:text-amber-200"
		>
			<WifiOff class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
			{t(locale, 'offline.notice')}
		</p>
	</div>
{/if}
