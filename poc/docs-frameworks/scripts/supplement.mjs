import { chromium } from 'playwright';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { uiTranslations } from 'fumadocs-ui/i18n';
import { openapiTranslations } from 'fumadocs-openapi/i18n';
import { translations } from '../apps/fumadocs/lib/translations.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const resultPath = path.join(root, 'artifacts/browser-results.json');
const results = JSON.parse(await readFile(resultPath, 'utf8'));
const probeSchema = JSON.parse(await readFile(path.join(root,'fixtures/openapi.ja.json'),'utf8'));
const browser = await chromium.launch({ headless: true });
results.supplementalChecks = [];
results.searches = results.searches.filter(item => item.suite !== 'controlled-morphology-identifiers');
results.supplement = { date: '2026-10-24', browser: browser.version(), viewport: { width: 1440, height: 1000 }, errors: [] };
const apps = [
  { name: 'starlight-scalar', base: 'http://127.0.0.1:4321', source: 'apps/starlight/src/content/docs', ext: 'md' },
  { name: 'fumadocs', base: 'http://127.0.0.1:4322', source: 'apps/fumadocs/content/docs', ext: 'mdx' },
];
async function newPage() {
  const page = await browser.newPage({ viewport: results.supplement.viewport });
  page.setDefaultTimeout(6500);
  page.on('pageerror', error => results.supplement.errors.push({ url: page.url(), message: error.message }));
  return page;
}
async function observe(app, name, criterion, fn) {
  const page = await newPage();
  try {
    const detail = await fn(page);
    results.supplementalChecks.push({ app, name, criterion, executed: true, pass: detail.pass, detail });
    console.log(`OBSERVED ${app} ${name}: ${detail.pass ? 'PASS' : 'FAIL'} ${JSON.stringify(detail).slice(0, 240)}`);
  } catch (error) {
    results.supplementalChecks.push({ app, name, criterion, executed: false, pass: null, error: error.message });
    console.log(`UNVERIFIED ${app} ${name}: ${error.message.slice(0, 180)}`);
  } finally { await page.close(); }
  await writeFile(resultPath, JSON.stringify(results, null, 2) + '\n');
}

// Six configurations distinguish layout from input transport and render mode.
for (const variant of ['scalar-modern-doc','scalar-modern-splash','scalar-classic-doc','scalar-classic-splash','scalar-classic-static-doc','scalar-classic-static-splash']) {
  await observe('starlight-scalar', variant, 'Internal search is visible and returns event operations with showSidebar:false', async page => {
    await page.goto(`http://127.0.0.1:4321/ja/${variant}/`);
    const scope = page.locator('.scalar-probe');
    await scope.getByText('SCLS Docs PoC API', { exact: true }).first().waitFor();
    const settings = JSON.parse(await scope.getAttribute('data-settings'));
    const starlightSidebarVisible = await page.locator('#starlight__sidebar').isVisible();
    const triggers = scope.getByRole('button', { name: /search/i }).filter({ visible: true });
    const inputs = scope.locator('input').filter({ visible: true });
    const rawTriggers = await triggers.allTextContents();
    const visibleInputs = await inputs.evaluateAll(elements => elements.map(el => ({ placeholder: el.placeholder, label: el.getAttribute('aria-label') })));
    let input = null;
    for (let index = 0; index < await inputs.count(); index++) {
      const candidate = inputs.nth(index);
      if (/search/i.test((await candidate.getAttribute('placeholder') ?? '') + (await candidate.getAttribute('aria-label') ?? ''))) { input = candidate; break; }
    }
    let searchScope = scope;
    if (!input && await triggers.count()) {
      await triggers.first().click();
      searchScope = page.getByRole('dialog').last();
      input = searchScope.getByRole('combobox').first();
      if (!await input.count()) input = searchScope.locator('input:visible').first();
    }
    if (!input) return { pass: false, settings, starlightSidebarVisible, visibleSearch: false, rawTriggers, visibleInputs, query: 'events', results: [] };
    await input.fill('events');
    await page.waitForTimeout(400);
    const matches = await searchScope.getByRole('option').allTextContents();
    const snapshot = await searchScope.ariaSnapshot();
    const operations = matches.filter(value => /Operation:|HTTP Method:/.test(value));
    return { pass: operations.length >= 2 && starlightSidebarVisible === (settings.template === 'doc'), settings, starlightSidebarVisible, visibleSearch: true, rawTriggers, visibleInputs, query: 'events', results: matches, operationResults: operations, namedSchemaCount: Object.keys(probeSchema.components?.schemas ?? {}).length, snapshot };
  });
}

const querySets = { ko: ['티켓','티켓을','티켓이','구독','구독을','구독이','v1','/v1/events','retryAfterSeconds'], ja: ['イベント','イベントを','イベントが','チケット','チケットを','v1','/v1/events','retryAfterSeconds'] };
for (const app of apps) {
  for (const [lang, queries] of Object.entries(querySets)) {
    const sourceText = await readFile(path.join(root, app.source, lang, `search-probe.${app.ext}`), 'utf8');
    const guideText = await readFile(path.join(root, app.source, lang, `guide.${app.ext}`), 'utf8');
    const absentForms = lang === 'ko' ? ['티켓을','티켓이','구독을','구독이'] : ['イベントを','イベントが','チケットを'];
    for (const form of absentForms) assert(!(sourceText + guideText).includes(form), `Inflected form accidentally present: ${form}`);
    const page = await newPage();
    try {
      await page.goto(`${app.base}/${lang}/search-probe/`);
      if (app.name === 'fumadocs') await page.getByRole('button', { name: /문서 검색|ドキュメント検索/ }).first().click();
      for (const query of queries) {
        let hits, snapshot;
        if (app.name === 'starlight-scalar') {
          hits = await page.evaluate(async query => {
            const engine = await import('/pagefind/pagefind.js');
            const result = await engine.search(query);
            return Promise.all(result.results.map(async hit => { const data = await hit.data(); return { url: data.url, title: data.meta.title, excerpt: data.excerpt }; }));
          }, query);
        } else {
          const dialog = page.getByRole('dialog').last();
          await dialog.getByRole('combobox').fill(query);
          await page.waitForTimeout(350);
          hits = await dialog.getByRole('option').evaluateAll(elements => elements.map(el => ({ id: el.id, title: el.textContent.trim() })));
          snapshot = await dialog.ariaSnapshot();
        }
        const controlledHits = hits.filter(hit => (hit.url ?? hit.id ?? '').includes(`/${lang}/search-probe`));
        const record = { app: app.name, language: lang, query, suite: 'controlled-morphology-identifiers', queryLiterallyInControl: sourceText.includes(query), inflectedFormAbsent: absentForms.includes(query) ? true : undefined, controlDocument: `/${lang}/search-probe/`, hits, controlledHits, snapshot };
        results.searches.push(record);
        console.log(`SEARCH ${app.name} ${lang} ${query}: control=${controlledHits.length}, all=${hits.length}`);
      }
    } finally { await page.close(); }
  }
  await observe(app.name, 'root-url', 'Root / serves a page or redirect instead of HTTP 404', async page => {
    const response = await page.goto(`${app.base}/`);
    return { pass: response.status() < 400, status: response.status(), finalUrl: page.url(), rawBody: (await page.locator('body').innerText()).slice(0, 400) };
  });
  await observe(app.name, 'ja-logo-link', 'Site title preserves ja and reaches a valid page', async page => {
    await page.goto(`${app.base}/ja/guide/`);
    const logo = page.getByRole('link', { name: 'SCLS Docs PoC', exact: true }).first();
    const href = await logo.getAttribute('href');
    const response = await page.request.get(new URL(href, page.url()).href);
    await logo.click();
    await page.waitForTimeout(250);
    const languageMaintained = new URL(page.url()).pathname.startsWith('/ja');
    return { pass: languageMaintained && response.status() < 400, href, finalUrl: page.url(), status: response.status(), languageMaintained, rawBody: (await page.locator('body').innerText()).slice(0, 400) };
  });
  for (const lang of ['ko','ja']) {
    for (const kind of ['url','file']) {
      await observe(app.name, `${lang}-relative-${kind}`, 'Relative guide link resolves to the translated sibling and HTTP 200', async page => {
        await page.goto(`${app.base}/${lang}/guide/`);
        const link = page.getByRole('link', { name: `relative-${kind}-probe`, exact: true });
        const href = await link.getAttribute('href');
        const resolved = new URL(href, page.url()).href;
        const response = await page.request.get(resolved);
        await link.click(); await page.waitForTimeout(200);
        const finalUrl = page.url();
        return { pass: response.status() === 200 && new URL(finalUrl).pathname.replace(/\/$/,'') === `/${lang}/subscription`, sourceSyntax: kind === 'url' ? 'subscription/' : `./subscription.${app.ext}`, href, resolved, status: response.status(), finalUrl, rawBody: (await page.locator('body').innerText()).slice(0, 300) };
      });
    }
  }
  if (app.name === 'fumadocs') {
    for (const lang of ['ko','ja']) {
      await observe(app.name, `${lang}-relative-file-with-resolver`, 'Official createRelativeLink resolves a translated sibling file to HTTP 200', async page => {
        await page.goto(`${app.base}/${lang}/relative-link-probe/`);
        const sourceDiagnostics=JSON.parse(await page.locator('[data-resolver-diagnostics]').innerText());
        const link = page.getByRole('link', { name: 'relative-file-probe', exact: true });
        const href = await link.getAttribute('href');
        const response = await page.request.get(new URL(href,page.url()).href);
        await link.click();await page.waitForTimeout(200);
        return {pass:response.status()===200 && new URL(page.url()).pathname.replace(/\/$/,'')===`/${lang}/subscription`,sourceSyntax:'./subscription.mdx',sourceDiagnostics,href,status:response.status(),finalUrl:page.url(),rawBody:(await page.locator('body').innerText()).slice(0,300)};
      });
      await observe(app.name, `${lang}-relative-file-dot-parser`, 'Dot parser with official resolver reaches the translated sibling', async page => {
        await page.goto(`${app.base}/${lang}/relative-link-dot-probe/`);
        const sourceDiagnostics=JSON.parse(await page.locator('[data-resolver-diagnostics]').innerText());
        const link=page.getByRole('link',{name:'relative-file-probe',exact:true});
        const href=await link.getAttribute('href');const response=await page.request.get(new URL(href,page.url()).href);
        await link.click();await page.waitForTimeout(200);
        return {pass:response.status()===200 && new URL(page.url()).pathname.replace(/\/$/,'')===`/${lang}/subscription`,sourceSyntax:'./subscription.mdx',sourceDiagnostics,href,status:response.status(),finalUrl:page.url(),rawBody:(await page.locator('body').innerText()).slice(0,300)};
      });
    }
  }
}

// Source counts and actual rendered English are kept separate.
const uiKeys = uiTranslations().keys, apiKeys = openapiTranslations().keys;
const allKeys = [...new Set([...uiKeys, ...apiKeys])];
const audit = { methodology: 'Distinct untranslated English labels observed in rendered non-code text, including scrollable content; accessible-only labels are counted separately. Guide, API page, playground, and site search are sampled, with tooltip probes when available. Unused OAuth and other UI are not covered.', uiPackage: JSON.parse(await readFile(path.join(root, 'node_modules/fumadocs-ui/package.json'), 'utf8')).name, uiKeys: uiKeys.length, uiUniqueKeys: new Set(uiKeys).size, openapiKeys: apiKeys.length, openapiUniqueKeys: new Set(apiKeys).size, overlap: uiKeys.filter(key => apiKeys.includes(key)), unionKeys: allKeys.length, locales: {} };
const englishLabel = key => key.split('(')[0];
async function capture(page, scope, missing) {
  const labels = [...new Set(missing.map(englishLabel))];
  return await scope.evaluate((root, labels) => {
    const pieces = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const parent = walker.currentNode.parentElement;
      if (!parent || parent.closest('pre,code,script,style,svg') || !parent.checkVisibility({checkOpacity:true,checkVisibilityCSS:true})) continue;
      const text = walker.currentNode.textContent.replace(/\s+/g, ' ').trim();
      if (text) pieces.push(text);
    }
    const escaped = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const matches = label => new RegExp('(?<![A-Za-z0-9_])' + escaped(label) + '(?![A-Za-z0-9_])');
    const visible = Object.fromEntries(labels.map(label => [label, [...new Set(pieces.filter(text => matches(label).test(text)))]]).filter(([,proof]) => proof.length));
    const accessibility = {};
    for (const element of root.querySelectorAll('[aria-label],[placeholder],[title]')) {
      if (!element.checkVisibility({checkOpacity:true,checkVisibilityCSS:true})) continue;
      for (const name of ['aria-label','placeholder','title']) {
        const text = element.getAttribute(name);
        if (!text) continue;
        for (const label of labels) if (matches(label).test(text)) (accessibility[label] ??= []).push({attribute:name,text});
      }
    }
    return { visible, accessibility };
  }, labels);
}
for (const lang of ['ko','ja']) {
  const dictionary = translations.get(lang);
  const translated = allKeys.filter(key => Object.hasOwn(dictionary,key));
  const missing = allKeys.filter(key => !Object.hasOwn(dictionary,key));
  const page = await newPage();
  const views = {};
  try {
    await page.goto(`http://127.0.0.1:4322/${lang}/guide/`);
    views.guide = await capture(page,page.locator('body'),missing);
    await page.goto(`http://127.0.0.1:4322/${lang}/api/list-events/`);
    const open = page.getByRole('button', {name: /API 호출 실습|API リクエストを試す/}).first();
    await open.waitFor();
    views.api = await capture(page,page.locator('body'),missing);
    const copy = page.getByRole('button',{name:'Copy Link',exact:true}).first();
    if(await copy.count()) {
      await copy.hover();await page.waitForTimeout(800);
      views.apiCopyTooltip=await capture(page,page.locator('body'),missing);
    }
    await open.click();
    views.playground = await capture(page,page.getByRole('dialog').last(),missing);
    const fieldInfo=page.getByRole('dialog').last().getByRole('button',{name:'Field Info',exact:true}).first();
    if(await fieldInfo.count()) {
      await fieldInfo.hover();await page.waitForTimeout(800);
      views.playgroundInfoTooltip=await capture(page,page.locator('body'),missing);
    }
    await page.keyboard.press('Escape');
    await page.getByRole('button',{name:/문서 검색|ドキュメント検索/}).first().click();
    const dialog=page.getByRole('dialog').last();await dialog.getByRole('combobox').fill(lang==='ko'?'티켓':'イベント');await page.waitForTimeout(350);
    views.search=await capture(page,dialog,missing);
  } finally { await page.close(); }
  const visibleLabels = [...new Set(Object.values(views).flatMap(view => Object.keys(view.visible)))].sort();
  const accessibleLabels = [...new Set(Object.values(views).flatMap(view => Object.keys(view.accessibility)))].sort();
  audit.locales[lang] = { translatedKeys: translated.length, translatedUiKeys: new Set(uiKeys.filter(key => translated.includes(key))).size, translatedOpenapiKeys: new Set(apiKeys.filter(key => translated.includes(key))).size, missingKeys: missing.length, missingKeyList: missing, visibleEnglishLabelCount: visibleLabels.length, visibleEnglishLabels: visibleLabels, accessibleEnglishLabelCount: accessibleLabels.length, accessibleEnglishLabels: accessibleLabels, views };
}
await writeFile(path.join(root,'artifacts/ui-translations-audit.json'),JSON.stringify(audit,null,2)+'\n');
results.supplement.translationAudit = { path:'artifacts/ui-translations-audit.json', uiKeys:audit.uiKeys, openapiKeys:audit.openapiKeys, unionKeys:audit.unionKeys, locales:Object.fromEntries(Object.entries(audit.locales).map(([lang,data])=>[lang,{translatedKeys:data.translatedKeys,missingKeys:data.missingKeys,visibleEnglishLabelCount:data.visibleEnglishLabelCount,visibleEnglishLabels:data.visibleEnglishLabels,accessibleEnglishLabelCount:data.accessibleEnglishLabelCount}])) };
results.supplement.summary = { observed:results.supplementalChecks.filter(check=>check.executed).length, unverified:results.supplementalChecks.filter(check=>!check.executed).length, criterionPassed:results.supplementalChecks.filter(check=>check.pass===true).length, criterionFailed:results.supplementalChecks.filter(check=>check.pass===false).length, controlledSearchQueries:results.searches.filter(search=>search.suite==='controlled-morphology-identifiers').length };
await writeFile(resultPath,JSON.stringify(results,null,2)+'\n');
await browser.close();
console.log(JSON.stringify({summary:results.supplement.summary,translations:results.supplement.translationAudit}));
if(results.supplement.summary.unverified || results.supplement.errors.length) process.exitCode=1;
