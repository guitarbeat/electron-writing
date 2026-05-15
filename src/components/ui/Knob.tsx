import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'motion/react';

interface KnobProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  label?: string;
  unit?: string;
  color?: string;
}

export function Knob({ value, min, max, step = 1, onChange, label, unit, color = '#ff4d8d' }: KnobProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const lastAngleRef = useRef<number | null>(null);
  
  // Create 20 full rotations for the full range (7200 degrees total) for more precision
  const totalRotations = 20;
  const totalDegrees = 360 * totalRotations;
  
  // Display angle based on value
  const fraction = max === min ? 0 : Math.max(0, Math.min(1, (value - min) / (max - min)));
  const angle = fraction * totalDegrees;
  
  const handleMouseMove = (e: MouseEvent | TouchEvent) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    
    let rad = Math.atan2(dy, dx);
    let deg = (rad * 180) / Math.PI + 90; // Offset so 0 is top
    
    // Normalize deg to -180 to 180
    if (deg > 180) deg -= 360;
    
    if (lastAngleRef.current === null) {
      lastAngleRef.current = deg;
      return;
    }

    let delta = deg - lastAngleRef.current;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    
    lastAngleRef.current = deg;
    
    const valuePerDegree = (max - min) / totalDegrees;
    
    const newValue = value + delta * valuePerDegree;
    const steppedValue = Math.round(newValue / step) * step;
    
    if (steppedValue !== value) {
      onChange(Math.min(max, Math.max(min, steppedValue)));
    }
  };

  useEffect(() => {
    const up = () => {
      setIsDragging(false);
      lastAngleRef.current = null;
    };
    
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', up);
      window.addEventListener('touchmove', handleMouseMove);
      window.addEventListener('touchend', up);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', up);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', up);
    };
  }, [isDragging, value, min, max, step]); // Add dependencies so closure has fresh values

  const strokeDashoffsetValue = isNaN(fraction) ? 188.5 : 188.5 - fraction * (188.5 - 62.8);

  return (
    <div className="flex flex-col items-center gap-4">
      {label && <label className="text-[10px] font-black uppercase tracking-widest text-ink/40">{label}</label>}
      
      <div 
        ref={containerRef}
        className="relative w-32 h-32 cursor-pointer select-none group"
        onMouseDown={(e) => {
          setIsDragging(true);
        }}
        onTouchStart={(e) => {
          setIsDragging(true);
          // Don't prevent default here as it breaks touch
        }}
      >
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border-4 border-ink bg-white shadow-sticker group-hover:scale-105 transition-transform" />
        
        {/* Progress arc (simplified as a background glow or segments if needed, but let's keep it clean) */}
        <svg className="absolute inset-0 w-full h-full -rotate-[240deg]" viewBox="0 0 100 100">
           <circle 
              cx="50" cy="50" r="40" 
              fill="none" 
              stroke="rgba(43, 23, 32, 0.05)" 
              strokeWidth="8" 
              strokeDasharray="188.5"
              strokeDashoffset="62.8" // Approx 2/3 of circle
              strokeLinecap="round"
           />
           <motion.circle 
              cx="50" cy="50" r="40" 
              fill="none" 
              stroke={color} 
              strokeWidth="8" 
              strokeDasharray="188.5"
              initial={{ strokeDashoffset: strokeDashoffsetValue }}
              animate={{ strokeDashoffset: strokeDashoffsetValue }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              strokeLinecap="round"
           />
        </svg>

        {/* The Knob */}
        <motion.div 
          className="absolute inset-4 rounded-full border-4 border-ink bg-white shadow-[inset_0_4px_0_rgba(0,0,0,0.05)] flex items-center justify-center"
          animate={{ rotate: angle }}
          transition={isDragging ? { type: 'tween', duration: 0 } : { type: 'spring', stiffness: 300, damping: 25 }}
        >
           {/* Marker */}
           <div className="absolute top-2 w-2 h-4 bg-ink rounded-full" />
           
           {/* Value display */}
           <div className="flex flex-col items-center pointer-events-none" style={{ transform: `rotate(${-angle}deg)` }}>
              <span className="text-xl font-black font-mono leading-none flex tracking-tighter">
                 {value >= 1000 ? (value % 1000 === 0 ? `${value/1000}k` : `${(value/1000).toFixed(1)}k`) : value}
              </span>
              {unit && <span className="text-[8px] font-black uppercase opacity-30">{unit}</span>}
           </div>
        </motion.div>
      </div>
    </div>
  );
}
