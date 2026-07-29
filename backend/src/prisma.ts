import { PrismaClient } from "@prisma/client";

// Single shared PrismaClient instance for the whole app.
// (Avoids exhausting DB connections from multiple clients.)
export const prisma = new PrismaClient();
