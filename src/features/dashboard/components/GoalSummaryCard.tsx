import React from 'react';
import { Settings } from '../../../types';
import { format, parseISO } from 'date-fns';
import { Target, CalendarDays } from 'lucide-react';

interface GoalSummaryCardProps {
  settings: Settings | null;
  totalTeam: number;
}

export function GoalSummaryCard({ settings, totalTeam }: GoalSummaryCardProps) {
  const goal = settings?.projectGoal || 50000;
  const metric = settings?.metric === 'pages' ? 'Pages' : 'Words';
  const deadline = settings?.deadline ? format(parseISO(settings.deadline), 'MMMM d, yyyy') : 'No deadline';
  const progressPercent = Math.min(100, Math.round((totalTeam / goal) * 100)) || 0;

  return (
    <div className="sticker-card p-6 bg-ink text-bg-paper flex flex-col gap-6 shadow-[8px_8px_0px_#2b1720]">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-black uppercase tracking-widest lg:text-base opacity-70 flex items-center gap-2">
          <Target className="w-5 h-5" /> Project Goal
        </h3>
        <p className="text-4xl text-primary font-display mt-2 break-words">
          {goal.toLocaleString()} {metric}
        </p>
        <p className="text-sm font-bold opacity-80 flex items-center gap-1 mt-1">
          <CalendarDays className="w-4 h-4" /> {deadline}
        </p>
      </div>

      <div className="flex flex-col gap-2 mt-4">
        <div className="w-full bg-white/10 rounded-full h-4 overflow-hidden border-2 border-bg-paper">
          <div 
            className="h-full transition-all duration-1000 border-r-2 border-bg-paper" 
            style={{ width: `${progressPercent}%`, backgroundColor: settings?.teamColor || '#10b981' }}
          />
        </div>

        <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest opacity-80">
          <span>{totalTeam.toLocaleString()} Completed</span>
          <span>{progressPercent}%</span>
        </div>
      </div>
    </div>
  );
}
