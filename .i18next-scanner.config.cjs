/* eslint @typescript-eslint/no-var-requires: "off" */
const fs = require('fs');
const path = require('path');

const getNamespaces = () => {
  const componentsDir = path.join(__dirname, 'src/component');
  return fs.readdirSync(componentsDir).filter((file) => {
    const filePath = path.join(componentsDir, file);
    return fs.statSync(filePath).isDirectory();
  });
};

module.exports = {
  input: ['src/**/*.{js,jsx,ts,tsx}', '!**/node_modules/**'],
  output: './',
  options: {
    compatibilityJSON: 'v4',
    debug: false,
    sort: true,
    removeUnusedKeys: true,
    func: {
      list: ['t', 'i18next.t', 'i18n.t'],
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
    },
    lngs: ['en', 'ko'],
    ns: getNamespaces(),
    defaultNs: 'dummy', // not common but dummy
    resource: {
      loadPath: 'src/locale/{{lng}}/{{ns}}.json',
      savePath: 'src/locale/{{lng}}/{{ns}}.json',
      jsonIndent: 2,
      lineEnding: '\n',
    },
    nsSeparator: ':',
    keySeparator: false,
    defaultValue: (lng, ns, key) => key,
  },

  transform: function customTransform(file, enc, done) {
    // save to sperate ns files
    // https://github.com/i18next/i18next-scanner/issues/142

    const parser = this.parser;
    const content = fs.readFileSync(file.path, enc);
    let namespaces = [];

    const namespaceMatches = content.match(/useTranslation\(\[([^\]]+)\]\)/);
    if (namespaceMatches) {
      namespaces = namespaceMatches[1].replace(/['"\s]/g, '').split(',');
    }

    if (namespaces.length === 0) {
      const singleNamespaceMatch = content.match(/useTranslation\(['"]([^'"]+)['"]\)/);
      if (singleNamespaceMatch) {
        namespaces = [singleNamespaceMatch[1]];
      }
    }

    if (namespaces.length === 0) {
      // not dummy but common
      namespaces = ['common'];
    }

    // use first namespace only
    const ns = namespaces[0];

    parser.parseFuncFromString(content, { list: ['t'] }, (key, options) => {
      options.ns = ns;
      parser.set(key, options);
    });

    done();
  },
};
