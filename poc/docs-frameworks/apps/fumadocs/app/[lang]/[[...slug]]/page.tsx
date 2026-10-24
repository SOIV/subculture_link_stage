import { source } from '@/lib/source';
import { openapi } from '@/lib/openapi';
import { OpenAPIPage } from '@/components/api-page';
import { DocsPage, DocsTitle, DocsDescription, DocsBody } from 'fumadocs-ui/page';
import defaultComponents from 'fumadocs-ui/mdx';
import { notFound } from 'next/navigation';
import fs from 'node:fs';
import path from 'node:path';
import labels from '../../../../../fixtures/content.json';

export const dynamicParams = false;
export function generateStaticParams() { return source.generateParams(); }
export default async function Page({ params }: { params: Promise<{lang: string, slug?: string[]}> }) {
  const { lang, slug } = await params;
  const page = source.getPage(slug, lang);
  if (!page) notFound();
  const Content = page.data.body;
  const language = lang as keyof typeof labels;
  const relativeSlug = (slug ?? []).join('/');
  const isFallback = !fs.existsSync(path.resolve(`content/docs/${lang}/${relativeSlug}.mdx`)) && !fs.existsSync(path.resolve(`content/docs/${lang}/${relativeSlug}/index.mdx`));
  return <DocsPage toc={page.data.toc} full={page.data.full}>
    <nav className="poc-language-links" aria-label="Page language">
      {['ko','ja','en'].map(locale => <a key={locale} href={`/${locale}/${relativeSlug}/`} lang={locale}>{locale}</a>)}
    </nav>
    {isFallback && <p className="poc-fallback" data-poc-fallback>{labels[language].missing}</p>}
    <DocsTitle>{page.data.title}</DocsTitle><DocsDescription>{page.data.description}</DocsDescription>
    <DocsBody><Content components={{ ...defaultComponents, OpenAPIPage: async (props: any) => <OpenAPIPage {...await openapi.preloadOpenAPIPage(page)} {...props} /> }} /></DocsBody>
  </DocsPage>;
}
