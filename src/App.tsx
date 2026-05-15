import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTracker } from './hooks/useTracker';
import { PasscodeScreen } from './components/PasscodeScreen';
import { Dashboard } from './features/dashboard/Dashboard';

export default function App() {
  const { isAuthorized, isLoading, login } = useTracker();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-paper flex items-center justify-center flex-col gap-4">
        <div className="text-display text-2xl animate-pulse">Waking up Smeemo...</div>
        <p className="text-[10px] font-black uppercase text-ink/40 tracking-widest text-center max-w-xs">
          The database server is spinning up. This can take a few seconds if it hasn't been used in a while.
        </p>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {isAuthorized ? (
        <motion.div
           key="dashboard"
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
        >
          <Dashboard />
        </motion.div>
      ) : (
        <motion.div
           key="passcode"
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
        >
          <PasscodeScreen onLogin={login} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
