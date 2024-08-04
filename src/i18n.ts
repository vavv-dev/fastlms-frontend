import i18n, { InitOptions } from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

interface Resources {
  [key: string]: Resources;
}

const importAll = async () => {
  // Import all json files in the locale folder
  const files = import.meta.glob('./locale/**/*.json');
  const resources: Resources = {};

  for (const path in files) {
    const [, language, namespace] = path.match(/\/([^/]+)\/([^/]+)\.json$/) || [];

    if (language && namespace) {
      const data = (await files[path]()) as { default: Resources };
      resources[language] = resources[language] || {};
      resources[language][namespace] = data.default;
    }
  }
  return resources;
};

// Initialize i18n
const resources = await importAll();

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    // ns: ['common'],
    defaultNS: 'common',
    // lng: detected browserLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    resources,
    // keySeparator: false,
    allowObjectInHTMLChildren: true,
    react: {
      useSuspense: true,
    },
    compatibilityJSON: 'v4',
  } as InitOptions);

export default i18n;
