'use strict';

var BASE = '가'.charCodeAt(0);
var INITIALS = [
  'ㄱ',
  'ㄲ',
  'ㄴ',
  'ㄷ',
  'ㄸ',
  'ㄹ',
  'ㅁ',
  'ㅂ',
  'ㅃ',
  'ㅅ',
  'ㅆ',
  'ㅇ',
  'ㅈ',
  'ㅉ',
  'ㅊ',
  'ㅋ',
  'ㅌ',
  'ㅍ',
  'ㅎ',
];
var MEDIALS = [
  'ㅏ',
  'ㅐ',
  'ㅑ',
  'ㅒ',
  'ㅓ',
  'ㅔ',
  'ㅕ',
  'ㅖ',
  'ㅗ',
  'ㅘ',
  'ㅙ',
  'ㅚ',
  'ㅛ',
  'ㅜ',
  'ㅝ',
  'ㅞ',
  'ㅟ',
  'ㅠ',
  'ㅡ',
  'ㅢ',
  'ㅣ',
];
var FINALES = [
  '',
  'ㄱ',
  'ㄲ',
  'ㄳ',
  'ㄴ',
  'ㄵ',
  'ㄶ',
  'ㄷ',
  'ㄹ',
  'ㄺ',
  'ㄻ',
  'ㄼ',
  'ㄽ',
  'ㄾ',
  'ㄿ',
  'ㅀ',
  'ㅁ',
  'ㅂ',
  'ㅄ',
  'ㅅ',
  'ㅆ',
  'ㅇ',
  'ㅈ',
  'ㅊ',
  'ㅋ',
  'ㅌ',
  'ㅍ',
  'ㅎ',
];
var MIXED = {
  ㄲ: ['ㄱ', 'ㄱ'],
  ㄳ: ['ㄱ', 'ㅅ'],
  ㄵ: ['ㄴ', 'ㅈ'],
  ㄶ: ['ㄴ', 'ㅎ'],
  ㄺ: ['ㄹ', 'ㄱ'],
  ㄻ: ['ㄹ', 'ㅁ'],
  ㄼ: ['ㄹ', 'ㅂ'],
  ㄽ: ['ㄹ', 'ㅅ'],
  ㄾ: ['ㄹ', 'ㅌ'],
  ㄿ: ['ㄹ', 'ㅍ'],
  ㅀ: ['ㄹ', 'ㅎ'],
  ㅄ: ['ㅂ', 'ㅅ'],
  ㅆ: ['ㅅ', 'ㅅ'],
  ㅘ: ['ㅗ', 'ㅏ'],
  ㅙ: ['ㅗ', 'ㅐ'],
  ㅚ: ['ㅗ', 'ㅣ'],
  ㅝ: ['ㅜ', 'ㅓ'],
  ㅞ: ['ㅜ', 'ㅔ'],
  ㅟ: ['ㅜ', 'ㅣ'],
  ㅢ: ['ㅡ', 'ㅣ'],
};
var MEDIAL_RANGE = {
  ㅗ: ['ㅗ', 'ㅚ'],
  ㅜ: ['ㅜ', 'ㅟ'],
  ㅡ: ['ㅡ', 'ㅢ'],
};
function getPhonemes(char) {
  var initial = '';
  var medial = '';
  var finale = '';
  var initialOffset = -1;
  var medialOffset = -1;
  var finaleOffset = -1;
  if (char.match(/[ㄱ-ㅎ]/)) {
    initial = char;
    initialOffset = INITIALS.join('').search(char);
  } else if (char.match(/[가-힣]/)) {
    var tmp = char.charCodeAt(0) - BASE;
    finaleOffset = tmp % FINALES.length;
    medialOffset = ((tmp - finaleOffset) / FINALES.length) % MEDIALS.length;
    initialOffset = ((tmp - finaleOffset) / FINALES.length - medialOffset) / MEDIALS.length;
    initial = INITIALS[initialOffset];
    medial = MEDIALS[medialOffset];
    finale = FINALES[finaleOffset];
  }
  return {
    initial: initial,
    medial: medial,
    finale: finale,
    initialOffset: initialOffset,
    medialOffset: medialOffset,
    finaleOffset: finaleOffset,
  };
}
var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;
var reHasRegExpChar = RegExp(reRegExpChar.source);
function escapeRegExp(string) {
  return string && reHasRegExpChar.test(string) ? string.replace(reRegExpChar, '\\$&') : string || '';
}
var getInitialSearchRegExp = function (initial) {
  var initialOffset = INITIALS.indexOf(initial);
  if (initialOffset !== -1) {
    var baseCode = initialOffset * MEDIALS.length * FINALES.length + BASE;
    return '[' + String.fromCharCode(baseCode) + '-' + String.fromCharCode(baseCode + MEDIALS.length * FINALES.length - 1) + ']';
  }
  return initial;
};
var FUZZY = '__' + parseInt('fuzzy', 36) + '__';
var IGNORE_SPACE = '__' + parseInt('ignorespace', 36) + '__';

export function getRegExp(search, _a) {
  var _b = _a === void 0 ? {} : _a,
    _c = _b.initialSearch,
    initialSearch = _c === void 0 ? false : _c,
    _d = _b.startsWith,
    startsWith = _d === void 0 ? false : _d,
    _e = _b.endsWith,
    endsWith = _e === void 0 ? false : _e,
    _f = _b.ignoreSpace,
    ignoreSpace = _f === void 0 ? false : _f,
    _g = _b.ignoreCase,
    ignoreCase = _g === void 0 ? true : _g,
    _h = _b.global,
    global = _h === void 0 ? false : _h,
    _j = _b.fuzzy,
    fuzzy = _j === void 0 ? false : _j;
  var frontChars = search.split('');
  var lastChar = frontChars.slice(-1)[0];
  var lastCharPattern = '';
  var phonemes = getPhonemes(lastChar || '');
  if (phonemes.initialOffset !== -1) {
    frontChars = frontChars.slice(0, -1);
    var initial = phonemes.initial,
      medial = phonemes.medial,
      finale = phonemes.finale,
      initialOffset = phonemes.initialOffset,
      medialOffset = phonemes.medialOffset;
    var baseCode = initialOffset * MEDIALS.length * FINALES.length + BASE;
    var patterns = [];
    switch (true) {
      case finale !== '': {
        patterns.push(lastChar);
        if (INITIALS.includes(finale)) {
          patterns.push('' + String.fromCharCode(baseCode + medialOffset * FINALES.length) + getInitialSearchRegExp(finale));
        }
        if (MIXED[finale]) {
          patterns.push(
            '' +
              String.fromCharCode(baseCode + medialOffset * FINALES.length + FINALES.join('').search(MIXED[finale][0]) + 1) +
              getInitialSearchRegExp(MIXED[finale][1]),
          );
        }
        break;
      }
      case medial !== '': {
        var from = void 0,
          to = void 0;
        if (MEDIAL_RANGE[medial]) {
          from = baseCode + MEDIALS.join('').search(MEDIAL_RANGE[medial][0]) * FINALES.length;
          to = baseCode + MEDIALS.join('').search(MEDIAL_RANGE[medial][1]) * FINALES.length + FINALES.length - 1;
        } else {
          from = baseCode + medialOffset * FINALES.length;
          to = from + FINALES.length - 1;
        }
        patterns.push('[' + String.fromCharCode(from) + '-' + String.fromCharCode(to) + ']');
        break;
      }
      case initial !== '': {
        patterns.push(getInitialSearchRegExp(initial));
        break;
      }
    }
    lastCharPattern = patterns.length > 1 ? '(' + patterns.join('|') + ')' : patterns[0];
  }
  var glue = fuzzy ? FUZZY : ignoreSpace ? IGNORE_SPACE : '';
  var frontCharsPattern = initialSearch
    ? frontChars
        .map(function (char) {
          return char.search(/[ㄱ-ㅎ]/) !== -1 ? getInitialSearchRegExp(char) : escapeRegExp(char);
        })
        .join(glue)
    : escapeRegExp(frontChars.join(glue));
  var pattern = (startsWith ? '^' : '') + frontCharsPattern + glue + lastCharPattern + (endsWith ? '$' : '');
  if (glue) {
    pattern = pattern.replace(RegExp(FUZZY, 'g'), '.*').replace(RegExp(IGNORE_SPACE, 'g'), '\\s*');
  }
  return RegExp(pattern, (global ? 'g' : '') + (ignoreCase ? 'i' : ''));
}
