import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

export interface Mission {
  id: string;
  title: string;
  description: string;
  emoji: string;
  target: number;
  current: number;
  xpReward: number;
  coinReward: number;
  completed: boolean;
  claimed: boolean;
  type: 'read' | 'share' | 'comment' | 'react' | 'streak';
}

interface MissionsContextType {
  missions: Mission[];
  totalClaimedXP: number;
  totalClaimedCoins: number;
  allCompleted: boolean;
  incrementMission: (type: Mission['type'], amount?: number) => void;
  claimMission: (id: string) => { xp: number; coins: number } | null;
  resetIfNewDay: () => void;
}

const INITIAL_MISSIONS: Omit<Mission, 'current' | 'completed' | 'claimed'>[] = [
  {
    id: 'daily_read_3',
    title: 'Daily Reader',
    description: 'Read 3 posts today',
    emoji: '📖',
    target: 3,
    xpReward: 30,
    coinReward: 5,
    type: 'read',
  },
  {
    id: 'daily_share',
    title: 'Spread the Word',
    description: 'Share 1 post',
    emoji: '🔗',
    target: 1,
    xpReward: 20,
    coinReward: 4,
    type: 'share',
  },
  {
    id: 'daily_comment',
    title: 'Join the Conversation',
    description: 'Comment on 2 posts',
    emoji: '💬',
    target: 2,
    xpReward: 25,
    coinReward: 4,
    type: 'comment',
  },
  {
    id: 'daily_react',
    title: 'Show the Love',
    description: 'React to 5 posts',
    emoji: '🔥',
    target: 5,
    xpReward: 15,
    coinReward: 3,
    type: 'react',
  },
  {
    id: 'daily_streak',
    title: 'Streak Master',
    description: 'Log in for your daily streak',
    emoji: '🏆',
    target: 1,
    xpReward: 50,
    coinReward: 8,
    type: 'streak',
  },
];

const STORAGE_KEY = 'jara_missions';

function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

function loadState(): { missions: Mission[]; date: string } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return buildFresh();
    const parsed = JSON.parse(raw);
    if (parsed.date !== getTodayKey()) return buildFresh();
    return parsed;
  } catch {
    return buildFresh();
  }
}

function buildFresh() {
  return {
    date: getTodayKey(),
    missions: INITIAL_MISSIONS.map(m => ({ ...m, current: 0, completed: false, claimed: false })),
  };
}

const MissionsContext = createContext<MissionsContextType | null>(null);

export function MissionsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ missions: Mission[]; date: string }>(loadState);
  const [totalClaimedXP, setTotalClaimedXP] = useState(0);
  const [totalClaimedCoins, setTotalClaimedCoins] = useState(0);

  // Auto-complete the streak mission on load (visiting the app counts as logging in)
  useEffect(() => {
    setState(prev => ({
      ...prev,
      missions: prev.missions.map(m =>
        m.type === 'streak' && !m.completed
          ? { ...m, current: 1, completed: true }
          : m
      ),
    }));
  }, []);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const resetIfNewDay = useCallback(() => {
    if (state.date !== getTodayKey()) {
      setState(buildFresh());
      setTotalClaimedXP(0);
      setTotalClaimedCoins(0);
    }
  }, [state.date]);

  const incrementMission = useCallback((type: Mission['type'], amount = 1) => {
    setState(prev => ({
      ...prev,
      missions: prev.missions.map(m => {
        if (m.type !== type || m.completed) return m;
        const newCurrent = Math.min(m.current + amount, m.target);
        return { ...m, current: newCurrent, completed: newCurrent >= m.target };
      }),
    }));
  }, []);

  const claimMission = useCallback((id: string): { xp: number; coins: number } | null => {
    let reward: { xp: number; coins: number } | null = null;
    setState(prev => ({
      ...prev,
      missions: prev.missions.map(m => {
        if (m.id === id && m.completed && !m.claimed) {
          reward = { xp: m.xpReward, coins: m.coinReward };
          return { ...m, claimed: true };
        }
        return m;
      }),
    }));
    if (reward) {
      setTotalClaimedXP(p => p + (reward?.xp ?? 0));
      setTotalClaimedCoins(p => p + (reward?.coins ?? 0));
    }
    return reward;
  }, []);

  const allCompleted = state.missions.every(m => m.completed);

  return (
    <MissionsContext.Provider value={{
      missions: state.missions,
      totalClaimedXP,
      totalClaimedCoins,
      allCompleted,
      incrementMission,
      claimMission,
      resetIfNewDay,
    }}>
      {children}
    </MissionsContext.Provider>
  );
}

export function useMissions() {
  const ctx = useContext(MissionsContext);
  if (!ctx) throw new Error('useMissions must be used within MissionsProvider');
  return ctx;
}
