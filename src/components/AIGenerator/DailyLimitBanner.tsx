import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';

interface DailyLimitBannerProps {
  remaining: number;
  total: number;
  isUnlimited: boolean;
  freeRemaining?: number;
  paidCredits?: number;
}

export default function DailyLimitBanner({
  remaining,
  total,
  isUnlimited,
  freeRemaining,
  paidCredits,
}: DailyLimitBannerProps) {
  const { t } = useTranslation('common');
  const router = useRouter();

  if (isUnlimited) {
    return (
      <div className="text-center text-sm text-gray-500 mt-6">
        <span className="inline-flex items-center px-3 py-1 bg-green-50 text-green-700 rounded-full font-medium">
          {t('ai.unlimited')}
        </span>
      </div>
    );
  }

  if (remaining > 0) {
    if (paidCredits && paidCredits > 0) {
      return (
        <div className="text-center text-sm text-gray-500 mt-6">
          <span className="font-bold text-black">{remaining}</span>{' '}
          {t('ai.usage.available')}
          {freeRemaining !== undefined && (
            <span className="text-gray-400">
              {' '}
              ({t('ai.usage.siteFreeRemaining')} {freeRemaining} +{' '}
              {t('ai.usage.creditsRemaining')} {paidCredits})
            </span>
          )}
        </div>
      );
    }

    return (
      <div className="text-center text-sm text-gray-500 mt-6">
        {t('ai.usage.siteFreeRemaining')}{' '}
        <span className="font-bold text-black">
          {remaining}/{total}
        </span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
      <h4 className="font-bold text-gray-900 mb-1">{t('ai.limitReached')}</h4>
      <p className="text-sm text-gray-500 mb-3">{t('ai.limitDesc')}</p>
      <button
        type="button"
        onClick={() => router.push('/pricing')}
        className="text-sm font-bold text-black border-b-2 border-black hover:border-transparent transition-colors"
      >
        {t('ai.upgrade')} →
      </button>
    </div>
  );
}
