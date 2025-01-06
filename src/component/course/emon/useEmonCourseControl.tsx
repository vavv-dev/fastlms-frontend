import { SxProps } from '@mui/material';
import { atom, useAtom, useAtomValue } from 'jotai';
import { useCallback, useMemo } from 'react';

import { useCourseState } from '../useCourseState';
import { AuthBox } from './AuthBox';

import { ExamDisplayResponse, QuizDisplayResponse, ResourceLocation } from '@/api';
import { userState } from '@/store';

type LearningType = '00' | '01' | '02' | '03' | '04';

interface AuthContext {
  learningType: LearningType;
  learningSequence: number;
  onComplete: () => void;
}

const authContextState = atom<AuthContext | null>(null);

export const useEmonCourseControl = (courseId: string | null) => {
  const { course, lessons } = useCourseState(courseId || '');
  const user = useAtomValue(userState);
  const [authContext, setAuthContext] = useAtom(authContextState);

  const learningSequencer = useMemo(() => {
    const counters: Record<LearningType, string[]> = { '00': [], '01': [], '02': [], '03': [], '04': [] };
    lessons?.forEach((lesson) => {
      if (lesson.grading_method === 'progress') {
        // progress lesson
        counters['01'].push(lesson.id);
      } else if (lesson.grading_method === 'score') {
        lesson.resources.forEach((resource) => {
          if (!['exam', 'quiz'].includes(resource.kind)) return;

          if (resource.kind === 'quiz' || resource.sub_kind === 'midterm_exam' || resource.sub_kind === 'general_exam') {
            // midterm exam
            counters['04'].push(resource.id);
          } else if (resource.sub_kind === 'final_exam') {
            // final exam
            counters['02'].push(resource.id);
          } else if (resource.sub_kind === 'assignment') {
            // assignment
            counters['03'].push(resource.id);
          }
        });
      }
    });
    const result: Record<LearningType, Record<string, number>> = { '00': {}, '01': {}, '02': {}, '03': {}, '04': {} };
    Object.entries(counters).forEach(([type, ids]) => {
      ids.forEach((id, index) => {
        result[type as LearningType][id] = index + 1;
      });
    });
    return result;
  }, [lessons]);

  const updateResourceLocation = useCallback(
    (locationToSet: ResourceLocation, _setResourceLocation: (location: ResourceLocation | null) => void) => {
      if (!lessons || !user) return;

      const lesson = lessons?.find((lesson) => lesson.id === locationToSet.lesson_id);
      if (!lesson) return;

      // alread passed
      if (lesson.passed) {
        setAuthContext(null);
        _setResourceLocation(locationToSet);
        return;
      }

      let learningType: LearningType = '01';

      // progress daily auth
      if (lesson.grading_method === 'progress') {
        learningType = '01';
        // check if already authed today
        const last_authed_date = new Date(user.last_authed || 0).getDate();
        if (last_authed_date >= new Date().getDate()) {
          setAuthContext(null);
          _setResourceLocation(locationToSet);
          return;
        }
      } else if (lesson.grading_method === 'score') {
        // check if exam or quiz resource already authed today
        for (const resource of lesson.resource_displays) {
          if (resource.id !== locationToSet.resource_id) continue;
          if (!['exam', 'quiz'].includes(resource.kind)) {
            setAuthContext(null);
            _setResourceLocation(locationToSet);
            return;
          }
          // check if already submitted
          const typedResource = resource as ExamDisplayResponse & QuizDisplayResponse;
          if (typedResource.status) {
            setAuthContext(null);
            _setResourceLocation(locationToSet);
            return;
          }
          if (
            typedResource.kind === 'quiz' ||
            typedResource.sub_kind === 'midterm_exam' ||
            typedResource.sub_kind === 'general_exam'
          ) {
            learningType = '04';
          } else if (typedResource.sub_kind === 'final_exam') {
            learningType = '02';
          } else if (typedResource.sub_kind === 'assignment') {
            learningType = '03';
          } else {
            // maybe not reachable
            setAuthContext(null);
            _setResourceLocation(locationToSet);
            return;
          }
        }
      } else {
        // no auth required
        setAuthContext(null);
        _setResourceLocation(locationToSet);
        return;
      }

      setAuthContext({
        learningType: learningType,
        learningSequence:
          learningSequencer[learningType][learningType === '01' ? locationToSet.lesson_id : locationToSet.resource_id],
        onComplete: () => _setResourceLocation(locationToSet),
      });
    },
    [lessons, user, setAuthContext, learningSequencer],
  );

  if (!course || !course.emon_managed_course || !authContext)
    return {
      showAuthBox: false,
      updateResourceLocation,
      AuthBox: () => <></>,
    };

  return {
    showAuthBox: true,
    updateResourceLocation,
    AuthBox: ({ sx }: { sx: SxProps }) => {
      return (
        <AuthBox
          course={course || null}
          user={user}
          learningType={authContext.learningType}
          learningSequence={authContext.learningSequence}
          onAuthComplete={() => {
            setAuthContext(null);
            authContext.onComplete();
          }}
          sx={sx}
        />
      );
    },
  };
};
