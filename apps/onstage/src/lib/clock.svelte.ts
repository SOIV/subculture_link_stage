// 화면이 쓰는 "지금" 시각. 오늘·D-day·진행 중·종료 판정은 날짜 단위라, 페이지를 오래 열어 두거나(설치한 앱,
// 행사장) 자정을 넘기면 다시 계산해야 한다. new Date()는 반응형이 아니라서 $derived 안에서 그대로 쓰면
// 입력 데이터가 바뀌기 전까지 다시 계산되지 않는다 — 그래서 이 now()를 쓴다.
//
// - 브라우저: 15분 경계마다(30·45분 오프셋을 포함해 모든 시간대의 자정이 여기에 걸린다), 그리고 화면으로
//   돌아올 때(백그라운드에서는 타이머가 늦어진다) 갱신한다. 카드마다 타이머를 두지 않고 하나를 같이 쓴다.
// - 서버: 요청마다 그 순간의 시각(모듈 상태는 요청끼리 공유되므로 고정해 두지 않는다).
import { browser } from '$app/environment';

const TICK_MS = 15 * 60 * 1000;

let current = $state(Date.now());
let started = false;

// 돌려주는 Date는 읽기만 하는 그 순간의 값이다. 반응성은 current($state)를 읽는 것으로 생기므로
// SvelteDate(바꿀 수 있는 반응형 Date)가 필요 없다.
export function now(): Date {
	// eslint-disable-next-line svelte/prefer-svelte-reactivity
	if (!browser) return new Date();
	start();
	// eslint-disable-next-line svelte/prefer-svelte-reactivity
	return new Date(current);
}

function start() {
	if (started) return;
	started = true;
	const tick = () => {
		current = Date.now();
	};
	const scheduleNext = () => {
		// 경계 바로 뒤(1초)에 깨어나도록 맞춘다.
		const delay = TICK_MS - (Date.now() % TICK_MS) + 1000;
		setTimeout(() => {
			tick();
			scheduleNext();
		}, delay);
	};
	scheduleNext();
	document.addEventListener('visibilitychange', () => {
		if (document.visibilityState === 'visible') tick();
	});
	window.addEventListener('pageshow', tick);
}
