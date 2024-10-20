import { OpenAPI } from '@/api';
import { EmailVerification, Join, Login, Logout, PasswordReset, PasswordResetConfirm } from '@/component/account';
import { ChannelStats, ChannelHome, ChannelLayout, ChannelRoot, ChannelSetting } from '@/component/channel';
import { CommentDisplays, ThreadDialog } from '@/component/comment';
import { CourseDisplays, CourseOutline, CourseView } from '@/component/course';
import { NotFound, Unauthorized } from '@/component/error';
import { ExamDisplays, ExamReadyDialog, ExamView, GradingDisplays } from '@/component/exam';
import { HomeChannel, HomeVideo } from '@/component/home';
import { BaseLayout } from '@/component/layout';
import { LessonDisplays, LessonViewDialog } from '@/component/lesson';
import { InvitationAccept, MemberDisplays } from '@/component/member';
import { QuizDisplays, QuizViewDialog } from '@/component/quiz';
import { SurveyDisplays, SurveyViewDialog } from '@/component/survey';
import {
  Profile,
  UserBookmark,
  UserChannel,
  UserComment,
  UserCourse,
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
  createBrowserRouter,
  createRoutesFromElements,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import './App.css';
import { AssetDisplays, AssetViewDialog } from './component/asset';

const USER_MESSAGE_URL = import.meta.env.VITE_USER_MESSAGE_URL || '';

const AppWrapper = () => {
  return (
    <>
      <DialogOpener />
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
            <Route path="" element={<HomeVideo />} />
            <Route path="channel" element={<HomeChannel />} />

            <Route path="playlist/:id" element={<PlaylistView />} />
            <Route path="course/:id" element={<CourseView />} />
            <Route path="video/search" element={<VideoSearchResult />} />

            {/* user */}
            <Route path="u" element={<UserLayout />}>
              <Route path="" element={<UserHistory />} />
              <Route path="course" element={<UserCourse />} />
              <Route path="bookmark" element={<UserBookmark />} />
              <Route path="channel" element={<UserChannel />} />
              <Route path="comment" element={<UserComment />} />
              <Route path="notification" element={<UserNotification />} />
              <Route path="profile" element={<Profile />} />
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
              <Route path="comment" element={<CommentDisplays />} />
              <Route path="member" element={<MemberDisplays />} />
              <Route path="exam/grading" element={<GradingDisplays />} />
              <Route path="stats" element={<ChannelStats />} />
              <Route path="setting" element={<ChannelSetting />} />
            </Route>
          </Route>

          {/* top level page without drawer */}
          <Route path="" element={<BaseLayout searchBar={<SearchInput />} hideDrawer />}>
            <Route path="video/:id" element={<VideoView />} />
          </Route>
          {/* top level page without drawer, search bar */}
          <Route path="" element={<BaseLayout hideDrawer />}>
            <Route path="exam/:id" element={<ExamView />} />
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

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RouterProvider router={router} />
    </ThemeProvider>
  );
};

const DialogOpener = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleClose = () => {
    if (location.state?.previousPath) {
      navigate(location.state.previousPath);
    } else {
      navigate(-1);
    }
  };

  const dialog = location.state?.dialog;
  if (!dialog) return null;

  // Thread instance
  if (dialog.kind === 'thread') {
    return <ThreadDialog open={true} setOpen={handleClose} threadProps={{ ...dialog, sticky: true }} enableSubjectOpen />;
  }

  // Learning resource's comment thread
  if (dialog.question != undefined) {
    return (
      <ThreadDialog
        open={true}
        setOpen={handleClose}
        threadProps={{
          ...dialog,
          url: encodeURIComponent(`${window.location.origin}/${dialog.kind}/${dialog.id}`),
          resource_kind: dialog.kind,
          sticky: true,
        }}
      />
    );
  }

  const DialogComponent = {
    quiz: QuizViewDialog,
    survey: SurveyViewDialog,
    asset: AssetViewDialog,
    exam: ExamReadyDialog,
    lesson: LessonViewDialog,
  }[dialog.kind as 'quiz' | 'survey' | 'asset' | 'exam' | 'lesson'];

  if (!DialogComponent) return null;

  return <DialogComponent id={dialog.id} open={true} setOpen={handleClose} />;
};

const Protected: React.FC<RouteProps> = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useAtom(userState);
  const [loginExpire, setLoginExpire] = useAtom(loginExpireState);
  const setUserMessage = useSetAtom(userMessageState);
  const socketRef = useRef<WebSocket | null>(null);

  const forceLogout = useCallback(() => {
    setUser(null);
    setLoginExpire(null);
    navigate('/login', { state: { from: location.pathname }, replace: true });
  }, [setUser, navigate, location.pathname, setLoginExpire]);

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
