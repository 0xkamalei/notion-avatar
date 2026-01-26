import { useState, useMemo } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { GetStaticPropsContext } from 'next';
import { Toaster } from 'react-hot-toast';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FaviconLinks from '@/components/SEO/FaviconLinks';
import { getCanonicalUrl } from '@/lib/seo';

// 延迟加载非关键组件
const AuthModal = dynamic(() => import('@/components/Auth/AuthModal'), {
  loading: () => null,
});
const PricingPlans = dynamic(
  () => import('@/components/Pricing/PricingPlans'),
  {
    loading: () => null,
  },
);

export default function PricingPage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const plans = useMemo(
    () => [
      {
        name: t('pricing.packs.free.name'),
        price: t('pricing.packs.free.price'),
        period: t('pricing.packs.free.period'),
        description: t('pricing.packs.free.description'),
        features: [t('pricing.packs.free.features.1')],
        buttonText: t('pricing.packs.free.buttonText'),
        buttonVariant: 'secondary' as const,
        packId: null,
      },
      {
        name: t('pricing.packs.small.name'),
        price: t('pricing.packs.small.price'),
        period: t('pricing.packs.small.period'),
        description: t('pricing.packs.small.description'),
        features: [t('pricing.packs.small.features.1')],
        buttonText: t('pricing.packs.small.buttonText'),
        buttonVariant: 'primary' as const,
        packId: 'small' as const,
        popular: true,
        credits: 100,
      },
      {
        name: t('pricing.packs.medium.name'),
        price: t('pricing.packs.medium.price'),
        period: t('pricing.packs.medium.period'),
        description: t('pricing.packs.medium.description'),
        features: [t('pricing.packs.medium.features.1')],
        buttonText: t('pricing.packs.medium.buttonText'),
        buttonVariant: 'secondary' as const,
        packId: 'medium' as const,
        credits: 500,
      },
      {
        name: t('pricing.packs.large.name'),
        price: t('pricing.packs.large.price'),
        period: t('pricing.packs.large.period'),
        description: t('pricing.packs.large.description'),
        features: [t('pricing.packs.large.features.1')],
        buttonText: t('pricing.packs.large.buttonText'),
        buttonVariant: 'secondary' as const,
        packId: 'large' as const,
        credits: 2000,
      },
    ],
    [t],
  );

  return (
    <>
      <Head>
        <FaviconLinks />
        <title>{t('pricing.pageTitle')}</title>
        <meta name="description" content={t('pricing.pageDescription')} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow" />
        <link
          rel="canonical"
          href={getCanonicalUrl('/pricing', router.locale)}
        />
      </Head>

      <div className="min-h-screen flex flex-col bg-[#fffefc]">
        <Header />
        <Toaster position="top-center" />
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
        />

        <main className="flex-grow container mx-auto px-4 py-12">
          <PricingPlans
            plans={plans}
            title={t('pricing.title')}
            description={t('pricing.description')}
            onAuthRequired={() => setIsAuthModalOpen(true)}
          />

          {/* FAQ Section */}
          <div className="mt-20 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8">
              {t('pricing.faq.title')}
            </h2>
            <div className="space-y-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-black">
                <h3 className="font-bold text-gray-900 mb-2">
                  {t('pricing.faq.q1')}
                </h3>
                <p className="text-gray-600">{t('pricing.faq.a1')}</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-black">
                <h3 className="font-bold text-gray-900 mb-2">
                  {t('pricing.faq.q2')}
                </h3>
                <p className="text-gray-600">{t('pricing.faq.a2')}</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-black">
                <h3 className="font-bold text-gray-900 mb-2">
                  {t('pricing.faq.q3')}
                </h3>
                <p className="text-gray-600">{t('pricing.faq.a3')}</p>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}

export async function getStaticProps({
  locale,
}: GetStaticPropsContext & { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}
