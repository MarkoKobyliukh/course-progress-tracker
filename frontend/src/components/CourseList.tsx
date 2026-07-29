import { useState } from "react";
import { api } from "../api";
import type { Course } from "../types";

interface Props {
  courses: Course[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDeleted: (id: string) => void;
}

export function CourseList({ courses, selectedId, onSelect, onDeleted }: Props) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation(); // don't select the card when deleting
    setDeletingId(id);
    try {
      await api.deleteCourse(id);
      onDeleted(id);
    } catch {
      // keep it simple; list will refetch on next action
    } finally {
      setDeletingId(null);
    }
  }

  if (courses.length === 0) {
    return <p className="muted">No courses yet.</p>;
  }

  return (
    <ul className="course-list">
      {courses.map((c) => (
        <li
          key={c.id}
          className={`course-card clickable ${
            c.id === selectedId ? "selected" : ""
          }`}
          onClick={() => onSelect(c.id)}
        >
          <div className="course-head">
            <strong>{c.title}</strong>
            <button
              className="danger"
              onClick={(e) => handleDelete(e, c.id)}
              disabled={deletingId === c.id}
            >
              {deletingId === c.id ? "…" : "Delete"}
            </button>
          </div>
          <span className="muted">
            {c.completedLessons}/{c.totalLessons} lessons · {c.progress}%
          </span>
          <div className="bar">
            <div className="bar-fill" style={{ width: `${c.progress}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
