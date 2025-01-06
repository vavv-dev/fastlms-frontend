const fs = require('fs');
const path = require('path');

const getNamespaces = () => {
  const componentsDir = path.join(__dirname, 'src/component'); // eslint-disable-line
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
    attr: {
      list: ['data-i18n', 'i18n-key', 't'],
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
    },
    lngs: ['en', 'ko'],
    ns: getNamespaces(),
    defaultNs: 'dummy',
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
    const parser = this.parser;
    const content = fs.readFileSync(file.path, enc);

    const styleProps = ['gridBoxSx', 'sx', 'style'];
    const ignoredProps = new RegExp(`(${styleProps.join('|')})=\\{\\{[^}]+\\}\\}`, 'g');

    let processedContent = content.replace(ignoredProps, 'IGNORED_STYLE_PROP');

    let namespaces = ['common'];

    const arrayNamespaceMatch = content.match(/useTranslation\(\[([^\]]+)\]\)/);
    if (arrayNamespaceMatch) {
      namespaces = arrayNamespaceMatch[1].replace(/['"\s]/g, '').split(',');
    } else {
      const singleNamespaceMatch = content.match(/useTranslation\(['"]([^'"]+)['"]\)/);
      if (singleNamespaceMatch) {
        namespaces = [singleNamespaceMatch[1]];
      }
    }

    parser.parseFuncFromString(processedContent, { list: ['t'] }, (key, options) => {
      if (!options.ns) {
        options.ns = namespaces[0];
      }
      parser.set(key, options);
    });

    done();
  },
};
