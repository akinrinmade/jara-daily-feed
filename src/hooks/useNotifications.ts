import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DBNotification {
  id: string; user_id: string; type: string; title: string;
  description: string; xp_amount: number | null; coin_amount: number | null;
  read: boolean; created_at: string;
}

export function useNotifications(userId: string | undefined) {
  return useQuery({
    queryKey: ['notifications', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data } = await supabase
        .from('notifications').select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }).limit(50);
      return (data || []) as DBNotification[];
    },
    enabled: !!userId,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useUnreadCount(userId: string | undefined) {
  const { data } = useNotifications(userId);
  return (data || []).filter(n => !n.read).length;
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      supabase.rpc('mark_all_notifications_read', { p_user_id: userId }),
    onSuccess: (_d, userId) =>
      qc.invalidateQueries({ queryKey: ['notifications', userId] }),
  });
}
