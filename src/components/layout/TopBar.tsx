import { useState, useEffect } from 'react';
import { Flame, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGamification } from '@/contexts/GamificationContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUnreadCount } from '@/hooks/useNotifications';
import { CoinDisplay } from '@/components/gamification/CoinDisplay';
import { StreakConfetti } from '@/components/gamification/StreakConfetti';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function TopBar() {
  const { streakDays } = useGamification();
  const { isGuest, user } = useAuth();
  const unreadCount = useUnreadCount(user?.id);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (!isGuest && streakDays > 0) {
      const key = `jara_streak_shown_${new Date().toISOString().split('T')[0]}`;
      if (!localStorage.getItem(key)) {
        const t = setTimeout(() => {
          setShowConfetti(true);
          localStorage.setItem(key, '1');
        }, 1500);
        return () => clearTimeout(t);
      }
    }
  }, [isGuest, streakDays]);

  return (
    <>
      <StreakConfetti trigger={showConfetti} streakDays={streakDays} onComplete={() => setShowConfetti(false)} />
      <header className="fixed top-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
          <Link to="/" className="flex items-center gap-0.5">
            <span className="text-xl font-black text-primary">Jara</span>
            <span className="text-xl font-black text-foreground">Daily</span>
          </Link>

          <div className="flex items-center gap-2">
            {isGuest ? (
              <Link to="/auth">
                <Button size="sm" variant="outline" className="h-8 text-xs font-semibold">Join Free</Button>
              </Link>
            ) : (
              <>
                <CoinDisplay />
                <button
                  onClick={() => setShowConfetti(true)}
                  className={cn(
                    'flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-bold transition-all active:scale-95',
                    streakDays > 0 ? 'bg-orange-500/10 text-orange-600 hover:bg-orange-500/20' : 'bg-muted text-muted-foreground'
                  )}
                  title={`${streakDays} day streak`}
                >
                  <Flame className={cn('h-4 w-4', streakDays > 0 ? 'text-orange-500' : 'text-muted-foreground')} />
                  <span>{streakDays}</span>
                </button>
              </>
            )}

            <Link to="/notifications" className="relative p-1.5 rounded-lg hover:bg-muted transition-colors">
              <Bell className="h-5 w-5 text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center px-0.5">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}
