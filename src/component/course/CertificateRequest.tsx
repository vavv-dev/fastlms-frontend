import { CreateOutlined, EmojiEvents } from '@mui/icons-material';
import { Box, Button, Link, Paper, Rating, Typography } from '@mui/material';
import { useAtom, useSetAtom } from 'jotai';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';

import { certificateStatusFamily } from '.';

import { CourseGetViewResponse as GetViewRespons, certificateRequestCourseCertificate as requestCourseCertificate } from '@/api';
import { GradientCircularProgress } from '@/component/common';
import { snackbarMessageState } from '@/component/layout';

export const CertificateRequest = ({ course }: { course: GetViewRespons }) => {
  const { t } = useTranslation('course');
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

  useEffect(() => {
    if (course.certificates.length > 0) {
      setCertificateStatus('issued');
    } else if (course.certificate_templates.length > 0) {
      if (course.passed) {
        setCertificateStatus('eligible');
      }
    }
  }, [course, setCertificateStatus]);

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
      <Button
        sx={{
          px: 2,
          mx: 'auto',
          minWidth: 'fit-content',
          whiteSpace: 'nowrap',
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(-45deg, #C850C0, #E975A8, #FFCC70)',
          backgroundSize: '200% 200%',
          animation: 'gradient 15s ease infinite',
          transition: 'all 0.3s ease',
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
          '@keyframes gradient': {
            '0%': { backgroundPosition: '0% 50%' },
            '50%': { backgroundPosition: '100% 50%' },
            '100%': { backgroundPosition: '0% 50%' },
          },
        }}
        startIcon={<EmojiEvents />}
        size="large"
        variant="contained"
        onClick={requestCertificate}
      >
        {t('Request certificate')}
      </Button>
    );
  }

  return (
    <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1.5, flexDirection: 'column' }}>
      <Typography variant="h6">{t('Certificate issued')}</Typography>
      <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', maxWidth: '100%', '&::-webkit-scrollbar': { display: 'none' } }}>
        {course.certificates.map((certificate, index) => (
          <Box key={index} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Paper
              elevation={3}
              component="img"
              src={certificate.thumbnail}
              sx={{ maxHeight: '150px', width: 'auto', borderRadius: 1 }}
            />
            <Link component="button" onClick={() => downloadCertificate(certificate.pdf)} underline="hover">
              {t('Download')}
            </Link>
          </Box>
        ))}
      </Box>
      {!course.marketing_url && (
        <Link
          variant="body2"
          underline="hover"
          component={RouterLink}
          to={`/course/${course.id}/outline`}
          sx={{ display: 'flex', gap: 1, overflowX: 'auto', maxWidth: '100%' }}
        >
          <CreateOutlined fontSize="small" />
          {t('Write a course review')}
          <Rating value={5} readOnly size="small" />
        </Link>
      )}
    </Box>
  );
};
