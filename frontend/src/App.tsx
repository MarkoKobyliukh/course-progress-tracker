import { useCallback, useEffect, useState } from "react";
import { api } from "./api";
import type { Course } from "./types";
import { CreateCourseForm } from "./components/CreateCourseForm";
import { CourseList } from "./components/CourseList";
import { CourseDetails } from "./components/CourseDetails";
import "./App.css";

export default function App() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const loadCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setCourses(await api.listCourses());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load courses");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  function handleDeleted(id: string) {
    if (id === selectedId) setSelectedId(null);
    loadCourses();
  }

  return (
    <main className="container">
      <h1>Course Progress Tracker</h1>

      <div className="layout">
        <div className="col">
          <CreateCourseForm onCreated={loadCourses} />

          {loading && <p className="muted">Loading…</p>}
          {error && <p className="error">Error: {error}</p>}
          {!loading && !error && (
            <CourseList
              courses={courses}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onDeleted={handleDeleted}
            />
          )}
        </div>

        <div className="col">
          {selectedId ? (
            <CourseDetails courseId={selectedId} onChanged={loadCourses} />
          ) : (
            <p className="muted">Select a course to see its lessons.</p>
          )}
        </div>
      </div>
    </main>
  );
}
