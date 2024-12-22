import { useSetAtom } from 'jotai';
import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { loginExpireState, userState } from '@/store';

export const useForceLogout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const setUser = useSetAtom(userState);
  const setLoginExpire = useSetAtom(loginExpireState);

  const forceLogout = useCallback(() => {
    setUser(null);
    setLoginExpire(null);
    navigate('/login', { state: { from: location.pathname }, replace: true });
  }, [setUser, navigate, location.pathname, setLoginExpire]);

  return forceLogout;
};
