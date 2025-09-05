import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import en from './locales/en.json';
import tr from './locales/tr.json';
import de from './locales/de.json';
import zh from './locales/zh.json';

const resources = {
  en: { translation: en },
  tr: { translation: tr },
  de: { translation: de },
  zh: { translation: zh },
};

// Determine language tag robustly across SDK versions
const getInitialLanguage = () => {
  try {
    // SDK 49+: use getLocales()
    const locales: any = (Localization as any).getLocales?.();
    if (Array.isArray(locales) && locales.length > 0) {
      return locales[0].languageTag || locales[0].languageCode || 'en';
    }
    // Fallback older API
    const legacy = (Localization as any).locale;
    if (typeof legacy === 'string' && legacy.length > 0) return legacy;
  } catch {
    // ignore
  }
  return 'en';
};

i18n.use(initReactI18next).init({
  resources,
  lng: getInitialLanguage(),
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
