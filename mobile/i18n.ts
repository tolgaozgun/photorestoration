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

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: Localization.locale,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
