import { EmojiEvents, ReplyAll } from '@mui/icons-material';
import { Box, SxProps, Tooltip, Typography, useTheme } from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { ActionMenu } from './ActionMenu';
import { EnrollDialog } from './EnrollDialog';

import { CourseDisplayResponse as DisplayResponse } from '@/api';
import { ResourceCard } from '@/component/common';
import { formatRelativeTime, textEllipsisCss } from '@/helper/util';

interface Props {
  data: DisplayResponse;
  hideAvatar?: boolean;
  footer?: React.ReactNode;
  sx?: SxProps;
}

export const Card = ({ data, hideAvatar, footer, sx }: Props) => {
  const { t } = useTranslation('course');
  const theme = useTheme();
  const navigate = useNavigate();
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);

  return (
    <>
      <ResourceCard
        resource={data}
        onClick={() => (data.enrolled ? navigate(`/course/${data.id}`) : setEnrollDialogOpen(true))}
        banner={
          <Box sx={{ position: 'relative' }}>
            {data.thumbnail ? (
              <Box
                sx={{
                  aspectRatio: '16 / 9',
                  backgroundImage: `url(${data.thumbnail})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
            ) : (
              <Box
                sx={{ p: 2, aspectRatio: '16 / 9', ...textEllipsisCss(3) }}
                className="tiptap-content"
                dangerouslySetInnerHTML={{ __html: data.description || t('Thumbnail or description here') }}
              />
            )}

            <Typography
              onClick={(e) => {
                e.stopPropagation();
                if (data.marketing_url) window.open(data.marketing_url, '_blank');
                else navigate(`/course/${data.id}/outline`, { state: { enrolled: data.enrolled } });
              }}
              variant="caption"
              sx={{
                position: 'absolute',
                bottom: 6,
                right: 6,
                px: '6px',
                borderRadius: '4px',
                fontWeight: '600',
                zIndex: 5,
                color: 'common.white',
                bgcolor: 'rgba(0, 0, 0, 0.6)',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              {t('Course info')}
              <ReplyAll fontSize="small" />
            </Typography>
          </Box>
        }
        score={data.score}
        passed={data.passed}
        avatarChildren={[
          t(...formatRelativeTime(data.modified)),
          data.enrolled && (
            <Typography variant="caption" color="success">
              {t('Enrolled')}
            </Typography>
          ),
          data.certificate_templates.length > 0 && (
            <Tooltip title={t('This course provides a certificate.')}>
              <EmojiEvents
                fontSize="small"
                sx={{ bgcolor: 'info.light', borderRadius: '50%', padding: '1px', color: theme.palette.background.paper }}
              />
            </Tooltip>
          ),
        ]}
        hideAvatar={hideAvatar}
        actionMenu={<ActionMenu data={data} />}
        autoColor
        bannerBorder={!data.thumbnail}
        footer={footer}
        sx={sx}
      />
      {enrollDialogOpen && <EnrollDialog open={enrollDialogOpen} setOpen={setEnrollDialogOpen} id={data.id} />}
    </>
  );
};
