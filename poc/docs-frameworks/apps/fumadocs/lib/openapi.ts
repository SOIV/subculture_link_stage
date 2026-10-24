import { createOpenAPI } from 'fumadocs-openapi/server';
import path from 'node:path';
export const openapi = createOpenAPI({
  input: Object.fromEntries(['ko','ja','en'].map(lang => [lang, path.resolve(`../../fixtures/openapi.${lang}.json`)])),
});
