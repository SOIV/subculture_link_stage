import { source as directorySource } from '@/lib/source';
import { loader } from 'fumadocs-core/source';
import { DocsPage, DocsTitle, DocsBody } from 'fumadocs-ui/page';
import defaultComponents, { createRelativeLink } from 'fumadocs-ui/mdx';
import { notFound } from 'next/navigation';

// Reuse the exact compiled guide bodies, changing only the Source API file names.
const files = ['ko','ja','en'].flatMap(lang => ['guide','subscription'].flatMap(slug => {
  const page = directorySource.getPage([slug], lang);
  return page ? [{ type: 'page' as const, path: `${slug}.${lang}.mdx`, data: page.data }] : [];
}));
const source = loader({ baseUrl: '/', source: { files }, i18n: { languages: ['ko','ja','en'], defaultLanguage: 'ko', parser: 'dot' } });
export const dynamicParams = false;
export default async function DotRelativeLinkProbe({ params }: { params: Promise<{lang:string}> }) {
  const { lang } = await params;
  const page = source.getPage(['guide'], lang);
  if (!page) notFound();
  const Content = directorySource.getPage(['guide'], lang)?.data.body;
  if (!Content) notFound();
  return <DocsPage><DocsTitle>Dot file resolver: {lang}</DocsTitle><DocsBody>
    <pre data-resolver-diagnostics>{JSON.stringify({ parser:'dot',pagePath:page.path,pageLocale:page.locale,resolved:source.resolveHref('./subscription.mdx',page) },null,2)}</pre>
    <Content components={{ ...defaultComponents, a:createRelativeLink(source,page) }} />
  </DocsBody></DocsPage>;
}
