import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  rotation: number;
  scale: number;
}

const COLORS = ['#008751', '#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: (Math.random() - 0.5) * 300,
    y: -(Math.random() * 400 + 100),
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    rotation: Math.random() * 720 - 360,
    scale: Math.random() * 0.8 + 0.4,
  }));
}

interface StreakConfettiProps {
  trigger: boolean;
  streakDays: number;
  onComplete: () => void;
}

export function StreakConfetti({ trigger, streakDays, onComplete }: StreakConfettiProps) {
  const [particles] = useState(() => generateParticles(40));

  useEffect(() => {
    if (trigger) {
      const t = setTimeout(onComplete, 3000);
      return () => clearTimeout(t);
    }
  }, [trigger, onComplete]);

  return (
    <AnimatePresence>
      {trigger && (
        <motion.div
          className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Central message */}
          <motion.div
            className="relative z-10 bg-card border-2 border-primary rounded-2xl px-8 py-5 shadow-2xl text-center"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <motion.div
              className="text-5xl mb-2"
              animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
              transition={{ duration: 0.6, repeat: 2 }}
            >
              🔥
            </motion.div>
            <p className="text-2xl font-black text-foreground">{streakDays} Day Streak!</p>
            <p className="text-sm text-muted-foreground mt-1">Keep it going, Oga! 💪</p>
          </motion.div>

          {/* Confetti particles */}
          <div className="absolute inset-0 overflow-hidden">
            {particles.map(p => (
              <motion.div
                key={p.id}
                className="absolute left-1/2 top-1/2 w-3 h-3 rounded-sm"
                style={{ backgroundColor: p.color, originX: 0.5, originY: 0.5 }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 0, rotate: 0 }}
                animate={{
                  x: p.x,
                  y: p.y,
                  opacity: [1, 1, 0],
                  scale: [0, p.scale, p.scale * 0.5],
                  rotate: p.rotation,
                }}
                transition={{ duration: 2.5, ease: 'easeOut' }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
