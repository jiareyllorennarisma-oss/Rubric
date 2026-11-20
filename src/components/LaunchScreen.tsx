import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface LaunchScreenProps {
  onComplete: () => void;
}

export const LaunchScreen: React.FC<LaunchScreenProps> = ({ onComplete }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const holdDuration = prefersReducedMotion ? 220 : 1050;
    const exitDuration = prefersReducedMotion ? 50 : 380;

    const timer = window.setTimeout(() => {
      setVisible(false);
      window.setTimeout(onComplete, exitDuration);
    }, holdDuration);

    return () => window.clearTimeout(timer);
  }, [onComplete]);

  const handleDismiss = () => {
    setVisible(false);
    window.setTimeout(onComplete, 180);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
          onClick={handleDismiss}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0B090A] px-6 text-center cursor-pointer select-none"
          aria-label="Rubric Launch Screen"
        >
          {/* Ambient radial deep burgundy warmth behind center emblem */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at 50% 42%, rgba(75, 20, 36, 0.42) 0%, rgba(28, 8, 15, 0.18) 42%, rgba(11, 9, 10, 0) 72%)',
            }}
          />

          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex flex-col items-center"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-[#D4AF37]/35 bg-[#240B12] shadow-2xl">
              <img
                src="/icon.svg"
                alt="Rubric emblem"
                className="h-14 w-14 rounded-xl"
                referrerPolicy="no-referrer"
              />
            </div>

            <h1 className="mt-6 font-editorial text-4xl font-semibold tracking-tight text-[#F5EFE6]">
              Rubric
            </h1>

            <div className="mt-3 h-px w-12 bg-[#D4AF37]/50" />

            <p className="mt-3 text-xs tracking-wide text-[#B8A9A3]">
              Quiet pages, kept locally
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
