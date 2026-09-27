// 행사 시리즈별 포인트 색. 시리즈가 없는 단독 행사는 자기 slug로 대신한다.
// 같은 시드값은 항상 같은 색을 돌려준다 — 서버·클라이언트 렌더가 어긋나지 않도록
// Math.random 대신 문자열 해시를 쓴다. 팔레트는 Tailwind 기본 색상(violet/pink/cyan/
// amber/emerald/sky/rose/indigo) 500번대 oklch 값을 그대로 옮겨 전체 톤과 어울리게 했다.
const PALETTE = [
	'oklch(60.6% 0.25 292.717)', // violet
	'oklch(65.6% 0.241 354.308)', // pink
	'oklch(71.5% 0.143 215.221)', // cyan
	'oklch(76.9% 0.188 70.08)', // amber
	'oklch(69.6% 0.17 162.48)', // emerald
	'oklch(68.5% 0.169 237.323)', // sky
	'oklch(64.5% 0.246 16.439)', // rose
	'oklch(58.5% 0.233 277.117)' // indigo
] as const;

function hash(value: string): number {
	let h = 0;
	for (let i = 0; i < value.length; i++) {
		h = (Math.imul(h, 31) + value.charCodeAt(i)) >>> 0;
	}
	return h;
}

export function accentColor(seed: string): string {
	return PALETTE[hash(seed) % PALETTE.length];
}
