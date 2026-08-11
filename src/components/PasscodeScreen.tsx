import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Lock, Info, Sun, Moon, Delete, X, Check } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Settings } from '../types';

interface PasscodeScreenProps {
  onLogin: (passcode: string) => Promise<boolean>;
  onBypassSuccess: () => Promise<boolean>;
  theme?: 'light' | 'dark';
  updateSettings?: (newSettings: Partial<Settings>) => Promise<boolean | void>;
}

export function PasscodeScreen({ onLogin, onBypassSuccess, theme: propTheme, updateSettings }: PasscodeScreenProps) {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [showKeypad, setShowKeypad] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>(() => {
    if (propTheme) return propTheme;
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    if (propTheme) {
      setCurrentTheme(propTheme);
    }
  }, [propTheme]);

  const handleToggleTheme = () => {
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setCurrentTheme(nextTheme);
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
    localStorage.setItem('smeemo_theme', nextTheme);
    if (updateSettings) {
      updateSettings({ theme: nextTheme });
    }
  };
  
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

  const handleKeypadPress = (num: string) => {
    if (passcode.length < 4) {
      const nextCode = passcode + num;
      setPasscode(nextCode);
      setError(false);
      if (nextCode.length === 4) {
        setTimeout(() => {
          handleSubmitWithCode(nextCode);
        }, 250);
      }
    }
  };

  const handleKeypadBackspace = () => {
    setPasscode((prev) => prev.slice(0, -1));
    setError(false);
  };

  const handleKeypadClear = () => {
    setPasscode('');
    setError(false);
  };

  const handleSubmitWithCode = async (codeToSubmit: string) => {
    const trimmedPasscode = codeToSubmit.trim();
    if (!trimmedPasscode || isInputDisabled) return;

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
        setShowKeypad(false);
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

  // Keyboard support when keypad overlay is active
  useEffect(() => {
    if (!showKeypad) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isInputDisabled) return;
      if (e.key >= '0' && e.key <= '9') {
        handleKeypadPress(e.key);
      } else if (e.key === 'Backspace') {
        handleKeypadBackspace();
      } else if (e.key === 'Escape') {
        setShowKeypad(false);
      } else if (e.key === 'Enter') {
        if (passcode) {
          handleSubmitWithCode(passcode);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showKeypad, passcode, isInputDisabled]);

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
    <div className="min-h-screen bg-bg-paper bg-[url('https://www.transparenttextures.com/patterns/felt.png')] flex items-center justify-center p-6 relative">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="bg-bg-surface border-4 border-ink rounded-card shadow-sticker w-full max-w-[380px] sm:max-w-[420px] flex flex-col items-center justify-center p-6 sm:p-8 gap-3 sm:gap-4 relative my-auto overflow-hidden"
      >
        {/* Theme Toggle at the top-right corner of the panel */}
        <button
          type="button"
          onClick={handleToggleTheme}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 w-8 h-8 flex items-center justify-center bg-bg-paper hover:bg-bg-pop text-ink border-2 border-ink rounded-xl shadow-[2px_2px_0_var(--color-ink)] transition-colors cursor-pointer z-20 group"
          title={currentTheme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label="Toggle theme"
        >
          {currentTheme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400 fill-amber-400/20 stroke-[2.5] transition-transform duration-300 group-hover:rotate-45" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-600 dark:text-indigo-400 fill-indigo-600/20 stroke-[2.5] transition-transform duration-300 group-hover:-rotate-12" />
          )}
        </button>

        <motion.div variants={itemVariants} className="rotate-3 relative flex items-center justify-center my-1">
          <img
            src="/smeemo.png"
            alt="Smeemo"
            className="object-cover spiky-effect"
            style={{ '--s': '180px' } as React.CSSProperties}
            referrerPolicy="no-referrer"
          />
        </motion.div>

        <motion.div variants={itemVariants} className="text-center">
          <h1 
            className={`text-display text-3xl sm:text-4xl transition-colors text-ink ${easterEggState === 'spinning' ? 'smeemo-spinning' : easterEggState === 'settled' ? 'smeemo-settled' : ''}`}
            onMouseEnter={handleMouseEnterTitle}
            onMouseLeave={handleMouseLeaveTitle}
          >
            Smeemo
          </h1>
        </motion.div>

        <motion.div variants={itemVariants} className="w-full flex flex-col items-center gap-3 max-w-[280px]">
          <button
            type="button"
            onClick={() => setShowKeypad(true)}
            disabled={isInputDisabled}
            className="button-playful w-full bg-primary flex items-center justify-center gap-2 py-3.5 text-xs sm:text-sm font-bold cursor-pointer disabled:opacity-50"
          >
            {isLoading ? 'Verifying...' : isBypassing ? 'Opening...' : (
              <>
                <Lock className="w-4 h-4" />
                Unlock our desk
              </>
            )}
          </button>
        </motion.div>

        {/* Interactive Keypad Overlay */}
        {showKeypad && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", duration: 0.25, bounce: 0 }}
            className="absolute inset-0 bg-bg-surface z-30 p-4 sm:p-5 flex flex-col justify-between items-center"
          >
            <div className="w-full flex items-center justify-between pb-1.5 border-b-2 border-ink/10">
              <div className="flex items-center gap-2 text-ink font-extrabold text-xs uppercase tracking-wider">
                <Lock className="w-3.5 h-3.5 text-primary" />
                Keypad
              </div>
              <button
                type="button"
                onClick={() => setShowKeypad(false)}
                className="p-1.5 rounded-lg hover:bg-ink/10 text-ink transition-colors cursor-pointer"
                aria-label="Close Keypad"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Passcode Indicator Dots */}
            <div className="w-full my-0.5 flex flex-col items-center gap-1">
              <div className="flex items-center justify-center gap-3 py-2 px-5 bg-bg-paper border-2 border-ink rounded-xl shadow-inner min-w-[170px]">
                {[0, 1, 2, 3].map((index) => (
                  <div
                    key={index}
                    className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border-2 border-ink transition-colors duration-150 ${
                      passcode.length > index
                        ? 'bg-primary shadow-sm'
                        : 'bg-transparent opacity-30'
                    }`}
                  />
                ))}
              </div>
              {error && !isBypassing && (
                <p className="text-red-500 text-[10px] font-black uppercase text-center tracking-tighter">
                  Oops! Incorrect passcode.
                </p>
              )}
              {showHint && !isBypassing && (
                <button
                  type="button"
                  onClick={handleFillHint}
                  className="text-[11px] font-bold text-primary underline underline-offset-2 hover:text-primary-hover transition-colors inline-block mt-0.5"
                >
                  Need a hint? Smeemo can help.
                </button>
              )}
            </div>

            {/* 3x4 Grid Keypad */}
            <div className="grid grid-cols-3 gap-2 w-full max-w-[250px]">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleKeypadPress(digit)}
                  disabled={isInputDisabled}
                  className="h-10 sm:h-11 bg-bg-paper hover:bg-bg-pop active:bg-primary/20 text-ink font-black text-base sm:text-lg border-2 border-ink rounded-xl shadow-[2px_2px_0_var(--color-ink)] transition-colors cursor-pointer flex items-center justify-center select-none"
                >
                  {digit}
                </button>
              ))}

              <button
                type="button"
                onClick={handleKeypadClear}
                disabled={isInputDisabled || !passcode}
                className="h-10 sm:h-11 bg-amber-100 dark:bg-amber-950/50 hover:bg-amber-200 text-amber-900 dark:text-amber-200 font-bold text-[11px] uppercase tracking-wider border-2 border-ink rounded-xl shadow-[2px_2px_0_var(--color-ink)] transition-colors cursor-pointer flex items-center justify-center disabled:opacity-40"
              >
                Clear
              </button>

              <button
                type="button"
                onClick={() => handleKeypadPress('0')}
                disabled={isInputDisabled}
                className="h-10 sm:h-11 bg-bg-paper hover:bg-bg-pop active:bg-primary/20 text-ink font-black text-base sm:text-lg border-2 border-ink rounded-xl shadow-[2px_2px_0_var(--color-ink)] transition-colors cursor-pointer flex items-center justify-center select-none"
              >
                0
              </button>

              <button
                type="button"
                onClick={handleKeypadBackspace}
                disabled={isInputDisabled || !passcode}
                className="h-10 sm:h-11 bg-rose-100 dark:bg-rose-950/50 hover:bg-rose-200 text-rose-900 dark:text-rose-200 font-bold border-2 border-ink rounded-xl shadow-[2px_2px_0_var(--color-ink)] transition-colors cursor-pointer flex items-center justify-center disabled:opacity-40"
              >
                <Delete className="w-4 h-4" />
              </button>
            </div>

            {/* Bottom Unlock Button */}
            <button
              type="button"
              onClick={() => handleSubmitWithCode(passcode)}
              disabled={isInputDisabled || !passcode}
              className="button-playful w-full max-w-[250px] bg-primary flex items-center justify-center gap-2 py-2 sm:py-2.5 text-xs font-bold disabled:opacity-50"
            >
              {isLoading ? 'Verifying...' : (
                <>
                  <Check className="w-4 h-4" />
                  Unlock
                </>
              )}
            </button>
          </motion.div>
        )}
      </motion.div>

      {recentVisit && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 max-w-sm w-full px-4 text-center z-10 pointer-events-none"
        >
          <div className="flex flex-col gap-1 text-ink bg-bg-surface/90 backdrop-blur-sm px-4 py-2 rounded-xl border-2 border-ink/10 shadow-sm text-xs pointer-events-auto">
            <div className="inline-flex items-center justify-center gap-1.5 text-ink-muted text-[10px] font-black uppercase">
              <Info className="w-3 h-3" /> Last Unlock: {format(parseISO(recentVisit.time!), 'MMM d, yyyy \u00B7 h:mm a')}
            </div>
            {recentVisit.ip && <p className="text-[10px] font-mono opacity-70">IP: {recentVisit.ip}</p>}
          </div>
        </motion.div>
      )}
    </div>
  );
}

