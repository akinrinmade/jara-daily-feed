import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PostCard } from '@/components/feed/PostCard';
import { usePosts } from '@/hooks/usePosts';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Category } from '@/types';

const CATEGORIES: Array<Category | 'All' | 'Trending'> = ['All', 'Money', 'Hausa', 'Gist', 'Trending'];

export default function Discover() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const { data: posts = [], isLoading } = usePosts(activeCategory === 'All' ? undefined : activeCategory, 40);

  const filtered = useMemo(() => {
    if (!search) return posts;
    const q = search.toLowerCase();
    return posts.filter(p => p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q));
  }, [posts, search]);

  const aiPicks = useMemo(
    () => [...posts].sort((a, b) => b.reactionsCount - a.reactionsCount).slice(0, 3),
    [posts]
  );

  return (
    <AppLayout>
      <div className="py-4">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search posts..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-5 -mx-4 px-4">
          {CATEGORIES.map(cat => (
            <Badge key={cat} variant={activeCategory === cat ? 'default' : 'outline'}
              className={cn('cursor-pointer whitespace-nowrap', activeCategory === cat && 'bg-primary text-primary-foreground')}
              onClick={() => setActiveCategory(cat)}>
              {cat}
            </Badge>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-48 rounded-2xl" />)}</div>
        ) : (
          <>
            {!search && activeCategory === 'All' && aiPicks.length > 0 && (
              <section className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h2 className="font-bold text-sm">AI Picks for You</h2>
                </div>
                <div className="flex flex-col gap-3">
                  {aiPicks.map(post => <PostCard key={post.id} post={post} />)}
                </div>
              </section>
            )}

            <div className="flex flex-col gap-4">
              {filtered.map(post => <PostCard key={post.id} post={post} />)}
              {filtered.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-4xl mb-3">🔍</p>
                  <p className="text-muted-foreground font-medium">No posts found.</p>
                  <p className="text-xs text-muted-foreground mt-1">Try a different search or category.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
