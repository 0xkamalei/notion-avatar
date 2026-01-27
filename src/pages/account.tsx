import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import type { GetServerSidePropsContext } from 'next';
import toast, { Toaster } from 'react-hot-toast';
import Image from 'next/legacy/image';
import { useAuth } from '@/contexts/AuthContext';
import { createServerSideClient } from '@/lib/supabase/server';
import {
  getCanonicalUrl,
  getHreflangLinks,
  getDefaultHreflangUrl,
} from '@/lib/seo';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Modal from '@/components/Modal/Common';
import FaviconLinks from '@/components/SEO/FaviconLinks';
import { useUsageHistory } from '@/hooks/useAccountData';
import { useAIUsage } from '@/hooks/useAIUsage';

interface AccountPageProps {
  initialUsageHistory: Array<{
    id: string;
    generation_mode: string;
    created_at: string;
    credits_charged?: number;
    used_free?: boolean;
    image_path?: string;
    image_url?: string;
  }>;
}

export default function AccountPage({ initialUsageHistory }: AccountPageProps) {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { user, credits, isLoading, signOut, refreshSubscription } = useAuth();
  const { usageState } = useAIUsage();

  const {
    data: usageHistory = initialUsageHistory,
    isLoading: isLoadingHistory,
  } = useUsageHistory(10);

  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [downloadingImage, setDownloadingImage] = useState<string | null>(null);
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());
  const [promoCode, setPromoCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (usageHistory.length > 0) {
      const imageIds = usageHistory.filter((r) => r.image_url).map((r) => r.id);
      setLoadingImages(new Set(imageIds));
    }
  }, [usageHistory]);

  const handleImagePreview = (imageUrl: string) => {
    setPreviewImageUrl(imageUrl);
  };

  const handleImageDownload = async (imageUrl: string, recordId: string) => {
    setDownloadingImage(recordId);
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `notion-avatar-${recordId}-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success(t('download') || 'Downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      toast.error(t('account.failedToDownload') || 'Failed to download');
    } finally {
      setDownloadingImage(null);
    }
  };

  const handleRedeemPromo = async () => {
    if (!promoCode.trim()) {
      toast.error(t('account.promo.enterCode'));
      return;
    }

    setIsRedeeming(true);
    try {
      const response = await fetch('/api/promo/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode.trim() }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(t('account.promo.success', { credits: data.credits }));
        setPromoCode('');
        refreshSubscription();
      } else {
        let errorKey = 'account.promo.error';
        if (data.error === 'Invalid promo code') {
          errorKey = 'account.promo.invalidCode';
        } else if (data.error === 'Promo code has expired') {
          errorKey = 'account.promo.expired';
        } else if (data.error === 'Promo code already redeemed') {
          errorKey = 'account.promo.alreadyRedeemed';
        } else if (data.error === 'Promo code redemption limit reached') {
          errorKey = 'account.promo.limitReached';
        }
        toast.error(t(errorKey));
      }
    } catch (error) {
      console.error('Promo redeem error:', error);
      toast.error(t('account.promo.error'));
    } finally {
      setIsRedeeming(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fffefc]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const avatarUrl = user.user_metadata?.avatar_url;
  const displayName =
    user.user_metadata?.full_name || user.user_metadata?.name || user.email;

  const pagePath = '/account';
  const canonicalUrl = getCanonicalUrl(pagePath, router.locale);
  const hreflangLinks = getHreflangLinks(pagePath);

  return (
    <>
      <Head>
        <FaviconLinks />
        <title>{t('account.pageTitle')}</title>
        <meta name="description" content={t('account.title')} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href={canonicalUrl} />
        {/* Hreflang links for all language versions */}
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
      </Head>

      <div className="min-h-screen flex flex-col bg-[#fffefc]">
        <Header />
        <Toaster position="top-center" />

        <main className="flex-grow container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">
              {t('account.title')}
            </h1>

            {/* Profile Section */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                {t('account.profile')}
              </h2>
              <div className="flex items-center gap-4">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="w-16 h-16 rounded-full border border-gray-200"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gray-900 flex items-center justify-center text-white text-xl font-medium">
                    {displayName?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-900">{displayName}</p>
                  <p className="text-gray-500">{user.email}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                {t('account.credits')}
              </h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-gray-900">{credits}</p>
                  <p className="text-gray-500">
                    {t('account.creditsRemaining')}
                  </p>
                </div>
                <Link
                  href="/pricing"
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {t('account.buyMore')}
                </Link>
              </div>
              <div className="mt-4 text-sm text-gray-600 space-y-1">
                <p>{t('account.siteFreeQuota')}</p>
                {usageState.isLoading ? (
                  <p>{t('auth.loading')}</p>
                ) : (
                  <p>
                    {t('account.usage.availableToday', {
                      remaining: usageState.remaining,
                      freeRemaining: usageState.freeRemaining || 0,
                      paidCredits: usageState.paidCredits || 0,
                    })}
                  </p>
                )}
              </div>
            </div>

            {/* Promo Code Section */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                {t('account.promo.title')}
              </h2>
              <p className="text-gray-500 text-sm mb-4">
                {t('account.promo.description')}
              </p>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder={t('account.promo.placeholder')}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent uppercase"
                  disabled={isRedeeming}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isRedeeming) {
                      handleRedeemPromo();
                    }
                  }}
                />
                <button
                  onClick={handleRedeemPromo}
                  disabled={isRedeeming || !promoCode.trim()}
                  type="button"
                  className="px-6 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isRedeeming ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      <span>{t('auth.loading')}</span>
                    </>
                  ) : (
                    t('account.promo.redeem')
                  )}
                </button>
              </div>
            </div>

            {/* Usage History */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                {t('account.recentGenerations')}
              </h2>
              {isLoadingHistory ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto" />
                </div>
              ) : usageHistory.length > 0 ? (
                <div className="space-y-3">
                  {usageHistory.map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        {record.image_url ? (
                          <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0 group cursor-pointer">
                            {loadingImages.has(record.id) && (
                              <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-lg z-10" />
                            )}
                            <Image
                              src={record.image_url || ''}
                              alt="Generated avatar"
                              layout="fill"
                              objectFit="cover"
                              className={`rounded-lg transition-opacity duration-300 ${
                                loadingImages.has(record.id)
                                  ? 'opacity-0'
                                  : 'opacity-100'
                              }`}
                              loading="lazy"
                              onClick={() => {
                                if (record.image_url) {
                                  handleImagePreview(record.image_url);
                                }
                              }}
                              onLoadingComplete={() => {
                                setLoadingImages((prev) => {
                                  const next = new Set(prev);
                                  next.delete(record.id);
                                  return next;
                                });
                              }}
                              onError={() => {
                                setLoadingImages((prev) => {
                                  const next = new Set(prev);
                                  next.delete(record.id);
                                  return next;
                                });
                              }}
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity flex items-center justify-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (record.image_url) {
                                    handleImagePreview(record.image_url);
                                  }
                                }}
                                type="button"
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-white rounded-full hover:bg-gray-100"
                                title="Preview"
                                aria-label="Preview"
                              >
                                <svg
                                  className="w-4 h-4 text-gray-900"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                  />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                            <svg
                              className="w-8 h-8 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">
                            {record.generation_mode === 'photo2avatar'
                              ? t('ai.photo2avatar')
                              : t('ai.text2avatar')}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>
                              {new Date(record.created_at).toLocaleString()}
                            </span>
                            {record.used_free ? (
                              <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs">
                                {t('account.usage.usedSiteFree')}
                              </span>
                            ) : record.credits_charged ? (
                              <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs">
                                {t('account.usage.usedCredits', {
                                  credits: record.credits_charged,
                                })}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  {t('account.noGenerationsYet')}{' '}
                  <Link
                    href="/ai-avatar/notion"
                    className="text-black font-medium hover:underline"
                  >
                    {t('account.createFirstAvatar')}
                  </Link>
                </p>
              )}
            </div>

            {/* Sign Out */}
            <div className="text-center">
              <button
                onClick={signOut}
                type="button"
                className="text-red-600 hover:text-red-700 font-medium"
              >
                {t('account.signOut')}
              </button>
            </div>
          </div>
        </main>

        <Footer />

        {/* Image Preview Modal */}
        {previewImageUrl && (
          <Modal onCancel={() => setPreviewImageUrl(null)}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex flex-col items-center">
                <div className="w-full flex justify-center mb-4">
                  <div className="relative w-full max-w-md">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewImageUrl}
                      alt="Generated avatar preview"
                      className="w-full h-auto rounded-lg"
                      loading="lazy"
                    />
                  </div>
                </div>
                <div className="flex gap-3 w-full justify-center">
                  <button
                    onClick={() => {
                      const record = usageHistory.find(
                        (r) => r.image_url === previewImageUrl,
                      );
                      if (record) {
                        handleImageDownload(previewImageUrl, record.id);
                      }
                    }}
                    disabled={
                      downloadingImage ===
                      usageHistory.find((r) => r.image_url === previewImageUrl)
                        ?.id
                    }
                    type="button"
                    className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {downloadingImage ===
                    usageHistory.find((r) => r.image_url === previewImageUrl)
                      ?.id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        <span>
                          {t('account.downloading') || 'Downloading...'}
                        </span>
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                          />
                        </svg>
                        <span>{t('download') || 'Download'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </>
  );
}

export async function getServerSideProps(
  context: GetServerSidePropsContext & { locale: string },
) {
  const { locale } = context;
  let usageHistory: Array<{
    id: string;
    generation_mode: string;
    created_at: string;
    credits_charged?: number;
    used_free?: boolean;
    image_path?: string;
    image_url?: string;
  }> = [];

  try {
    const supabase = createServerSideClient(context);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        redirect: {
          destination: '/auth/login',
          permanent: false,
        },
      };
    }

    const { data: usageData } = await supabase
      .from('usage_records')
      .select(
        'id, generation_mode, created_at, image_path, credits_charged, used_free',
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (usageData) {
      const { createServiceClient } = await import('@/lib/supabase/server');
      const serviceClient = createServiceClient();
      usageHistory = await Promise.all(
        usageData.map(async (record) => {
          if (record.image_path) {
            try {
              const { data: signedUrlData } = await serviceClient.storage
                .from('generated-avatars')
                .createSignedUrl(record.image_path, 3600);
              return {
                ...record,
                image_url: signedUrlData?.signedUrl,
              };
            } catch {
              return record;
            }
          }
          return record;
        }),
      );
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching account data in SSR:', error);
  }

  return {
    props: {
      initialUsageHistory: usageHistory,
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}
