<script lang="ts">
	// 메인 페이지의 "추천 행사(광고)" 자리. 아직 광고 데이터가 없어서 운영 화면에서는 아무것도 그리지
	// 않고(빈 자리가 남지 않게), 개발 모드에서만 점선 자리 표시로 위치를 보여 준다. 광고를 실제로 연결할
	// 때는 events에 광고 대상 행사를 넘기면 된다 — 광고 표시(ad.label)와 일반 목록(곧 열리는 행사 등)과의
	// 구분은 이 컴포넌트가 책임진다. 광고 등록·과금·표기 정책은 아직 정해지지 않았다.
	import type { EventSummary } from '$lib/api';
	import { t, type Locale } from '$lib/i18n';
	import type { TagIndex } from '$lib/tags';
	import EventCard from './EventCard.svelte';

	let { events, locale, tagIndex }: { events: EventSummary[]; locale: Locale; tagIndex: TagIndex } =
		$props();
</script>

{#if events.length > 0}
	<section class="space-y-4">
		<div class="flex items-center gap-2">
			<h2 class="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
				{t(locale, 'home.promoted')}
			</h2>
			<span
				class="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-white/10 dark:text-slate-300"
			>
				{t(locale, 'ad.label')}
			</span>
		</div>
		<div class="grid gap-4 sm:grid-cols-2">
			{#each events as event (event.id)}
				<EventCard {event} {locale} {tagIndex} promoted />
			{/each}
		</div>
	</section>
{:else if import.meta.env.DEV}
	<section
		aria-hidden="true"
		class="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400 dark:border-slate-700 dark:text-slate-500"
	>
		{t(locale, 'home.promoted')} · {t(locale, 'home.promoted.placeholder')}
	</section>
{/if}
