import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author: { username: string; avatar_url: string };
}

async function fetchComments(postId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select('id, post_id, author_id, content, created_at')
    .eq('post_id', postId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error || !data) return [];

  const authorIds = [...new Set(data.map((c: any) => c.author_id))];
  const { data: profiles } = await supabase
    .from('profiles').select('id, username, avatar_url').in('id', authorIds);

  const pm: Record<string, any> = {};
  (profiles || []).forEach((p: any) => { pm[p.id] = p; });

  return data.map((c: any) => ({
    ...c,
    author: {
      username: pm[c.author_id]?.username || 'User',
      avatar_url: pm[c.author_id]?.avatar_url || `https://api.dicebear.com/9.x/adventurer/svg?seed=${c.author_id}`,
    },
  }));
}

export function useComments(postId: string | undefined) {
  return useQuery({
    queryKey: ['comments', postId],
    queryFn: () => postId ? fetchComments(postId) : [],
    enabled: !!postId,
    staleTime: 30_000,
  });
}

export function useAddComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, authorId, content }: { postId: string; authorId: string; content: string }) => {
      const { data, error } = await supabase.rpc('add_comment', {
        p_post_id: postId, p_author_id: authorId, p_content: content,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['comments', vars.postId] });
      qc.invalidateQueries({ queryKey: ['post', undefined] });
    },
  });
}
