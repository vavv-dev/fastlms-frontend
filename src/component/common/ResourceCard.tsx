import { WithAvatar, useFixMouseLeave } from '@/component/common';
import { generateRandomDarkColor, textEllipsisCss } from '@/helper/util';
import { BookmarkBorderOutlined } from '@mui/icons-material';
import { Box, LinearProgress, Stack, Typography, darken, useTheme } from '@mui/material';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  resource: {
    title: string;
    is_public?: boolean;
    bookmarked: boolean;
    owner: {
      name: string;
      username: string;
      thumbnail?: string | null;
    };
  };
  onClick: (e: React.MouseEvent) => void;
  banner?: React.ReactNode;
  bannerPlace?: 'top' | 'bottom';
  score: number | null;
  passed: boolean | null;
  avatarChildren?: React.ReactNode[];
  hideAvatar?: boolean;
  autoColor?: boolean;
  actionMenu?: React.ReactNode;
  footer?: React.ReactNode;
}

const ResourceCard = ({
  resource,
  onClick,
  banner,
  bannerPlace = 'top',
  avatarChildren,
  hideAvatar,
  autoColor,
  actionMenu,
  score,
  passed,
  footer,
}: Props) => {
  const { t } = useTranslation('common');
  const theme = useTheme();
  const color = autoColor ? generateRandomDarkColor(resource.title, 1, 0.1) : 'inherit';
  const cardRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);

  // Fix  with hovering
  useFixMouseLeave(cardRef, () => {
    setHover(false);
  });

  const Banner = () => (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        bgcolor: color,
        border: `1px solid ${darken(color, 0.5)}`,
        position: 'relative',
        borderRadius: theme.shape.borderRadius / 2,
        gap: 1.5,
        overflow: 'hidden',
      }}
    >
      {!resource.is_public && (
        <Box
          sx={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            top: 0,
            right: 0,
            background: 'rgba(0,0,0,0.7)',
            color: 'white',
            zIndex: 3,
            p: 1,
          }}
        >
          {t('Not public')}
        </Box>
      )}
      {banner}
      {typeof score == 'number' && (
        <LinearProgress
          variant="determinate"
          value={score}
          sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', bgcolor: 'action.disalbedBackground' }}
          color={passed ? 'success' : 'warning'}
        />
      )}
    </Box>
  );

  return (
    <Box
      ref={cardRef}
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      sx={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 1 }}
    >
      {bannerPlace === 'top' && <Banner />}
      <Typography variant="subtitle2" sx={{ fontWeight: '600', mt: 1, lineHeight: 1.2, ...textEllipsisCss(1) }}>
        {resource.title}
      </Typography>
      <WithAvatar
        name={resource.owner.name}
        username={resource.owner.username}
        thumbnail={resource.owner.thumbnail}
        hideAvatar={hideAvatar}
        sx={bannerPlace === 'bottom' ? { flexGrow: 0, mb: 1 } : {}}
      >
        <Stack sx={{ color: 'text.secondary', fontSize: '0.9rem' }} direction="row" spacing={1}>
          {avatarChildren?.map((child, i) => (
            <Typography key={i} component="div" variant="subtitle2">
              {child}
            </Typography>
          ))}
          {resource.bookmarked && <BookmarkBorderOutlined fontSize="small" />}
        </Stack>
        <Box sx={{ display: !hover ? 'none' : 'block', position: 'absolute', right: '-8px' }}>{actionMenu}</Box>
      </WithAvatar>
      {bannerPlace === 'bottom' && <Banner />}
      {footer}
    </Box>
  );
};

export default ResourceCard;
