// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Platform {
			env: Env;
			ctx: ExecutionContext;
			caches: CacheStorage;
			cf?: IncomingRequestCfProperties;
		}

		interface Error {
			message: string;
			/** 공개 API 호출이 실패했을 때 그 원인 코드(ScLsApiError.code — src/hooks.client.ts). */
			code?: string;
		}
		// interface Locals {}
		interface PageData {
			seo?: import('$lib/seo').PageSeo;
		}
		// interface PageState {}
	}
}

export {};
