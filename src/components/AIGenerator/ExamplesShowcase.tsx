import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import Image from 'next/legacy/image';
import { AvatarStyle } from '@/types/ai';

interface Example {
  before?: string;
  after: string;
  prompt?: string;
  type: 'photo2avatar' | 'text2avatar';
}

interface ExamplesShowcaseProps {
  style: AvatarStyle;
  onApplyPrompt?: (prompt: string) => void;
}

interface ImageComparisonProps {
  before: string;
  after: string;
  beforeLabel: string;
  afterLabel: string;
}

function ImageComparison({
  before,
  after,
  beforeLabel,
  afterLabel,
}: ImageComparisonProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, percentage)));
  };

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = (x / rect.width) * 100;
        setSliderPosition(Math.max(0, Math.min(100, percentage)));
      }
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging]);

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-square bg-white rounded-lg overflow-hidden border-3 border-black cursor-col-resize group"
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      role="slider"
      aria-label="Image comparison slider"
      aria-valuenow={sliderPosition}
      aria-valuemin={0}
      aria-valuemax={100}
      tabIndex={0}
    >
      {/* Before Image (Background) */}
      <div className="absolute inset-0">
        <Image src={before} alt="Before" layout="fill" objectFit="cover" />
      </div>

      {/* After Image (Clipped) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <Image src={after} alt="After" layout="fill" objectFit="cover" />
      </div>

      {/* Slider Line */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-black z-20 transition-opacity group-hover:opacity-100 opacity-80"
        style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
      >
        {/* Slider Handle */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-black rounded-full border-4 border-white flex items-center justify-center shadow-lg cursor-grab active:cursor-grabbing">
          <div className="flex gap-1">
            <div className="w-1 h-4 bg-white rounded-full" />
            <div className="w-1 h-4 bg-white rounded-full" />
            <div className="w-1 h-4 bg-white rounded-full" />
          </div>
        </div>
      </div>

      {/* Labels */}
      <div className="absolute top-2 left-2 bg-black text-white text-xs font-bold px-3 py-1 rounded-full z-10 border-2 border-white">
        {beforeLabel}
      </div>
      <div className="absolute top-2 right-2 bg-black text-white text-xs font-bold px-3 py-1 rounded-full z-10 border-2 border-white">
        {afterLabel}
      </div>
    </div>
  );
}

export default function ExamplesShowcase({
  style,
  onApplyPrompt,
}: ExamplesShowcaseProps) {
  const { t } = useTranslation('common');

  // Notion Style Examples
  const notionPhotoExamples: Example[] = [
    {
      before: '/image/angelina.jpg',
      after: '/examples/notion-1.png',
      type: 'photo2avatar',
    },
    {
      before: '/image/jack-chen.jpeg',
      after: '/examples/notion-2.png',
      type: 'photo2avatar',
    },
    {
      before: '/image/smith.jpg',
      after: '/examples/notion-3.png',
      type: 'photo2avatar',
    },
  ];

  const notionTextExamples: Example[] = [
    {
      after: '/examples/notion-text-1.png',
      prompt: t('ai.examples.prompt1'),
      type: 'text2avatar',
    },
    {
      after: '/examples/notion-text-2.png',
      prompt: t('ai.examples.prompt2'),
      type: 'text2avatar',
    },
    {
      after: '/examples/notion-text-3.png',
      prompt: t('ai.examples.prompt3'),
      type: 'text2avatar',
    },
  ];

  const ghibliPhotoExamples: Example[] = [
    {
      before: '/image/angelina.jpg',
      after: '/examples/ghibli-1.png',
      type: 'photo2avatar',
    },
    {
      before: '/image/jack-chen.jpeg',
      after: '/examples/ghibli-2.png',
      type: 'photo2avatar',
    },
    {
      before: '/image/smith.jpg',
      after: '/examples/ghibli-3.png',
      type: 'photo2avatar',
    },
  ];

  const ghibliTextExamples: Example[] = [
    {
      after: '/examples/ghibli-text-1.png',
      prompt: t('ai.examples.ghibliPrompt1'),
      type: 'text2avatar',
    },
    {
      after: '/examples/ghibli-text-2.png',
      prompt: t('ai.examples.ghibliPrompt2'),
      type: 'text2avatar',
    },
    {
      after: '/examples/ghibli-text-3.png',
      prompt: t('ai.examples.ghibliPrompt3'),
      type: 'text2avatar',
    },
  ];

  const oilPhotoExamples: Example[] = [
    {
      before: '/image/angelina.jpg',
      after: '/examples/oil_painting-1.png',
      type: 'photo2avatar',
    },
    {
      before: '/image/jack-chen.jpeg',
      after: '/examples/oil_painting-2.png',
      type: 'photo2avatar',
    },
    {
      before: '/image/smith.jpg',
      after: '/examples/oil_painting-3.png',
      type: 'photo2avatar',
    },
  ];

  const oilTextExamples: Example[] = [
    {
      after: '/examples/oil_painting-text-1.png',
      prompt: t('ai.examples.oilPrompt1'),
      type: 'text2avatar',
    },
    {
      after: '/examples/oil_painting-text-2.png',
      prompt: t('ai.examples.oilPrompt2'),
      type: 'text2avatar',
    },
    {
      after: '/examples/oil_painting-text-3.png',
      prompt: t('ai.examples.oilPrompt3'),
      type: 'text2avatar',
    },
  ];

  const getPhotoExamples = () => {
    switch (style) {
      case 'ghibli':
        return ghibliPhotoExamples;
      case 'oil_painting':
        return oilPhotoExamples;
      default:
        return notionPhotoExamples;
    }
  };

  const getTextExamples = () => {
    switch (style) {
      case 'ghibli':
        return ghibliTextExamples;
      case 'oil_painting':
        return oilTextExamples;
      default:
        return notionTextExamples;
    }
  };

  const photoExamples = getPhotoExamples();
  const textExamples = getTextExamples();

  return (
    <section className="py-16 relative animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-6xl mx-auto px-4">
        {/* Photo to Avatar Examples */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 inline-block relative">
              <span className="relative">
                {t('ai.examples.photoTitle')} ({t(`ai.style.${style}`)})
              </span>
              <span className="absolute top-[-32px] left-[-32px]">
                <Image
                  src="/icon/bling.svg"
                  width={32}
                  height={34}
                  alt="Bling"
                />
              </span>
            </h2>
            <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
              {t('ai.examples.photoDesc')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {photoExamples.map((example) => (
              <div key={example.after} className="flex flex-col items-center">
                <ImageComparison
                  before={example.before!}
                  after={example.after}
                  beforeLabel={t('ai.examples.original')}
                  afterLabel={t('ai.examples.generated')}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Text to Avatar Examples */}
        <div>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 inline-block relative">
              <span className="relative">
                {t('ai.examples.textTitle')} ({t(`ai.style.${style}`)})
              </span>
              <span className="absolute top-[-32px] right-[-32px]">
                <Image
                  src="/icon/ai-magic.svg"
                  width={32}
                  height={32}
                  alt="Magic"
                />
              </span>
            </h2>
            <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
              {t('ai.examples.textDesc')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {textExamples.map((example, index) => (
              <div
                key={example.after}
                className="group relative bg-white rounded-xl shadow-sm border-2 border-black overflow-hidden hover:shadow-xl transition-all duration-300"
              >
                <div className="relative aspect-square overflow-hidden bg-gray-50">
                  <Image
                    src={example.after}
                    alt={`Example ${index + 1}`}
                    layout="fill"
                    objectFit="cover"
                    className="group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
                </div>
                <div className="p-5 bg-white border-t-2 border-black">
                  <p className="text-sm text-gray-600 italic line-clamp-3 mb-4 min-h-[60px]">
                    &quot;{example.prompt}&quot;
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      example.prompt && onApplyPrompt?.(example.prompt)
                    }
                    className="w-full py-2 px-4 bg-gray-50 hover:bg-black hover:text-white border-2 border-black rounded-lg text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <Image
                      src="/icon/ai-magic.svg"
                      width={16}
                      height={16}
                      alt="Magic"
                      className="group-hover:invert"
                    />
                    {t('ai.examples.apply')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
