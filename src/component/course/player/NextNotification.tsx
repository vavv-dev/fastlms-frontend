import { Close } from '@mui/icons-material';
import { Button, Fade, Slide, Tooltip, Typography, useMediaQuery } from '@mui/material';
import Box from '@mui/material/Box';
import { memo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { textEllipsisCss } from '@/helper/util';

interface ResourceMeta {
  title: string;
  thumbnail: string;
  passed: boolean | null;
}

interface NextNotificationProps {
  canGoForward: boolean;
  onForward: () => void;
  nextMeta: ResourceMeta | null;
  nextProgress: string;
}

export const NextNotification = memo(({ canGoForward, onForward, nextMeta, nextProgress }: NextNotificationProps) => {
  const { t } = useTranslation('course');
  const [showClose, setShowClose] = useState(false);
  const [displayData, setDisplayData] = useState<{ meta: ResourceMeta; progress: string } | null>(null);
  const mobileDown = useMediaQuery((theme) => theme.breakpoints.down('mobile'));

  useEffect(() => {
    if (canGoForward && nextMeta) {
      const timer = setTimeout(() => {
        setDisplayData({
          meta: nextMeta,
          progress: nextProgress,
        });
      }, 1000);
      return () => {
        clearTimeout(timer);
        setDisplayData(null);
      };
    } else {
      setDisplayData(null);
    }
  }, [canGoForward, nextMeta, nextProgress]);

  useEffect(() => {
    if (!displayData) setShowClose(false);
  }, [displayData]);

  if (!canGoForward || !displayData || !displayData.meta) return null;

  return (
    <Tooltip title={t('You can move to the next resource.')} placement="top">
      <Box
        onMouseEnter={() => setShowClose(true)}
        onMouseLeave={() => setShowClose(false)}
        sx={{
          position: 'absolute',
          bottom: '1em',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1,
        }}
      >
        <Slide direction="up" in={true} mountOnEnter unmountOnExit>
          <Box>
            <Fade in={mobileDown || showClose}>
              <Button
                onClick={() => setDisplayData(null)}
                size="small"
                variant="contained"
                color="inherit"
                sx={{
                  position: 'absolute',
                  left: '-4px',
                  top: '-4px',
                  zIndex: 1,
                  borderRadius: '50%',
                  aspectRatio: 1,
                  minWidth: 0,
                  height: 20,
                  color: 'text.secondary',
                }}
              >
                <Close sx={{ fontSize: 12 }} />
              </Button>
            </Fade>
            <Button
              onClick={() => onForward()}
              variant="contained"
              sx={{
                width: '100%',
                alignItems: 'center',
                py: 1.5,
                px: 2,
                gap: 1.5,
                borderRadius: 2,
                bgcolor: 'success.light',
                display: 'flex',
                maxWidth: 350,
                justifyContent: 'flex-start',
              }}
            >
              {displayData.meta.thumbnail && (
                <Box
                  sx={{
                    height: 40,
                    aspectRatio: '16/9',
                    borderRadius: 1,
                    backgroundImage: `url(${displayData.meta.thumbnail})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    flexShrink: 0,
                  }}
                />
              )}
              <Box sx={{ textAlign: 'left', flexShrink: 1, overflow: 'hidden' }}>
                <Typography variant="caption">
                  {`${t('Next')}:`} {displayData.progress}
                </Typography>
                <Typography variant="body2" sx={{ ...textEllipsisCss(1) }}>
                  {displayData.meta.title}
                </Typography>
              </Box>
            </Button>
          </Box>
        </Slide>
      </Box>
    </Tooltip>
  );
});
