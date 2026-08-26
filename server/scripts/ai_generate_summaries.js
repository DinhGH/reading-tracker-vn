// Script: server/scripts/ai_generate_summaries.js
import "dotenv/config";
import path from "path";
import { config } from "dotenv";
config({ path: path.resolve(process.cwd(), "server/.env") });

import prisma from "../src/config/prisma.js";
import aiService from "../src/services/ai.service.js";

console.log("[DEBUG] process.env.GEMINI_API_KEY =", process.env.GEMINI_API_KEY);

async function updateAllMissingSummaries() {
  const articles = await prisma.article.findMany({
    where: {
      OR: [{ summary: null }, { summary: "" }, { topic: null }, { topic: "" }],
    },
  });
  console.log(
    `[INFO] Found ${articles.length} articles without summary or topic.`,
  );

  let updated = 0,
    errorCount = 0;

  for (const article of articles) {
    try {
      const { summary, topics } = await aiService.summarizeAndClassify(
        article.content,
      );
      await prisma.article.update({
        where: { id: article.id },
        data: {
          summary,
          topic: Array.isArray(topics) ? topics.join(", ") : topics || "",
        },
      });
      console.log(`[OK] Updated Article ID=${article.id}`);
      updated++;
    } catch (error) {
      errorCount++;
      console.error(`[FAIL] Article ID=${article.id}: ${error.message}`);
    }
  }
  await prisma.$disconnect();
  console.log(`[DONE] Updated ${updated} articles. Failed: ${errorCount}`);
}

updateAllMissingSummaries().catch((e) => {
  console.error("[FATAL]", e);
  process.exit(1);
});
