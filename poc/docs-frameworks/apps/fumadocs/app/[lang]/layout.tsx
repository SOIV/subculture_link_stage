import { RootProvider } from 'fumadocs-ui/provider/next';
import { i18nProvider } from 'fumadocs-ui/i18n';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { source } from '@/lib/source';
import { i18n } from '@/lib/i18n';
import { translations } from '@/lib/translations';
import '../global.css';

export function generateStaticParams() { return i18n.languages.map(lang => ({ lang })); }
export default async function Layout({ params, children }: { params: Promise<{lang:string}>, children: React.ReactNode }) {
  const { lang } = await params;
  return <html lang={lang} suppressHydrationWarning><body>
    <RootProvider i18n={i18nProvider(translations, lang)} search={{ options: { type: 'static', api: '/api/search' } }}>
      <DocsLayout tree={source.getPageTree(lang)} i18n={{ languages: i18n.languages, defaultLanguage: i18n.defaultLanguage, hideLocale: i18n.hideLocale }} nav={{ title: 'SCLS Docs PoC' }}>{children}</DocsLayout>
    </RootProvider>
  </body></html>;
}
