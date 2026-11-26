/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-cloudflare';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
	// 콘텐츠 보안 정책의 connect-src에 공개 API 주소를 넣는다(.env 또는 빌드 환경 변수).
	const env = { ...loadEnv(mode, process.cwd(), 'PUBLIC_'), ...process.env };
	const apiOrigin = env.PUBLIC_API_BASE_URL
		? (new URL(env.PUBLIC_API_BASE_URL).origin as `${string}://${string}.${string}`)
		: undefined;

	return {
		plugins: [
			tailwindcss(),
			sveltekit({
				compilerOptions: {
					// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
					runes: ({ filename }) =>
						filename.split(/[/\\]/).includes('node_modules') ? undefined : true
				},
				adapter: adapter(),
				// 앱 파일 주소를 절대 경로(/_app/…)로 쓴다. 오프라인용 앱 껍데기(src/routes/app-shell)는 다른
				// 주소(/events/… 등)의 응답으로 쓰이는데, 상대 경로(./_app/…)면 그 주소 기준으로 풀려 못 찾는다.
				paths: { relative: false },
				// 콘텐츠 보안 정책. 스크립트는 이 사이트 것과 SvelteKit이 nonce를 붙인 인라인(테마 결정 스크립트
				// 포함, src/app.html)만 실행된다. 스타일은 Svelte의 style 속성(시리즈 색)·Tailwind 때문에 인라인을
				// 허용하고, 글꼴은 Google Fonts만 받는다. 다른 사이트가 이 페이지를 iframe에 넣지 못하게 한다.
				csp: {
					mode: 'auto',
					directives: {
						'default-src': ['self'],
						'script-src': ['self'],
						'style-src': ['self', 'unsafe-inline', 'https://fonts.googleapis.com'],
						'font-src': ['self', 'https://fonts.gstatic.com'],
						'img-src': ['self', 'data:'],
						'connect-src': ['self', ...(apiOrigin ? [apiOrigin] : [])],
						'manifest-src': ['self'],
						'worker-src': ['self'],
						'object-src': ['none'],
						'base-uri': ['self'],
						'form-action': ['self'],
						'frame-ancestors': ['none']
					}
				}
			})
		],
		test: {
			include: ['src/**/*.test.ts'],
			environment: 'node',
			// 날짜 계산이 실행 환경 시간대에 기대지 않는지 보려고 서버(Cloudflare Workers)와 같은 UTC로 돌린다.
			env: { TZ: 'UTC' }
		}
	};
});
