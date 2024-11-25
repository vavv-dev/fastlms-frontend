import { CreateOutlined, EmojiEvents } from '@mui/icons-material';
import { Box, Button, Link, Paper, Rating, Typography, useTheme } from '@mui/material';
import { useAtom, useSetAtom } from 'jotai';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { certificateStatusFamily } from '.';

import { CourseGetViewResponse as GetViewRespons, certificateRequestCourseCertificate as requestCourseCertificate } from '@/api';
import { GradientCircularProgress } from '@/component/common';
import { snackbarMessageState } from '@/component/layout';

export const CertificateRequest = ({ course }: { course: GetViewRespons }) => {
  const { t } = useTranslation('course');
  const theme = useTheme();
  const navigate = useNavigate();
  const [certificateStatus, setCertificateStatus] = useAtom(certificateStatusFamily(course.id));
  const setSnackbarMessage = useSetAtom(snackbarMessageState);

  const requestCertificate = () => {
    requestCourseCertificate({ requestBody: { resource_id: course.id } })
      .then(() => setCertificateStatus('requested'))
      .catch((error) => {
        console.error(error);
        setSnackbarMessage({ message: t('Failed to request certificate. Please try again.'), duration: 3000 });
      });
  };

  const downloadCertificate = (pdf: string) => {
    const link = document.createElement('a');
    link.href = pdf;
    link.download = `${course.title}-${t('certificate')}.pdf`;
    link.click();
  };

  if (certificateStatus === 'notEligible') return null;

  if (certificateStatus === 'requested') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
        <GradientCircularProgress size={24} sx={{ minWidth: 24 }} />
        <Typography
          variant="body1"
          sx={{
            '@keyframes pulse': {
              '0%': { opacity: 1 },
              '50%': { opacity: 0.4 },
              '100%': { opacity: 1 },
            },
            animation: 'pulse 1.5s ease-in-out infinite',
            fontWeight: 600,
          }}
        >
          {t('Certificate issuance in progress...')}
          <Typography sx={{ display: 'block' }} variant="caption">
            {t('This may take a few minutes.')}
          </Typography>
        </Typography>
      </Box>
    );
  }

  if (certificateStatus === 'eligible') {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', whiteSpace: 'nowrap', gap: 0.5 }}>
        <Typography variant="caption" sx={{ lineHeight: 1.4, textAlign: 'center', maxWidth: 'sm' }}>
          {t('You have met the requirements for a certificate.')}
        </Typography>
        <Button
          sx={{
            position: 'relative',
            overflow: 'hidden',
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '50%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
              animation: 'shine 3s infinite',
            },
            '@keyframes shine': {
              '0%': { left: '-100%' },
              '100%': { left: '200%' },
            },
          }}
          startIcon={<EmojiEvents />}
          size="large"
          variant="contained"
          color="primary"
          onClick={requestCertificate}
        >
          {t('Request certificate')}
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1.5, flexDirection: 'column' }}>
      <Typography variant="h6">{t('Certificate issued')}</Typography>
      <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', maxWidth: '100%', '&::-webkit-scrollbar': { display: 'none' } }}>
        {course.certificates.map((certificate, index) => (
          <Link
            key={index}
            onClick={() => downloadCertificate(certificate.pdf)}
            sx={{
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1,
              fontSize: theme.typography.body2.fontSize,
            }}
          >
            <Paper
              elevation={3}
              component="img"
              src={certificate.thumbnail}
              sx={{ maxHeight: '150px', width: 'auto', borderRadius: 1 }}
            />
            {t('Download')}
          </Link>
        ))}
      </Box>
      {!course.marketing_url && (
        <Box
          onClick={() => navigate(`/course/${course.id}/outline`)}
          sx={{ display: 'flex', gap: 1, overflowX: 'auto', maxWidth: '100%', cursor: 'pointer' }}
        >
          <Typography
            variant="body2"
            sx={{ lineHeight: 1.4, textAlign: 'center', color: 'primary.main', display: 'flex', alignItems: 'center', gap: 0.5 }}
          >
            <CreateOutlined fontSize="small" />
            {t('Write a course review')}
          </Typography>
          <Rating value={5} readOnly size="small" />
        </Box>
      )}
    </Box>
  );
};
