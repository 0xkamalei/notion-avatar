import { useTranslation } from 'next-i18next';
import Image from 'next/legacy/image';
import Link from 'next/link';

export default function StyleExamples() {
  const { t } = useTranslation('common');

  const styles = [
    {
      id: 'notion',
      title: t('ai.title'),
      desc: t('ai.heroSubtitle'),
      image: '/examples/notion-1.png',
      url: '/ai-avatar/notion',
    },
    {
      id: 'ghibli',
      title: t('styleExamples.ghibli.title'),
      desc: t('styleExamples.ghibli.desc'),
      image: '/examples/ghibli-1.png',
      url: '/ai-avatar/ghibli',
    },
    {
      id: 'oil_painting',
      title: t('styleExamples.oil.title'),
      desc: t('styleExamples.oil.desc'),
      image: '/examples/oil_painting-1.png',
      url: '/ai-avatar/oil_painting',
    },
  ];

  return (
    <div className="flex flex-col gap-24 py-16">
      {styles.map((style) => (
        <section key={style.id} className="container mx-auto px-4 md:px-8">
          <div className="text-center">
            <div className="relative inline-block mb-6">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 relative">
                {style.title}
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
              {style.desc}
            </p>
            <div className="mb-8">
              <div className="relative w-64 h-64 mx-auto rounded-3xl overflow-hidden shadow-lg border-4 border-black">
                <Image
                  src={style.image}
                  alt={style.title}
                  layout="fill"
                  objectFit="cover"
                  className="hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>
            <Link
              href={style.url}
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
        </section>
      ))}

      <div className="text-center py-8">
        <p className="text-xl text-gray-500 font-medium tracking-wide">
          {t('styleExamples.moreComing')}
        </p>
      </div>
    </div>
  );
}
