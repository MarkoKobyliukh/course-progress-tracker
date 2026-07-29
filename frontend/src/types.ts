export interface Lesson {
  id: string;
  title: string;
  isCompleted: boolean;
  createdAt: string;
  courseId: string;
}

/** Progress fields are computed on the backend and returned on every course. */
export interface Course {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
  totalLessons: number;
  completedLessons: number;
  progress: number; // 0..100
}

/** Course detail response also includes its lessons. */
export interface CourseWithLessons extends Course {
  lessons: Lesson[];
}
