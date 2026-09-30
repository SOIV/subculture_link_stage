<script lang="ts">
	// 국기는 flag-icons(MIT)의 표준 SVG를 쓴다. 이모지 국기는 Windows에서 "KR"/"JP" 글자 박스로
	// 깨지고, 예전에 직접 그린 그림은 태극기 4괘가 빠져 있었다. 한국·일본 외 국가가 늘어나면
	// FLAGS에 한 줄씩 추가한다(국기가 없는 국가는 지구본 아이콘으로 보인다).
	import Globe from '@lucide/svelte/icons/globe';
	import jpFlag from 'flag-icons/flags/4x3/jp.svg';
	import krFlag from 'flag-icons/flags/4x3/kr.svg';
	import { countryLabel } from '$lib/format';
	import { t, type Locale } from '$lib/i18n';

	let {
		locale,
		countryCode,
		isOnline = false
	}: { locale: Locale; countryCode: string | null; isOnline?: boolean } = $props();

	const FLAGS: Record<string, string> = { KR: krFlag, JP: jpFlag };
	let flag = $derived(!isOnline && countryCode ? FLAGS[countryCode] : undefined);
</script>

<span class="inline-flex items-center gap-1.5 align-middle">
	{#if flag}
		<!-- 흰 바탕 국기가 흰/어두운 배경에 묻히지 않게 얇은 테두리를 둔다. -->
		<img
			src={flag}
			alt=""
			width="21"
			height="16"
			class="h-4 w-auto shrink-0 rounded-[3px] ring-1 ring-slate-900/15 dark:ring-white/25"
		/>
	{:else}
		<Globe class="size-4 shrink-0 opacity-70" aria-hidden="true" />
	{/if}
	{isOnline ? t(locale, 'card.online') : countryLabel(locale, countryCode)}
</span>
