import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster } from 'sonner';
import { useTracker } from './hooks/useTracker';
import { PasscodeScreen } from './components/PasscodeScreen';
import { Dashboard } from './features/dashboard/Dashboard';
import '@khmyznikov/pwa-install';

export default function App() {
  const tracker = useTracker();
  const { isAuthorized, isLoading, login, checkSession } = tracker;
  
  // Allow bypassing via environment variable or URL parameter
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const shouldBypassAuth = 
    (import.meta.env.DEV && (typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname))) ||
    import.meta.env.VITE_BYPASS_PASSCODE === 'true' ||
    urlParams.get('bypass') === 'true';

  const effectivelyAuthorized = shouldBypassAuth || isAuthorized;

  return (
    <>
      <Toaster position="top-center" richColors theme="light" />
      <pwa-install
        manifest-url="/manifest.json"
        styles={{ '--tint-color': '#ff4d8d' }}
      ></pwa-install>
      {isLoading && !shouldBypassAuth ? (
        <div className="min-h-screen bg-bg-paper bg-[url('https://www.transparenttextures.com/patterns/felt.png')] flex items-center justify-center flex-col gap-4">
          <img
            src="/smeemo.png"
            alt="Smeemo"
            className="object-cover spiky-effect"
            style={{ '--s': '80px' } as React.CSSProperties}
            referrerPolicy="no-referrer"
          />
          <div className="text-display text-2xl animate-pulse">Smeemo</div>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {effectivelyAuthorized ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -12, filter: "blur(4px)", transition: { duration: 0.15, ease: "easeIn" } }}
              transition={{ type: "spring", duration: 0.4, bounce: 0 }}
            >
              <Dashboard tracker={tracker} />
            </motion.div>
          ) : (
            <motion.div
              key="passcode"
              initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -12, filter: "blur(4px)", transition: { duration: 0.15, ease: "easeIn" } }}
              transition={{ type: "spring", duration: 0.4, bounce: 0 }}
            >
              <PasscodeScreen onLogin={login} onBypassSuccess={checkSession} />
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </>
  );
}
