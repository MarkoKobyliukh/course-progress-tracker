import { useCallback, useEffect, useState } from "react";
import { api } from "../api";
import type { CourseWithLessons } from "../types";
import { AddLessonForm } from "./AddLessonForm";
import { LessonItem } from "./LessonItem";

interface Props {
  courseId: string;
  /** Called after any change so the parent can refresh the course list card. */
  onChanged: () => void;
}

export function CourseDetails({ courseId, onChanged }: Props) {
  const [course, setCourse] = useState<CourseWithLessons | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setCourse(await api.getCourse(courseId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load course");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    load();
  }, [load]);

  // Re-fetch this course (fresh progress) AND tell the parent to refresh the list.
  const refresh = useCallback(() => {
    load();
    onChanged();
  }, [load, onChanged]);

  if (loading) return <p className="muted">Loading course…</p>;
  if (error) return <p className="error">Error: {error}</p>;
  if (!course) return null;

  return (
    <section className="card">
      <h2>{course.title}</h2>
      {course.description && <p className="muted">{course.description}</p>}

      <div className="progress-row">
        <div className="bar big">
          <div className="bar-fill" style={{ width: `${course.progress}%` }} />
        </div>
        <span className="progress-label">
          {course.completedLessons}/{course.totalLessons} · {course.progress}%
        </span>
      </div>

      <AddLessonForm courseId={course.id} onAdded={refresh} />

      {course.lessons.length === 0 ? (
        <p className="muted">No lessons yet.</p>
      ) : (
        <ul className="lesson-list">
          {course.lessons.map((l) => (
            <LessonItem key={l.id} lesson={l} onChanged={refresh} />
          ))}
        </ul>
      )}
    </section>
  );
}
