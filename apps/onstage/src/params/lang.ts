import type { ParamMatcher } from '@sveltejs/kit';
import { PREFIXED_LOCALES } from '$lib/i18n';

// [[lang=lang]]에서 쓰는 매처. 기본 로케일(ko)은 URL에 접두사를 붙이지 않으므로
// 여기에는 접두사가 붙는 로케일(ja, en)만 허용한다 — /ko와 /가 같은 내용을 중복
// 제공하는 것을 막기 위해서다.
export const match: ParamMatcher = (param) =>
	PREFIXED_LOCALES.includes(param as (typeof PREFIXED_LOCALES)[number]);
