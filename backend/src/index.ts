import "dotenv/config";
import express from "express";
import cors from "cors";
import { coursesRouter } from "./routes/courses";
import { lessonsRouter } from "./routes/lessons";
import { errorHandler, notFound } from "./middleware/errorHandler";

const app = express();
const PORT = Number(process.env.PORT) || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check (used by Docker depends_on in Stage 8)
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/courses", coursesRouter);
app.use(lessonsRouter);

// 404 + central error handler (must be last)
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
