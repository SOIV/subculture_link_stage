import { source } from '@/lib/source';
import { DocsPage, DocsTitle, DocsBody } from 'fumadocs-ui/page';
import defaultComponents, { createRelativeLink } from 'fumadocs-ui/mdx';
import { notFound } from 'next/navigation';

export const dynamicParams = false;
export default async function RelativeLinkProbe({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const page = source.getPage(['guide'], lang);
  if (!page) notFound();
  const Content = page.data.body;
  return <DocsPage><DocsTitle>Relative file resolver: {lang}</DocsTitle><DocsBody>
    <pre data-resolver-diagnostics>{JSON.stringify({ parser: 'dir', pagePath: page.path, pageLocale: page.locale, resolved: source.resolveHref('./subscription.mdx', page), rootLookup: source.getPageByHref('./subscription.mdx', { dir: '', language: lang })?.page.url }, null, 2)}</pre>
    <Content components={{ ...defaultComponents, a: createRelativeLink(source, page) }} />
  </DocsBody></DocsPage>;
}
