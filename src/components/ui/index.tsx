import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  parseISO 
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

// ==========================================
// 1. Knob Component
// ==========================================

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
  
  // Fallbacks for NaN or undefined
  const safeValue = (value === undefined || Number.isNaN(value)) ? min : value;
  
  // Display angle based on value
  const fraction = max === min ? 0 : Math.max(0, Math.min(1, (safeValue - min) / (max - min)));
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
    
    const newValue = safeValue + delta * valuePerDegree;
    const steppedValue = Math.round(newValue / step) * step;
    
    if (steppedValue !== safeValue) {
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
        onMouseDown={() => {
          setIsDragging(true);
        }}
        onTouchStart={() => {
          setIsDragging(true);
        }}
      >
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border-4 border-ink bg-bg-surface shadow-sticker group-hover:border-primary group-hover:bg-primary/5 transition-colors duration-150" />
        
        {/* Progress arc */}
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
          className="absolute inset-4 rounded-full border-4 border-ink bg-bg-surface shadow-[inset_0_4px_0_rgba(0,0,0,0.05)] flex items-center justify-center"
          animate={{ rotate: angle }}
          transition={isDragging ? { type: 'tween', duration: 0 } : { type: 'spring', stiffness: 300, damping: 25 }}
        >
           {/* Marker */}
           <div className="absolute top-2 w-2 h-4 bg-ink rounded-full" />
           
           {/* Value display */}
           <div className="flex flex-col items-center pointer-events-none" style={{ transform: `rotate(${-angle}deg)` }}>
              <span className="text-xl font-black font-mono leading-none flex tracking-tighter">
                 {safeValue >= 1000 ? (safeValue % 1000 === 0 ? `${safeValue/1000}k` : `${(safeValue/1000).toFixed(1)}k`) : safeValue}
              </span>
              {unit && <span className="text-[8px] font-black uppercase opacity-30">{unit}</span>}
           </div>
        </motion.div>
      </div>
    </div>
  );
}

// ==========================================
// 2. CalendarPicker Component
// ==========================================

interface CalendarPickerProps {
  value: string; // ISO date string YYYY-MM-DD
  onChange: (date: string) => void;
  label?: string;
  color?: string;
}

export function CalendarPicker({ value, onChange, label, color = '#ff4d8d' }: CalendarPickerProps) {
  const selectedDate = value ? parseISO(value) : new Date();
  const [viewDate, setViewDate] = useState(selectedDate || new Date());
  
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(viewDate)),
    end: endOfWeek(endOfMonth(viewDate))
  });

  return (
    <div className="flex flex-col gap-4">
      {label && <label className="text-[10px] font-black uppercase tracking-widest text-ink/40 pl-1">{label}</label>}
      
      <div className="sticker-card bg-bg-surface p-3 sm:p-4 border-4 border-ink flex flex-col gap-4 w-full max-w-[320px] mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center px-2">
          <button 
            onClick={() => setViewDate(subMonths(viewDate, 1))}
            className="p-1 hover:bg-ink/5 rounded-lg transition-colors border-2 border-ink/10"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h4 className="text-sm font-black uppercase tracking-widest">
            {format(viewDate, 'MMMM yyyy')}
          </h4>
          <button 
            onClick={() => setViewDate(addMonths(viewDate, 1))}
            className="p-1 hover:bg-ink/5 rounded-lg transition-colors border-2 border-ink/10"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Grid Header */}
        <div className="grid grid-cols-7 gap-1">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
            <div key={i} className="text-center text-[10px] font-black opacity-30 py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, i) => {
            const isSelected = isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, viewDate);
            const isToday = isSameDay(day, new Date());
            
            return (
              <button
                key={i}
                onClick={() => onChange(format(day, 'yyyy-MM-dd'))}
                className={cn(
                  "aspect-square rounded-lg flex items-center justify-center text-xs font-black transition-[transform,background-color,border-color,color,box-shadow] duration-150 ease-out active:scale-[0.96] border-2",
                  !isCurrentMonth && "opacity-10",
                  isSelected 
                    ? "bg-ink text-white border-ink scale-110 shadow-sticker z-10" 
                    : isToday 
                       ? "border-primary text-primary" 
                       : "border-transparent hover:border-ink/20"
                )}
                style={isSelected ? { backgroundColor: color, borderColor: 'var(--color-ink)' } : {}}
              >
                {format(day, 'd')}
              </button>
            );
          })}
        </div>

        <div className="mt-2 text-center">
           <p className="text-[10px] font-black uppercase text-ink/30 italic">
             Selection: {format(selectedDate, 'MMM d, yyyy')}
           </p>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 3. UserSettingsInput Component
// ==========================================

interface UserSettingsInputProps {
  value: string;
  onChangeName: (v: string) => void;
  color: string;
  onChangeColor: (c: string) => void;
  placeholder: string;
}

export function UserSettingsInput({ 
  value, 
  onChangeName, 
  color, 
  onChangeColor, 
  placeholder 
}: UserSettingsInputProps) {
  return (
    <div className="flex flex-row items-center justify-between w-full sticker-card border-4 bg-bg-surface p-3 sm:p-4" style={{ borderColor: color }}>
      <input
        type="text"
        value={value}
        onChange={e => onChangeName(e.target.value)}
        className="flex-1 border-none outline-none bg-transparent font-black uppercase text-xl sm:text-2xl tracking-wider w-0"
        style={{ color: color }}
        placeholder={placeholder}
      />
      <div className="relative shrink-0 ml-4 flex items-center justify-center">
        <label className="text-xs font-black uppercase tracking-widest text-ink/50 mr-2">Color</label>
        <div className="w-10 h-10 rounded-full border-4 border-ink overflow-hidden cursor-pointer" style={{ backgroundColor: color }}>
          <input 
            type="color" 
            value={color}
            onChange={e => onChangeColor(e.target.value)}
            className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
