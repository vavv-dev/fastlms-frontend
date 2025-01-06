export const checkResourceAccessible = (
  key: string,
  indices: Record<string, number>,
  metas: Record<string, { passed: boolean | null; status: string | null }>,
  sequentialLearning: boolean,
): boolean => {
  if (!sequentialLearning) return true;

  const orderedKeys = Object.entries(indices)
    .sort(([, indexA], [, indexB]) => indexA - indexB)
    .map(([key]) => key);

  const currentIndex = indices[key];
  if (currentIndex === 0) return true;

  for (let i = 0; i < currentIndex; i++) {
    const meta = metas[orderedKeys[i]];
    if (!meta?.passed && meta?.status !== 'grading') {
      return false;
    }
  }

  return true;
};
