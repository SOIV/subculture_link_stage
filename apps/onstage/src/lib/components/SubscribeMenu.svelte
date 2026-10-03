<script lang="ts">
	// "구독" 버튼 하나를 누르면 캘린더 앱별 구독 방법을 고르는 메뉴가 열린다. 평범한 .ics 링크는 대부분 일회성
	// 가져오기가 되므로, Apple(webcal://)·Google·Outlook은 앱별 링크로, 그 밖의 앱은 주소 복사로 구독한다.
	// 접속한 기기가 iPhone·iPad·Mac이면 Apple 항목을 맨 위에 둔다(서버는 기기를 알 수 없어 마운트 뒤에 정한다).
	import { onMount, type Snippet } from 'svelte';
	import Check from '@lucide/svelte/icons/check';
	import Copy from '@lucide/svelte/icons/copy';
	import Download from '@lucide/svelte/icons/download';
	import { t, type Locale } from '$lib/i18n';
	import { isAppleDevice, subscribeLinks } from '$lib/subscribe';

	let {
		locale,
		url,
		name = 'SCLS',
		placement = 'down',
		triggerClass,
		children
	}: {
		locale: Locale;
		/** 구독할 캘린더의 https 주소(.ics). */
		url: string;
		/** Outlook이 캘린더 이름으로 쓴다. */
		name?: string;
		/** 메뉴가 버튼 아래(down)로 열릴지 위(up)로 열릴지. 화면 아래쪽에 있는 버튼은 up으로 한다. */
		placement?: 'down' | 'up';
		triggerClass: string;
		children: Snippet;
	} = $props();

	let open = $state(false);
	let copied = $state(false);
	// 패널의 왼쪽 위치(px, 버튼 왼쪽 끝 기준). 화면 밖으로 잘리지 않게 안쪽으로 밀어 넣는다. transform 대신 left를 쓰는 이유는
	// transform은 원래 자리가 페이지 폭(가로 스크롤)에 계속 남기 때문이다.
	let shift = $state(0);
	let apple = $state(false);
	let root: HTMLElement | undefined = $state();
	let panel: HTMLElement | undefined = $state();
	let trigger: HTMLButtonElement | undefined = $state();
	let copiedTimer: ReturnType<typeof setTimeout> | undefined;

	let links = $derived(subscribeLinks(url, name));
	const panelId = `subscribe-${Math.random().toString(36).slice(2, 8)}`;

	onMount(() => {
		apple = isAppleDevice(navigator.userAgent);
		return () => clearTimeout(copiedTimer);
	});

	// 열렸을 때 패널이 좌우 화면 밖으로 넘치면 안쪽으로 민다. 줄 중간이나 끝에 있는 버튼도 잘리지 않게 하려는 것이다.
	$effect(() => {
		if (!open || !panel || !root) return;
		const margin = 8;
		// window.innerWidth는 패널이 넘치면 페이지 폭과 함께 커지므로, 넘쳐도 변하지 않는 clientWidth를 쓴다.
		const viewportWidth = document.documentElement.clientWidth;
		const rootLeft = root.getBoundingClientRect().left;
		let left = rootLeft;
		if (left + panel.offsetWidth > viewportWidth - margin) {
			left = viewportWidth - margin - panel.offsetWidth;
		}
		if (left < margin) left = margin;
		shift = left - rootLeft;
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

	async function copyLink() {
		try {
			await navigator.clipboard.writeText(links.https);
			copied = true;
			clearTimeout(copiedTimer);
			copiedTimer = setTimeout(() => (copied = false), 2000);
		} catch {
			// 클립보드를 쓸 수 없는 환경(권한 거부 등)이면 주소를 직접 보고 복사할 수 있게 새 탭으로 연다.
			window.open(links.https, '_blank', 'noreferrer');
		}
	}

	const itemClass =
		'flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/5';
</script>

<svelte:window onclick={onWindowClick} onkeydown={onWindowKeydown} />

<div bind:this={root} class="relative inline-block">
	<button
		bind:this={trigger}
		type="button"
		aria-haspopup="true"
		aria-expanded={open}
		aria-controls={panelId}
		onclick={() => (open = !open)}
		class={triggerClass}
	>
		{@render children()}
	</button>

	{#if open}
		<div
			bind:this={panel}
			id={panelId}
			class="absolute z-30 w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/10 dark:border-white/10 dark:bg-slate-900 dark:shadow-black/40 {placement ===
			'up'
				? 'bottom-full mb-2'
				: 'top-full mt-2'}"
			style:left="{shift}px"
		>
			<ul class="space-y-0.5">
				<!-- 기기에 맞는 항목이 위로 온다: Apple 기기는 Apple 먼저, 그 밖은 Google 먼저. -->
				{#if apple}
					<li>
						<a href={links.webcal} onclick={() => (open = false)} class={itemClass}
							>{t(locale, 'subscribe.webcal')}</a
						>
					</li>
				{/if}
				<li>
					<a
						href={links.google}
						target="_blank"
						rel="noreferrer"
						onclick={() => (open = false)}
						class={itemClass}>{t(locale, 'subscribe.google')}</a
					>
				</li>
				{#if !apple}
					<li>
						<a href={links.webcal} onclick={() => (open = false)} class={itemClass}
							>{t(locale, 'subscribe.webcal')}</a
						>
					</li>
				{/if}
				<li>
					<a
						href={links.outlook}
						target="_blank"
						rel="noreferrer"
						onclick={() => (open = false)}
						class={itemClass}>{t(locale, 'subscribe.outlook')}</a
					>
				</li>
				<li>
					<button type="button" onclick={copyLink} class={itemClass}>
						{t(locale, 'subscribe.copy')}
						{#if copied}
							<span
								class="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400"
								role="status"
							>
								<Check class="size-3.5" aria-hidden="true" />{t(locale, 'subscribe.copied')}
							</span>
						{:else}
							<Copy class="size-4 text-slate-400" aria-hidden="true" />
						{/if}
					</button>
				</li>
				<li>
					<a href={links.https} download onclick={() => (open = false)} class={itemClass}>
						{t(locale, 'subscribe.file')}
						<Download class="size-4 text-slate-400" aria-hidden="true" />
					</a>
				</li>
			</ul>
			<p
				class="mt-1 border-t border-slate-200/70 px-3 pt-2 pb-1 text-xs text-slate-500 dark:border-white/10 dark:text-slate-400"
			>
				{t(locale, 'subscribe.hint')}
			</p>
		</div>
	{/if}
</div>
