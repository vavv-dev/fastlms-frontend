import { accountLogout } from '@/api';
import { userState } from '@/store';
import { useAtom, useSetAtom } from 'jotai';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { accountProcessingState } from '.';

export const Logout = () => {
  const navigate = useNavigate();

  const [user, setUser] = useAtom(userState);
  const setProcessing = useSetAtom(accountProcessingState);

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
