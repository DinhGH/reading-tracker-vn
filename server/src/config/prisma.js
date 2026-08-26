import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  // log: ["query", "info", "warn", "error"], // Optional: Enable detailed Prisma logs for debugging
});

export default prisma;
