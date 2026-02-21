import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react';
import { getRank, type Rank } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface XPEvent {
  id: string;
  amount: number;
  reason: string;
  timestamp: number;
}

interface GamificationState {
  xpPoints: number;
  currentRank: Rank;
  streakDays: number;
  postsRead: number;
  savedPosts: string[];
  isGuest: boolean;
  shadowWalletXP: number;
  recentXPEvents: XPEvent[];
}

interface GamificationContextType extends GamificationState {
  addXP: (amount: number, reason: string) => void;
  toggleSavePost: (postId: string) => void;
  markPostRead: (postId: string) => void;
  dismissXPEvent: (id: string) => void;
}

const GamificationContext = createContext<GamificationContextType | null>(null);

export function GamificationProvider({ children }: { children: ReactNode }) {
  const { user, profile, isGuest, refreshProfile } = useAuth();

  const [state, setState] = useState<GamificationState>({
    xpPoints: 0,
    currentRank: 'JJC',
    streakDays: 0,
    postsRead: 0,
    savedPosts: [],
    isGuest: true,
    shadowWalletXP: 0,
    recentXPEvents: [],
  });

  // Keep a ref to user so callbacks don't go stale
  const userRef = useRef(user);
  useEffect(() => { userRef.current = user; }, [user]);

  // Sync from profile
  useEffect(() => {
    if (profile) {
      setState(prev => ({
        ...prev,
        xpPoints: profile.xp_points,
        currentRank: profile.current_rank as Rank,
        streakDays: profile.streak_days,
        postsRead: profile.posts_read,
        savedPosts: profile.saved_posts || [],
        isGuest: false,
      }));
    } else {
      setState(prev => ({ ...prev, isGuest: true }));
    }
  }, [profile]);

  // FIX: addXP no longer depends on `user` — it reads from userRef to avoid
  // markPostRead becoming stale every time user changes.
  const addXP = useCallback((amount: number, reason: string) => {
    const event: XPEvent = { id: crypto.randomUUID(), amount, reason, timestamp: Date.now() };

    setState(prev => {
      const newXP = prev.xpPoints + amount;
      const shadowXP = prev.isGuest ? prev.shadowWalletXP + amount : prev.shadowWalletXP;
      return {
        ...prev,
        xpPoints: newXP,
        currentRank: getRank(newXP),
        shadowWalletXP: shadowXP,
        recentXPEvents: [event, ...prev.recentXPEvents].slice(0, 5),
      };
    });

    // Persist to DB if logged in — read from ref, not closure
    if (userRef.current) {
      supabase.rpc('add_xp', { p_user_id: userRef.current.id, p_amount: amount });
    }
  }, []); // ← stable: no deps, reads user via ref

  const toggleSavePost = useCallback(async (postId: string) => {
    setState(prev => {
      const newSaved = prev.savedPosts.includes(postId)
        ? prev.savedPosts.filter(id => id !== postId)
        : [...prev.savedPosts, postId];
      if (userRef.current) {
        supabase.from('profiles').update({ saved_posts: newSaved }).eq('id', userRef.current.id).then();
      }
      return { ...prev, savedPosts: newSaved };
    });
  }, []); // ← stable

  // FIX: markPostRead is now stable — both it and addXP are stable callbacks
  const markPostRead = useCallback((postId: string) => {
    setState(prev => {
      const newCount = prev.postsRead + 1;
      if (userRef.current) {
        supabase.from('profiles').update({ posts_read: newCount }).eq('id', userRef.current.id).then();
      }
      return { ...prev, postsRead: newCount };
    });
    addXP(5, 'Deep read completed');
  }, [addXP]); // addXP is now stable so this never re-creates needlessly

  const dismissXPEvent = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      recentXPEvents: prev.recentXPEvents.filter(e => e.id !== id),
    }));
  }, []);

  return (
    <GamificationContext.Provider value={{ ...state, addXP, toggleSavePost, markPostRead, dismissXPEvent }}>
      {children}
    </GamificationContext.Provider>
  );
}

export function useGamification() {
  const ctx = useContext(GamificationContext);
  if (!ctx) throw new Error('useGamification must be used within GamificationProvider');
  return ctx;
}
