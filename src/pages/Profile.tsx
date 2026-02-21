import { useState, useRef } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useGamification } from '@/contexts/GamificationContext';
import { useCoins } from '@/contexts/CoinContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePosts } from '@/hooks/usePosts';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PostCard } from '@/components/feed/PostCard';
import { GlobalCoinPool } from '@/components/gamification/GlobalCoinPool';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useSeo } from '@/hooks/useSeo';
import {
  Flame, BookOpen, Trophy, Star, Coins, Shield, LogOut, TrendingUp,
  Camera, Pencil, Check, X, Loader2,
} from 'lucide-react';
import { getRankColor, getNextRankXP } from '@/types';
import { cn } from '@/lib/utils';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

// Real leaderboard from Supabase
function useLeaderboard() {
  return useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, xp_points, current_rank, location_state')
        .order('xp_points', { ascending: false })
        .limit(10);
      return data || [];
    },
    staleTime: 5 * 60_000,
  });
}

export default function Profile() {
  useSeo({ title: 'My Profile' });
  const { xpPoints, currentRank, streakDays, postsRead, savedPosts } = useGamification();
  const { userCoins } = useCoins();
  const { user, profile, isGuest, signOut, updateProfile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const nextRankXP = getNextRankXP(xpPoints);
  const progress = Math.min(100, (xpPoints / nextRankXP) * 100);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: leaderboard = [], isLoading: lbLoading } = useLeaderboard();
  const { data: allPosts = [] } = usePosts(undefined, 50);
  const savedPostsData = allPosts.filter(p => savedPosts.includes(p.id));

  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [savingUsername, setSavingUsername] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  if (isGuest) {
    return (
      <AppLayout>
        <div className="py-20 text-center px-4">
          <div className="text-5xl mb-4">🏆</div>
          <h1 className="text-xl font-black mb-2">Join Jara Daily</h1>
          <p className="text-sm text-muted-foreground mb-6">Sign up to track XP, coins, and compete on the leaderboard!</p>
          <Button onClick={() => navigate('/auth')}>Sign Up Free</Button>
        </div>
      </AppLayout>
    );
  }

  const displayName = profile?.username || 'User';
  const avatarUrl = profile?.avatar_url || '';

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'Image too large', description: 'Max 2MB', variant: 'destructive' });
      return;
    }
    setUploadingAvatar(true);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/avatar.${ext}`;
    const { data, error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (error) {
      toast({ title: 'Upload failed', description: 'Check storage bucket setup.', variant: 'destructive' });
    } else {
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(data.path);
      await updateProfile({ avatar_url: publicUrl });
      toast({ title: 'Avatar updated!' });
    }
    setUploadingAvatar(false);
  };

  const saveUsername = async () => {
    if (!newUsername.trim() || newUsername.trim().length < 3) {
      toast({ title: 'Username must be at least 3 characters', variant: 'destructive' });
      return;
    }
    setSavingUsername(true);
    await updateProfile({ username: newUsername.trim() });
    setEditingUsername(false);
    setSavingUsername(false);
    toast({ title: 'Username updated!' });
  };

  return (
    <AppLayout>
      <div className="py-4">
        {/* Avatar + name */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative mb-3">
            <Avatar className="h-20 w-20 ring-4 ring-primary/20">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="text-2xl font-black">{displayName[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-md"
            >
              {uploadingAvatar ? <Loader2 className="h-3.5 w-3.5 text-white animate-spin" /> : <Camera className="h-3.5 w-3.5 text-white" />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>

          {/* Username editing */}
          {editingUsername ? (
            <div className="flex items-center gap-2 mb-1">
              <Input value={newUsername} onChange={e => setNewUsername(e.target.value)}
                placeholder="New username" className="h-8 text-sm w-36" autoFocus
                onKeyDown={e => { if (e.key === 'Enter') saveUsername(); if (e.key === 'Escape') setEditingUsername(false); }}
              />
              <Button size="icon" className="h-8 w-8" onClick={saveUsername} disabled={savingUsername}>
                {savingUsername ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingUsername(false)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 mb-1">
              <h1 className="text-lg font-black">{displayName}</h1>
              <button onClick={() => { setNewUsername(displayName); setEditingUsername(true); }}>
                <Pencil className="h-3.5 w-3.5 text-muted-foreground hover:text-primary transition-colors" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-2 mb-3">
            <Badge className={cn('text-xs', getRankColor(currentRank))}>{currentRank}</Badge>
            {profile?.location_state && <span className="text-xs text-muted-foreground">{profile.location_state}</span>}
          </div>

          <div className="flex items-center gap-4 text-xs">
            <Link to="/earnings" className="text-primary flex items-center gap-1 font-semibold">
              <TrendingUp className="h-3.5 w-3.5" /> Earnings
            </Link>
            {profile?.role === 'admin' && (
              <Link to="/admin" className="text-primary flex items-center gap-1 font-semibold bg-primary/10 px-2 py-1 rounded-md">
                <Shield className="h-3.5 w-3.5" /> Admin
              </Link>
            )}
            <button onClick={() => { signOut(); navigate('/'); }} className="text-destructive flex items-center gap-1 font-semibold">
              <LogOut className="h-3.5 w-3.5" /> Sign Out
            </button>
          </div>
        </div>

        {/* XP Progress */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold">XP Progress</span>
              <span className="text-xs text-muted-foreground">{xpPoints} / {nextRankXP} XP</span>
            </div>
            <Progress value={progress} className="h-2.5" />
            <p className="text-xs text-muted-foreground mt-1.5">{Math.max(0, nextRankXP - xpPoints)} XP to next rank</p>
          </CardContent>
        </Card>

        <div className="mb-4"><GlobalCoinPool /></div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          {[
            { icon: Flame, value: streakDays, label: 'Streak', color: 'text-orange-500' },
            { icon: BookOpen, value: postsRead, label: 'Read', color: 'text-primary' },
            { icon: Star, value: xpPoints, label: 'XP', color: 'text-primary' },
            { icon: Coins, value: userCoins, label: 'Coins', color: 'text-accent' },
          ].map(({ icon: Icon, value, label, color }) => (
            <Card key={label}>
              <CardContent className="p-2.5 flex flex-col items-center gap-0.5">
                <Icon className={cn('h-4 w-4', color)} />
                <span className="text-base font-bold">{value}</span>
                <span className="text-[9px] text-muted-foreground">{label}</span>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Live Leaderboard */}
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="h-4 w-4 text-primary" />
            <h2 className="font-bold text-sm">Top Earners</h2>
          </div>
          <Card>
            <CardContent className="p-0">
              {lbLoading ? (
                <div className="p-3 space-y-3">
                  {[1,2,3].map(i => <Skeleton key={i} className="h-9 rounded-lg" />)}
                </div>
              ) : leaderboard.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">Leaderboard loading…</p>
              ) : leaderboard.map((entry: any, i: number) => (
                <div key={entry.id} className={cn('flex items-center gap-3 px-4 py-2.5', i !== leaderboard.length - 1 && 'border-b border-border')}>
                  <span className={cn('w-6 text-center font-black text-sm', i < 3 ? 'text-primary' : 'text-muted-foreground')}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                  </span>
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={entry.avatar_url} />
                    <AvatarFallback className="text-[10px]">{entry.username?.[0] || '?'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{entry.username}</p>
                    <p className="text-[10px] text-muted-foreground">{entry.location_state || 'Nigeria'}</p>
                  </div>
                  <span className="text-xs font-bold text-primary">{entry.xp_points} XP</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        {/* Saved Posts */}
        {savedPostsData.length > 0 && (
          <section>
            <h2 className="font-bold text-sm mb-3">Saved Posts ({savedPostsData.length})</h2>
            <div className="flex flex-col gap-3">
              {savedPostsData.map(post => <PostCard key={post.id} post={post} />)}
            </div>
          </section>
        )}
      </div>
    </AppLayout>
  );
}
