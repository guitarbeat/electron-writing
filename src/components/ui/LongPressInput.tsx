import React, { useRef, useCallback } from 'react';

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
    <div className="relative flex flex-col items-center justify-center w-full min-h-[100px] sticker-card border-4 bg-white" style={{ borderColor: color }}>
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
      <div className="text-[9px] font-bold italic opacity-40 uppercase mt-2 select-none pointer-events-none text-ink">Hold to change color</div>
    </div>
  );
}
