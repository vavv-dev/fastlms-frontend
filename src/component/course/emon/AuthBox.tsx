import { Box, Link, SxProps, Typography } from '@mui/material';
import { useSetAtom } from 'jotai';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';

import { CourseGetViewResponse, UserResponse, accountUpdateMe } from '@/api';
import { userState } from '@/store';

const EMON_AUTH_URL = import.meta.env.VITE_EMON_AUTH_URL;
const EMON_AUTH_ORIGIN = new URL(EMON_AUTH_URL).origin;

type LearningType = '00' | '01' | '02' | '03' | '04';

interface Props {
  course: CourseGetViewResponse | null;
  user: UserResponse | null;
  learningType: LearningType;
  learningSequence: number;
  onAuthComplete?: (authData?: Record<string, string | number>) => void;
  setLoadState?: (state: number | null) => void;
  sx?: SxProps;
}

export const AuthBox = ({ course, user, learningType, learningSequence, onAuthComplete, setLoadState, sx }: Props) => {
  const { t } = useTranslation('course');
  const [loadState_, setLoadState_] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const setUser = useSetAtom(userState);

  const handleMessage = (event: MessageEvent) => {
    if (event.origin !== EMON_AUTH_ORIGIN) return;

    /**
     * cf. http://localhost:8013/docs#/authn/fastlms_emon_authn_api_auth
     *
     * before auth
     * 200: auth process started
     * 403: not eligible to enroll
     * 409: Maybe violate unique constraint enrolling courses at the same time
     * 422: Something wrong with the request data
     * 423: Already authed. still valid
     *
     * after auth
     * 201: auth process completed
     **/
    const { status_code } = event.data;
    setLoadState_(status_code);

    switch (status_code) {
      case 200:
        // ready iframe
        break;
      case 201:
        // auth completed
        accountUpdateMe({
          requestBody: { last_authed: new Date().toISOString() },
        }).then((updated) => {
          setUser(updated);
        });

        onAuthComplete?.(event.data.auth_data);
        break;
      case 403:
        setError(t("You're not eligible to enroll in this course."));
        break;
      case 409:
        setError(t('You enrollment data is wrong. contact to admin.'));
        break;
      case 422:
        setError(t('Something wrong with the request data.'));
        break;
      case 423:
        onAuthComplete?.();
        break;
    }
  };

  useEffect(() => {
    setLoadState?.(loadState_);
  }, [loadState_, setLoadState]);

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []); // eslint-disable-line

  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    formRef.current?.submit();
  }, []);

  if (!course || !user) return null;

  if (error) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, ...sx }}>
        <Typography variant="h6" color="error" sx={{ textAlign: 'center' }}>
          {error}
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', m: 1 }}>
          {t(
            'This course is only available to learners pre-registered by the administrator. If you believe you are eligible for this course, please contact the administrator.',
          )}
          <Link variant="subtitle2" component={RouterLink} to={`/channel/${course.owner.username}/qna`} sx={{ ml: 1 }}>
            {t('Contact the admin')}
          </Link>
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative', height: '480px', my: 'auto', display: loadState_ === 200 ? 'flex' : 'none', ...sx }}>
      <form
        ref={formRef}
        target="auth-iframe"
        action="http://localhost:8013/authn/auth"
        method="POST"
        style={{ margin: 0, padding: 0 }}
      >
        <input type="hidden" name="auth_type" value={'motp'} />
        <input type="hidden" name="lms_course_id" value={course.id} />
        <input type="hidden" name="username" value={user.username} />
        <input type="hidden" name="name" value={user.name} />
        <input type="hidden" name="learning_type" value={learningType} />
        <input type="hidden" name="learning_sequence" value={learningSequence} />
      </form>
      <iframe name="auth-iframe" style={{ width: '100%', height: '100%', border: 0 }} title="Identity Verification" />
    </Box>
  );
};
