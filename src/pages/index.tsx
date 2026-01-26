import type { GetServerSidePropsContext, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/legacy/image';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import {
  getCanonicalUrl,
  getDefaultHreflangUrl,
  getHreflangLinks,
} from '@/lib/seo';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AvatarEditor from '@/components/AvatarEditor';

const UseCases = dynamic(() => import('@/components/UseCases'), {
  loading: () => null,
});

const Home: NextPage = () => {
  const { t } = useTranslation(`common`);
  const router = useRouter();

  const faqItems = [
    { question: 'faq.whatIsAvatar', answer: 'faq.whatIsAvatarAnswer' },
    { question: 'faq.howToUse', answer: 'faq.howToUseAnswer' },
    { question: 'faq.commercialUse', answer: 'faq.commercialUseAnswer' },
    {
      question: 'faq.supportedBrowsers',
      answer: 'faq.supportedBrowsersAnswer',
    },
  ];

  const pagePath = '/';
  const canonicalUrl = getCanonicalUrl(pagePath, router.locale);
  const hreflangLinks = getHreflangLinks(pagePath);
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://avatar.leix.dev';
  const ogImage = `${baseUrl}/social.png`;

  return (
    <>
      <Head>
        {/* 关键资源预加载 */}
        <link rel="preload" href="/image/avatar-diff.png" as="image" />

        {/* Favicon - 只保留关键尺寸 */}
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon/favicon-16x16.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/favicon/apple-icon-180x180.png"
        />
        <link rel="manifest" href="/manifest.json" />

        {/* SEO Meta Tags */}
        <title>{t(`siteTitle`)}</title>
        <meta name="description" content={t(`siteDescription`)} />
        <meta name="keywords" content={t('siteKeywords')} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="theme-color" content="#fffefc" />
        <meta name="msapplication-TileColor" content="#fffefc" />
        <meta
          name="msapplication-TileImage"
          content="/favicon/ms-icon-144x144.png"
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content={t('siteTitle')} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={t(`siteTitle`)} />
        <meta property="og:title" content={t(`siteTitle`)} />
        <meta property="og:description" content={t(`siteDescription`)} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={ogImage} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={ogImage} />
        <meta name="twitter:title" content={t(`siteTitle`)} />
        <meta name="twitter:description" content={t(`siteDescription`)} />
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#fffefc" />
        {/* Robots & Canonical */}
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow" />
        <meta name="google" content="notranslate" />
        <link rel="canonical" href={canonicalUrl} />

        {/* Hreflang - 使用更简洁的方式 */}
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
        <link
          rel="preload"
          href="/fonts/Quicksand.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: t('siteTitle'),
              description: t('siteDescription'),
              url: canonicalUrl,
              applicationCategory: 'DesignApplication',
              operatingSystem: 'Web',
            }),
          }}
        />
      </Head>

      <Header />
      <main className="my-5">
        <AvatarEditor />
        <section className="py-16 my-12">
          <div className="container mx-auto px-4 md:px-8">
            <h2 className="text-2xl font-bold text-center mb-12 text-gray-900 ">
              {t('steps.title')}
            </h2>
            <div className="max-w-3xl mx-auto space-y-8">
              <div className="flex">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-black flex items-center justify-center text-white font-bold mr-4">
                  1
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    {t('steps.step1Title')}
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {t('steps.step1Desc')}
                  </p>
                </div>
              </div>
              <div className="flex">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-black flex items-center justify-center text-white font-bold mr-4">
                  2
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    {t('steps.step2Title')}
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {t('steps.step2Desc')}
                  </p>
                </div>
              </div>
              <div className="flex">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-black flex items-center justify-center text-white font-bold mr-4">
                  3
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    {t('steps.step3Title')}
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {t('steps.step3Desc')}
                  </p>
                </div>
              </div>
              <div className="flex">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-black flex items-center justify-center text-white font-bold mr-4">
                  4
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    {t('steps.step4Title')}
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {t('steps.step4Desc')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Notion Avatar Hero Section */}
        <section className="py-16 my-12">
          <div className="container mx-auto px-4 md:px-8">
            <div className="text-center mb-8">
              <div className="relative inline-block mb-6">
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 relative">
                  {t('ai.title')}
                </h2>
                <div className="absolute -right-6 -top-4 md:-top-8 md:-right-12">
                  <Image
                    src="/icon/ai-stars.svg"
                    width={48}
                    height={48}
                    alt="Stars"
                  />
                </div>
              </div>
              <p className="text-lg md:text-xl text-gray-700 max-w-2xl mx-auto mb-8 leading-relaxed">
                {t('ai.heroSubtitle')}
              </p>
              <div className="mb-8">
                <Image
                  src="/image/avatar-diff.png"
                  alt="Notion Avatar"
                  width={1024}
                  height={485}
                  className="mx-auto"
                  priority
                  loading="eager"
                />
              </div>
              <Link
                href="/ai-generator"
                className="inline-flex items-center gap-2 py-3 px-8 rounded-full bg-black text-white font-bold text-lg hover:scale-105 active:scale-95 transition-all shadow-lg hover:shadow-xl"
              >
                {t('ai.heroCTA')}
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </section>

        <UseCases />

        <section className="py-16 my-12">
          <div className="container mx-auto px-4 md:px-8">
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
              {t('faq.title')}
            </h2>
            <div className="max-w-3xl mx-auto space-y-10">
              {faqItems.map((item) => (
                <div
                  key={item.answer}
                  className="bg-white rounded-lg shadow-sm p-6 border-3 border-black"
                >
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">
                    {t(item.question)}
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {t(item.answer)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

export async function getServerSideProps(
  context: GetServerSidePropsContext & { locale: string },
) {
  const { locale } = context;

  return {
    props: {
      ...(await serverSideTranslations(locale, [`common`])),
    },
  };
}

export default Home;
