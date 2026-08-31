'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

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

export async function getBlogPosts() {
  try {
    const posts = await prisma.blogPost.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: posts };
  } catch (error) {
    console.error('Erro ao buscar posts:', error);
    return { success: false, error: 'Falha ao buscar posts do blog.' };
  }
}

export async function getPublishedPostsPaginated(skip: number, take: number) {
  try {
    const posts = await prisma.blogPost.findMany({
      where: {
        published: true,
        createdAt: { lte: new Date() },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        image: true,
        author: true,
        tags: true,
        createdAt: true,
        likes: true,
        dislikes: true,
        commentsCount: true,
      }
    });
    return { success: true, data: posts };
  } catch (error) {
    console.error('Erro ao buscar posts paginados:', error);
    return { success: false, error: 'Falha ao buscar posts do blog.' };
  }
}

export async function getDashboardKanbanPosts() {
  try {
    const drafts = await prisma.blogPost.findMany({
      where: { OR: [{ status: 'DRAFT' }, { status: '', published: false }] },
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, author: true, createdAt: true, status: true, published: true, referenceUrl: true, referenceBlogId: true, slug: true }
    });
    const reviews = await prisma.blogPost.findMany({
      where: { status: 'REVIEW' },
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, author: true, createdAt: true, status: true, published: true, referenceUrl: true, referenceBlogId: true, slug: true }
    });
    const images = await prisma.blogPost.findMany({
      where: { status: 'IMAGES' },
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, author: true, createdAt: true, status: true, published: true, referenceUrl: true, referenceBlogId: true, slug: true }
    });
    return { success: true, data: { drafts, reviews, images } };
  } catch (error) {
    console.error('Erro ao buscar Kanban posts:', error);
    return { success: false, error: 'Falha ao buscar posts.' };
  }
}

export async function getDashboardPublishedPaginated(skip: number, take: number) {
  try {
    const published = await prisma.blogPost.findMany({
      where: { OR: [{ status: 'PUBLISHED' }, { status: '', published: true }] },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      select: { id: true, title: true, author: true, createdAt: true, status: true, published: true, referenceUrl: true, referenceBlogId: true, slug: true }
    });
    return { success: true, data: published };
  } catch (error) {
    console.error('Erro ao buscar posts publicados:', error);
    return { success: false, error: 'Falha ao buscar posts publicados.' };
  }
}


export async function getPublishedPosts() {
  try {
    // Auto-publish scheduled posts when current date is reached
    const cutoffDate = new Date();
    const posts = await prisma.blogPost.findMany({
      where: { 
        published: true,
        createdAt: { lte: cutoffDate }
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        image: true,
        author: true,
        tags: true,
        createdAt: true,
        likes: true,
        dislikes: true,
        commentsCount: true,
      }
    });
    return { success: true, data: posts };
  } catch (error) {
    console.error('Erro ao buscar posts publicados:', error);
    return { success: false, error: 'Falha ao buscar posts publicados.' };
  }
}

export async function getBlogPostById(id: string) {
  try {
    const post = await prisma.blogPost.findUnique({
      where: { id },
    });
    if (!post) {
      return { success: false, error: 'Post não encontrado.' };
    }
    return { success: true, data: post };
  } catch (error) {
    console.error('Erro ao buscar post:', error);
    return { success: false, error: 'Falha ao buscar post.' };
  }
}

export async function getBlogPostBySlug(slug: string) {
  try {
    const post = await prisma.blogPost.findFirst({
      where: {
        OR: [
          { slug: slug },
          { id: slug }
        ]
      },
    });
    if (!post) {
      return { success: false, error: 'Post não encontrado.' };
    }
    return { success: true, data: post };
  } catch (error) {
    console.error('Erro ao buscar post por slug:', error);
    return { success: false, error: 'Falha ao buscar post.' };
  }
}

export async function createPost(data: {
  title: string;
  excerpt: string;
  content: string;
  author: string;
  image?: string;
  tags?: string;
  published?: boolean;
  createdAt?: string;
  metaDescription?: string;
}) {
  try {
    let baseSlug = slugify(data.title);
    if (!baseSlug) baseSlug = 'post';
    let slug = baseSlug;
    
    // Check if slug exists
    let exists = await prisma.blogPost.findUnique({ where: { slug } });
    if (exists) {
      slug = `${baseSlug}-${Date.now().toString(36)}`;
    }

    const post = await prisma.blogPost.create({
      data: {
        id: crypto.randomUUID(),
        slug,
        title: data.title,
        excerpt: data.excerpt,
        content: data.content,
        author: data.author,
        image: data.image || null,
        tags: data.tags || '[]',
        metaDescription: data.metaDescription || null,
        published: data.published ?? false,
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        updatedAt: new Date(),
      },
    });
    revalidatePath('/dashboard/blog');
    revalidatePath('/blog');
    return { success: true, data: post };
  } catch (error) {
    console.error('Erro ao criar post:', error);
    return { success: false, error: 'Falha ao criar post.' };
  }
}

export async function updatePost(
  id: string,
  data: {
    title: string;
    excerpt: string;
    content: string;
    author: string;
    image?: string;
    tags?: string;
    published?: boolean;
    createdAt?: string;
    status?: 'DRAFT' | 'REVIEW' | 'IMAGES' | 'PUBLISHED';
    metaDescription?: string;
  }
) {
  try {
    const post = await prisma.blogPost.update({
      where: { id },
      data: {
        title: data.title,
        excerpt: data.excerpt,
        content: data.content,
        author: data.author,
        image: data.image || null,
        tags: data.tags || '[]',
        metaDescription: data.metaDescription !== undefined ? data.metaDescription : undefined,
        published: data.published ?? false,
        ...(data.createdAt && { createdAt: new Date(data.createdAt) }),
        ...(data.status && { status: data.status }),
      },
    });
    revalidatePath('/dashboard/blog');
    revalidatePath('/blog');
    return { success: true, data: post };
  } catch (error) {
    console.error('Erro ao atualizar post:', error);
    return { success: false, error: 'Falha ao atualizar post.' };
  }
}

export async function deletePost(id: string) {
  try {
    await prisma.blogPost.delete({
      where: { id },
    });
    revalidatePath('/dashboard/blog');
    revalidatePath('/blog');
    return { success: true };
  } catch (error) {
    console.error('Erro ao deletar post:', error);
    return { success: false, error: 'Falha ao deletar post.' };
  }
}

export async function togglePublishPost(id: string) {
  try {
    const post = await prisma.blogPost.findUnique({
      where: { id },
    });
    if (!post) {
      return { success: false, error: 'Post não encontrado.' };
    }
    const updated = await prisma.blogPost.update({
      where: { id },
      data: { published: !post.published },
    });
    revalidatePath('/dashboard/blog');
    revalidatePath('/blog');
    return { success: true, data: updated };
  } catch (error) {
    console.error('Erro ao alternar publicação:', error);
    return { success: false, error: 'Falha ao alternar publicação.' };
  }
}

export async function likePost(id: string) {
  try {
    const updated = await prisma.blogPost.update({
      where: { id },
      data: { likes: { increment: 1 } },
    });
    revalidatePath('/blog');
    revalidatePath(`/blog/${id}`);
    return { success: true, data: updated };
  } catch (error) {
    console.error('Erro ao dar like:', error);
    return { success: false, error: 'Falha ao processar like.' };
  }
}

export async function dislikePost(id: string) {
  try {
    const updated = await prisma.blogPost.update({
      where: { id },
      data: { dislikes: { increment: 1 } },
    });
    revalidatePath('/blog');
    revalidatePath(`/blog/${id}`);
    return { success: true, data: updated };
  } catch (error) {
    console.error('Erro ao dar dislike:', error);
    return { success: false, error: 'Falha ao processar dislike.' };
  }
}

export async function getOtherPosts(currentPostId: string, limit: number = 30) {
  try {
    const posts = await prisma.blogPost.findMany({
      where: { 
        published: true,
        id: { not: currentPostId },
        createdAt: { lte: new Date() }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    
    const shuffled = posts.sort(() => Math.random() - 0.5);
    return { success: true, data: shuffled };
  } catch (error) {
    console.error('Erro ao buscar outros posts:', error);
    return { success: false, error: 'Falha ao buscar outros posts.' };
  }
}

export async function incrementPostViews(id: string) {
  try {
    const updated = await prisma.blogPost.update({
      where: { id },
      data: { views: { increment: 1 } },
    });
    return { success: true, data: updated };
  } catch (error) {
    console.error('Erro ao incrementar visualizações:', error);
    return { success: false, error: 'Falha ao incrementar visualizações.' };
  }
}

export async function updatePostStatus(id: string, newStatus: 'DRAFT' | 'REVIEW' | 'IMAGES' | 'PUBLISHED') {
  try {
    const post = await prisma.blogPost.update({
      where: { id },
      data: {
        status: newStatus,
        published: newStatus === 'PUBLISHED',
      },
    });
    revalidatePath('/dashboard/blog');
    revalidatePath('/blog');
    return { success: true, data: post };
  } catch (error) {
    console.error('Erro ao atualizar status do post:', error);
    return { success: false, error: 'Falha ao atualizar status.' };
  }
}

export async function createDraftFromIdea(title: string, referenceUrl?: string, referenceBlogId?: string) {
  try {
    let baseSlug = slugify(title);
    if (!baseSlug) baseSlug = 'ideia';
    let slug = `${baseSlug}-${Date.now().toString(36)}`;

    const post = await prisma.blogPost.create({
      data: {
        id: crypto.randomUUID(),
        slug,
        title: title,
        excerpt: 'Rascunho gerado a partir de referência.',
        content: '<p>Comece a escrever seu artigo aqui...</p>',
        author: 'Redação',
        status: 'DRAFT',
        published: false,
        referenceUrl: referenceUrl || null,
        referenceBlogId: referenceBlogId || null,
        tags: '[]',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    revalidatePath('/dashboard/blog');
    return { success: true, data: post };
  } catch (error) {
    console.error('Erro ao criar rascunho:', error);
    return { success: false, error: 'Falha ao criar rascunho.' };
  }
}

export async function getBlogKpis() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [byStatus, publishedLast30, referenceBlogs, postsWithRef] = await Promise.all([
      // Count per status
      prisma.blogPost.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      // Published in the last 30 days
      prisma.blogPost.count({
        where: { status: 'PUBLISHED', createdAt: { gte: thirtyDaysAgo } },
      }),
      // All reference blogs
      prisma.referenceBlog.findMany({ select: { id: true, name: true, url: true, feedUrl: true } }),
      // Posts usages by referenceBlogId
      prisma.blogPost.groupBy({
        by: ['referenceBlogId'],
        _count: { _all: true },
        where: { referenceBlogId: { not: null } }
      }),
    ]);

    // Build status map
    const statusMap: Record<string, number> = {};
    for (const row of byStatus) {
      statusMap[row.status || 'DRAFT'] = (statusMap[row.status || 'DRAFT'] || 0) + row._count._all;
    }

    // Rank reference blogs based on the direct referenceBlogId count
    const refUsageMap: Record<string, number> = {};
    for (const row of postsWithRef) {
      if (row.referenceBlogId) {
        refUsageMap[row.referenceBlogId] = row._count._all;
      }
    }

    const refRanking = referenceBlogs.map(blog => {
      return { id: blog.id, name: blog.name, url: blog.url, usageCount: refUsageMap[blog.id] || 0 };
    }).sort((a, b) => b.usageCount - a.usageCount);

    return {
      success: true,
      data: {
        draft: statusMap['DRAFT'] || 0,
        review: statusMap['REVIEW'] || 0,
        images: statusMap['IMAGES'] || 0,
        published: statusMap['PUBLISHED'] || 0,
        publishedLast30,
        refRanking,
      },
    };
  } catch (error) {
    console.error('Erro ao buscar KPIs do blog:', error);
    return { success: false, error: 'Falha ao buscar KPIs.' };
  }
}
