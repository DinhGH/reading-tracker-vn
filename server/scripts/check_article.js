import prisma from "../src/config/prisma.js";

async function check() {
  try {
    const article = await prisma.article.findFirst({ where: { id: 404 } });
    if (!article) {
      console.log("Article 404 not found");
      return;
    }
    console.log("Article 404 content length:", article.content.length);
    console.log(
      "Article 404 content snippet:",
      article.content.substring(0, 100),
    );
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}
check();
