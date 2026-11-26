import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

// 오프라인용 앱 껍데기. 서버는 이 주소에 화면 없이 앱 스크립트만 든 HTML을 준다(ssr = false). service
// worker가 설치할 때 받아 두었다가, 저장된 HTML이 없는 주소를 오프라인에서 열면 이것을 대신 준다. 그러면
// 앱이 주소창의 원래 주소로 화면을 그리며 공개 API를 부르고, worker가 API 저장본으로 답한다.
// 이 주소를 직접 열었을 때만 아래 load가 돌아 메인으로 보낸다.
export const ssr = false;
export const prerender = false;

export const load: PageLoad = () => {
	redirect(307, '/');
};
