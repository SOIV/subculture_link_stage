import { chromium } from 'playwright';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = fileURLToPath(new URL('../', import.meta.url));
const onlyCase = process.argv.includes('--case') ? process.argv[process.argv.indexOf('--case') + 1] : undefined;
const previous = onlyCase ? JSON.parse(await readFile(path.join(root, 'artifacts/browser-results.json'), 'utf8')) : undefined;
const labels = JSON.parse(await readFile(path.join(root, 'fixtures/content.json'), 'utf8'));
const browser = await chromium.launch({ headless: true });
const results = { date: '2026-10-24', environment: { node: process.version, browser: browser.version(), platform: process.platform }, checks: previous?.checks.filter(check => check.name !== onlyCase) ?? [], searches: previous?.searches ?? [], errors: [], lastRunCase: onlyCase ?? 'all' };
const apps = [
  { name: 'starlight-scalar', base: 'http://127.0.0.1:4321', api: lang => `/${lang}/api/`, open: /요청 테스트|リクエストをテスト|Test Request/ },
  { name: 'fumadocs', base: 'http://127.0.0.1:4322', api: lang => `/${lang}/api/list-events/`, open: /API 호출 실습|API リクエストを試す|Try in Playground/ },
];
await mkdir(path.join(root, 'artifacts'), { recursive: true });

async function pageFor(app) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.setDefaultTimeout(6500);
  page.on('pageerror', error => results.errors.push({ app: app.name, url: page.url(), message: error.message }));
  return page;
}
async function check(app, name, fn) {
  if (onlyCase && name !== onlyCase) return;
  const started = Date.now();
  const page = await pageFor(app);
  try {
    const detail = await fn(page);
    results.checks.push({ app: app.name, name, pass: true, milliseconds: Date.now() - started, detail });
    console.log(`PASS ${app.name}: ${name}`);
  } catch (error) {
    results.checks.push({ app: app.name, name, pass: false, milliseconds: Date.now() - started, error: error.message.slice(0, 1200) });
    console.log(`FAIL ${app.name}: ${name}: ${error.message.slice(0, 180)}`);
    await page.screenshot({ path: path.join(root, 'artifacts', `${app.name}-${name.replace(/[^a-z0-9-]/gi, '_')}.png`) }).catch(() => {});
  } finally { await page.close(); }
}
async function openPlayground(page, app, lang, route) {
  await page.goto(app.base + (route ?? app.api(lang)));
  await page.getByRole('button', { name: app.open }).first().click();
  return page.getByRole('dialog').last();
}
async function send(page, dialog, app) {
  const response = page.waitForResponse(res => res.url().startsWith('http://127.0.0.1:4310/v1/'), { timeout: 6500 });
  const buttons = dialog.getByRole('button', { name: /^(요청 보내기|送信|Send)(\b|\s|$)/ });
  await buttons.first().click();
  return response;
}

for (const app of apps) {
  for (const lang of ['ko', 'ja', 'en']) {
    await check(app, `guide-${lang}`, async page => {
      const response = await page.goto(`${app.base}/${lang}/guide/`);
      assert.equal(response.status(), 200);
      assert.equal(await page.locator('html').getAttribute('lang'), lang);
      assert.equal((await page.getByRole('heading', { level: 1 }).first().innerText()).trim(), labels[lang].guide);
      return { language: lang, title: labels[lang].guide };
    });
    await check(app, `openapi-${lang}`, async page => {
      await page.goto(app.base + app.api(lang));
      await page.getByRole('button', { name: app.open }).first().waitFor();
      const body = await page.locator('body').innerText();
      assert(body.includes(labels[lang].list));
      assert(body.includes(labels[lang].country));
      await page.screenshot({ path: path.join(root, 'artifacts', `${app.name}-${lang}.png`), fullPage: true });
      return { description: labels[lang].country, htmlLanguage: await page.locator('html').getAttribute('lang') };
    });
  }
  await check(app, 'missing-translation', async page => {
    await page.goto(`${app.base}/en/subscription/`);
    const body = await page.locator('body').innerText();
    assert(body.includes(labels.ko.subscribeBody));
    assert(/not.*translated|not available in your language|translation.*not|아직.*번역|未翻訳/i.test(body));
    return { koreanOriginal: true, notice: true };
  });
  await check(app, 'native-guide-language-switch', async page => {
    await page.goto(`${app.base}/ko/guide/`);
    if (app.name === 'starlight-scalar') {
      await page.locator('select').filter({ has: page.locator('option[value="/ja/guide/"]') }).first().selectOption('/ja/guide/');
    } else {
      await page.getByRole('button', { name: '언어 선택', exact: true }).first().click();
      await page.getByRole('button', { name: '日本語', exact: true }).click();
    }
    await page.waitForURL('**/ja/guide/');
    await page.getByRole('heading', { name: labels.ja.guide, exact: true }).waitFor();
    return { url: page.url() };
  });
  await check(app, 'guide-to-api-navigation', async page => {
    await page.goto(`${app.base}/ja/guide/`);
    const target = page.getByRole('link', { name: labels.ja.api, exact: true }).last();
    await target.click();
    if (app.name === 'fumadocs') await page.getByRole('link', { name: labels.ja.list, exact: true }).last().click();
    await page.getByRole('button', { name: app.open }).first().waitFor();
    assert(new URL(page.url()).pathname.startsWith('/ja/api'));
    return { url: page.url(), playgroundAfterNavigation: true };
  });
  await check(app, 'native-api-language-preserves-operation', async page => {
    const route = app.name === 'fumadocs' ? '/ko/api/get-event/' : '/ko/api/#tag/events/GET/events/{slug}';
    await page.goto(app.base + route);
    if (app.name === 'starlight-scalar') {
      await page.getByRole('button', { name: app.open }).first().waitFor();
      await page.locator('select').filter({ has: page.locator('option[value="/ja/api/"]') }).first().selectOption('/ja/api/');
    } else {
      await page.getByRole('button', { name: '언어 선택', exact: true }).first().click();
      await page.getByRole('button', { name: '日本語', exact: true }).click();
    }
    await page.waitForURL('**/ja/api/**');
    const url = new URL(page.url());
    if (app.name === 'fumadocs') assert.equal(url.pathname, '/ja/api/get-event/');
    else assert.equal(decodeURIComponent(url.hash), '#tag/events/GET/events/{slug}');
    return { url: page.url() };
  });
  await check(app, 'json-response-and-errors', async page => {
    const dialog = await openPlayground(page, app, 'ja');
    const statuses = [];
    for (const expected of [200, 400, 429]) {
      if (expected !== 200) await page.request.get(`http://127.0.0.1:4310/__poc/status?next=${expected}`);
      const response = await send(page, dialog, app);
      statuses.push(response.status());
      assert.equal(response.status(), expected);
      const marker = expected === 200 ? 'poc-event' : expected === 400 ? 'VALIDATION_ERROR' : 'RATE_LIMITED';
      await dialog.getByText(new RegExp(marker)).first().waitFor();
    }
    return { statuses, documentLanguage: 'ja', initialResponseLanguage: 'ko', responseDisplayed: true };
  });
  await check(app, 'ics-response', async page => {
    const route = app.name === 'fumadocs' ? '/ja/api/get-calendar/' : '/ja/api/';
    await page.goto(app.base + route);
    if (app.name === 'starlight-scalar') {
      // Scalar lazily mounts the selected operation; choose the calendar operation first.
      await page.getByRole('button', { name: app.open }).first().waitFor();
      const calendarLink = page.getByRole('link').filter({ hasText: '/calendars/custom.ics' }).first();
      if (await calendarLink.count()) await calendarLink.click();
      else await page.locator('[id*="calendars"]').first().scrollIntoViewIfNeeded();
    }
    const requestButton = app.name === 'fumadocs' ? page.getByRole('button', { name: app.open }).first() : page.getByRole('button', { name: /リクエストをテスト.*calendars/ });
    await requestButton.click();
    const dialog = page.getByRole('dialog').last();
    const response = await send(page, dialog, app);
    assert.equal(response.status(), 200);
    assert(response.headers()['content-type'].startsWith('text/calendar'));
    await dialog.getByText(/BEGIN:VCALENDAR/).first().waitFor();
    return { status: 200, type: response.headers()['content-type'], rawCalendarDisplayed: true };
  });
  await check(app, 'api-locale-independent-from-doc-language', async page => {
    const dialog = await openPlayground(page, app, 'ja');
    if (app.name === 'fumadocs') {
      await dialog.getByRole('combobox').first().click();
      await page.getByRole('option', { name: 'en', exact: true }).click();
    } else {
      const row = dialog.getByRole('row').filter({ hasText: /locale/ }).first();
      await row.getByRole('button', { name: 'ko', exact: true }).click();
      await page.getByRole('menuitem', { name: 'en', exact: true }).click();
    }
    const response = await send(page, dialog, app);
    const data = await response.json();
    assert.equal(data.data.items[0].locale, 'en');
    assert.equal(await page.locator('html').getAttribute('lang'), 'ja');
    return { request: response.url(), responseLocale: data.data.items[0].locale, documentLanguage: 'ja' };
  });
  await check(app, 'localized-search-ui', async page => {
    await page.goto(`${app.base}/ja/guide/`);
    await page.getByRole('button', { name: app.name === 'fumadocs' ? /ドキュメント検索/ : /^検索/ }).first().click();
    const dialog = page.getByRole('dialog').last();
    await dialog.locator('input:visible').first().fill('イベント');
    await page.waitForTimeout(450);
    const body = await dialog.innerText();
    assert(!/Search failed/i.test(body));
    assert(body.includes('イベント'));
    return { text: body.slice(0, 900) };
  });
  if (app.name === 'starlight-scalar') {
    await check(app, 'scalar-native-api-search', async page => {
      await page.goto(app.base + app.api('ja'));
      const trigger = page.locator('.scalar-shell').getByRole('button', { name: /API 検索を開く/ }).first();
      await trigger.click();
      const dialog = page.getByRole('dialog').last();
      await dialog.getByRole('combobox').fill(labels.ja.detail);
      const result = dialog.getByRole('option').filter({ hasText: labels.ja.detail });
      await result.first().waitFor();
      return { results: await result.allTextContents(), scope: 'API reference only' };
    });
  } else {
    await check(app, 'site-search-opens-generated-api-page', async page => {
      await page.goto(`${app.base}/ko/guide/`);
      await page.getByRole('button', { name: /문서 검색/ }).first().click();
      const dialog = page.getByRole('dialog').last();
      await dialog.getByRole('combobox').fill(labels.ko.list);
      await dialog.getByRole('option', { name: /^SCLS Docs PoC.*행사 목록 조회$/ }).click();
      await page.waitForURL('**/ko/api/list-events/**');
      await page.getByRole('button', { name: app.open }).first().waitFor();
      return { url: page.url(), scope: 'guides and generated API pages' };
    });
  }
  if (onlyCase) continue;
  const queries = { ko: ['행사', '행사를', '티켓', '티켓을', '캘린더', '행사 목록 조회', '개최 국가'], ja: ['イベント', 'カレンダー', 'チケット', 'イベント一覧を取得', '開催国'], en: ['events', 'locale'] };
  const searchPage = await pageFor(app);
  try {
    for (const [lang, terms] of Object.entries(queries)) {
      await searchPage.goto(`${app.base}/${lang}/guide/`);
      if (app.name === 'fumadocs') await searchPage.getByRole('button', { name: /문서 검색|ドキュメント検索|Search/ }).first().click();
      for (const query of terms) {
        let hits;
        if (app.name === 'starlight-scalar') {
          hits = await searchPage.evaluate(async query => {
            const index = await import('/pagefind/pagefind.js');
            const response = await index.search(query);
            return await Promise.all(response.results.slice(0, 8).map(async result => { const data = await result.data(); return { url: data.url, title: data.meta.title }; }));
          }, query);
        } else {
          const dialog = searchPage.getByRole('dialog').last();
          await dialog.locator('input:visible').first().fill(query);
          await searchPage.waitForTimeout(300);
          hits = await dialog.getByRole('option').evaluateAll(elements => elements.map(el => ({ url: el.getAttribute('data-value') ?? el.getAttribute('value'), title: el.textContent.trim().slice(0, 150) })));
        }
        results.searches.push({ app: app.name, language: lang, query, hits });
      }
    }
  } catch (error) { results.errors.push({ app: app.name, area: 'search-measurement', message: error.message }); }
  await searchPage.close();
}
results.summary = Object.fromEntries(apps.map(app => {
  const checks = results.checks.filter(check => check.app === app.name);
  return [app.name, { passed: checks.filter(check => check.pass).length, total: checks.length }];
}));
await writeFile(path.join(root, 'artifacts/browser-results.json'), JSON.stringify(results, null, 2) + '\n');
await browser.close();
console.log(JSON.stringify(results.summary));
if (results.checks.some(check => !check.pass) || results.errors.length) process.exitCode = 1;
