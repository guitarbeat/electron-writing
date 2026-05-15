import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTracker } from './hooks/useTracker';
import { PasscodeScreen } from './components/PasscodeScreen';
import { Dashboard } from './features/dashboard/Dashboard';

export default function App() {
  const { isAuthorized, isLoading, login } = useTracker();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-paper flex items-center justify-center">
        <div className="text-display text-2xl animate-pulse">Initializing...</div>
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
