import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Gift, CheckCircle2, Coins, Star } from 'lucide-react';
import { useMissions } from '@/contexts/MissionsContext';
import { useGamification } from '@/contexts/GamificationContext';
import { useCoins } from '@/contexts/CoinContext';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

export function DailyMissions() {
  const [open, setOpen] = useState(false);
  const { missions, allCompleted, claimMission } = useMissions();
  const { addXP } = useGamification();
  const { earnCoins } = useCoins();

  const completedCount = missions.filter(m => m.completed).length;
  const claimedCount = missions.filter(m => m.claimed).length;
  const unclaimedCompleted = missions.filter(m => m.completed && !m.claimed).length;

  const handleClaim = async (id: string) => {
    const reward = claimMission(id);
    if (!reward) return;
    addXP(reward.xp, 'Daily mission completed! 🎯');
    await earnCoins(reward.coins, 'bonus', 'Mission reward');
    toast({
      title: '🎯 Mission Complete!',
      description: `+${reward.xp} XP & +${reward.coins} Coins claimed!`,
    });
  };

  return (
    <div className="mb-5 rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
      {/* Header — always visible */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <Gift className={cn('h-5 w-5', unclaimedCompleted > 0 ? 'text-primary animate-bounce' : 'text-muted-foreground')} />
          <div>
            <span className="text-sm font-black text-foreground">Daily Missions</span>
            {unclaimedCompleted > 0 && (
              <span className="ml-2 text-[10px] font-bold bg-primary text-primary-foreground rounded-full px-1.5 py-0.5">
                {unclaimedCompleted} ready!
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium">{completedCount}/{missions.length}</span>
          {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {/* Progress bar strip */}
      <div className="px-4 pb-2">
        <Progress value={(completedCount / missions.length) * 100} className="h-1.5" />
      </div>

      {/* Expanded mission list */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 space-y-3">
              {missions.map(mission => (
                <motion.div
                  key={mission.id}
                  layout
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-xl border transition-all',
                    mission.claimed
                      ? 'border-border bg-muted/30 opacity-60'
                      : mission.completed
                      ? 'border-primary/40 bg-primary/5'
                      : 'border-border bg-background'
                  )}
                >
                  <span className="text-xl flex-shrink-0">{mission.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={cn(
                        'text-xs font-bold',
                        mission.claimed ? 'text-muted-foreground line-through' : 'text-foreground'
                      )}>
                        {mission.title}
                      </span>
                      {mission.claimed && <CheckCircle2 className="h-3 w-3 text-primary" />}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{mission.description}</p>
                    {!mission.claimed && (
                      <div className="mt-1.5">
                        <Progress value={(mission.current / mission.target) * 100} className="h-1" />
                        <span className="text-[10px] text-muted-foreground mt-0.5 block">
                          {mission.current}/{mission.target}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Star className="h-3 w-3 text-primary" />
                      <span>+{mission.xpReward}</span>
                      <Coins className="h-3 w-3 text-amber-500 ml-0.5" />
                      <span>+{mission.coinReward}</span>
                    </div>
                    {mission.completed && !mission.claimed && (
                      <Button
                        size="sm"
                        className="h-6 text-[10px] px-2 font-bold"
                        onClick={() => handleClaim(mission.id)}
                      >
                        Claim!
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}

              {allCompleted && claimedCount === missions.length && (
                <div className="text-center py-2">
                  <p className="text-xs font-bold text-primary">🎉 All missions done! Come back tomorrow.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
