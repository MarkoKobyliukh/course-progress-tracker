import { Router } from "express";
import { prisma } from "../prisma";
import { HttpError } from "../middleware/errorHandler";

export const lessonsRouter = Router();

// GET /courses/:courseId/lessons — lessons of a course.
lessonsRouter.get("/courses/:courseId/lessons", async (req, res) => {
  const course = await prisma.course.findUnique({
    where: { id: req.params.courseId },
  });
  if (!course) throw new HttpError(404, "Course not found");

  const lessons = await prisma.lesson.findMany({
    where: { courseId: req.params.courseId },
    orderBy: { createdAt: "asc" },
  });
  res.json(lessons);
});

// POST /courses/:courseId/lessons — add a lesson. title required, course must exist.
lessonsRouter.post("/courses/:courseId/lessons", async (req, res) => {
  const { title } = req.body ?? {};

  if (typeof title !== "string" || title.trim() === "") {
    throw new HttpError(400, "lesson.title is required");
  }

  const course = await prisma.course.findUnique({
    where: { id: req.params.courseId },
  });
  if (!course) throw new HttpError(404, "Course not found");

  const lesson = await prisma.lesson.create({
    data: { title: title.trim(), courseId: req.params.courseId },
  });
  res.status(201).json(lesson);
});

// PATCH /lessons/:id — toggle isCompleted and/or edit title.
lessonsRouter.patch("/lessons/:id", async (req, res) => {
  const { isCompleted, title } = req.body ?? {};
  const data: { isCompleted?: boolean; title?: string } = {};

  if (isCompleted !== undefined) {
    if (typeof isCompleted !== "boolean") {
      throw new HttpError(400, "isCompleted must be a boolean");
    }
    data.isCompleted = isCompleted;
  }

  if (title !== undefined) {
    if (typeof title !== "string" || title.trim() === "") {
      throw new HttpError(400, "lesson.title must be a non-empty string");
    }
    data.title = title.trim();
  }

  if (Object.keys(data).length === 0) {
    throw new HttpError(400, "Nothing to update (send isCompleted or title)");
  }

  const existing = await prisma.lesson.findUnique({
    where: { id: req.params.id },
  });
  if (!existing) throw new HttpError(404, "Lesson not found");

  const lesson = await prisma.lesson.update({
    where: { id: req.params.id },
    data,
  });
  res.json(lesson);
});

// DELETE /lessons/:id — delete a single lesson.
lessonsRouter.delete("/lessons/:id", async (req, res) => {
  const existing = await prisma.lesson.findUnique({
    where: { id: req.params.id },
  });
  if (!existing) throw new HttpError(404, "Lesson not found");

  await prisma.lesson.delete({ where: { id: req.params.id } });
  res.status(204).send();
});
