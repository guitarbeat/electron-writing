import React from 'react';
import { Settings } from '../../../types';
import { format, parseISO } from 'date-fns';
import { Target, CalendarDays, Gauge, TrendingUp } from 'lucide-react';
import { TrackerStats } from '../../../lib/stats';

interface GoalSummaryCardProps {
  settings: Settings | null;
  stats: TrackerStats;
}

export function GoalSummaryCard({ settings, stats }: GoalSummaryCardProps) {
  const goal = stats.goal;
  const metric = settings?.metric === 'pages' ? 'Pages' : 'Words';
  const deadline = settings?.deadline ? format(parseISO(settings.deadline), 'MMMM d, yyyy') : 'No deadline';
  const progressPercent = Math.min(100, Math.round((stats.totalTeam / goal) * 100)) || 0;
  const pacePerDay = Math.ceil(stats.requiredPerDay);
  const pacePerWeek = Math.ceil(stats.requiredPerWeek);
  const deficitLabel = Math.round(Math.abs(stats.deficit)).toLocaleString();
  const statusText = stats.deficit >= 0 ? `Ahead by ${deficitLabel}` : `Behind by ${deficitLabel}`;
  const statusTone = stats.deficit >= 0 ? 'text-mint' : 'text-primary';
  const metricUnit = metric.toLowerCase();

  return (
    <div className="sticker-card p-6 bg-ink text-bg-paper flex flex-col gap-6 shadow-[8px_8px_0px_#2b1720]">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-black uppercase tracking-widest lg:text-base opacity-70 flex items-center gap-2">
          <Target className="w-5 h-5" /> Project Goal
        </h3>
        <p className="text-2xl sm:text-3xl md:text-4xl text-primary font-display mt-2 break-words">
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
          <span>{stats.totalTeam.toLocaleString()} Completed</span>
          <span>{progressPercent}%</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-white/10 border-2 border-white/20 rounded-2xl p-4 flex flex-col gap-1">
          <span className="text-[10px] font-black uppercase tracking-widest opacity-70 flex items-center gap-2">
            <Gauge className="w-4 h-4" /> Required Pace
          </span>
          <span className="text-xl font-display text-primary">
            {pacePerDay.toLocaleString()} {metricUnit}/day
          </span>
          <span className="text-[11px] font-bold opacity-75">
            {pacePerWeek.toLocaleString()} {metricUnit}/week
          </span>
        </div>

        <div className="bg-white/10 border-2 border-white/20 rounded-2xl p-4 flex flex-col gap-1">
          <span className="text-[10px] font-black uppercase tracking-widest opacity-70 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Remaining
          </span>
          <span className="text-xl font-display text-primary">
            {stats.remainingGoal.toLocaleString()} {metric}
          </span>
          <span className="text-[11px] font-bold opacity-75">
            {stats.daysLeft} days left
          </span>
        </div>
      </div>

      <div className="text-xs font-black uppercase tracking-widest opacity-85">
        <span className={statusTone}>{statusText}</span>
      </div>
    </div>
  );
}
