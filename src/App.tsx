import { OpenAPI } from '@/api';
import { EmailVerification, Join, Login, Logout, PasswordReset, PasswordResetConfirm } from '@/component/account';
import { ChannelHome, ChannelLayout } from '@/component/channel';
import { CommentDisplays } from '@/component/comment';
import { CourseDisplays, CourseView } from '@/component/course';
import { NotFound, Unauthorized } from '@/component/error';
import { ExamDisplays, ExamView, GradingDisplays } from '@/component/exam';
import { Home, HomeVideo } from '@/component/home';
import { BaseLayout } from '@/component/layout';
import { ContentDisplays, LessonDisplays } from '@/component/lesson';
import { InvitationAccept, MemberDisplays } from '@/component/member';
import { QuizDisplays } from '@/component/quiz';
import { SurveyDisplays } from '@/component/survey';
import {
  Profile,
  UserBookmark,
  UserCertificate,
  UserChannel,
  UserComment,
  UserHistory,
  UserLayout,
  UserNotification,
} from '@/component/u';
import { PlaylistDisplays, PlaylistView, SearchInput, VideoDisplays, VideoSearchResult, VideoView } from '@/component/video';
import { loginExpireState, userMessageState, userState } from '@/store';
import { modeState, themeConfig } from '@/theme';
import { ThemeProvider } from '@emotion/react';
import { CssBaseline, createTheme } from '@mui/material';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import React, { useCallback, useEffect, useRef } from 'react';
import {
  Navigate,
  Outlet,
  Route,
  RouteProps,
  RouterProvider,
  ScrollRestoration,
  createBrowserRouter,
  createRoutesFromElements,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import './App.css';

const USER_MESSAGE_URL = import.meta.env.VITE_USER_MESSAGE_URL || '';

const AppWrapper = () => {
  return (
    <>
      <ScrollRestoration />
      <Outlet />
    </>
  );
};
export const App = () => {
  const mode = useAtomValue(modeState);
  const theme = React.useMemo(() => createTheme(themeConfig(mode)), [mode]);

  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route element={<AppWrapper />}>
        <Route path="/" element={<Protected />}>
          <Route path="" element={<BaseLayout searchBar={<SearchInput />} />}>
            <Route path="" element={<Home />} />
            <Route path="video" element={<HomeVideo />} />

            <Route path="playlist/:id" element={<PlaylistView />} />
            <Route path="course/:id" element={<CourseView />} />
            <Route path="video/search" element={<VideoSearchResult />} />

            {/* user */}
            <Route path="u" element={<UserLayout />}>
              <Route path="" element={<UserHistory />} />
              <Route path="bookmark" element={<UserBookmark />} />
              <Route path="channel" element={<UserChannel />} />
              <Route path="comment" element={<UserComment />} />
              <Route path="notification" element={<UserNotification />} />
              <Route path="certificate" element={<UserCertificate />} />
              <Route path="profile" element={<Profile />} />
            </Route>

            {/* channel */}
            <Route path="channel/:username" element={<ChannelLayout />}>
              <Route path="" element={<ChannelHome />} />
              <Route path="video" element={<VideoDisplays />} />
              <Route path="short" element={<VideoDisplays />} />
              <Route path="playlist" element={<PlaylistDisplays />} />
              <Route path="quiz" element={<QuizDisplays />} />
              <Route path="survey" element={<SurveyDisplays />} />
              <Route path="exam" element={<ExamDisplays />} />
              <Route path="lesson" element={<LessonDisplays />} />
              <Route path="course" element={<CourseDisplays />} />
              <Route path="comment" element={<CommentDisplays />} />
              <Route path="member" element={<MemberDisplays />} />
              <Route path="exam/grading" element={<GradingDisplays />} />
              <Route path="lesson/content" element={<ContentDisplays />} />
            </Route>
          </Route>

          {/* top level page without drawer */}
          <Route path="" element={<BaseLayout searchBar={<SearchInput />} hideDrawer />}>
            <Route path="video/:id" element={<VideoView />} />
          </Route>
          {/* top level page without drawer, search bar */}
          <Route path="" element={<BaseLayout hideDrawer />}>
            <Route path="exam/:id/assess" element={<ExamView />} />
          </Route>
        </Route>

        <Route path="/" element={<BaseLayout hideDrawer />}>
          <Route path="login" element={<Login />} />
          <Route path="logout" element={<Logout />} />
          <Route path="join" element={<Join />} />
          <Route path="password-reset" element={<PasswordReset />} />
          <Route path="password-reset-confirm" element={<PasswordResetConfirm />} />
          <Route path="email-verification" element={<EmailVerification />} />
          <Route path="invitation-accept" element={<InvitationAccept />} />

          {/* error */}
          <Route path="error/401" element={<Unauthorized />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* public without layout*/}
      </Route>,
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
  const setUserMessage = useSetAtom(userMessageState);
  const socketRef = useRef<WebSocket | null>(null);

  const forceLogout = useCallback(() => {
    setUser(null);
    navigate('/login', { state: { from: location.pathname }, replace: true });
  }, [setUser, navigate, location.pathname]);

  /**
   *
   * login state
   *
   */

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

  /**
   *
   * websocket message
   *
   */

  const connect = useCallback(() => {
    if (!user || socketRef.current) return;

    const socket = new WebSocket(`${USER_MESSAGE_URL}?user_id=${user.id}`);
    socketRef.current = socket;

    socket.onopen = () => {
      setUserMessage(socket);
      console.log('WebSocket connected');
    };

    socket.onclose = (e) => {
      setUserMessage(null);
      if (e.wasClean) {
        socketRef.current = null;
        setTimeout(() => connect(), 1 * 1000);
      }
    };

    socket.onerror = (error) => {
      console.warn('WebSocket error:', error);
    };
  }, [user]); // eslint-disable-line

  useEffect(() => {
    connect();
  }, []); // eslint-disable-line

  return user ? <Outlet /> : <Navigate to="/login" state={{ from: location.pathname }} replace />;
};

// api setup
OpenAPI.BASE = import.meta.env.VITE_LMS_API_SERVER || '';
OpenAPI.WITH_CREDENTIALS = true;
OpenAPI.CREDENTIALS = 'include';
