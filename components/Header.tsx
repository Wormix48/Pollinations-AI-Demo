
import React from 'react';
import { SparklesIcon } from './Icons';
import { useTranslation } from '../hooks/useTranslation';

export const Header: React.FC = () => {
  const { language, setLanguage, t } = useTranslation();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ru' : 'en');
  };

  return (
    <header className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-700/50 sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <SparklesIcon className="w-8 h-8 text-indigo-400" />
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {t('header.title')} <span className="text-indigo-400">{t('header.subtitle')}</span>
          </h1>
        </div>
        <button
          onClick={toggleLanguage}
          className="font-semibold text-sm py-2 px-4 rounded-md bg-gray-700/50 hover:bg-gray-700 transition-colors"
          aria-label={`Switch language to ${language === 'en' ? 'Russian' : 'English'}`}
        >
          {language === 'en' ? 'RU' : 'EN'}
        </button>
      </div>
    </header>
  );
};
