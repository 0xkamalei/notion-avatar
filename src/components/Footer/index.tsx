import { useTranslation } from 'next-i18next';
import Link from 'next/link';

export default function Footer() {
  const { t } = useTranslation(`common`);

  return (
    <footer className="flex flex-col items-center pb-4">
      <div className="flex flex-wrap justify-center mt-10 gap-x-1 gap-y-2">
        <Link className="transition hover:underline" href="/pricing">
          {t('menu.pricing')}
        </Link>
        <span className="mx-2">·</span>
        <Link className="transition hover:underline" href="/privacy-policy">
          {t('privacyPolicy')}
        </Link>
        <span className="mx-2">·</span>
        <Link className="transition hover:underline" href="/terms">
          {t('termOfUse')}
        </Link>
      </div>
    </footer>
  );
}
