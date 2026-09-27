import prettier from 'eslint-config-prettier';
import path from 'node:path';
import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import { defineConfig, includeIgnoreFile } from 'eslint/config';
import globals from 'globals';
import ts from 'typescript-eslint';

const gitignorePath = path.resolve(import.meta.dirname, '.gitignore');

export default defineConfig(
	includeIgnoreFile(gitignorePath),
	js.configs.recommended,
	ts.configs.recommended,
	svelte.configs.recommended,
	prettier,
	svelte.configs.prettier,
	{
		languageOptions: { globals: { ...globals.browser, ...globals.node } },
		rules: {
			// typescript-eslint strongly recommend that you do not use the no-undef lint rule on TypeScript projects.
			// see: https://typescript-eslint.io/troubleshooting/faqs/eslint/#i-get-errors-from-the-no-undef-rule-about-global-variables-not-being-defined-even-though-there-are-no-typescript-errors
			'no-undef': 'off'
		}
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
		languageOptions: {
			parserOptions: {
				projectService: true,
				extraFileExtensions: ['.svelte'],
				parser: ts.parser
			}
		}
	},
	{
		// Override or add rule settings here, such as:
		// 'svelte/button-has-type': 'error'
		rules: {
			// kit.paths.base를 쓰지 않고(항상 ""), 로케일 접두사(/ja, /en)가 붙은 내부 경로는
			// $lib/i18n의 localeHref/stripLocale로 직접 만든다 — 이 작은 라우트 트리 안에서는
			// 이미 정확함이 보장돼 있어 resolve()의 이점(동적으로 만든 문자열을 리터럴
			// Pathname 타입에 맞추기 어렵다)보다 비용이 크다. 외부 링크(공식 사이트, 지도,
			// API의 ICS/JSON URL)에는 애초에 안 맞는 규칙이기도 하다.
			'svelte/no-navigation-without-resolve': 'off'
		}
	}
);
