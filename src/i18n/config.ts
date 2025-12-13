import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import ja from './locales/ja.json';
import en from './locales/en.json';
import hi from './locales/hi.json';
import bn from './locales/bn.json';
import zh from './locales/zh.json';
import es from './locales/es.json';
import ar from './locales/ar.json';
import pt from './locales/pt.json';
import ru from './locales/ru.json';
import fr from './locales/fr.json';

export const resources = {
  ja: { translation: ja },
  en: { translation: en },
  hi: { translation: hi },
  bn: { translation: bn },
  zh: { translation: zh },
  es: { translation: es },
  ar: { translation: ar },
  pt: { translation: pt },
  ru: { translation: ru },
  fr: { translation: fr },
} as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'ja',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
