import { AppLayout } from '@/components/layout/AppLayout';
import { useNotifications, useMarkAllRead } from '@/hooks/useNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, Flame, Heart, Info, Coins, Target, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

const iconMap: Record<string, any> = {
  xp: Sparkles, streak: Flame, social: Heart,
  system: Info, coin: Coins, mission: Target,
};

const colorMap: Record<string, string> = {
  xp: 'bg-primary/10 text-primary',
  streak: 'bg-orange-500/10 text-orange-500',
  social: 'bg-pink-500/10 text-pink-500',
  system: 'bg-muted text-muted-foreground',
  coin: 'bg-amber-500/10 text-amber-500',
  mission: 'bg-purple-500/10 text-purple-500',
};

export default function Notifications() {
  const { user, isGuest } = useAuth();
  const navigate = useNavigate();
  const { data: notifications = [], isLoading } = useNotifications(user?.id);
  const markAllRead = useMarkAllRead();

  const unreadCount = notifications.filter(n => !n.read).length;

  if (isGuest) {
    return (
      <AppLayout>
        <div className="py-20 text-center">
          <h1 className="text-xl font-black mb-2">Notifications</h1>
          <p className="text-sm text-muted-foreground mb-6">Sign in to see your activity and notifications.</p>
          <Button onClick={() => navigate('/auth')}>Sign In</Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-black">Notifications</h1>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs text-primary"
              onClick={() => user && markAllRead.mutate(user.id)} disabled={markAllRead.isPending}>
              <CheckCheck className="h-4 w-4 mr-1" /> Mark all read
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-4xl mb-4">🔔</p>
            <p className="font-bold text-foreground mb-1">No notifications yet</p>
            <p className="text-xs text-muted-foreground">Start reading and engaging to earn XP and Coins!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {notifications.map(n => {
              const Icon = iconMap[n.type] || Info;
              return (
                <div key={n.id}
                  className={cn('flex items-start gap-3 p-3 rounded-xl border transition-colors',
                    n.read ? 'bg-card border-border' : 'bg-primary/5 border-primary/20'
                  )}>
                  <div className={cn('w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0', colorMap[n.type] || colorMap.system)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold leading-tight">{n.title}</p>
                      {!n.read && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />}
                    </div>
                    {n.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.description}</p>}
                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex flex-col gap-0.5 items-end flex-shrink-0">
                    {n.xp_amount && <span className="text-[10px] font-bold text-primary">+{n.xp_amount} XP</span>}
                    {n.coin_amount && <span className="text-[10px] font-bold text-amber-500">+{n.coin_amount} 🪙</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
