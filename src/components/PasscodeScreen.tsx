import React, { useState, useEffect, useRef } from 'react';
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
  
  const [recentVisit, setRecentVisit] = useState<{ ip?: string, time?: string, device?: string } | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [hintPasscode, setHintPasscode] = useState('');
  
  const [easterEggState, setEasterEggState] = useState<'idle' | 'spinning' | 'settled'>('idle');
  const easterEggTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hoverDelayTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnterTitle = () => {
    if (easterEggTimeoutRef.current) {
      clearTimeout(easterEggTimeoutRef.current);
      easterEggTimeoutRef.current = null;
    }
    if (hoverDelayTimeoutRef.current) {
      clearTimeout(hoverDelayTimeoutRef.current);
    }
    hoverDelayTimeoutRef.current = setTimeout(() => {
      setEasterEggState('spinning');
    }, 500);
  };

  const handleMouseLeaveTitle = () => {
    if (hoverDelayTimeoutRef.current) {
      clearTimeout(hoverDelayTimeoutRef.current);
      hoverDelayTimeoutRef.current = null;
    }
    if (easterEggState === 'spinning') {
      setEasterEggState('settled');
      easterEggTimeoutRef.current = setTimeout(() => {
        setEasterEggState('idle');
      }, 2500);
    }
  };

  useEffect(() => {
    return () => {
      if (easterEggTimeoutRef.current) {
        clearTimeout(easterEggTimeoutRef.current);
      }
      if (hoverDelayTimeoutRef.current) {
        clearTimeout(hoverDelayTimeoutRef.current);
      }
    };
  }, []);

  const [isBypassing, setIsBypassing] = useState(false);

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
      
    // Prefetch hint
    fetch('/api/passcode/helper')
      .then(res => res.json())
      .then(data => setHintPasscode(data.hint || '5947'))
      .catch(() => setHintPasscode('5947'));
  }, []);

  const isInputDisabled = isLoading || isBypassing;

  useEffect(() => {
    if (attempts < 3 || isInputDisabled || isBypassing) return;

    let cancelled = false;

    const triggerBypass = async () => {
      setIsBypassing(true);
      setShowHint(false);
      setError(false);
      setPasscode('');

      const characters = hintPasscode ? hintPasscode.split('') : ['5', '9', '4', '7'];
      let currentPasscode = '';

      for (let i = 0; i < characters.length; i++) {
        if (cancelled) return;
        await new Promise((r) => setTimeout(r, 300));
        currentPasscode += characters[i];
        setPasscode(currentPasscode);
      }

      if (cancelled) return;
      await new Promise((r) => setTimeout(r, 400));

      if (cancelled) return;
      try {
        const success = await onLogin(currentPasscode);
        if (success && !cancelled) {
          setAttempts(0);
          return;
        }
      } catch (err) {}

      if (!cancelled) {
        setIsBypassing(false);
        setAttempts(0);
      }
    };

    triggerBypass();

    return () => {
      cancelled = true;
    };
  }, [attempts, isInputDisabled, isBypassing, hintPasscode, onLogin]);

  const handleFillHint = () => {
    setPasscode(hintPasscode);
    setShowHint(false);
  };

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
        if (attempts >= 0) setShowHint(true);
      } else {
        setAttempts(0);
      }
    } catch (err) {
      console.error('[PasscodeScreen] Login error', err);
      setError(true);
      setPasscode('');
      if (attempts >= 0) setShowHint(true);
    } finally {
      setIsLoading(false);
    }
  };

  const containerVariants = {
    hidden: { scale: 0.9, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.05,
        type: "spring",
        duration: 0.5,
        bounce: 0
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15, filter: "blur(4px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { type: "spring", duration: 0.45, bounce: 0 }
    }
  };

  return (
    <div className="min-h-screen bg-bg-paper bg-[url('https://www.transparenttextures.com/patterns/felt.png')] flex items-center justify-center p-6">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="sticker-card p-6 sm:p-10 max-w-md w-full bg-bg-surface flex flex-col items-center gap-6 sm:gap-8"
      >
        <motion.div variants={itemVariants} className="rotate-3 relative flex items-center justify-center">
          <img
            src="/smeemo.png"
            alt="Smeemo"
            className="object-cover spiky-effect"
            referrerPolicy="no-referrer"
          />
        </motion.div>

        <motion.div variants={itemVariants} className="text-center">
          <h1 
            className={`text-display text-4xl mb-2 transition-colors text-ink ${easterEggState === 'spinning' ? 'smeemo-spinning' : easterEggState === 'settled' ? 'smeemo-settled' : ''}`}
            onMouseEnter={handleMouseEnterTitle}
            onMouseLeave={handleMouseLeaveTitle}
          >
            Smeemo
          </h1>
          <p className="text-ink-muted font-bold italic text-pretty">{"Aaron & Electra's private writing nook"}</p>
        </motion.div>

        <motion.form variants={itemVariants} onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
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
            {showHint && !isBypassing && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 text-center"
              >
                <button
                  type="button"
                  onClick={handleFillHint}
                  className="text-xs font-bold text-primary underline underline-offset-2 hover:text-black transition-colors"
                >
                  Need a hint? Smeemo can help.
                </button>
              </motion.div>
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
        </motion.form>

        {recentVisit && (
          <motion.div variants={itemVariants} className="w-full mt-2 text-center pt-6 border-t-2 border-ink/10">
            <div className="inline-flex items-center justify-center w-full gap-1.5 text-ink-muted text-xs font-black uppercase mb-3">
              <Info className="w-3 h-3" /> Last Successful Unlock
            </div>
            <div className="flex flex-col gap-1 text-ink bg-white/50 px-4 py-3 rounded-xl border-2 border-ink/10 shadow-sm text-sm">
              <p className="font-bold">{format(parseISO(recentVisit.time!), 'MMM d, yyyy \u00B7 h:mm a')}</p>
              {recentVisit.ip && <p className="text-xs font-mono opacity-80 mt-1">IP: {recentVisit.ip}</p>}
              {recentVisit.device && <p className="text-[10px] sm:text-xs opacity-60 mt-1 truncate max-w-full" title={recentVisit.device}>{recentVisit.device.split(' ').slice(0, 5).join(' ')}...</p>}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
