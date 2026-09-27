<script lang="ts">
	// 국기를 이모지로 쓰면 Windows에서 "KR"/"JP" 글자 박스로 깨져 보이는 경우가 많아
	// (레귤러 인디케이터 국기 글리프 지원이 플랫폼마다 다름) 작은 인라인 SVG로 대신한다.
	// 태극기 4괘는 이 크기(14px)에서는 안 보이므로 생략하고 원 색상만 살렸다.
	import { countryLabel } from '$lib/format';
	import { t, type Locale } from '$lib/i18n';

	let {
		locale,
		countryCode,
		isOnline = false
	}: { locale: Locale; countryCode: string | null; isOnline?: boolean } = $props();
</script>

<span class="inline-flex items-center gap-1.5 align-middle">
	{#if !isOnline && countryCode === 'KR'}
		<svg viewBox="0 0 20 14" class="h-3.5 w-5 shrink-0 rounded-[3px]" aria-hidden="true">
			<rect width="20" height="14" rx="2" fill="white" />
			<path d="M10 3a4 4 0 0 1 0 8 2 2 0 0 1 0-4 2 2 0 0 0 0-4Z" fill="#CD2E3A" />
			<path d="M10 3a4 4 0 0 0 0 8 2 2 0 0 0 0-4 2 2 0 0 1 0-4Z" fill="#0047A0" />
		</svg>
	{:else if !isOnline && countryCode === 'JP'}
		<svg viewBox="0 0 20 14" class="h-3.5 w-5 shrink-0 rounded-[3px]" aria-hidden="true">
			<rect width="20" height="14" rx="2" fill="white" />
			<circle cx="10" cy="7" r="4" fill="#BC002D" />
		</svg>
	{:else}
		<svg
			viewBox="0 0 20 20"
			class="h-3.5 w-3.5 shrink-0 text-current opacity-70"
			aria-hidden="true"
		>
			<circle cx="10" cy="10" r="7.5" fill="none" stroke="currentColor" stroke-width="1.3" />
			<ellipse
				cx="10"
				cy="10"
				rx="3.2"
				ry="7.5"
				fill="none"
				stroke="currentColor"
				stroke-width="1.3"
			/>
			<path d="M2.5 10h15" stroke="currentColor" stroke-width="1.3" />
		</svg>
	{/if}
	{isOnline ? t(locale, 'card.online') : countryLabel(locale, countryCode)}
</span>
