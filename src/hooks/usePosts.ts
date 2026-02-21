import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MOCK_POSTS } from '@/data/mockData';
import type { Post } from '@/types';

function mapDbPost(row: any, profileMap: Record<string, any>): Post {
  const author = profileMap[row.author_id] || {};
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    content: row.content,
    excerpt: row.excerpt || row.content.replace(/<[^>]*>/g, '').slice(0, 120) + '…',
    category: row.category,
    imageUrl: row.image_url || 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&fit=crop',
    isPremium: row.is_premium,
    media_type: row.media_type,
    createdAt: row.created_at,
    readTime: row.read_time || 3,
    views: row.views,
    shares: row.shares,
    reactionsCount: row.reactions_count,
    commentsCount: row.comments_count,
    author: {
      id: row.author_id,
      name: author.username || 'Jara Author',
      avatar: author.avatar_url || `https://api.dicebear.com/9.x/adventurer/svg?seed=${row.author_id}`,
      rank: (author.current_rank || 'JJC') as any,
      role: author.role,
    },
  };
}

async function fetchPosts(category?: string, limit = 20, offset = 0): Promise<Post[]> {
  let query = supabase
    .from('posts')
    .select('*')
    .eq('published', true)
    .range(offset, offset + limit - 1);

  if (category === 'Trending') {
    query = query.order('views', { ascending: false });
  } else {
    query = query.order('created_at', { ascending: false });
    if (category && category !== 'All') query = query.eq('category', category);
  }

  const { data: posts, error } = await query;

  if (error || !posts || posts.length === 0) {
    // Graceful fallback to mock data while DB is being set up
    let mock = [...MOCK_POSTS];
    if (category === 'Trending') mock.sort((a, b) => b.views - a.views);
    else if (category && category !== 'All') mock = mock.filter(p => p.category === category);
    return mock.slice(offset, offset + limit);
  }

  const authorIds = [...new Set(posts.map((p: any) => p.author_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, current_rank, role')
    .in('id', authorIds);

  const profileMap: Record<string, any> = {};
  (profiles || []).forEach((p: any) => { profileMap[p.id] = p; });
  return posts.map((p: any) => mapDbPost(p, profileMap));
}

async function fetchPostBySlug(slug: string): Promise<Post | null> {
  const { data: post, error } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle();

  if (error || !post) return MOCK_POSTS.find(p => p.slug === slug) || null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, current_rank, role')
    .eq('id', post.author_id)
    .maybeSingle();

  return mapDbPost(post, profile ? { [post.author_id]: profile } : {});
}

export function usePosts(category?: string, limit = 20) {
  return useQuery({
    queryKey: ['posts', category ?? 'all', limit],
    queryFn: () => fetchPosts(category, limit),
    staleTime: 2 * 60 * 1000,
  });
}

export function usePost(slug: string | undefined) {
  return useQuery({
    queryKey: ['post', slug],
    queryFn: () => slug ? fetchPostBySlug(slug) : null,
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
}

export function useTrendingPosts(count = 6) {
  return useQuery({
    queryKey: ['posts', 'trending', count],
    queryFn: () => fetchPosts('Trending', count),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      title: string; content: string; category: 'Money' | 'Hausa' | 'Gist';
      image_url?: string; is_premium?: boolean; media_type?: string; author_id: string;
    }) => {
      const { data: slug } = await supabase.rpc('generate_slug', { title: input.title });
      const plain = input.content.replace(/<[^>]*>/g, '').trim();
      const excerpt = plain.slice(0, 150) + (plain.length > 150 ? '…' : '');
      const readTime = Math.max(1, Math.ceil(plain.split(/\s+/).length / 200));

      const { data, error } = await supabase.from('posts').insert({
        title: input.title, slug: slug || input.title.toLowerCase().replace(/\s+/g, '-').slice(0, 60),
        content: input.content, excerpt,
        category: input.category, image_url: input.image_url || '',
        is_premium: input.is_premium ?? false,
        media_type: input.media_type || 'text',
        author_id: input.author_id, read_time: readTime, published: true,
      }).select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['posts'] }),
  });
}

export function useIncrementView() {
  return useMutation({
    mutationFn: ({ postId, userId }: { postId: string; userId?: string }) =>
      supabase.rpc('increment_post_view', { p_post_id: postId, p_user_id: userId || null }),
  });
}
