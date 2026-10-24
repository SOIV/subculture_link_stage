import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://docs-poc.invalid',
  output: 'static',
  vite: { environments: { prerender: { resolve: { noExternal: ['@astrojs/starlight'] } } } },
  integrations: [starlight({
    title: 'SCLS Docs PoC', defaultLocale: 'ko',
    locales: { ko: { label: '한국어', lang: 'ko' }, ja: { label: '日本語', lang: 'ja' }, en: { label: 'English', lang: 'en' } },
    sidebar: [
      { slug: 'guide' }, { slug: 'subscription' },
      { label: 'API 레퍼런스', translations: { ja: 'API リファレンス', en: 'API reference' }, link: '/api/' },
    ],
    customCss: ['./src/styles/poc.css'],
  })],
});
