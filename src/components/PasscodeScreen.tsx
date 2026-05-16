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

  const revealedPasscode = import.meta.env.VITE_PASSCODE;


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
        className="sticker-card p-10 max-w-md w-full bg-bg-surface flex flex-col items-center gap-8"
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
              type="password"
              placeholder="Enter shared passcode..."
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              className={`input-playful w-full text-center text-2xl tracking-widest ${error ? 'border-red-500 animate-shake' : ''}`}
              autoFocus
            />
            {error && (
              <p className="text-red-500 text-xs font-black uppercase mt-2 text-center tracking-tighter">
                {attempts >= 3 && revealedPasscode 
                  ? `Hint: The passcode is ${revealedPasscode}` 
                  : 'Oops! Incorrect passcode.'}
              </p>
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
