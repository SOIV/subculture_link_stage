<script lang="ts">
	// 시스템/라이트/다크 3단 전환. "시스템"은 localStorage에 선택을 저장하지 않고 OS 설정을
	// 그대로 따른다(src/app.html의 인라인 스크립트와 같은 판정 로직). 실제 적용은
	// <html data-theme>에 반영하고, Tailwind의 dark: variant는 그 속성을 본다
	// (src/routes/layout.css의 @custom-variant).
	import { browser } from '$app/environment';
	import { t, type Locale } from '$lib/i18n';

	let { locale }: { locale: Locale } = $props();

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
	}

	// "시스템"을 선택한 상태에서 OS 설정이 바뀌면 즉시 반영한다.
	$effect(() => {
		if (!browser || preference !== 'system') return;
		const media = window.matchMedia('(prefers-color-scheme: dark)');
		const onChange = () => document.documentElement.setAttribute('data-theme', resolve('system'));
		media.addEventListener('change', onChange);
		return () => media.removeEventListener('change', onChange);
	});

	const OPTIONS: { value: Preference; key: 'theme.system' | 'theme.light' | 'theme.dark' }[] = [
		{ value: 'system', key: 'theme.system' },
		{ value: 'light', key: 'theme.light' },
		{ value: 'dark', key: 'theme.dark' }
	];
</script>

<div
	class="flex items-center gap-1 rounded-full border border-slate-200/70 bg-white/50 p-1 backdrop-blur-sm dark:border-white/10 dark:bg-white/5"
>
	{#each OPTIONS as option (option.value)}
		<button
			type="button"
			onclick={() => choose(option.value)}
			aria-pressed={preference === option.value}
			class="rounded-full px-2.5 py-1 text-xs font-bold transition-colors {preference ===
			option.value
				? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-sm'
				: 'text-slate-500 hover:text-violet-600 dark:text-slate-400 dark:hover:text-violet-400'}"
		>
			{t(locale, option.key)}
		</button>
	{/each}
</div>
