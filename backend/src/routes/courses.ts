import { Router } from "express";
import { prisma } from "../prisma";
import { computeProgress } from "../lib/progress";
import { HttpError } from "../middleware/errorHandler";

export const coursesRouter = Router();

// GET /courses — all courses, each enriched with backend-computed progress.
coursesRouter.get("/", async (_req, res) => {
  const courses = await prisma.course.findMany({
    orderBy: { createdAt: "desc" },
    include: { lessons: { select: { isCompleted: true } } },
  });

  const result = courses.map(({ lessons, ...course }) => ({
    ...course,
    ...computeProgress(lessons),
  }));

  res.json(result);
});

// POST /courses — create a course. title is required.
coursesRouter.post("/", async (req, res) => {
  const { title, description } = req.body ?? {};

  if (typeof title !== "string" || title.trim() === "") {
    throw new HttpError(400, "course.title is required");
  }

  const course = await prisma.course.create({
    data: {
      title: title.trim(),
      description:
        typeof description === "string" && description.trim() !== ""
          ? description.trim()
          : null,
    },
  });

  res
    .status(201)
    .json({ ...course, totalLessons: 0, completedLessons: 0, progress: 0 });
});

// GET /courses/:id — one course with its lessons + progress.
coursesRouter.get("/:id", async (req, res) => {
  const course = await prisma.course.findUnique({
    where: { id: req.params.id },
    include: { lessons: { orderBy: { createdAt: "asc" } } },
  });

  if (!course) throw new HttpError(404, "Course not found");

  const { lessons, ...rest } = course;
  res.json({ ...rest, ...computeProgress(lessons), lessons });
});

// DELETE /courses/:id — deletes course (lessons cascade at DB level).
coursesRouter.delete("/:id", async (req, res) => {
  const existing = await prisma.course.findUnique({
    where: { id: req.params.id },
  });
  if (!existing) throw new HttpError(404, "Course not found");

  await prisma.course.delete({ where: { id: req.params.id } });
  res.status(204).send();
});
