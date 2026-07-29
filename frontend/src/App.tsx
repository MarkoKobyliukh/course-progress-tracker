import { useEffect, useState } from "react";
import { api } from "./api";
import type { Course } from "./types";
import "./App.css";

export default function App() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadCourses() {
    setLoading(true);
    setError(null);
    try {
      setCourses(await api.listCourses());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load courses");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCourses();
  }, []);

  return (
    <main className="container">
      <h1>Course Progress Tracker</h1>

      {loading && <p className="muted">Loading…</p>}
      {error && <p className="error">Error: {error}</p>}

      {!loading && !error && courses.length === 0 && (
        <p className="muted">No courses yet.</p>
      )}

      <ul className="course-list">
        {courses.map((c) => (
          <li key={c.id} className="course-card">
            <div className="course-head">
              <strong>{c.title}</strong>
              <span className="muted">
                {c.completedLessons}/{c.totalLessons} · {c.progress}%
              </span>
            </div>
            {c.description && <p className="muted">{c.description}</p>}
            <div className="bar">
              <div className="bar-fill" style={{ width: `${c.progress}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
