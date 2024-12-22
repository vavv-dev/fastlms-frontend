import { isEqual } from 'lodash';
import { useEffect, useMemo } from 'react';

import {
  CourseDisplayResponse as DisplayResponse,
  CourseGetViewData as GetViewData,
  CourseGetViewResponse as GetViewResponse,
  LessonDisplayResponse,
  LessonGetDisplaysData,
  LessonGetDisplaysResponse,
  ResourceLocation,
  courseGetDisplays as getDisplays,
  courseGetView as getView,
  lessonGetDisplays,
  courseUpdateLearning as updateLearning,
} from '@/api';
import { updateInfiniteCache, useInfinitePagination, useServiceImmutable } from '@/component/common';

export const useCourseState = (id: string, validLocation?: ResourceLocation | null) => {
  const {
    data: course,
    mutate: courseMutate,
    isLoading: courseIsLoading,
    isValidating: courseIsValidating,
  } = useServiceImmutable<GetViewData, GetViewResponse>(getView, { id });

  const {
    data: lessonsData,
    mutate: lessonsMutate,
    isLoading: lessonsIsLoading,
    isValidating: lessonsIsValidating,
  } = useInfinitePagination<LessonGetDisplaysData, LessonGetDisplaysResponse>({
    apiService: lessonGetDisplays,
    apiOptions: course?.enrolled ? { course: id } : {},
  });

  const lessons = useMemo(() => lessonsData?.[0]?.items || [], [lessonsData]);
  const learningState = useMemo(() => calculateLearningStats(course, lessons), [course, lessons]);
  const location = useMemo(
    () =>
      validLocation ||
      course?.resource_location || {
        lesson_id: lessons[0]?.id,
        resource_id: lessons[0]?.resources[0]?.id,
      },
    [validLocation, course, lessons],
  );

  useEffect(() => {
    if (!location) return;

    if (
      !course ||
      !learningState ||
      (course.progress === learningState.progress &&
        course.score === learningState.score &&
        course.passed === learningState.passed &&
        isEqual(course.resource_location, location))
    )
      return;

    // sync learning state with server
    updateLearning({
      id: id,
      requestBody: { ...learningState, resource_location: location },
    }).catch((error) => console.error('Failed to update learning:', error));

    // update local state
    courseMutate((prev) => prev && { ...prev, ...learningState, resource_location: location }, { revalidate: false });

    // update course list
    updateInfiniteCache<DisplayResponse>(
      getDisplays,
      {
        id: course.id,
        progress: course.progress,
        score: course.score,
        passed: course.passed,
        resource_location: location,
      },
      'update',
    );
  }, [id, learningState, course, courseMutate, location]);

  return {
    course,
    courseMutate,
    lessons,
    lessonsMutate,
    isLoading: courseIsLoading || lessonsIsLoading,
    isValidating: courseIsValidating || lessonsIsValidating,
  };
};

interface LearningStats {
  progress: number;
  score: number;
  passed: boolean;
}

export const calculateLearningStats = (
  course: GetViewResponse | undefined,
  lessons: LessonDisplayResponse[] | undefined,
): LearningStats | null => {
  if (!course || !lessons?.length) return null;

  const result = lessons.reduce(
    (acc, lesson) => {
      const { grading_method, passed } = lesson;
      const weight = lesson.weight ?? 0;
      const progress = lesson.progress ?? 0;
      const score = lesson.score ?? 0;

      if (grading_method === 'progress') {
        acc.progressCount++;
        if (passed) acc.progressPassed++;
      }

      if (weight > 0) {
        acc.totalWeight += weight;
        acc.totalScore += (weight / 100) * (grading_method === 'progress' ? progress : grading_method === 'score' ? score : 100);
      }

      return acc;
    },
    { progressPassed: 0, progressCount: 0, totalScore: 0, totalWeight: 0 },
  );

  // This method should be consistent with the server side calculation
  const progress = result.progressCount ? (result.progressPassed / result.progressCount) * 100 : 0;
  const score = result.totalWeight ? (result.totalScore / result.totalWeight) * 100 : 0;
  const passed =
    progress >= course.cutoff_progress &&
    score >= course.cutoff_score &&
    lessons.every((l) => l.passed == true || l.grading_method === 'none');
  return { progress, score, passed };
};
