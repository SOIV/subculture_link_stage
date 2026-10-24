import { createOpenAPI } from 'fumadocs-openapi/server';
import { generateFiles } from 'fumadocs-openapi';
import path from 'node:path';
import { writeFile } from 'node:fs/promises';

for (const lang of ['ko','ja','en']) {
  const openapi = createOpenAPI({ input: { [lang]: path.resolve(`../../fixtures/openapi.${lang}.json`) } });
  await generateFiles({ input: openapi, output: `content/docs/${lang}/api`, per: 'operation', groupBy: 'none', includeDescription: true,
    name: entry => entry.type === 'operation' ? ({ '/events': 'list-events', '/events/{slug}': 'get-event', '/calendars/custom.ics': 'get-calendar' }[entry.item.path] ?? entry.item.operationId) : 'index',
  });
  await writeFile(`content/docs/${lang}/api/meta.json`, JSON.stringify({ title: lang === 'ko' ? 'API 레퍼런스' : lang === 'ja' ? 'API リファレンス' : 'API reference', pages: ['list-events','get-event','get-calendar'] }));
}
