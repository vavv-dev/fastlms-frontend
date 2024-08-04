/**
 * Get from local storage with default value
 * @param key - The key to get from local storage
 * @param defaultValue - The default value to return if the key is not found
 * @returns The value from local storage or the default value
 */
export const parseLocalStorage = <T>(key: string, defaultValue: T) => {
  const value = localStorage.getItem(key);
  if (value) {
    try {
      return JSON.parse(value);
    } catch (e) {
      // if already raw data saved, JSON.prase will fail
      console.error(e);
    }
  }
  return defaultValue;
};

/**
 * Format a date as a relative time string
 * @param date - The date to format
 * @param t - The translation function
 * @returns The formatted relative time string
 */
export function formatRelativeTime(date: Date | string | null | undefined): [string, { num: number; ns: string }?] {
  if (!date) {
    return [''];
  }
  if (typeof date === 'string') {
    date = new Date(date);
  }

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return ['Past seconds {{ num }}', { num: diffInSeconds, ns: 'common' }];
  } else if (diffInSeconds < 3600) {
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    return ['Past minutes {{ num }}', { num: diffInMinutes, ns: 'common' }];
  } else if (diffInSeconds < 86400) {
    const diffInHours = Math.floor(diffInSeconds / 3600);
    return ['Past hours {{ num }}', { num: diffInHours, ns: 'common' }];
  } else if (diffInSeconds < 604800) {
    const diffInDays = Math.floor(diffInSeconds / 86400);
    return ['Past days {{ num }}', { num: diffInDays, ns: 'common' }];
  } else if (diffInSeconds < 2419200) {
    const diffInWeeks = Math.floor(diffInSeconds / 604800);
    return ['Past weeks {{ num }}', { num: diffInWeeks, ns: 'common' }];
  } else if (diffInSeconds < 29030400) {
    const diffInMonths = Math.floor(diffInSeconds / 2419200);
    return ['Past months {{ num }}', { num: diffInMonths, ns: 'common' }];
  } else {
    const diffInYears = Math.floor(diffInSeconds / 29030400);
    return ['Past years {{ num }}', { num: diffInYears, ns: 'common' }];
  }
}

/**
 * Format a duration in seconds as a string in the format "HH:MM:SS" or "MM:SS"
 * @param seconds - The duration in seconds
 * @returns The formatted duration. example: 1:02:03
 */
export function formatDuration(seconds: number | string): string {
  // Ensure the input is a positive integer
  if (typeof seconds === 'string') {
    seconds = parseInt(seconds, 10);
  }
  seconds = Math.abs(Math.round(seconds));

  const hours: number = Math.floor(seconds / 3600);
  const minutes: number = Math.floor((seconds % 3600) / 60);
  const remainingSeconds: number = seconds % 60;

  // Helper function to add leading zeros
  const addLeadingZero = (value: number): string => (value < 10 ? `0${value}` : `${value}`);

  // Format the output based on the presence of hours
  if (hours === 0) {
    return `${addLeadingZero(minutes)}:${addLeadingZero(remainingSeconds)}`;
  } else {
    return `${hours}:${addLeadingZero(minutes)}:${addLeadingZero(remainingSeconds)}`;
  }
}

/**
 * Convert a duration string in the format "HH:MM:SS" or "MM:SS" to seconds
 * @param duration - The duration string to convert
 * @returns The duration in seconds
 */
export function durationToSeconds(duration: string): number {
  if (!duration) return 0;
  const parts = duration.split(':').reverse();
  let seconds = 0;
  for (let i = 0; i < parts.length; i++) {
    seconds += parseInt(parts[i], 10) * Math.pow(60, i);
  }
  return seconds;
}

/**
 * Parse a JWT token
 * @param token - The JWT token to parse
 * @returns The parsed JWT token
 * @returns null if the token is invalid
 */
export function parseJwt(token: string) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
}

/**
 * Format a number as a human-readable string
 * @param num - The number to format
 * @returns { count: number, symbol: string }
 */
export function humanNumber(keyPrefix: string, num: number): [string, { count: number; ns: string }] {
  const digits = 1;
  const lookup = [
    { value: 1e9, symbol: 'b' },
    { value: 1e7, symbol: 'tm' },
    { value: 1e6, symbol: 'm' },
    { value: 1e4, symbol: 'tk' },
    { value: 1e3, symbol: 'k' },
  ];
  const item = lookup.find((item) => num >= item.value);

  if (item) {
    const count = (num / item.value).toFixed(digits);
    return [`${keyPrefix} {{ count }}${item.symbol}`, { count: parseFloat(count), ns: 'common' }];
  } else {
    return [`${keyPrefix} {{ count}}`, { count: num, ns: 'common' }];
  }
}

/**
 * Generate a random dark color based on a seed string
 * @param seedString - The seed string to generate the color from
 * @param factor - The factor to darken the color by
 * @param opacity - The opacity of the color
 * @returns The generated color
 */
export function generateRandomDarkColor(seedString: string | undefined, factor = 0.4, opacity = 1) {
  if (!seedString) {
    return 'rgba(0, 0, 0, 0)';
  }
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    hash = seedString.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = `#${((hash & 0x00ffffff) | 0x1000000).toString(16).slice(1)}`;
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  const darkerR = Math.floor(r * factor);
  const darkerG = Math.floor(g * factor);
  const darkerB = Math.floor(b * factor);
  return `rgb(${darkerR}, ${darkerG}, ${darkerB}, ${opacity})`;
}

/**
 * Format a date as a string
 * @param date - The date to format
 * @returns The formatted date string
 */
export function formatYYYMMDD(d: string | Date): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format a date as input datetime-local format
 * @param dateString - The date string to format
 * @returns The formatted date string
 */
export function formatDatetimeLocale(dateString: string | null | undefined) {
  if (!dateString) {
    return '';
  }
  const d = new Date(dateString);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60 * 1000).toISOString().slice(0, -8);
}

/**
 * Format a date as a string
 * @param date - The date to format
 * @returns The formatted date string
 */
export function textEllipsisCss(lineCount: number) {
  return {
    display: '-webkit-box',
    WebkitLineClamp: lineCount,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    wordBreak: 'break-word',
  };
}

/**
 * Download a base64 encoded xlsx file
 * @param text - The base64 encoded xlsx file
 * @param filename - The filename to save the file as
 * @returns void
 */
export const base64XlsxDownload = (text: string, filename: string) => {
  const binaryString = atob(text);
  const arrayBuffer = new ArrayBuffer(binaryString.length);
  const uint8Array = new Uint8Array(arrayBuffer);
  for (let i = 0; i < binaryString.length; i++) {
    uint8Array[i] = binaryString.charCodeAt(i);
  }

  const mime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  const blob = new Blob([uint8Array], { type: mime });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
};

/**
 * Format a number as a human-readable string
 * @param num - The number to format
 * @returns The formatted number string
 */
export const toFixedHuman = (num: number | null | undefined, decimalPlaces: number) => {
  if (num == null || num == undefined) {
    return '';
  }
  return parseFloat(num.toFixed(decimalPlaces)).toString();
};
