import { Box, Popper } from '@mui/material';
import type { EmojiClickData, Theme } from 'emoji-picker-react';
import { useAtomValue } from 'jotai';
import { Suspense, lazy, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { GradientCircularProgress } from '@/component/common';
import { modeState } from '@/theme';

const EmojiPicker = lazy(() =>
  import('emoji-picker-react').then((module) => ({
    default: module.default,
  })),
);

const EmojiPickerLoader = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 290, width: 400 }}>
    <GradientCircularProgress size={32} />
  </Box>
);

interface Props {
  insertEmoji: (emojiData: EmojiClickData) => void;
  showPicker: boolean;
  setShowPicker: (show: boolean) => void;
  emojiButtonRef: React.RefObject<HTMLButtonElement | null>;
}

export const EmojiPickerWrapper = ({ insertEmoji, showPicker, setShowPicker, emojiButtonRef }: Props) => {
  const { t } = useTranslation('comment');
  const mode = useAtomValue(modeState);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  const categories = useMemo(
    () => [
      { category: 'suggested', name: t('Suggested') },
      { category: 'smileys_people', name: t('Smileys & Emotion') },
      { category: 'animals_nature', name: t('Animals & Nature') },
      { category: 'food_drink', name: t('Food & Drink') },
      { category: 'travel_places', name: t('Travel & Places') },
      { category: 'activities', name: t('Activities') },
      { category: 'objects', name: t('Objects') },
      { category: 'symbols', name: t('Symbols') },
      { category: 'flags', name: t('Flags') },
    ],
    [t],
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!wrapperRef.current || !pickerRef.current) return;

      const clickedElement = event.target as Node;
      const isInsideEmojiPicker = pickerRef.current.contains(clickedElement);
      const isInsideWrapper = wrapperRef.current.contains(clickedElement);
      const isEmojiButton = emojiButtonRef.current?.contains(clickedElement);

      if (isInsideEmojiPicker) return;
      if (!isInsideWrapper && !isEmojiButton) setShowPicker(false);
    };

    if (showPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPicker, setShowPicker, emojiButtonRef]);

  return (
    <Popper
      open={showPicker}
      anchorEl={emojiButtonRef.current}
      placement="bottom-start"
      sx={{ zIndex: (theme) => theme.zIndex.modal + 1 }}
    >
      <Box
        ref={wrapperRef}
        onKeyDown={(e) => e.stopPropagation()}
        sx={{
          position: 'relative',
          borderRadius: 2,
          bgcolor: 'background.paper',
          boxShadow: (theme) => theme.shadows[8],
          '& .epr-category-nav': { justifyContent: 'center', gap: 1, pb: 0.5 },
          '& .EmojiPickerReact': {
            border: 'none',
            '--epr-category-navigation-button-size': '24px',
            '--epr-emoji-size': '24px',
            '--epr-category-label-height': '32px',
          },
        }}
      >
        <Suspense fallback={<EmojiPickerLoader />}>
          <Box ref={pickerRef} sx={{ maxWidth: '100%' }}>
            <EmojiPicker
              theme={mode as Theme}
              searchDisabled
              lazyLoadEmojis
              onEmojiClick={(emoji) => insertEmoji(emoji)}
              previewConfig={{ showPreview: false }}
              height={290}
              // @ts-expect-error categories
              categories={categories}
            />
          </Box>
        </Suspense>
      </Box>
    </Popper>
  );
};
