import { AvatarStyle } from '@/types/ai';
import { useTranslation } from 'next-i18next';

interface StyleSelectorProps {
  currentStyle: AvatarStyle;
  onStyleChange: (style: AvatarStyle) => void;
  disabled?: boolean;
}

export default function StyleSelector({
  currentStyle,
  onStyleChange,
  disabled,
}: StyleSelectorProps) {
  const { t } = useTranslation('common');

  const styles: { id: AvatarStyle; label: string }[] = [
    { id: 'notion', label: t('ai.style.notion', 'Notion Style') },
    { id: 'ghibli', label: t('ai.style.ghibli', 'Ghibli Style') },
    { id: 'oil_painting', label: t('ai.style.oil_painting', 'Oil Painting') },
  ];

  return (
    <div className="flex flex-col items-center mb-8">
      <label className="mb-2 text-sm font-medium text-gray-700">
        {t('ai.style.label', 'Select Style')}
      </label>
      <div className="flex p-1 bg-gray-100 rounded-lg max-w-2xl mx-auto overflow-x-auto">
        {styles.map((style) => (
          <button
            key={style.id}
            type="button"
            onClick={() => onStyleChange(style.id)}
            disabled={disabled}
            className={`py-2 px-6 rounded-md text-sm font-bold transition-all duration-200 whitespace-nowrap ${
              currentStyle === style.id
                ? 'bg-white text-black shadow-sm'
                : 'text-gray-500 hover:text-black'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {style.label}
          </button>
        ))}
      </div>
    </div>
  );
}
