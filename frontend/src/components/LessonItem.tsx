import { useState } from "react";
import { api } from "../api";
import type { Lesson } from "../types";

interface Props {
  lesson: Lesson;
  onChanged: () => void;
}

export function LessonItem({ lesson, onChanged }: Props) {
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    try {
      await api.setLessonCompleted(lesson.id, !lesson.isCompleted);
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await api.deleteLesson(lesson.id);
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="lesson-item">
      <label className="lesson-label">
        <input
          type="checkbox"
          checked={lesson.isCompleted}
          onChange={toggle}
          disabled={busy}
        />
        <span className={lesson.isCompleted ? "done" : ""}>{lesson.title}</span>
      </label>
      <button className="danger" onClick={remove} disabled={busy}>
        Delete
      </button>
    </li>
  );
}
