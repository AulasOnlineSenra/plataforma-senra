const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log("Starting URL link fix script...");
  const posts = await prisma.blogPost.findMany();
  let updatedCount = 0;
  
  for (const post of posts) {
     let updatedContent = post.content;
     let modified = false;
     
     for (const other of posts) {
        if (other.slug) {
            const searchId = `/blog/${other.id}`;
            const searchId2 = `href="/blog/${other.id}"`;
            
            if (updatedContent.includes(searchId)) {
                updatedContent = updatedContent.split(searchId).join(`/blog/${other.slug}`);
                modified = true;
            }
        }
     }
     
     if (modified) {
        await prisma.blogPost.update({ 
            where: { id: post.id }, 
            data: { content: updatedContent } 
        });
        updatedCount++;
        console.log(`Updated post: ${post.title}`);
     }
  }
  
  console.log(`Finished! Updated ${updatedCount} posts.`);
}

run()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
