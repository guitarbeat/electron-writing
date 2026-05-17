import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Lock } from 'lucide-react';

interface PasscodeScreenProps {
  onLogin: (passcode: string) => Promise<boolean>;
  onBypassSuccess: () => Promise<boolean>;
}

export function PasscodeScreen({ onLogin, onBypassSuccess }: PasscodeScreenProps) {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
<<<<<<< HEAD
  const [isBypassing, setIsBypassing] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  // After 3 failed attempts, Smeemo (the cat) lets you through
  useEffect(() => {
    if (attempts < 3 || isLoading || isBypassing) return;

    let cancelled = false;

    const triggerBypass = async () => {
      setIsBypassing(true);
      setError(false);
      setPasscode('');

      // Try to fetch a hint from the server to show while bypassing
      try {
        const response = await fetch('/api/passcode/helper');
        const data = await response.json();
        if (data.hint) {
          setHint(data.hint);
=======
  const [isTyping, setIsTyping] = useState(false);

  const [revealedPasscode, setRevealedPasscode] = useState((import.meta.env.VITE_PASSCODE || '0000').toString().trim());

  React.useEffect(() => {
    const triggerHelper = async () => {
      // Only trigger if we have enough attempts
      if (attempts >= 3 && !isLoading && !isTyping) {
        setIsTyping(true);
        setError(false);
        setPasscode('');

        let activePasscode = revealedPasscode;

        // Try to fetch the latest from the server
        try {
          const response = await fetch('/api/passcode/helper');
          const data = await response.json();
          if (data.passcode) {
            activePasscode = data.passcode.toString().trim();
            setRevealedPasscode(activePasscode);
          }
        } catch (err) {
          console.warn('SMEEMO_HELPER: Failed to fetch latest passcode, using local fallback.');
>>>>>>> origin/fix-test-timeouts-4864288518525717396
        }
      } catch (err) {
        console.warn('SMEEMO_BYPASS: Failed to fetch hint', err);
      }

<<<<<<< HEAD
      // Brief pause so the user sees the "Smeemo is helping" message
      await new Promise((r) => setTimeout(r, 2000));
      if (cancelled) return;

      try {
        const res = await fetch('/api/session/bypass', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ attempts }),
        });

        if (res.ok) {
          if (!cancelled) {
            // Re-check session in the parent to transition to the dashboard
            await onBypassSuccess();
            return;
=======
        console.log('SMEEMO_HELPER: Starting auto-type animation...');
        
        let i = 0;
        const interval = setInterval(() => {
          setPasscode(activePasscode.slice(0, i + 1));
          i++;
          if (i >= activePasscode.length) {
            clearInterval(interval);
            setTimeout(async () => {
              setIsLoading(true);
              console.log('SMEEMO_HELPER: Attempting auto-login...');
              const success = await onLogin(activePasscode);
              if (success) {
                setAttempts(0);
              } else {
                setAttempts(0); 
                setError(true);
                console.error('SMEEMO_HELPER: Auto-login failed. Sync issue?');
              }
              setIsLoading(false);
              setIsTyping(false);
            }, 600);
>>>>>>> origin/fix-test-timeouts-4864288518525717396
          }
        }
      } catch (err) {
        console.warn('SMEEMO_BYPASS: Failed to trigger bypass', err);
      }

      if (!cancelled) {
        setIsBypassing(false);
        setAttempts(0);
      }
    };

    triggerBypass();

    return () => {
      cancelled = true;
    };
  }, [attempts, isLoading, isBypassing, onBypassSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(false);
    const success = await onLogin(passcode);
    if (!success) {
      setError(true);
      setPasscode('');
      setAttempts((prev) => prev + 1);
    } else {
      setAttempts(0);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-bg-paper flex items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/felt.png')]">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="sticker-card p-6 sm:p-10 max-w-md w-full bg-bg-surface flex flex-col items-center gap-6 sm:gap-8"
      >
        <div className="w-24 h-24 rounded-full border-4 border-ink shadow-sticker rotate-3 overflow-hidden bg-bg-paper">
          <img
            src="/smeemo.png"
            alt="Smeemo"
            className="h-full w-full object-cover"
          />
        </div>

        <div className="text-center">
          <h1 className="text-display text-4xl mb-2">Smeemo</h1>
          <p className="text-ink-muted font-bold italic">{"Aaron & Electra's private writing nook"}</p>
        </div>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Enter shared passcode..."
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              className={`input-playful w-full text-center text-lg sm:text-2xl tracking-wider sm:tracking-widest ${error ? 'border-red-500 animate-shake' : ''}`}
              autoFocus
              disabled={isBypassing}
              aria-label="Shared passcode"
            />
            {error && !isBypassing && (
              <p className="text-red-500 text-xs font-black uppercase mt-2 text-center tracking-tighter">
                Oops! Incorrect passcode.
              </p>
            )}
            {isBypassing && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-primary text-[10px] font-black uppercase mt-2 text-center tracking-tighter"
              >
<<<<<<< HEAD
                {hint ? `Smeemo whispers: ${hint} ✨` : "Smeemo is letting you through... ✨"}
=======
                Smeemo is helping you out... ✨
>>>>>>> origin/fix-test-timeouts-4864288518525717396
              </motion.p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || !passcode || isBypassing}
            className="button-playful w-full bg-primary flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {isLoading ? 'Verifying...' : isBypassing ? 'Opening...' : (
              <>
                <Lock className="w-5 h-5" />
                Unlock our desk
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
