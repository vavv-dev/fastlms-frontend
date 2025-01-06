import { useMemo } from 'react';

import {
  CourseGetViewData as GetViewData,
  CourseGetViewResponse as GetViewResponse,
  LessonGetDisplaysData,
  LessonGetDisplaysResponse,
  courseGetView as getView,
  lessonGetDisplays,
} from '@/api';
import { useInfinitePagination, useServiceImmutable } from '@/component/common';

export const useCourseState = (id: string) => {
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

  return {
    course,
    courseMutate,
    lessons,
    lessonsMutate,
    isLoading: courseIsLoading || lessonsIsLoading,
    isValidating: courseIsValidating || lessonsIsValidating,
  };
};
