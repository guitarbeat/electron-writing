import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster } from 'sonner';
import { useTracker } from './hooks/useTracker';
import { PasscodeScreen } from './components/PasscodeScreen';
import { Dashboard } from './features/dashboard/Dashboard';
import '@khmyznikov/pwa-install';

export default function App() {
  const tracker = useTracker();
  const { isAuthorized, isLoading, login, checkSession, settings } = tracker;
  
  useEffect(() => {
    if (settings?.theme) {
      document.documentElement.classList.toggle('dark', settings.theme === 'dark');
    }
  }, [settings?.theme]);

  // Allow bypassing via environment variable or URL parameter
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const shouldBypassAuth = 
    (import.meta.env.DEV && (typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname))) ||
    import.meta.env.VITE_BYPASS_PASSCODE === 'true' ||
    urlParams.get('bypass') === 'true';

  const effectivelyAuthorized = shouldBypassAuth || isAuthorized;

  return (
    <>
      <Toaster 
        position="bottom-right" 
        theme={settings?.theme === 'dark' ? 'dark' : 'light'}
        toastOptions={{
          className: 'smeemo-toast',
          style: {
            fontFamily: 'var(--font-sans)',
            border: '3px solid var(--color-ink)',
            borderRadius: '20px',
            boxShadow: '4px 4px 0 var(--color-ink)',
            background: 'var(--color-bg-surface)',
            color: 'var(--color-ink)',
            fontWeight: 800,
            padding: '14px 18px',
            fontSize: '14px',
            letterSpacing: '0.02em',
          }
        }}
      />
      <pwa-install
        manifest-url="/manifest.json"
        styles={{ '--tint-color': '#ff4d8d' }}
      ></pwa-install>

      {/* Main Dashboard is rendered underneath */}
      <Dashboard tracker={tracker} />

      {/* Passcode Lock Overlay with backdrop blur when not authorized */}
      <AnimatePresence>
        {!effectivelyAuthorized && !isLoading && (
          <motion.div
            key="passcode-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.25, ease: "easeOut" } }}
            className="fixed inset-0 z-50 pointer-events-auto"
          >
            <PasscodeScreen
              onLogin={login}
              onBypassSuccess={checkSession}
              theme={settings?.theme}
              updateSettings={tracker.updateSettings}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
