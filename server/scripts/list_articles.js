import prisma from "../src/config/prisma.js";

async function list() {
  const articles = await prisma.article.findMany({
    select: {
      id: true,
      title: true,
      url: true,
      content: true,
      summary: true,
      topic: true,
    },
  });

  articles.forEach((a) => {
    console.log(`ID: ${a.id}`);
    console.log(`Title: ${a.title}`);
    console.log(`Content Length: ${a.content ? a.content.length : "N/A"}`);
    console.log(`Has Summary: ${!!a.summary}`);
    console.log("---");
  });

  await prisma.$disconnect();
}
list();
