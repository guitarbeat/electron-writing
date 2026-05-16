import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTracker } from './hooks/useTracker';
import { PasscodeScreen } from './components/PasscodeScreen';
import { Dashboard } from './features/dashboard/Dashboard';
import { Analytics } from "@vercel/analytics/react"

export default function App() {
  const tracker = useTracker();
  const { isAuthorized, isLoading, login } = tracker;
  
  const isLocal = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  return (
    <>
      {import.meta.env.PROD && !isLocal && <Analytics />}
      {isLoading ? (
        <div className="min-h-screen bg-bg-paper flex items-center justify-center flex-col gap-4">
          <img
            src="/smeemo.png"
            alt="Smeemo"
            className="h-20 w-20 rounded-full border-4 border-ink object-cover shadow-sticker"
          />
          <div className="text-display text-2xl animate-pulse">Smeemo</div>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {isAuthorized ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Dashboard tracker={tracker} />
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
      )}
    </>
  );
}
