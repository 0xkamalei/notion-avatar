import Head from 'next/head';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { GetStaticPropsContext } from 'next';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AIGeneratorContent from '@/components/AIGenerator/AIGeneratorContent';
import {
  getCanonicalUrl,
  getDefaultHreflangUrl,
  getHreflangLinks,
} from '@/lib/seo';

interface AIGeneratorPageProps {
  locale?: string;
}

export default function AIGeneratorPage({
  locale: propLocale,
}: AIGeneratorPageProps) {
  const { t } = useTranslation('common');
  const pagePath = '/ai-avatar';
  const currentLocale = propLocale || 'en';
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://avatar.leix.dev';
  const canonicalUrl = getCanonicalUrl(pagePath, currentLocale);
  const hreflangLinks = getHreflangLinks(pagePath);
  const pageTitle = `${t('ai.title')} | ${t('siteTitle')}`;
  const pageDescription = t('ai.description');
  const pageKeywords = t('ai.seoKeywords') || t('siteKeywords');
  const ogImage = `${baseUrl}/social-ai.png`;

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="keywords" content={pageKeywords} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        <meta name="theme-color" content="#fffefc" />
        <meta name="msapplication-TileColor" content="#fffefc" />
        <meta
          name="msapplication-TileImage"
          content="/favicon/ms-icon-144x144.png"
        />
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow" />
        <meta name="google" content="notranslate" />
        <meta charSet="utf-8" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={t('siteTitle')} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={ogImage} />

        {/* Canonical URL */}
        <link rel="canonical" href={canonicalUrl} />

        {/* Hreflang links */}
        {hreflangLinks.map((link) => (
          <link
            key={link.hrefLang}
            rel="alternate"
            hrefLang={link.hrefLang}
            href={link.href}
          />
        ))}
        <link
          rel="alternate"
          hrefLang="x-default"
          href={getDefaultHreflangUrl(pagePath)}
        />

        {/* Favicon links */}
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="96x96"
          href="/favicon/favicon-96x96.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon/favicon-16x16.png"
        />
        <link rel="manifest" href="/manifest.json" />

        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: t('ai.title'),
              description: pageDescription,
              url: canonicalUrl,
              applicationCategory: 'DesignApplication',
              operatingSystem: 'Web',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
              },
              featureList: [
                'Photo to Avatar conversion',
                'Text to Avatar generation',
                'AI-powered avatar creation',
                'Minimalist black-and-white avatar design',
              ],
            }),
          }}
        />
      </Head>

      <div className="min-h-screen flex flex-col bg-[#fffefc]">
        <Header />
        <AIGeneratorContent avatarStyle="notion" />
        <Footer />
      </div>
    </>
  );
}

export const getStaticProps = async ({ locale }: GetStaticPropsContext) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', ['common'])),
    locale: locale ?? 'en',
  },
});
