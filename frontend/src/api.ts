import type { Course, CourseWithLessons, Lesson } from "./types";

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

/** Wrapper around fetch that throws a readable Error on non-2xx responses. */
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      /* non-JSON error body — keep default message */
    }
    throw new Error(message);
  }

  // 204 No Content (e.g. DELETE) has no body to parse.
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  // Courses
  listCourses: () => request<Course[]>("/courses"),
  getCourse: (id: string) => request<CourseWithLessons>(`/courses/${id}`),
  createCourse: (data: { title: string; description?: string }) =>
    request<Course>("/courses", { method: "POST", body: JSON.stringify(data) }),
  deleteCourse: (id: string) =>
    request<void>(`/courses/${id}`, { method: "DELETE" }),

  // Lessons
  listLessons: (courseId: string) =>
    request<Lesson[]>(`/courses/${courseId}/lessons`),
  addLesson: (courseId: string, data: { title: string }) =>
    request<Lesson>(`/courses/${courseId}/lessons`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  setLessonCompleted: (id: string, isCompleted: boolean) =>
    request<Lesson>(`/lessons/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ isCompleted }),
    }),
  deleteLesson: (id: string) =>
    request<void>(`/lessons/${id}`, { method: "DELETE" }),
};
