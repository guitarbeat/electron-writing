import React from "react";
import { cn } from "../../lib/utils";

export function LongPressColorArea({ color, onColorChange, children, className, style }: any) {
  const colorInputRef = React.useRef<HTMLInputElement>(null);
  const timerRef = React.useRef<any>(null);

  const startPress = React.useCallback((e: React.SyntheticEvent) => {
    if (!onColorChange) return;
    timerRef.current = setTimeout(() => {
      if (colorInputRef.current) {
         colorInputRef.current.style.pointerEvents = 'auto';
         colorInputRef.current.click();
      }
    }, 500);
  }, [onColorChange]);

  const endPress = React.useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return (
    <div 
       className={cn("relative group", className)} 
       style={style}
       onMouseDown={startPress}
       onMouseUp={endPress}
       onMouseLeave={endPress}
       onTouchStart={startPress}
       onTouchEnd={endPress}
       onContextMenu={(e) => {
           if (onColorChange) {
             e.preventDefault();
             if (colorInputRef.current) colorInputRef.current.click();
           }
       }}
    >
       {children}
       {onColorChange && (
          <>
            <input 
              ref={colorInputRef}
              type="color" 
              value={color || '#ffffff'}
              onChange={e => {
                  onColorChange(e.target.value);
                  if (colorInputRef.current) colorInputRef.current.style.pointerEvents = 'none';
              }}
              onBlur={() => {
                  if (colorInputRef.current) colorInputRef.current.style.pointerEvents = 'none';
              }}
              className="opacity-0 absolute w-full h-full inset-0 pointer-events-none"
            />
            <div className="absolute -bottom-2 right-2 text-[8px] font-black italic text-ink/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none uppercase bg-white/50 px-1 rounded">Hold for color</div>
          </>
       )}
    </div>
  );
}
