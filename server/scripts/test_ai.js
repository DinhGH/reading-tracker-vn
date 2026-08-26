import aiService from "../src/services/ai.service.js";
import prisma from "../src/config/prisma.js";

async function test() {
  try {
    const article = await prisma.article.findFirst({ where: { id: 404 } });
    if (!article) {
      console.log("Article 404 not found");
      return;
    }
    console.log("Article ID 404 content length:", article.content.length);
    const result = await aiService.summarizeAndClassify(article.content);
    console.log("Result:", JSON.stringify(result, null, 2));
  } catch (e) {
    console.error("Error:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}
test();
