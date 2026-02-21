import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const TOTAL_COINS = 1_000_000;

interface CoinEvent {
  id: string;
  amount: number;
  reason: string;
  timestamp: number;
}

interface CoinState {
  userCoins: number;
  globalRemaining: number;
  totalCoins: number;
  recentCoinEvents: CoinEvent[];
}

interface CoinContextType extends CoinState {
  earnCoins: (baseReward: number, sourceType: string, reason: string, postId?: string) => Promise<number>;
  dismissCoinEvent: (id: string) => void;
  spendCoins: (amount: number, reason: string) => Promise<boolean>;
  refreshCoins: () => Promise<void>;
}

const CoinContext = createContext<CoinContextType | null>(null);

export function CoinProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();

  // Keep a ref to user so earnCoins/spendCoins don't go stale
  const userRef = useRef(user);
  useEffect(() => { userRef.current = user; }, [user]);

  const [state, setState] = useState<CoinState>({
    userCoins: 0,
    globalRemaining: TOTAL_COINS,
    totalCoins: TOTAL_COINS,
    recentCoinEvents: [],
  });

  const refreshCoins = useCallback(async () => {
    const { data: poolRes } = await supabase
      .from('coin_pool')
      .select('remaining, total_supply')
      .eq('id', 1)
      .maybeSingle();
    if (poolRes) {
      setState(prev => ({
        ...prev,
        globalRemaining: poolRes.remaining ?? prev.globalRemaining,
        totalCoins: poolRes.total_supply ?? prev.totalCoins,
      }));
    }
  }, []);

  useEffect(() => { refreshCoins(); }, [refreshCoins]);

  // Sync user coins from profile (source of truth after login)
  useEffect(() => {
    if (profile) {
      setState(prev => ({ ...prev, userCoins: profile.coins }));
    }
  }, [profile]);

  const earnCoins = useCallback(async (
    baseReward: number,
    sourceType: string,
    reason: string,
    postId?: string,
  ): Promise<number> => {
    const currentUser = userRef.current;
    if (!currentUser) {
      // Guest: local-only simulation
      const earned = Math.max(1, Math.min(5, baseReward));
      const event: CoinEvent = { id: crypto.randomUUID(), amount: earned, reason, timestamp: Date.now() };
      setState(prev => ({
        ...prev,
        userCoins: prev.userCoins + earned,
        recentCoinEvents: [event, ...prev.recentCoinEvents].slice(0, 5),
      }));
      return earned;
    }

    const idempotencyKey = `${currentUser.id}_${sourceType}_${postId || 'global'}`;
    const { data: earned, error } = await supabase.rpc('earn_coins', {
      p_user_id: currentUser.id,
      p_source_type: sourceType as any,
      p_base_reward: baseReward,
      p_post_id: postId || null,
      p_idempotency_key: idempotencyKey,
    });

    if (error) {
      console.error('earn_coins RPC error:', error.message);
      return 0;
    }
    if (!earned) return 0;

    const event: CoinEvent = { id: crypto.randomUUID(), amount: earned, reason, timestamp: Date.now() };
    setState(prev => ({
      ...prev,
      userCoins: prev.userCoins + earned,
      globalRemaining: Math.max(0, prev.globalRemaining - earned),
      recentCoinEvents: [event, ...prev.recentCoinEvents].slice(0, 5),
    }));
    return earned;
  }, []); // stable — reads user via ref

  // FIX: spendCoins no longer optimistically deducts.
  // It validates balance locally first, then delegates to the RPC caller.
  // The actual deduction happens inside tip_author / boost_post atomically.
  // After the RPC, we refreshCoins() to sync the real balance from the DB.
  const spendCoins = useCallback(async (amount: number, _reason: string): Promise<boolean> => {
    // Optimistic check only — don't mutate local state here.
    // The RPC (tip_author/boost_post) will handle the atomic deduction.
    // If the RPC fails, local state was never touched so it stays consistent.
    const currentUser = userRef.current;
    if (!currentUser) return false;

    // Read current balance from state snapshot via functional updater to be safe
    let hasEnough = false;
    setState(prev => {
      hasEnough = prev.userCoins >= amount;
      return prev; // no mutation
    });

    if (!hasEnough) return false;

    // Caller (TipDialog/BoostDialog) owns the actual RPC call.
    // After it succeeds, call refreshCoins() to pull the canonical balance.
    await refreshCoins();
    return true;
  }, [refreshCoins]);

  const dismissCoinEvent = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      recentCoinEvents: prev.recentCoinEvents.filter(e => e.id !== id),
    }));
  }, []);

  return (
    <CoinContext.Provider value={{ ...state, earnCoins, dismissCoinEvent, spendCoins, refreshCoins }}>
      {children}
    </CoinContext.Provider>
  );
}

export function useCoins() {
  const ctx = useContext(CoinContext);
  if (!ctx) throw new Error('useCoins must be used within CoinProvider');
  return ctx;
}
