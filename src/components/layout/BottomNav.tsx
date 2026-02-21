import { Link, useLocation } from 'react-router-dom';
import { Home, Compass, PlusCircle, Settings, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMissions } from '@/contexts/MissionsContext';
import { useAuth } from '@/contexts/AuthContext';

export function BottomNav() {
  const location = useLocation();
  const { isGuest } = useAuth();
  const { missions } = useMissions();
  const hasUnclaimedMissions = !isGuest && missions.some(m => m.completed && !m.claimed);

  const tabs = [
    { path: '/', icon: Home, label: 'Home', badge: hasUnclaimedMissions },
    { path: '/discover', icon: Compass, label: 'Discover' },
    { path: '/create', icon: PlusCircle, label: 'Create', isCreate: true },
    { path: '/settings', icon: Settings, label: 'Settings' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-t border-border">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {tabs.map(({ path, icon: Icon, label, isCreate, badge }) => {
          const isActive = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all relative',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {isCreate ? (
                <div className={cn(
                  'w-11 h-11 rounded-full flex items-center justify-center -mt-5 shadow-lg transition-transform active:scale-95',
                  'bg-primary'
                )}>
                  <Icon className="h-5 w-5 text-primary-foreground" />
                </div>
              ) : (
                <div className="relative">
                  <Icon className={cn('h-5 w-5', isActive && 'stroke-[2.5]')} />
                  {badge && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-primary border-2 border-card animate-pulse" />
                  )}
                </div>
              )}
              <span className={cn('text-[10px] font-medium', isCreate && '-mt-0.5', isActive && 'font-bold')}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
