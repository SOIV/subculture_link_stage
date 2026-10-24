import { defineI18n } from 'fumadocs-core/i18n';
export const i18n = defineI18n({
  languages: ['ko', 'ja', 'en'], defaultLanguage: 'ko',
  fallbackLanguage: 'ko', parser: 'dir', hideLocale: 'never',
});
