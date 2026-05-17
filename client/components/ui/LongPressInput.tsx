import React, { useRef, useCallback } from 'react';
import { Palette } from 'lucide-react';

export function LongPressInput({ 
  value, 
  onChangeName, 
  color, 
  onChangeColor, 
  placeholder 
}: { 
  value: string; 
  onChangeName: (v: string) => void; 
  color: string; 
  onChangeColor: (c: string) => void; 
  placeholder: string;
}) {
  const colorInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<any>(null);

  const startPress = useCallback((e: React.SyntheticEvent) => {
    timerRef.current = setTimeout(() => {
      if (colorInputRef.current) {
         colorInputRef.current.style.pointerEvents = 'auto';
         colorInputRef.current.click();
      }
    }, 600);
  }, []);

  const endPress = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center w-full min-h-[112px] sticker-card border-4 bg-white px-4 py-5" style={{ borderColor: color }}>
      <input
        type="text"
        value={value}
        onChange={e => onChangeName(e.target.value)}
        onMouseDown={startPress}
        onMouseUp={endPress}
        onMouseLeave={endPress}
        onTouchStart={startPress}
        onTouchEnd={endPress}
        onContextMenu={(e) => {
           e.preventDefault();
           if (colorInputRef.current) colorInputRef.current.click();
        }}
        className="w-full border-none outline-none bg-transparent text-center font-black uppercase text-2xl tracking-wider"
        style={{ color: color }}
        placeholder={placeholder}
      />
      <button
        type="button"
        onClick={() => colorInputRef.current?.click()}
        className="mt-3 inline-flex items-center gap-2 border-2 border-ink bg-bg-paper px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-ink shadow-[2px_2px_0_var(--color-ink)] transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
        aria-label={`Change ${value || placeholder} color`}
      >
        <span className="w-3 h-3 border-2 border-ink" style={{ backgroundColor: color }} />
        <Palette className="w-3.5 h-3.5" />
        Color
      </button>
      <input 
        ref={colorInputRef}
        type="color" 
        value={color}
        onChange={e => {
            onChangeColor(e.target.value);
            if (colorInputRef.current) colorInputRef.current.style.pointerEvents = 'none';
        }}
        onBlur={() => {
            if (colorInputRef.current) colorInputRef.current.style.pointerEvents = 'none';
        }}
        className="opacity-0 absolute w-full h-full inset-0 pointer-events-none"
      />
    </div>
  );
}
