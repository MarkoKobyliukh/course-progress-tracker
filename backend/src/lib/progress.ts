export interface ProgressStats {
  totalLessons: number;
  completedLessons: number;
  progress: number; // 0..100, integer
}

/**
 * Backend-only progress calculation.
 * progress = completed / total * 100, rounded. 0/0 => 0 (no division by zero).
 */
export function computeProgress(
  lessons: { isCompleted: boolean }[]
): ProgressStats {
  const totalLessons = lessons.length;
  const completedLessons = lessons.filter((l) => l.isCompleted).length;
  const progress =
    totalLessons === 0
      ? 0
      : Math.round((completedLessons / totalLessons) * 100);

  return { totalLessons, completedLessons, progress };
}
