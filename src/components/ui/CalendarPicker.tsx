import React, { useState } from 'react';
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

interface CalendarPickerProps {
  value: string; // ISO date string YYYY-MM-DD
  onChange: (date: string) => void;
  label?: string;
  color?: string;
}

export function CalendarPicker({ value, onChange, label, color = '#ff4d8d' }: CalendarPickerProps) {
  const selectedDate = parseISO(value);
  const [viewDate, setViewDate] = useState(selectedDate);
  
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(viewDate)),
    end: endOfWeek(endOfMonth(viewDate))
  });

  return (
    <div className="flex flex-col gap-4">
      {label && <label className="text-[10px] font-black uppercase tracking-widest text-ink/40 pl-1">{label}</label>}
      
      <div className="sticker-card bg-white p-3 sm:p-4 border-4 border-ink flex flex-col gap-4 w-full max-w-[320px] mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center px-2">
          <button 
            onClick={() => setViewDate(subMonths(viewDate, 1))}
            className="p-1 hover:bg-ink/5 rounded-lg transition-colors border-2 border-ink/10 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h4 className="text-sm font-black uppercase tracking-widest">
            {format(viewDate, 'MMMM yyyy')}
          </h4>
          <button 
            onClick={() => setViewDate(addMonths(viewDate, 1))}
            className="p-1 hover:bg-ink/5 rounded-lg transition-colors border-2 border-ink/10 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            aria-label="Next month"
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
                  "aspect-square rounded-lg flex items-center justify-center text-xs font-black transition-all border-2",
                  !isCurrentMonth && "opacity-10",
                  isSelected 
                    ? "bg-ink text-white border-ink scale-110 shadow-sticker z-10" 
                    : isToday 
                       ? "border-primary text-primary" 
                       : "border-transparent hover:border-ink/20"
                )}
                style={isSelected ? { backgroundColor: color, borderColor: '#2b1720' } : {}}
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
