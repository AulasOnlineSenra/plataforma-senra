'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';

type Post = {
  id: string;
  title: string;
  excerpt: string;
  image?: string;
  author: string;
  tags?: string;
  createdAt: string;
};

export default function BlogSearchBar({ posts }: { posts: Post[] }) {
  const [query, setQuery] = useState('');

  return (
    <div className="mb-[235px] -mt-[45px] max-w-[65%] mx-auto">
      <div className="flex items-center gap-2 bg-card border border-[#f5b000] rounded-2xl px-4 py-3 shadow-[0_0_10px_rgba(245,176,0,0.4)]">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar posts..."
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
        />
        <Search className="h-5 w-5 text-muted-foreground flex-shrink-0" />
      </div>
    </div>
  );
}