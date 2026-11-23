<script lang="ts">
	// 헤더 오른쪽 "설정" 메뉴 하나에 언어와 화면 모드(시스템/라이트/다크)를 모았다. 언어는 링크(현재
	// 경로와 검색조건을 유지한 채 다른 로케일 URL로 이동), 화면 모드는 버튼이다. 화면 모드 판정은
	// src/app.html의 인라인 스크립트와 같은 규칙이다 — "시스템"은 localStorage에 선택을 저장하지
	// 않고 OS 설정을 그대로 따른다. 실제 적용은 <html data-theme>에 반영하고, Tailwind의 dark:
	// variant는 그 속성을 본다(src/routes/layout.css의 @custom-variant).
	import { browser } from '$app/environment';
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import Check from '@lucide/svelte/icons/check';
	import Monitor from '@lucide/svelte/icons/monitor';
	import Moon from '@lucide/svelte/icons/moon';
	import Settings from '@lucide/svelte/icons/settings';
	import Sun from '@lucide/svelte/icons/sun';
	import { LOCALES, LOCALE_NAMES, localeHref, stripLocale, t, type Locale } from '$lib/i18n';
	import { applyThemeColor } from '$lib/theme';

	let { locale }: { locale: Locale } = $props();

	let open = $state(false);
	let root: HTMLElement | undefined = $state();
	let trigger: HTMLButtonElement | undefined = $state();

	// 언어를 바꿀 때 현재 페이지와 검색조건(쿼리스트링)은 그대로 유지한다.
	function hrefFor(target: Locale) {
		return localeHref(target, stripLocale(page.url.pathname)) + page.url.search;
	}

	// 언어 링크를 눌러 페이지가 이동하면 메뉴를 닫는다(헤더는 이동해도 그대로 남아 있기 때문).
	afterNavigate(() => {
		open = false;
	});

	function onWindowClick(event: MouseEvent) {
		if (open && root && !root.contains(event.target as Node)) open = false;
	}

	function onWindowKeydown(event: KeyboardEvent) {
		if (open && event.key === 'Escape') {
			open = false;
			trigger?.focus();
		}
	}

	type Preference = 'system' | 'light' | 'dark';

	function systemPrefersDark(): boolean {
		return browser && window.matchMedia('(prefers-color-scheme: dark)').matches;
	}

	function readStoredPreference(): Preference {
		if (!browser) return 'system';
		const stored = localStorage.getItem('theme');
		return stored === 'light' || stored === 'dark' ? stored : 'system';
	}

	function resolve(pref: Preference): 'light' | 'dark' {
		return pref === 'system' ? (systemPrefersDark() ? 'dark' : 'light') : pref;
	}

	// $derived는 쓰기도 가능하다(writable derived) — choose()에서 직접 덮어쓸 수 있다.
	// $state + $effect 조합 대신 이걸 쓰는 이유: 서버는 항상 'system'으로 렌더하지만
	// (localStorage에 접근 불가), $derived는 하이드레이션 시 클라이언트에서 다시 계산되면서
	// 그 결과가 바로 DOM에 반영된다 — $state였다면 초깃값이 서버와 다를 때 마운트 후 별도
	// effect로 한 번 더 고쳐줘야 DOM이 따라온다(Svelte가 하이드레이션된 DOM을 자동으로
	// 다시 그려주지 않기 때문).
	let preference = $derived.by(() => readStoredPreference());

	function choose(next: Preference) {
		preference = next;
		if (!browser) return;
		if (next === 'system') localStorage.removeItem('theme');
		else localStorage.setItem('theme', next);
		document.documentElement.setAttribute('data-theme', resolve(next));
		applyThemeColor(next);
	}

	// "시스템"을 선택한 상태에서 OS 설정이 바뀌면 즉시 반영한다.
	$effect(() => {
		if (!browser || preference !== 'system') return;
		const media = window.matchMedia('(prefers-color-scheme: dark)');
		const onChange = () => document.documentElement.setAttribute('data-theme', resolve('system'));
		media.addEventListener('change', onChange);
		return () => media.removeEventListener('change', onChange);
	});

	const THEME_OPTIONS = [
		{ value: 'system', key: 'theme.system', icon: Monitor },
		{ value: 'light', key: 'theme.light', icon: Sun },
		{ value: 'dark', key: 'theme.dark', icon: Moon }
	] as const;

	const sectionHeadingClass = 'px-2 pt-1 text-xs font-medium text-zinc-500 dark:text-zinc-400';
</script>

<svelte:window onclick={onWindowClick} onkeydown={onWindowKeydown} />

<div bind:this={root} class="relative">
	<button
		bind:this={trigger}
		type="button"
		aria-haspopup="true"
		aria-expanded={open}
		aria-controls="settings-panel"
		aria-label={t(locale, 'menu.settings')}
		onclick={() => (open = !open)}
		class="flex h-11 min-w-11 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors sm:h-9 sm:min-w-0 {open
			? 'bg-zinc-900/[0.06] text-zinc-900 dark:bg-white/[0.08] dark:text-zinc-50'
			: 'text-zinc-600 hover:bg-zinc-900/[0.04] hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-white/[0.06] dark:hover:text-zinc-50'}"
	>
		<Settings class="size-4" aria-hidden="true" />
		<span class="hidden sm:inline">{t(locale, 'menu.settings')}</span>
	</button>

	{#if open}
		<div
			id="settings-panel"
			class="absolute top-full right-0 z-30 mt-3 w-64 max-w-[calc(100vw-2rem)] rounded-xl border border-zinc-900/[0.08] bg-white p-2 shadow-[0_8px_24px_rgba(0,0,0,0.08)] dark:border-white/[0.08] dark:bg-zinc-900 dark:shadow-black/40"
		>
			<section aria-labelledby="settings-language">
				<h2 id="settings-language" class={sectionHeadingClass}>{t(locale, 'menu.language')}</h2>
				<ul class="mt-1.5 space-y-0.5">
					{#each LOCALES as target (target)}
						<li>
							<a
								href={hrefFor(target)}
								lang={target}
								hreflang={target}
								aria-current={target === locale ? 'true' : undefined}
								class="flex h-11 items-center justify-between rounded-lg px-2 text-sm transition-colors sm:h-9 {target ===
								locale
									? 'bg-zinc-100 font-medium text-zinc-900 dark:bg-white/[0.08] dark:text-zinc-50'
									: 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-white/5'}"
							>
								{LOCALE_NAMES[target]}
								{#if target === locale}
									<Check class="size-4 text-violet-600 dark:text-violet-400" aria-hidden="true" />
								{/if}
							</a>
						</li>
					{/each}
				</ul>
			</section>

			<section
				aria-labelledby="settings-theme"
				class="mt-2 border-t border-zinc-900/[0.08] pt-2 dark:border-white/[0.08]"
			>
				<h2 id="settings-theme" class={sectionHeadingClass}>{t(locale, 'menu.theme')}</h2>
				<div class="mt-1.5 grid grid-cols-3 gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-white/5">
					{#each THEME_OPTIONS as option (option.value)}
						{@const Icon = option.icon}
						<button
							type="button"
							onclick={() => choose(option.value)}
							aria-pressed={preference === option.value}
							class="flex flex-col items-center gap-1 rounded-md px-2 py-2 text-xs font-medium transition-colors {preference ===
							option.value
								? 'bg-white text-zinc-900 shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:bg-white/[0.12] dark:text-zinc-50'
								: 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'}"
						>
							<Icon class="size-4" aria-hidden="true" />
							{t(locale, option.key)}
						</button>
					{/each}
				</div>
			</section>
		</div>
	{/if}
</div>
