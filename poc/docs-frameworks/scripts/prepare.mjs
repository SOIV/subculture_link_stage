import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const root = fileURLToPath(new URL('../', import.meta.url));
export const locales = ['ko', 'ja', 'en'];
export const apiBase = process.env.POC_API_BASE_URL ?? 'http://127.0.0.1:4310/v1';
export const text = {
  ko: {
    guide: '행사 API 빠른 시작',
    intro: '행사 목록과 티켓 정보를 조회합니다. 캘린더 구독은 ICS 피드를 사용합니다.',
    details: '한국·일본 행사 검색. 티켓 정보. 캘린더 구독.',
    subscription: '캘린더 구독 안내',
    subscribeBody: '캘린더 구독 주소를 복사해서 Google Calendar 또는 Apple 캘린더에 추가합니다.',
    missing: '이 페이지는 아직 번역되지 않았습니다. 한국어 원문을 표시합니다.',
    api: 'API 레퍼런스', list: '행사 목록 조회', detail: '행사 상세 조회', calendar: '캘린더 피드 조회',
    description: '공개 행사 정보를 조회합니다. 나라와 태그로 필터링할 수 있습니다.',
    country: '개최 국가 코드입니다. 예: JP 또는 KR.',
    locale: 'API 응답 콘텐츠의 언어입니다. 문서 화면 언어와 독립적입니다.',
    response: '행사 목록 응답', search: '문서 검색',
  },
  ja: {
    guide: 'イベント API クイックスタート',
    intro: 'イベント一覧とチケット情報を取得します。カレンダー購読には ICS フィードを使います。',
    details: '韓国と日本: イベント検索、チケット情報、カレンダー購読。',
    subscription: 'カレンダー購読ガイド',
    subscribeBody: '購読 URL をコピーし、Google Calendar または Apple カレンダーに追加します。',
    missing: 'このページは未翻訳です。韓国語の原文を表示しています。',
    api: 'API リファレンス', list: 'イベント一覧を取得', detail: 'イベント詳細を取得', calendar: 'カレンダーフィードを取得',
    description: '公開イベント情報を取得します。国とタグで絞り込めます。',
    country: '開催国コードです。例: JP または KR。',
    locale: 'API 応答コンテンツの言語です。文書の表示言語とは独立しています。',
    response: 'イベント一覧の応答', search: 'ドキュメント検索',
  },
  en: {
    guide: 'Event API quick start',
    intro: 'Read event and ticket information. Use an ICS feed to subscribe to a calendar.',
    details: 'Find events in Korea and Japan, inspect tickets, and subscribe to event schedules.',
    subscription: 'Calendar subscription guide',
    subscribeBody: 'Copy the subscription URL into Google Calendar or Apple Calendar.',
    missing: 'This page is not translated yet. Showing the Korean original.',
    api: 'API reference', list: 'List events', detail: 'Get event details', calendar: 'Get calendar feed',
    description: 'Read public events. Filter by country and tags.',
    country: 'Country code where the event takes place, such as JP or KR.',
    locale: 'Language of the API response content, independent from the documentation language.',
    response: 'Event list response', search: 'Search documentation',
  },
};

const eventSchema = {
  type: 'object', required: ['id', 'slug', 'locale', 'title'],
  properties: {
    id: { type: 'string' }, slug: { type: 'string' }, locale: { type: 'string', enum: locales },
    title: { type: 'string' }, countryCode: { type: 'string' },
  },
};

export function schema(lang) {
  const t = text[lang];
  const localeParam = { name: 'locale', in: 'query', description: t.locale, schema: { type: 'string', enum: locales, default: 'ko' } };
  const errors = {
    400: { description: 'VALIDATION_ERROR', content: { 'application/json': { schema: { type: 'object' }, example: { success: false, error: 'VALIDATION_ERROR' } } } },
    429: { description: 'RATE_LIMITED', content: { 'application/json': { schema: { type: 'object' }, example: { success: false, error: 'RATE_LIMITED' } } } },
  };
  return {
    openapi: '3.1.0', info: { title: 'SCLS Docs PoC API', version: '1.0.0', description: t.description },
    servers: [{ url: apiBase, description: 'Local deterministic fixture (not production)' }],
    tags: [{ name: 'events', description: t.list }, { name: 'calendars', description: t.calendar }],
    paths: {
      '/events': { get: { operationId: 'listEvents', summary: t.list, description: t.description, tags: ['events'],
        parameters: [localeParam, { name: 'country', in: 'query', description: t.country, schema: { type: 'string', minLength: 2, maxLength: 2 } }, ...['tags','from','to','q'].map(name => ({ name, in: 'query', schema: { type: 'string' } }))],
        responses: { 200: { description: t.response, content: { 'application/json': { schema: { type: 'object', properties: { success: { const: true }, data: { type: 'object', properties: { count: { type: 'integer' }, items: { type: 'array', items: eventSchema } } } } } } } }, ...errors },
      } },
      '/events/{slug}': { get: { operationId: 'getEvent', summary: t.detail, description: t.description, tags: ['events'],
        parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string', default: 'poc-event' } }, localeParam],
        responses: { 200: { description: t.detail, content: { 'application/json': { schema: { type: 'object', properties: { success: { const: true }, data: eventSchema } } } } }, 404: { description: 'EVENT_NOT_FOUND' }, ...errors },
      } },
      '/calendars/custom.ics': { get: { operationId: 'getCalendar', summary: t.calendar, description: t.subscribeBody, tags: ['calendars'],
        parameters: [localeParam, { name: 'country', in: 'query', description: t.country, schema: { type: 'string', minLength: 2, maxLength: 2 } }],
        responses: { 200: { description: 'ICS calendar (RFC 5545)', content: { 'text/calendar': { schema: { type: 'string' }, example: 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nEND:VCALENDAR' } } }, ...errors },
      } },
    },
  };
}

async function put(relative, content) {
  const destination = path.join(root, relative);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, content);
}

for (const lang of locales) {
  const t = text[lang];
  const spec = JSON.stringify(schema(lang), null, 2) + '\n';
  for (const app of ['starlight','fumadocs']) await put(`apps/${app}/public/openapi.${lang}.json`, spec);
  await put(`fixtures/openapi.${lang}.json`, spec);
  const content = `---\ntitle: ${t.guide}\ndescription: ${t.intro}\n---\n\n${t.intro}\n\n${t.details}\n\n## GET /v1/events\n\n\`country\`, \`tags\`, \`from\`, \`to\`, \`q\`, \`locale\`\n\n\`\`\`js\nconst response = await fetch('${apiBase}/events?country=JP&locale=ja');\nconst result = await response.json();\n\`\`\`\n\n[${t.api}](/${lang}/api/)\n`;
  // Keep URL-relative and source-file-relative links distinct for the audit.
  await put(`apps/starlight/src/content/docs/${lang}/guide.md`, content + '\n[relative-url-probe](subscription/)\n\n[relative-file-probe](./subscription.md)\n');
  await put(`apps/fumadocs/content/docs/${lang}/guide.mdx`, content + '\n[relative-url-probe](subscription/)\n\n[relative-file-probe](./subscription.mdx)\n');
  // Use base forms only; supplement.mjs asserts queried inflections are absent.
  const probeBody = lang === 'ko' ? '티켓\n\n구독\n\n행사' : lang === 'ja' ? 'イベント\n\nチケット\n\n購読' : 'ticket\n\nsubscription\n\nevent';
  const probe = `---\ntitle: Search control ${lang}\n---\n\n${probeBody}\n\nv1\n\n/v1/events\n\nretryAfterSeconds\n`;
  await put(`apps/starlight/src/content/docs/${lang}/search-probe.md`, probe);
  await put(`apps/fumadocs/content/docs/${lang}/search-probe.mdx`, probe);
  // Deliberately omit en/subscription to compare missing-translation behavior.
  if (lang !== 'en') {
    const subscription = `---\ntitle: ${t.subscription}\n---\n\n${t.subscribeBody}\n\n\`text/calendar\` · ICS · \`locale=${lang}\`\n`;
    await put(`apps/starlight/src/content/docs/${lang}/subscription.md`, subscription);
    await put(`apps/fumadocs/content/docs/${lang}/subscription.mdx`, subscription);
  }
  const meta = { title: 'SCLS Docs PoC', pages: ['guide','subscription','api','search-probe'] };
  await put(`apps/fumadocs/content/docs/${lang}/meta.json`, JSON.stringify(meta, null, 2));
  await put(`apps/fumadocs/content/docs/${lang}/api/index.mdx`, `---\ntitle: ${t.api}\n---\n\n- [${t.list}](/${lang}/api/list-events/)\n- [${t.detail}](/${lang}/api/get-event/)\n- [${t.calendar}](/${lang}/api/get-calendar/)\n`);
}
await put('fixtures/content.json', JSON.stringify(text, null, 2));
const scalarEntry = import.meta.resolve('@scalar/api-reference');
await put('apps/starlight/public/vendor/scalar.js', await readFile(new URL('./browser/standalone.js', scalarEntry)));
console.log(`Prepared 3 localized OpenAPI documents and identical guides. API: ${apiBase}`);
