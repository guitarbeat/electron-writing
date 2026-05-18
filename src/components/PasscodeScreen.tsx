import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Lock, Info } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface PasscodeScreenProps {
  onLogin: (passcode: string) => Promise<boolean>;
  onBypassSuccess: () => Promise<boolean>;
}

export function PasscodeScreen({ onLogin, onBypassSuccess }: PasscodeScreenProps) {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isBypassing, setIsBypassing] = useState(false);
  
  const [recentVisit, setRecentVisit] = useState<{ ip?: string, time?: string, device?: string } | null>(null);

  useEffect(() => {
    fetch('/api/session/recent')
      .then(res => res.json())
      .then(data => {
        if (data.lastVisitTime) {
          setRecentVisit({
            ip: data.lastVisitIp,
            time: data.lastVisitTime,
            device: data.lastVisitDevice
          });
        }
      })
      .catch(() => console.error("Could not fetch recent visit"));
  }, []);

  // Consolidated check for whether input should be disabled
  const isInputDisabled = isLoading || isBypassing;

  // After 3 failed attempts, Smeemo (the cat) lets you through
  useEffect(() => {
    if (attempts < 3 || isInputDisabled) return;

    console.log('[v0] PasscodeScreen: Bypass triggered', { attempts });
    let cancelled = false;

    const triggerBypass = async () => {
      setIsBypassing(true);
      setError(false);
      setPasscode('');

      // Try to fetch a hint from the server to show while bypassing
      let fetchedHint = '';
      try {
        const response = await fetch('/api/passcode/helper');
        if (!response.ok) {
          console.warn('[PasscodeScreen] Hint fetch failed', response.status);
          fetchedHint = '5947'; // fallback
        } else {
          const data = await response.json();
          if (data.hint) {
            fetchedHint = data.hint;
          }
        }
      } catch (err) {
        console.error('[PasscodeScreen] Hint fetch error', err);
        fetchedHint = '5947'; // fallback
      }

      const characters = fetchedHint.split('');
      let currentPasscode = '';

      for (let i = 0; i < characters.length; i++) {
        if (cancelled) return;
        await new Promise((r) => setTimeout(r, 400));
        currentPasscode += characters[i];
        setPasscode(currentPasscode);
      }

      if (cancelled) return;
      await new Promise((r) => setTimeout(r, 600));

      // Attempt the login with the "typed" passcode
      if (cancelled) return;
      try {
        const success = await onLogin(currentPasscode);
        if (success && !cancelled) {
          setAttempts(0);
          return;
        }
      } catch (err) {
        console.error('[PasscodeScreen] Bypass login error', err);
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
    const trimmedPasscode = passcode.trim();
    
    if (!trimmedPasscode || isInputDisabled) {
      return;
    }
    
    setIsLoading(true);
    setError(false);
    
    try {
      const success = await onLogin(trimmedPasscode);
      if (!success) {
        setError(true);
        setPasscode('');
        setAttempts((prev) => prev + 1);
      } else {
        setAttempts(0);
      }
    } catch (err) {
      console.error('[PasscodeScreen] Login error', err);
      setError(true);
      setPasscode('');
    } finally {
      setIsLoading(false);
    }
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
              maxLength={4}
              placeholder="Enter shared passcode..."
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              className={`input-playful w-full text-center text-lg sm:text-2xl tracking-wider sm:tracking-widest ${error ? 'border-red-500 animate-shake' : ''}`}
              autoFocus
              disabled={isInputDisabled}
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
                Smeemo is letting you in...
              </motion.p>
            )}
          </div>

          <button
            type="submit"
            disabled={isInputDisabled || !passcode}
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

        {recentVisit && (
          <div className="w-full mt-2 text-center pt-6 border-t-2 border-ink/10">
            <div className="inline-flex items-center justify-center w-full gap-1.5 text-ink-muted text-xs font-black uppercase mb-3">
              <Info className="w-3 h-3" /> Last Successful Unlock
            </div>
            <div className="flex flex-col gap-1 text-ink bg-white/50 px-4 py-3 rounded-xl border-2 border-ink/10 shadow-sm text-sm">
              <p className="font-bold">{format(parseISO(recentVisit.time!), 'MMM d, yyyy \u00B7 h:mm a')}</p>
              {recentVisit.ip && <p className="text-xs font-mono opacity-80 mt-1">IP: {recentVisit.ip}</p>}
              {recentVisit.device && <p className="text-[10px] sm:text-xs opacity-60 mt-1 truncate max-w-full" title={recentVisit.device}>{recentVisit.device.split(' ').slice(0, 5).join(' ')}...</p>}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
