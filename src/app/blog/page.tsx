import Link from 'next/link';
import { getPublishedPosts } from '@/app/actions/blog';

export default async function BlogPage() {
  const result = await getPublishedPosts();
  const posts = result.success ? result.data : [];

  return (
    <div className="min-h-[calc(100vh-160px)] bg-background py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold font-headline text-slate-900 dark:text-foreground mb-8">
          Blog
        </h1>

        {posts && posts.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => {
              let firstTag = '';
              try {
                const parsed = JSON.parse(post.tags);
                if (Array.isArray(parsed) && parsed.length > 0) firstTag = parsed[0];
              } catch { firstTag = ''; }

              const formattedDate = new Date(post.createdAt).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              });

              return (
                <Link
                  key={post.id}
                  href={`/blog/${post.id}`}
                  className="group overflow-hidden rounded-xl border bg-card shadow-sm hover:shadow-lg transition-all duration-300"
                >
                  {post.image && (
                    <div className="relative">
                      <img
                        src={post.image}
                        alt={post.title}
                        className="w-full h-40 sm:h-48 object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      {firstTag && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-4">
                          <span className="text-xs text-amber-400 font-medium uppercase tracking-wider">
                            {firstTag}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="p-6">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-foreground mb-3 line-clamp-2 group-hover:text-amber-500 transition-colors duration-200">
                      {post.title}
                    </h2>
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{formattedDate}</span>
                      <span>{post.author}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
            <p className="text-lg">Nenhum artigo publicado ainda.</p>
          </div>
        )}
      </div>
    </div>
  );
}
