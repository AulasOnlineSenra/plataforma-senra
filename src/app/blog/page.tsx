import Link from 'next/link';
import { getBlogPosts } from '@/lib/data';

export default function BlogPage() {
  const posts = getBlogPosts();

  return (
    <div className="min-h-[calc(100vh-160px)] bg-background py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold font-headline text-slate-900 mb-8">
          Blog
        </h1>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.id}`}
              className="group overflow-hidden rounded-xl border bg-card shadow-sm hover:shadow-lg transition-all duration-300"
            >
              <div className="relative">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-4">
                  <span className="text-xs text-amber-400 font-medium uppercase tracking-wider">
                    {post.tags[0]}
                  </span>
                </div>
              </div>
              <div className="p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-3 line-clamp-2 hover:text-amber-500 transition-colors duration-200 group-hover:text-amber-500">
                  {post.title}
                </h2>
                <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    <svg className="w-4 h-4 mr-1 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3"></path>
                    </svg>
                    {post.readTime}
                  </span>
                  <span>
                    <svg className="w-4 h-4 mr-1 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                    </svg>
                    {post.author}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-12 text-center">
          <a href="#" className="text-amber-600 hover:text-amber-500">
            Ver todos os artigos →
          </a>
        </div>
      </div>
    </div>
  );
}