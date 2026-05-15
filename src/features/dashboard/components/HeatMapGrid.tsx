import React from 'react';
import { HeatMapCell } from './HeatMapCell';

export function HeatMapGrid({ months, stats, onDateClick, selectedDateStr, activeColor }: any) {
  return (
    <div className="w-full flex-1 flex flex-col">
      <div className="grid grid-cols-1 gap-0 bg-bg-surface border-2 border-ink/10 rounded-xl overflow-hidden">
        {months.map((month: any, mi: number) => (
          <React.Fragment key={month.label + month.yearLabel}>
            <div className={`py-4 bg-white px-6 border-b-2 border-ink/10 ${mi > 0 ? "border-t-2" : ""}`}>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">{month.label} {month.yearLabel}</span>
            </div>
            <div className="grid grid-cols-7 gap-1 p-4 bg-bg-surface">
              {month.days.map((day: any, di: number) => {
                if (!day) return <div key={di} className="aspect-square opacity-0"></div>;
                return (
                  <HeatMapCell 
                     key={di}
                     day={day}
                     stats={stats}
                     onDateClick={onDateClick}
                     selectedDateStr={selectedDateStr}
                     activeColor={activeColor}
                  />
                );
              })}
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
