import { OpenAPI } from '@/api';
import {
  EmailVerification,
  HomeLayout,
  Join,
  Login,
  Logout,
  PasswordReset,
  PasswordResetConfirm,
  Profile,
} from '@/component/account';
import { CommentDisplays } from '@/component/comment';
import { CourseView, CourseDisplays } from '@/component/course';
import { NotFound, Unauthorized } from '@/component/error';
import { ExamDisplays, ExamView, GradingDisplays } from '@/component/exam';
import { BaseLayout } from '@/component/layout';
import { ContentDisplays, LessonDisplays } from '@/component/lesson';
import { QuizDisplays } from '@/component/quiz';
import { SurveyDisplays } from '@/component/survey';
import { PlaylistDisplays, PlaylistView, SearchInput, VideoDisplays, VideoView } from '@/component/video';
import { loginExpireState, userChannelState, userState } from '@/store';
import { modeState, themeConfig } from '@/theme';
import { ThemeProvider } from '@emotion/react';
import { CssBaseline, createTheme } from '@mui/material';
import { useAtom, useAtomValue } from 'jotai';
import React, { useCallback, useEffect } from 'react';
import {
  Navigate,
  Outlet,
  Route,
  RouteProps,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
  useLocation,
  useNavigate,
} from 'react-router-dom';

const CHANNEL_SOCKET_URL = import.meta.env.VITE_CHANNEL_SOCKET_URL || '';

export const App = () => {
  const mode = useAtomValue(modeState);
  const theme = React.useMemo(() => createTheme(themeConfig(mode)), [mode]);

  const router = createBrowserRouter(
    createRoutesFromElements(
      <>
        <Route element={<Protected />}>
          <Route path="/" element={<BaseLayout searchBar={<SearchInput />} />}>
            {/* user home */}
            <Route path="u/:username" element={<HomeLayout />}>
              {['video', 'short'].map((videoKind) => (
                <Route key={videoKind} path={videoKind} element={<VideoDisplays />} />
              ))}
              <Route path="playlist" element={<PlaylistDisplays />} />
              <Route path="quiz" element={<QuizDisplays />} />
              <Route path="survey" element={<SurveyDisplays />} />
              <Route path="exam" element={<ExamDisplays />} />
              <Route path="lesson" element={<LessonDisplays />} />
              <Route path="course" element={<CourseDisplays />} />
              <Route path="comment" element={<CommentDisplays />} />
              <Route path="profile" element={<Profile />} />
              <Route path="exam/grading" element={<GradingDisplays />} />
              <Route path="lesson/content" element={<ContentDisplays />} />
            </Route>

            {/* top level page with drawer */}
            <Route path="playlist/:id" element={<PlaylistView />} />
            <Route path="course/:id" element={<CourseView />} />
            {/*
            <Route path="video/search" element={<VideoSearchResult />} />
            */}
          </Route>

          {/* top level page without drawer */}
          <Route path="/" element={<BaseLayout searchBar={<SearchInput />} hideDrawer={true} />}>
            <Route path="video/:id" element={<VideoView />} />
          </Route>
          {/* top level page without drawer, search bar */}
          <Route path="/" element={<BaseLayout hideDrawer={true} />}>
            <Route path="exam/:id/assess" element={<ExamView />} />
          </Route>
        </Route>

        <Route path="/" element={<BaseLayout hideDrawer={true} />}>
          <Route path="login" element={<Login />} />
          <Route path="logout" element={<Logout />} />
          <Route path="join" element={<Join />} />
          <Route path="password-reset" element={<PasswordReset />} />
          <Route path="password-reset-confirm" element={<PasswordResetConfirm />} />
          <Route path="email-verification" element={<EmailVerification />} />

          {/* error */}
          <Route path="/error/401" element={<Unauthorized />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* public without layout*/}
      </>,
    ),
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RouterProvider router={router} />
    </ThemeProvider>
  );
};

const Protected: React.FC<RouteProps> = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useAtom(userState);
  const loginExpire = useAtomValue(loginExpireState);
  const [userChannel, setUserChannel] = useAtom(userChannelState);

  const forceLogout = useCallback(() => {
    setUser(null);
    navigate('/login', { state: { from: location.pathname }, replace: true });
  }, [setUser, navigate, location.pathname]);

  // force logout at refresh token expire
  useEffect(() => {
    if (loginExpire) {
      const now = new Date();
      const expireDate = new Date(loginExpire);
      if (now > expireDate) {
        forceLogout();
      } else {
        const timeUntilExpire = expireDate.getTime() - now.getTime();
        const logoutTimer = setTimeout(forceLogout, timeUntilExpire);
        return () => clearTimeout(logoutTimer);
      }
    }
  }, [loginExpire, forceLogout]);

  useEffect(() => {
    OpenAPI.interceptors.response.use((response) => {
      if (user && response.status === 401) forceLogout();
      return response;
    });
  }, []); // eslint-disable-line

  useEffect(() => {
    if (!user || userChannel) return;
    const socket = new WebSocket(`${CHANNEL_SOCKET_URL}?user_id=${user.id}`);
    setUserChannel(socket);
    return () => {
      socket.close();
      setUserChannel(null);
    };
  }, []); // eslint-disable-line

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  return <Outlet />;
};

// api setup
OpenAPI.BASE = import.meta.env.VITE_LMS_API_SERVER || '';
OpenAPI.WITH_CREDENTIALS = true;
OpenAPI.CREDENTIALS = 'include';
