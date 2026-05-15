import React, { useMemo } from 'react';
import { format, eachDayOfInterval, startOfMonth, endOfMonth } from 'date-fns';
import { HeatMapGrid } from './HeatMapGrid';

export function CalendarHeatMap({ stats, settings, activeColor, onDateClick, selectedDateStr }: any) {
  const months = useMemo(() => {
    if (!stats.rows.length) return [];
    
    const end = endOfMonth(new Date());
    const start = startOfMonth(stats.rows[0].dateObj);
    
    const allDays = eachDayOfInterval({ start, end });
    
    const monthsArr: { label: string, yearLabel: string, isFirstMonthOfYear: boolean, days: (Date | null)[] }[] = [];
    let currentMonth: Date[] = [];
    
    const pushMonth = () => {
      if (currentMonth.length === 0) return;
      const firstDay = currentMonth[0];
      const year = firstDay.getFullYear();
      const monthDays = new Array(31).fill(null);
      currentMonth.forEach(d => {
        monthDays[d.getDate() - 1] = d;
      });
      const isFirst = monthsArr.length === 0 || monthsArr[monthsArr.length - 1].yearLabel !== year.toString();
      monthsArr.push({
        label: format(firstDay, "MMM"),
        yearLabel: year.toString(),
        isFirstMonthOfYear: isFirst,
        days: monthDays
      });
    };

    allDays.forEach(day => {
      if (currentMonth.length > 0 && day.getMonth() !== currentMonth[0].getMonth()) {
        pushMonth();
        currentMonth = [];
      }
      currentMonth.push(day);
    });
    
    if (currentMonth.length > 0) pushMonth();
    
    return [...monthsArr].reverse();
  }, [stats]);

  return (
    <div className="flex flex-col w-full relative bg-transparent">
      <div className="px-0 pt-4 pb-10 max-h-[600px] overflow-y-auto scrollbar-hide">
        <HeatMapGrid 
          months={months} 
          stats={stats} 
          onDateClick={onDateClick} 
          selectedDateStr={selectedDateStr} 
          activeColor={activeColor}
        />
        
        <div className="mt-8 pt-6 border-t-4 border-ink/10 mb-4 font-mono">
           <div className="flex space-x-1.5 text-[9px] text-ink font-black uppercase tracking-[0.2em] items-center">
             <span className="mr-1 opacity-20">Less</span>
             <div className="w-3.5 h-3.5 rounded-md border-2 border-ink/5" style={{ backgroundColor: 'rgba(43, 23, 32, 0.05)' }}></div>
             <div className="w-3.5 h-3.5 rounded-md border-2 border-ink/30" style={{ backgroundColor: 'rgba(43, 23, 32, 0.4)' }}></div>
             <div className="w-3.5 h-3.5 rounded-md border-2 border-ink shadow-[2px_2px_0_#2b1720]" style={{ backgroundColor: activeColor || 'rgba(43, 23, 32, 1)' }}></div>
             <span className="ml-1 opacity-20">More</span>
           </div>
        </div>
      </div>
    </div>
  );
}
