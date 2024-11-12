import LanguageIcon from '@mui/icons-material/Language';
import { Box, Button, List, ListItem, ListItemButton, ListItemText, Popover } from '@mui/material';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Language {
  code: string;
  label: string;
  icon?: string;
}

interface LanguageSelectorProps {
  renderTrigger?: (props: {
    currentLanguage: Language | undefined;
    onClick: (event: React.MouseEvent<HTMLElement>) => void;
  }) => React.ReactNode;
}

export const LanguageSelector = ({ renderTrigger }: LanguageSelectorProps) => {
  const { t, i18n } = useTranslation('layout');
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const LANGUAGES: Language[] = useMemo(
    () => [
      { code: 'ko', label: t('Korean'), icon: '🇰🇷' },
      { code: 'en', label: t('English') },
    ],
    [t],
  );

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageSelect = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    handleClose();
  };

  const currentLanguage = LANGUAGES.find((lang) => lang.code === i18n.language);

  return (
    <>
      {renderTrigger ? (
        renderTrigger({ currentLanguage, onClick: handleClick })
      ) : (
        <Button onClick={handleClick} sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
          <LanguageIcon />
          <span>{currentLanguage?.label}</span>
          <span>{currentLanguage?.icon}</span>
        </Button>
      )}

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <List sx={{ py: 0 }} dense>
          {LANGUAGES.map((language) => (
            <ListItem key={language.code} disablePadding>
              <ListItemButton onClick={() => handleLanguageSelect(language.code)} selected={language.code === i18n.language}>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>{language.label}</span>
                      <span>{language.icon}</span>
                    </Box>
                  }
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Popover>
    </>
  );
};
