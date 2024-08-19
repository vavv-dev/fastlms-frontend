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
import { UserComment } from '@/component/comment';
import { NotFound, Unauthorized } from '@/component/error';
import { ExamView, UserExam, UserGrading } from '@/component/exam';
import { BaseLayout } from '@/component/layout';
import { UserContent, UserLesson } from '@/component/lesson';
import { UserQuiz } from '@/component/quiz';
import { UserSurvey } from '@/component/survey';
import { PlaylistView, SearchBox, UserPlaylist, UserVideo, VideoSearchResult, VideoView } from '@/component/video';
import { userState } from '@/store';
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

const App = () => {
  const mode = useAtomValue(modeState);
  const theme = React.useMemo(() => createTheme(themeConfig(mode)), [mode]);

  const router = createBrowserRouter(
    createRoutesFromElements(
      <>
        <Route element={<Protected />}>
          <Route path="/" element={<BaseLayout searchBar={<SearchBox />} />}>
            {/* user home */}
            <Route path="u/:username" element={<HomeLayout />}>
              {['video', 'short'].map((videoKind) => (
                <Route key={videoKind} path={videoKind} element={<UserVideo />} />
              ))}
              <Route path="playlist" element={<UserPlaylist />} />
              <Route path="quiz" element={<UserQuiz />} />
              <Route path="survey" element={<UserSurvey />} />
              <Route path="exam" element={<UserExam />} />
              <Route path="lesson" element={<UserLesson />} />
              <Route path="comment" element={<UserComment />} />
              <Route path="profile" element={<Profile />} />
              {/* hidden tabs */}
              <Route path="exam/grading" element={<UserGrading />} />
              <Route path="lesson/content" element={<UserContent />} />
            </Route>

            {/* top level page with drawer */}
            <Route path="playlist/:playlistId" element={<PlaylistView />} />
            <Route path="video/search" element={<VideoSearchResult />} />
          </Route>

          {/* top level page without drawer */}
          <Route path="/" element={<BaseLayout searchBar={<SearchBox />} hideDrawer={true} />}>
            <Route path="video/:videoId" element={<VideoView />} />
          </Route>
          {/* top level page without drawer, search bar */}
          <Route path="/" element={<BaseLayout hideDrawer={true} />}>
            <Route path="exam/:examId/assess" element={<ExamView />} />
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

export default App;

const Protected: React.FC<RouteProps> = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useAtom(userState);

  const forceLogout = useCallback(() => {
    setUser(null);
    navigate('/login', { state: { from: location.pathname }, replace: true });
  }, [setUser, navigate, location.pathname]);

  useEffect(() => {
    OpenAPI.interceptors.response.use((response) => {
      if (user && response.status === 401) forceLogout();
      return response;
    });
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
