import { useAtom, useSetAtom } from 'jotai';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { accountProcessingState } from '.';

import { accountLogout } from '@/api';
import { alertState } from '@/component/layout';
import { userState } from '@/store';

export const Logout = () => {
  const navigate = useNavigate();

  const [user, setUser] = useAtom(userState);
  const setProcessing = useSetAtom(accountProcessingState);
  const setAlert = useSetAtom(alertState);

  useEffect(() => {
    const login = '/login';
    if (!user) {
      navigate(login);
      return;
    }

    // set loading state
    setProcessing(true);

    const logOut = () => {
      accountLogout()
        .then(() => {
          setUser(null);
          setAlert({ open: false, severity: 'success', message: '' });
          navigate(login);
        })
        .finally(() => setProcessing(false));
    };

    const timeoutId = setTimeout(logOut, 100);

    // Cleanup function
    return () => clearTimeout(timeoutId);
  }, []); // eslint-disable-line

  return <></>;
};
