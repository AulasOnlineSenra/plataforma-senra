import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD') // separate accent from letter
    .replace(/[\u0300-\u036f]/g, '') // remove all separated accents
    .replace(/\s+/g, '-') // replace spaces with -
    .replace(/[^\w\-]+/g, '') // remove all non-word chars
    .replace(/\-\-+/g, '-'); // replace multiple - with single -
}

async function migrateSlugs() {
  const posts = await prisma.blogPost.findMany();
  for (const post of posts) {
    // Only migrate if slug is a standard uuid length (36 chars) or if you want to force all
    if (post.slug && post.slug.length === 36 && post.slug.includes('-')) {
      let baseSlug = slugify(post.title);
      if (!baseSlug) baseSlug = 'post';
      let slug = baseSlug;
      
      let exists = await prisma.blogPost.findFirst({ where: { slug, id: { not: post.id } } });
      if (exists) {
        slug = `${baseSlug}-${Date.now().toString(36)}`;
      }

      await prisma.blogPost.update({
        where: { id: post.id },
        data: { slug },
      });
      console.log(`Migrated ${post.title} to slug: ${slug}`);
    }
  }
  console.log('Migration completed.');
}

migrateSlugs()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
