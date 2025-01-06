import { isEqual } from 'lodash';
import { useEffect, useMemo } from 'react';
import { KeyedMutator } from 'swr';

import {
  CourseDisplayResponse as DisplayResponse,
  CourseGetViewResponse as GetViewResponse,
  LessonDisplayResponse,
  ResourceLocation,
  courseGetDisplays as getDisplays,
  courseUpdateLearning as updateLearning,
} from '@/api';
import { updateInfiniteCache } from '@/component/common';

export const useCourseLearningState = (
  course: GetViewResponse | undefined,
  courseMutate: KeyedMutator<GetViewResponse>,
  lessons: LessonDisplayResponse[] | undefined,
  resourceLocation: ResourceLocation | null,
) => {
  const learningState = useMemo(() => calculateLearningStats(course, lessons), [course, lessons]);
  const location = useMemo(() => resourceLocation || course?.resource_location, [resourceLocation, course]);

  useEffect(() => {
    if (!location || !course || !learningState) return;

    const changed =
      course.progress !== learningState.progress ||
      course.score !== learningState.score ||
      course.passed !== learningState.passed ||
      !isEqual(course.resource_location, location);

    if (!changed) return;

    // sync learning state with server
    updateLearning({
      id: course?.id,
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
  }, [learningState, course, courseMutate, location]);

  return { learningState, location };
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
