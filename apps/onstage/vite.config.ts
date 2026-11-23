/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-cloudflare';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter()
		})
	],
	test: {
		include: ['src/**/*.test.ts'],
		environment: 'node',
		// 날짜 계산이 실행 환경 시간대에 기대지 않는지 보려고 서버(Cloudflare Workers)와 같은 UTC로 돌린다.
		env: { TZ: 'UTC' }
	}
});
