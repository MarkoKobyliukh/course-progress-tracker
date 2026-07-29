import { useState } from "react";
import { api } from "../api";

interface Props {
  courseId: string;
  onAdded: () => void;
}

export function AddLessonForm({ courseId, onAdded }: Props) {
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (title.trim() === "") {
      setError("Lesson title is required");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await api.addLesson(courseId, { title: title.trim() });
      setTitle("");
      onAdded();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add lesson");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="add-lesson" onSubmit={handleSubmit}>
      <input
        placeholder="New lesson title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <button type="submit" disabled={submitting}>
        {submitting ? "Adding…" : "Add lesson"}
      </button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}
