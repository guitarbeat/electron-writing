import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock } from 'lucide-react';

interface PasscodeScreenProps {
  onLogin: (passcode: string) => Promise<boolean>;
}

export function PasscodeScreen({ onLogin }: PasscodeScreenProps) {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isTyping, setIsTyping] = useState(false);

  const revealedPasscode = (import.meta.env.VITE_PASSCODE || '0000').toString().trim();

  React.useEffect(() => {
    // Only trigger if we have a valid-looking passcode and enough attempts
    if (attempts >= 3 && revealedPasscode.length > 0 && !isLoading && !isTyping) {
      setIsTyping(true);
      setError(false);
      let i = 0;
      setPasscode('');
      
      console.log('SMEEMO_HELPER: Starting auto-type animation...');
      
      const interval = setInterval(() => {
        setPasscode(revealedPasscode.slice(0, i + 1));
        i++;
        if (i >= revealedPasscode.length) {
          clearInterval(interval);
          setTimeout(async () => {
            setIsLoading(true);
            console.log('SMEEMO_HELPER: Attempting auto-login...');
            const success = await onLogin(revealedPasscode);
            if (success) {
              setAttempts(0);
            } else {
              setAttempts(0); // Reset to prevent infinite loop
              setError(true);
              console.error('SMEEMO_HELPER: Auto-login failed. Sync issue?');
            }
            setIsLoading(false);
            setIsTyping(false);
          }, 600); // Slightly longer delay for natural feel
        }
      }, 150);
      
      return () => clearInterval(interval);
    }
  }, [attempts, revealedPasscode, isLoading, isTyping, onLogin]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(false);
    const success = await onLogin(passcode);
    if (!success) {
      setError(true);
      setPasscode('');
      setAttempts(prev => prev + 1);
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
          <p className="text-ink-muted font-bold italic">Aaron & Electra's private writing nook</p>
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
              className={`input-playful w-full text-center text-2xl tracking-widest ${error ? 'border-red-500 animate-shake' : ''}`}
              autoFocus
              aria-label="Shared passcode"
            />
            {error && !isTyping && (
              <p className="text-red-500 text-xs font-black uppercase mt-2 text-center tracking-tighter">
                Oops! Incorrect passcode.
              </p>
            )}
            {isTyping && (
              <div className="flex flex-col items-center gap-1 mt-2">
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-primary text-[10px] font-black uppercase text-center tracking-tighter"
                >
                  Smeemo is helping you out... ✨
                </motion.p>
                <p className="text-[8px] font-bold italic text-ink/30 uppercase">
                  (Helper only knows original factory passcode)
                </p>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || !passcode}
            className="button-playful w-full bg-primary flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {isLoading ? 'Verifying...' : (
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
