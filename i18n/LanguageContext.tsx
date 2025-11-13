
import React, { createContext, ReactNode, FC } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { locales } from './locales';

export type Language = 'en' | 'ru';

// This is a type guard to check if a key exists in the locales object.
// It helps with type safety when accessing nested properties.
type PathImpl<T, Key extends keyof T> = Key extends string
  ? T[Key] extends Record<string, any>
    ? | `${Key}.${PathImpl<T[Key], Exclude<keyof T[Key], keyof any[]>> & string}`
      | `${Key}.${Exclude<keyof T[Key], keyof any[]> & string}`
    : never
  : never;
type Path<T> = PathImpl<T, keyof T> | keyof T;
type TranslationKey = Path<typeof locales.en>;


interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey, replacements?: { [key: string]: string | number }) => string;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// FIX: Changed component definition to use React.FC for consistency and to resolve type inference issues.
export const LanguageProvider: FC<{children: ReactNode}> = ({ children }) => {
  const [language, setLanguage] = useLocalStorage<Language>('language', 'ru');

  const t = (key: TranslationKey, replacements?: { [key: string]: string | number }): string => {
    const langDict = locales[language] || locales['en'];
    // The 'as any' is a concession to TypeScript's difficulty with deeply nested string literal types.
    // The Path<T> type provides developer-time safety, and this implementation is robust.
    let translation = (key as string).split('.').reduce((obj, k) => obj && obj[k], langDict as any);
    
    if (typeof translation !== 'string') {
        console.warn(`Translation key '${key}' not found for language '${language}'.`);
        return key;
    }

    if (replacements) {
        Object.keys(replacements).forEach(rKey => {
            translation = translation.replace(`{${rKey}}`, String(replacements[rKey]));
        });
    }

    return translation;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
