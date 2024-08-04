declare module '@/helper/search' {
  interface Phonemes {
    initial: string;
    medial: string;
    finale: string;
    initialOffset: number;
    medialOffset: number;
    finaleOffset: number;
  }

  interface GetRegExpOptions {
    initialSearch?: boolean;
    startsWith?: boolean;
    endsWith?: boolean;
    ignoreSpace?: boolean;
    ignoreCase?: boolean;
    global?: boolean;
    fuzzy?: boolean;
  }

  export function getRegExp(search: string, options?: GetRegExpOptions): RegExp;
}
