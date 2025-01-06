import i18n, { InitOptions } from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

interface ResourceObject {
  [key: string]: string | ResourceObject;
}

interface Resources {
  [language: string]: {
    [namespace: string]: ResourceObject;
  };
}

const resources = Object.fromEntries(
  Object.entries(import.meta.glob('./locale/**/*.json', { eager: true })).map(([key, value]) => {
    const [, language, namespace] = key.match(/\.\/locale\/(.+)\/(.+)\.json$/) || [];
    return [`${language}.${namespace}`, (value as { default: ResourceObject }).default];
  }),
);

const formattedResources = Object.entries(resources).reduce((acc, [key, value]) => {
  const [language, namespace] = key.split('.');
  if (!acc[language]) acc[language] = {};
  acc[language][namespace] = value;
  return acc;
}, {} as Resources);

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    defaultNS: 'common',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    resources: formattedResources,
    allowObjectInHTMLChildren: true,
    react: {
      useSuspense: true,
    },
    compatibilityJSON: 'v4',
  } as InitOptions);

export default i18n;
