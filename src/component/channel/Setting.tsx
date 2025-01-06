import {
  EmojiEventsOutlined,
  InfoOutlined,
  NotificationsOutlined
} from '@mui/icons-material';
import { Box, Tab, Tabs, Theme, Typography, useMediaQuery } from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ChannelInfo } from './settings/ChannelInfo';

import { TemplateDisplays } from '@/component/certificate';
import { NotificationSetting } from '@/component/notification';

export const Setting: React.FC = () => {
  const { t } = useTranslation('channel');
  const mdDown = useMediaQuery((theme: Theme) => theme.breakpoints.down('md'));
  const [tabValue, setTabValue] = useState(0);

  const tabs = [
    { label: t('Channel Info'), icon: InfoOutlined, Component: ChannelInfo },
    { label: t('Certificate'), icon: EmojiEventsOutlined, Component: TemplateDisplays },
    { label: t('Notification'), icon: NotificationsOutlined, Component: NotificationSetting },
  ];

  const CurrentComponent = tabs[tabValue].Component;

  return (
    <Box sx={{ display: 'block', p: 3, width: '100%' }}>
      <Box
        sx={{
          maxWidth: 'lg',
          display: 'flex',
          mx: 'auto',
          flexDirection: { xs: 'column-reverse', md: 'row' },
          gap: { xs: 2, md: 5 },
        }}
      >
        <Box sx={{ flex: 1 }}>
          <CurrentComponent />
        </Box>
        <Tabs
          orientation={mdDown ? 'horizontal' : 'vertical'}
          value={tabValue}
          onChange={(_, newValue: number) => {
            setTabValue(newValue);
          }}
          variant={mdDown ? 'scrollable' : 'standard'}
          scrollButtons
          allowScrollButtonsMobile
          sx={{
            bgcolor: 'background.paper',
            minHeight: 'unset',
            alignSelf: { xs: 'center', md: 'flex-start' },
            '& .MuiButtonBase-root': {
              justifyContent: 'flex-start',
              minHeight: 'inherit',
              px: 3,
              minWidth: 'unset',
              alignItems: { xs: 'center', md: 'flex-start' },
            },
            '& .MuiTabs-indicator': { left: 0, right: 'auto' },
            minWidth: { md: 150 },
            borderLeft: { md: 1 },
            borderColor: { md: 'divider' },
          }}
        >
          {tabs.map((tab, index) => {
            const Icon = tab.icon;
            return (
              <Tab
                key={index}
                label={
                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Icon fontSize="small" />
                    {tab.label}
                  </Typography>
                }
                sx={{ bgcolor: tabValue === index && !mdDown ? 'action.selected' : 'inherit' }}
              />
            );
          })}
        </Tabs>
      </Box>
    </Box>
  );
};
