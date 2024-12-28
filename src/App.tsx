import { ThemeProvider } from '@emotion/react';
import { CssBaseline, createTheme } from '@mui/material';
import { useAtomValue, useSetAtom } from 'jotai';
import debounce from 'lodash/debounce';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Navigate,
  Outlet,
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
  useLocation,
} from 'react-router-dom';

import './App.css';

import { OpenAPI, sharedGetImportant } from '@/api';
import {
  EmailVerification,
  Join,
  Login,
  Logout,
  PasswordReset,
  PasswordResetConfirm,
  UserBookmark,
  UserHistory,
  UserLayout,
  UserProfile,
  useForceLogout,
} from '@/component/account';
import { AssetDisplays } from '@/component/asset';
import { ChannelHome, ChannelLayout, ChannelRoot, ChannelSetting, HomeChannel, UserChannel } from '@/component/channel';
import { CommentDisplays, QnADisplays, UserComment } from '@/component/comment';
import { CourseDisplays, CourseOutline, CoursePlayer, CourseView, UserCourse } from '@/component/course';
import { NotFound, Unauthorized } from '@/component/error';
import { ExamDisplays, ExamMessage, ExamViewDialog, GradingDisplays } from '@/component/exam';
import { BaseLayout, StrictTabControl, alertState } from '@/component/layout';
import { LessonDisplays } from '@/component/lesson';
import { InvitationAccept, MemberDisplays } from '@/component/member';
import { UserNotification } from '@/component/notification';
import { QuizDisplays } from '@/component/quiz';
import { SurveyDisplays } from '@/component/survey';
import {
  HomeVideo,
  PlaylistDisplays,
  PlaylistView,
  SearchInput,
  VideoDisplays,
  VideoSearchResult,
  VideoView,
} from '@/component/video';
import i18n from '@/i18n';
import { loginExpireState, userMessageState, userState } from '@/store';
import { modeState, themeConfig } from '@/theme';

// api setup
OpenAPI.BASE = import.meta.env.VITE_LMS_API_SERVER || '';
OpenAPI.WITH_CREDENTIALS = true;
OpenAPI.CREDENTIALS = 'include';

const USER_MESSAGE_URL = import.meta.env.VITE_USER_MESSAGE_URL || '';

const Protected = () => {
  const location = useLocation();
  const user = useAtomValue(userState);
  const loginExpire = useAtomValue(loginExpireState);
  const setUserMessage = useSetAtom(userMessageState);
  const socketRef = useRef<WebSocket | null>(null);
  const setAlert = useSetAtom(alertState);
  const forceLogout = useForceLogout();

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
   * set important events
   *
   */
  useEffect(() => {
    if (!user?.id) return;
    const debouncedGetImportant = debounce(() => {
      sharedGetImportant().then((important) => {
        important.exams_in_progress.forEach((exam) => {
          setAlert({
            open: true,
            message: <ExamMessage key={exam.id} {...exam} />,
            severity: 'warning',
            duration: exam.remains * 1000,
          });
        });
      });
    }, 300);
    debouncedGetImportant();
    return () => {
      debouncedGetImportant.cancel();
    };
  }, [user?.id, setAlert]);

  /**
   *
   * websocket message
   *
   */

  const connect = useCallback(() => {
    if (!user || socketRef.current) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = USER_MESSAGE_URL.replace(/^(ws|wss):\/\//, '');
    const socket = new WebSocket(`${protocol}//${wsHost}?user_id=${user.id}`);
    socketRef.current = socket;

    socket.onopen = () => {
      setUserMessage(socket);
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

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<Outlet />}>
      <Route path="/" element={<Protected />}>
        <Route path="" element={<BaseLayout searchBar={<SearchInput />} />}>
          <Route path="" element={<HomeVideo />} />
          <Route path="channel" element={<HomeChannel />} />

          <Route path="playlist/:id" element={<PlaylistView />} />
          <Route path="course/:id" element={<CourseView />} />
          <Route path="video/search" element={<VideoSearchResult />} />

          {/* user */}
          <Route path="u" element={<UserLayout />}>
            <Route path="" element={<UserCourse />} />
            <Route path="history" element={<UserHistory />} />
            <Route path="bookmark" element={<UserBookmark />} />
            <Route path="channel" element={<UserChannel />} />
            <Route path="comment" element={<UserComment />} />
            <Route path="notification" element={<UserNotification />} />
            <Route path="profile" element={<UserProfile />} />
          </Route>

          {/* channel */}
          <Route path="channel/:username" element={<ChannelLayout />}>
            <Route path="" element={<ChannelRoot />} />
            <Route path="home" element={<ChannelHome />} />
            <Route path="video" element={<VideoDisplays kind="video" />} />
            <Route path="short" element={<VideoDisplays kind="short" />} />
            <Route path="playlist" element={<PlaylistDisplays />} />
            <Route path="quiz" element={<QuizDisplays />} />
            <Route path="survey" element={<SurveyDisplays />} />
            <Route path="exam" element={<ExamDisplays />} />
            <Route path="asset" element={<AssetDisplays />} />
            <Route path="lesson" element={<LessonDisplays />} />
            <Route path="course" element={<CourseDisplays />} />
            <Route path="qna" element={<QnADisplays />} />
            <Route path="comment" element={<CommentDisplays />} />
            <Route path="member" element={<MemberDisplays />} />
            <Route path="exam/grading" element={<GradingDisplays />} />
            <Route path="setting" element={<ChannelSetting />} />
          </Route>
        </Route>

        {/* course player */}
        <Route path="course/:id/player" element={<CoursePlayer />} />

        {/* exam opener */}
        <Route path="exam/:id" element={<ExamViewDialog open />} />

        {/* top level page without drawer */}
        <Route path="" element={<BaseLayout searchBar={<SearchInput />} hideDrawer />}>
          <Route path="video/:id" element={<VideoView />} />
        </Route>
      </Route>

      {/* public with layout */}
      <Route path="/" element={<BaseLayout hideDrawer />}>
        <Route path="login" element={<Login />} />
        <Route path="logout" element={<Logout />} />
        <Route path="join" element={<Join />} />
        <Route path="password-reset" element={<PasswordReset />} />
        <Route path="password-reset-confirm" element={<PasswordResetConfirm />} />
        <Route path="email-verification" element={<EmailVerification />} />
        <Route path="invitation-accept" element={<InvitationAccept />} />

        {/* course */}
        <Route path="course/:id/outline" element={<CourseOutline />} />

        {/* error */}
        <Route path="error/401" element={<Unauthorized />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* public without layout*/}
    </Route>,
  ),
);

export const App = () => {
  const mode = useAtomValue(modeState);
  const theme = useMemo(() => createTheme(themeConfig(mode)), [mode]);

  // language change
  useEffect(() => {
    // on load
    OpenAPI.HEADERS = { ...OpenAPI.HEADERS, 'Accept-Language': i18n.language };
    // on change
    i18n.on('languageChanged', (language) => {
      OpenAPI.HEADERS = { ...OpenAPI.HEADERS, 'Accept-Language': language };
    });
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <StrictTabControl allowedPatterns={[/^\/password-reset-confirm/, /^\/invitation-accept/, /^\/login/]}>
        <RouterProvider router={router} />
      </StrictTabControl>
    </ThemeProvider>
  );
};
