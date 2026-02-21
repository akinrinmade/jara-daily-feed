import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PostCard } from '@/components/feed/PostCard';
import { AdCard } from '@/components/feed/AdCard';
import { TrendingRibbon } from '@/components/feed/TrendingRibbon';
import { DailyMissions } from '@/components/gamification/DailyMissions';
import { MOCK_ADS } from '@/data/mockData';
import { usePosts, useTrendingPosts } from '@/hooks/usePosts';
import { useGamification } from '@/contexts/GamificationContext';
import { useCoins } from '@/contexts/CoinContext';
import { useAuth } from '@/contexts/AuthContext';
import { useMissions } from '@/contexts/MissionsContext';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function FeedSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      {[1, 2, 3].map(i => (
        <div key={i} className="rounded-2xl overflow-hidden border border-border bg-card">
          <Skeleton className="w-full aspect-[4/5] sm:aspect-[16/9]" />
          <div className="p-4 hidden sm:block space-y-2">
            <Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-full" />
          </div>
          <div className="flex gap-4 p-3 border-t border-border">
            <Skeleton className="h-4 w-12" /><Skeleton className="h-4 w-12" />
          </div>
        </div>
      ))}
    </div>
  );
}

const BATCH = 6;

export default function Index() {
  const [visible, setVisible] = useState(BATCH);
  const [loadingMore, setLoadingMore] = useState(false);
  const { shadowWalletXP } = useGamification();
  const { userCoins } = useCoins();
  const { isGuest } = useAuth();
  const { incrementMission } = useMissions();
  const navigate = useNavigate();
  const sentinel = useRef<HTMLDivElement>(null);

  const { data: allPosts = [], isLoading } = usePosts(undefined, 40);
  const { data: trendingPosts = [] } = useTrendingPosts(6);

  useEffect(() => { if (!isGuest) incrementMission('streak'); }, [isGuest]); // eslint-disable-line

  const feedItems = useMemo(() => {
    const items: Array<{ type: 'post' | 'ad'; data: any; key: string }> = [];
    allPosts.slice(0, visible).forEach((post, i) => {
      items.push({ type: 'post', data: post, key: `p-${post.id}` });
      if ((i + 1) % 4 === 0) {
        const ad = MOCK_ADS[Math.floor(i / 4) % MOCK_ADS.length];
        if (ad) items.push({ type: 'ad', data: ad, key: `a-${ad.id}-${i}` });
      }
    });
    return items;
  }, [allPosts, visible]);

  const loadMore = useCallback(() => {
    if (visible >= allPosts.length || loadingMore) return;
    setLoadingMore(true);
    setTimeout(() => { setVisible(v => Math.min(v + BATCH, allPosts.length)); setLoadingMore(false); }, 500);
  }, [visible, allPosts.length, loadingMore]);

  useEffect(() => {
    const obs = new IntersectionObserver(e => { if (e[0].isIntersecting) loadMore(); }, { rootMargin: '400px' });
    if (sentinel.current) obs.observe(sentinel.current);
    return () => obs.disconnect();
  }, [loadMore]);

  return (
    <AppLayout>
      <div className="py-4">
        <TrendingRibbon posts={trendingPosts} />
        {!isGuest && <DailyMissions />}

        {isGuest && shadowWalletXP > 0 && (
          <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-primary/20 to-primary/5 border border-primary/30 flex items-center gap-3">
            <Sparkles className="h-6 w-6 text-primary flex-shrink-0 animate-pulse" />
            <div className="flex-1">
              <p className="text-sm font-black">You've earned {shadowWalletXP} XP & {userCoins} Coins!</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Sign up to claim your shadow wallet.</p>
            </div>
            <Button size="sm" onClick={() => navigate('/auth')}>Claim</Button>
          </div>
        )}

        {isLoading ? <FeedSkeleton /> : (
          <div className="flex flex-col gap-5">
            {feedItems.map(item =>
              item.type === 'post'
                ? <PostCard key={item.key} post={item.data} />
                : <AdCard key={item.key} ad={item.data} />
            )}
          </div>
        )}

        {!isLoading && (
          <div ref={sentinel} className="mt-10 mb-12 flex justify-center pb-4">
            {loadingMore
              ? <Loader2 className="h-7 w-7 animate-spin text-primary/60" />
              : visible >= allPosts.length && allPosts.length > 0 && (
                <div className="text-center">
                  <div className="h-1 w-12 bg-border rounded-full mx-auto mb-2" />
                  <p className="text-sm font-bold text-muted-foreground">You're all caught up!</p>
                </div>
              )
            }
          </div>
        )}
      </div>
    </AppLayout>
  );
}
