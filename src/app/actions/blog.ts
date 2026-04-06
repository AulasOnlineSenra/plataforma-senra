'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

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

export async function getPublishedPosts() {
  try {
    const posts = await prisma.blogPost.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' },
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

export async function createPost(data: {
  title: string;
  excerpt: string;
  content: string;
  author: string;
  image?: string;
  tags?: string;
  published?: boolean;
}) {
  try {
    const post = await prisma.blogPost.create({
      data: {
        id: crypto.randomUUID(),
        title: data.title,
        excerpt: data.excerpt,
        content: data.content,
        author: data.author,
        image: data.image || null,
        tags: data.tags || '[]',
        published: data.published ?? false,
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
        published: data.published ?? false,
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
