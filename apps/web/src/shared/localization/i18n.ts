import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { appConfig } from '@/app/config/env';
import en from './locales/en.json';
import ar from './locales/ar.json';

const savedLocale = localStorage.getItem('locale') || appConfig.defaultLocale;

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ar: { translation: ar },
  },
  lng: savedLocale,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export { i18n };
