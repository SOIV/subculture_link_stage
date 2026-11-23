// API에서 온 외부 주소(공식 사이트·예매처 등)를 링크로 만들기 전에 거르는 곳. API도 주소를 검사하지만,
// 화면에서도 http(s)만 링크로 만든다 — javascript:·data: 같은 주소가 섞여 들어와도 실행되지 않게 한다.
const ALLOWED_PROTOCOLS = ['https:', 'http:'];

/** 링크로 써도 되는 주소면 정리된 주소를, 아니면(형식 오류·허용하지 않는 protocol) null. */
export function safeExternalUrl(value: string | null | undefined): string | null {
	if (!value) return null;
	try {
		const url = new URL(value);
		return ALLOWED_PROTOCOLS.includes(url.protocol) ? url.href : null;
	} catch {
		return null;
	}
}
