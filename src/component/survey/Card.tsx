import { Box } from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ActionMenu } from './ActionMenu';
import { ViewDialog } from './ViewDialog';

import { SurveyDisplayResponse as DisplayResponse } from '@/api';
import { ResourceCard } from '@/component/common';
import { formatRelativeTime, textEllipsisCss } from '@/helper/util';

interface Props {
  data: DisplayResponse;
  hideAvatar?: boolean;
}

export const Card = ({ data, hideAvatar }: Props) => {
  const { t } = useTranslation('survey');
  const [viewOpen, setViewOpen] = useState(false);

  return (
    <>
      <ResourceCard
        resource={data}
        onClick={() => setViewOpen(true)}
        banner={
          data.thumbnail ? (
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
          )
        }
        score={data.passed ? 100 : null}
        passed={data.passed}
        inProgress={data.status == 'in_progress'}
        avatarChildren={[t(...formatRelativeTime(data.modified))]}
        hideAvatar={hideAvatar}
        actionMenu={<ActionMenu data={data} />}
        autoColor
        bannerBorder={!data.thumbnail}
      />
      {viewOpen && <ViewDialog open={viewOpen} setOpen={setViewOpen} id={data.id} />}
    </>
  );
};
