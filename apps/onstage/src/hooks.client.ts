import type { HandleClientError } from '@sveltejs/kit';
import { ScLsApiError } from '$lib/api';

// 브라우저에서 load가 던진 오류를 오류 화면에 넘길 모양으로 바꾼다. 공개 API 실패면 원인 코드를 함께 넘겨,
// 통신 실패(NETWORK_ERROR)일 때 오류 화면이 오프라인 안내를 띄우게 한다(+error.svelte).
export const handleError: HandleClientError = ({ error, message }) => {
	if (error instanceof ScLsApiError) return { message, code: error.code };
	return { message };
};
