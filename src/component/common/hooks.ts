import debounce from 'lodash/debounce';
import isObject from 'lodash/isObject';
import { useEffect, useRef, useState } from 'react';
import { FieldErrors, FieldValues, UseFormWatch } from 'react-hook-form';
import useSWRImmutable from 'swr/immutable';
import useSWRInfinite, { SWRInfiniteConfiguration } from 'swr/infinite';

interface PaginateProps {
  page: number;
  pages: number;
}

interface InfinitePaginationProps<T, K extends PaginateProps> {
  apiOptions: T;
  apiService: (options: T) => Promise<K>;
  infiniteScrollRef?: React.RefObject<HTMLDivElement | null>;
  observerOptions?: {
    root?: Element | null;
    rootMargin?: string;
    threshold?: number | number[];
  };
  swrInfiniteOption?: SWRInfiniteConfiguration<K>;
}

export const useInfinitePagination = <T, K extends PaginateProps>(options: InfinitePaginationProps<T, K>) => {
  const { data, isValidating, isLoading, size, setSize, mutate } = useSWRInfinite<K>(
    (index, prev) => {
      // return null if apiOptions is empty
      if (!options.apiOptions || !Object.values(options.apiOptions as object).filter((v) => v).length) return null;
      if (prev && prev.page == prev.pages) return null;
      return `${options.apiService.name}?${Object.entries(options.apiOptions as object)
        .map(([key, value]) => `${key}=${value}`)
        .sort()
        .join('&')}:${index + 1}`;
    },
    async (key) => {
      const page = key.split(':')[1];
      const opts = options.apiOptions;
      (Object.keys(opts as object) as Array<keyof T>).forEach((key) => !opts[key] && delete opts[key]);
      return await options.apiService({ page, ...opts });
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateFirstPage: false,
      // revalidateOnMount: false,
      revalidateIfStale: false,
      initialSize: 1,
      // keepPreviousData: true,
      ...options.swrInfiniteOption,
    },
  );

  const lastRunTime = useRef(0);
  const THROTTLE_DELAY = 500;

  useEffect(() => {
    if (!options.infiniteScrollRef?.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!data || data.length >= data[0].pages) return;
        if (isLoading || isValidating) return;
        if (entries.length > 1) return;
        if (entries[0].isIntersecting) {
          const now = Date.now();
          if (now - lastRunTime.current >= THROTTLE_DELAY) {
            setSize(size + 1);
            lastRunTime.current = now;
          }
        }
      },
      { threshold: 0.5, ...options.observerOptions },
    );

    observer.observe(options.infiniteScrollRef.current);
    return () => observer.disconnect();
  }, [data, data?.length, options.infiniteScrollRef?.current, isLoading, isValidating]); // eslint-disable-line

  return { data, isValidating, isLoading, size, setSize, mutate };
};

export const useDebounce = (value: string, delay: number): string => {
  const [debouncedValue, setDebouncedValue] = useState<string>(value);
  useEffect(() => {
    const handler = debounce((val: string) => {
      setDebouncedValue(val);
    }, delay);
    handler(value);
    return () => {
      handler.cancel();
    };
  }, [value, delay]);
  return debouncedValue;
};

export const useServiceImmutable = <T, K>(apiService: (params: T) => Promise<K>, params: T | null | undefined) => {
  const getSortedParamsKey = (params: T) => {
    return JSON.stringify(Object.fromEntries(Object.entries(params as object).sort()));
  };
  const { data, mutate, isValidating, isLoading, error } = useSWRImmutable<K>(
    () => {
      // Explicit undefined argument means apiService's params is empty
      if (params === undefined) return apiService.name;
      return params && Object.values(params as object).filter((v) => v).length > 0
        ? `${apiService.name}/${getSortedParamsKey(params)}`
        : null;
    },
    async () => {
      return await apiService(params as T);
    },
    {
      keepPreviousData: true,
      onErrorRetry: (error, _, __, revalidate, { retryCount }) => {
        if (error.status === 404) return;
        if (retryCount >= 10) return;
        setTimeout(() => revalidate({ retryCount }), 5000);
      },
    },
  );
  return { data, mutate, isValidating, isLoading, error };
};

export const useFixMouseLeave = (containerRef: React.RefObject<HTMLDivElement | null>, handler: () => void) => {
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current) {
        const { clientX, clientY } = e;
        const { top, left, right, bottom } = containerRef.current.getBoundingClientRect();
        if (clientX < left || clientX > right || clientY < top || clientY > bottom) {
          handler();
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [containerRef, handler]);
};

export const useScrollToFirstError = (errors: FieldErrors) => {
  useEffect(() => {
    const findFirstErrorElement = (err: FieldErrors, parentPath: string = ''): HTMLElement | null => {
      for (const key in err) {
        if (Object.prototype.hasOwnProperty.call(err, key)) {
          const error = err[key];
          const currentPath = parentPath ? `${parentPath}.${key}` : key;
          if (isObject(error)) {
            if (error.ref) {
              const element = document.getElementsByName(currentPath)[0];
              if (element instanceof HTMLElement) {
                return element;
              }
            } else {
              const nestedElement = findFirstErrorElement(error as FieldErrors, currentPath);
              if (nestedElement) {
                return nestedElement;
              }
            }
          }
        }
      }
      return null;
    };
    if (errors) {
      const firstErrorElement = findFirstErrorElement(errors);
      if (firstErrorElement) {
        setTimeout(() => {
          firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          firstErrorElement.focus({ preventScroll: true });
        }, 0);
      }
    }
  }, [errors]);
};

export const useScrollToNewElement = <T extends FieldValues>(watch: UseFormWatch<T>) => {
  const prevLengthRef = useRef<Record<string, number>>({});
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (!name || !value || !Array.isArray(value[name])) {
        return;
      }
      const currentLength = value[name].length;
      const prevLength = prevLengthRef.current[name] || 0;
      if (currentLength > prevLength) {
        const newIndex = currentLength - 1;
        const firstField = Object.keys(value[name][0])[0];
        requestAnimationFrame(() => {
          const newElement = document.querySelector(`[name="${name}.${newIndex}.${firstField}"]`);
          if (newElement) {
            newElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        });
      }
      prevLengthRef.current[name] = currentLength;
    });
    return () => subscription.unsubscribe();
  }, [watch]);
};
