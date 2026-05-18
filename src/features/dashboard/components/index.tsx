import React from 'react';
import { 
  Settings as SettingsIcon, 
  LogOut, 
  Target, 
  CalendarDays, 
  Gauge, 
  TrendingUp,
  TrendingDown,
  BarChart3 
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { Settings } from '../../../types';
import { TrackerStats, ChartDatum } from '../../../lib/stats';

// ==========================================
// 1. DashboardHeader Component
// ==========================================
interface DashboardHeaderProps {
  settings: Settings | null;
  setShowGuide: (show: boolean) => void;
  logout: () => void;
  visibleWriters: ('personA' | 'personB')[];
  toggleWriter: (writer: 'personA' | 'personB') => void;
}

export function DashboardHeader({ settings, setShowGuide, logout, visibleWriters, toggleWriter }: DashboardHeaderProps) {
  return (
    <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6 mb-2 sm:mb-4">
      <div className="flex flex-col gap-3 sm:gap-4 w-full md:w-auto">
        <div className="flex items-start justify-between md:justify-start gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-4xl sm:text-5xl md:text-6xl text-ink font-black tracking-[-0.05em]">
              Smeemo
            </h1>
            <p className="text-sm sm:text-base font-bold italic text-ink/80 leading-snug">
              {settings?.personAName || 'Aaron'} & {settings?.personBName || 'Electra'}'s Writing Sanctuary
            </p>
          </div>
          
          <div className="flex md:hidden items-center gap-2 shrink-0">
            <button
              onClick={() => setShowGuide(true)}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-button border-[3px] border-ink bg-primary text-white flex items-center justify-center shadow-sticker active:shadow-sticker-active active:translate-x-1 active:translate-y-1"
              title="Settings"
            >
              <SettingsIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <button
              onClick={logout}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-button border-[3px] border-ink bg-primary text-white flex items-center justify-center shadow-sticker active:shadow-sticker-active active:translate-x-1 active:translate-y-1"
              title="Logout"
            >
              <LogOut className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        <div className="flex md:hidden items-center flex-wrap gap-2">
          <button 
            type="button"
            onClick={() => toggleWriter('personA')}
            className={`bg-bg-paper border-[3px] sm:border-4 border-ink shadow-sticker active:shadow-sticker-active px-3 py-2 flex items-center gap-2 min-w-0 transition-all ${visibleWriters.includes('personA') ? 'opacity-100' : 'opacity-40'} active:translate-x-1 active:translate-y-1`}
          >
            <div className="w-4 h-4 border-2 border-ink shrink-0" style={{ backgroundColor: settings?.personAColor || '#ff4d8d' }} />
            <span className="text-label text-[10px] text-ink truncate">{settings?.personAName || 'Aaron'}</span>
          </button>
          <button 
            type="button"
            onClick={() => toggleWriter('personB')}
            className={`bg-bg-paper border-[3px] sm:border-4 border-ink shadow-sticker active:shadow-sticker-active px-3 py-2 flex items-center gap-2 min-w-0 transition-all ${visibleWriters.includes('personB') ? 'opacity-100' : 'opacity-40'} active:translate-x-1 active:translate-y-1`}
          >
            <div className="w-4 h-4 border-2 border-ink shrink-0" style={{ backgroundColor: settings?.personBColor || '#7c3aed' }} />
            <span className="text-label text-[10px] text-ink truncate">{settings?.personBName || 'Electra'}</span>
          </button>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-4">
        <div className="flex items-center gap-2 mr-2">
          <button 
            type="button"
            onClick={() => toggleWriter('personA')}
            className={`bg-bg-paper border-4 border-ink shadow-sticker active:shadow-sticker-active px-3 py-2 flex items-center gap-2 min-w-0 transition-opacity ${visibleWriters.includes('personA') ? 'opacity-100 hover:opacity-80' : 'opacity-40 hover:opacity-60'} active:translate-x-1 active:translate-y-1`}
          >
            <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-ink shrink-0" style={{ backgroundColor: settings?.personAColor || '#ff4d8d' }} />
            <span className="text-label text-[9px] sm:text-[10px] text-ink truncate">{settings?.personAName || 'Aaron'}</span>
          </button>
          <button 
            type="button"
            onClick={() => toggleWriter('personB')}
            className={`bg-bg-paper border-4 border-ink shadow-sticker active:shadow-sticker-active px-3 py-2 flex items-center gap-2 min-w-0 transition-opacity ${visibleWriters.includes('personB') ? 'opacity-100 hover:opacity-80' : 'opacity-40 hover:opacity-60'} active:translate-x-1 active:translate-y-1`}
          >
            <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-ink shrink-0" style={{ backgroundColor: settings?.personBColor || '#7c3aed' }} />
            <span className="text-label text-[9px] sm:text-[10px] text-ink truncate">{settings?.personBName || 'Electra'}</span>
          </button>
        </div>
        
        {settings?.updatedAt && (
          <div className="text-[10px] font-black uppercase text-ink/40 tracking-widest text-right">
            LAST MODIFIED {settings.lastModifiedBy && settings.lastModifiedBy !== 'System' ? `BY ${settings.lastModifiedBy.toUpperCase()}` : ''}:<br/>
            {new Date(settings.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
        <button
          onClick={() => setShowGuide(true)}
          className="button-playful uppercase font-black tracking-widest bg-primary text-white border-4 border-ink shadow-sticker text-xs px-5 py-3 flex items-center gap-2 active:shadow-sticker-active active:translate-x-1 active:translate-y-1"
        >
          <SettingsIcon className="w-4 h-4" />
          Writing Setup
        </button>
        <button
          onClick={logout}
          className="button-playful bg-primary text-white border-4 border-ink shadow-sticker p-3 active:shadow-sticker-active active:translate-x-1 active:translate-y-1"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
      
      {settings?.updatedAt && (
        <div className="md:hidden text-[8px] font-black uppercase text-ink/40 tracking-widest">
          LAST MODIFIED {settings.lastModifiedBy && settings.lastModifiedBy !== 'System' ? `BY ${settings.lastModifiedBy.toUpperCase()}` : ''}: {new Date(settings.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      )}
    </header>
  );
}

// ==========================================
// 2. GoalSummaryCard Component
// ==========================================
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
  const metricUnit = metric.toLowerCase();

  let statusHeading = 'On Track';
  let statusMessage = "You're right on schedule.";
  let statusTone = 'text-green-600';
  let StatusIcon = TrendingUp;
  
  if (stats.deficit > 0) {
    statusHeading = 'Ahead of Schedule';
    statusMessage = `You're safely ahead by ${deficitLabel} ${metricUnit}.`;
    statusTone = 'text-green-600';
    StatusIcon = TrendingUp;
  } else if (stats.deficit < 0) {
    statusHeading = 'Falling Behind';
    statusMessage = `Need ${deficitLabel} more ${metricUnit} to catch up.`;
    statusTone = 'text-primary';
    StatusIcon = TrendingDown;
  }

  return (
    <div className="sticker-card p-6 flex flex-col gap-6 shadow-[8px_8px_0px_#2b1720]">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-black uppercase tracking-widest lg:text-base opacity-70 flex items-center gap-2 text-ink">
          <Target className="w-5 h-5" /> Project Goal
        </h3>
        <p className="text-2xl sm:text-3xl md:text-4xl text-primary font-display mt-2 break-words">
          {goal.toLocaleString()} {metric}
        </p>
        <p className="text-sm font-bold text-ink-muted flex items-center gap-1 mt-1">
          <CalendarDays className="w-4 h-4" /> {deadline} <span className="opacity-50 mx-1">&bull;</span> {stats.daysLeft} days left
        </p>
      </div>

      <div className="flex flex-col gap-2 mt-4">
        <div className="w-full bg-ink/5 rounded-full h-4 overflow-hidden border-2 border-ink/10">
          <div 
            className="h-full transition-all duration-1000 border-r-2 border-ink/10" 
            style={{ width: `${progressPercent}%`, backgroundColor: settings?.teamColor || '#10b981' }}
          />
        </div>

        <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-ink-muted">
          <span>{stats.totalTeam.toLocaleString()} Completed</span>
          <span>{progressPercent}%</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-ink/5 border-2 border-ink/10 rounded-2xl p-4 flex flex-col gap-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-ink/70 flex items-center gap-2">
            <Gauge className="w-4 h-4" /> Required Pace
          </span>
          <span className="text-xl font-display text-primary">
            {pacePerDay.toLocaleString()} {metricUnit}/day
          </span>
          <span className="text-[11px] font-bold text-ink-muted">
            {pacePerWeek.toLocaleString()} {metricUnit}/week
          </span>
        </div>

        <div className="bg-ink/5 border-2 border-ink/10 rounded-2xl p-4 flex flex-col gap-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-ink/70 flex items-center gap-2">
            <StatusIcon className="w-4 h-4" /> {statusHeading}
          </span>
          <span className={`text-lg font-display leading-tight ${statusTone}`}>
            {statusMessage}
          </span>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 3. ProgressChart Component
// ==========================================
interface ProgressChartProps {
  chartView: 'daily' | 'weekly' | 'cumulative';
  setChartView: (view: 'daily' | 'weekly' | 'cumulative') => void;
  chartData: ChartDatum[];
  settings: Settings | null;
}

export function ProgressChart({ chartView, setChartView, chartData, settings }: ProgressChartProps) {
  const goalLabel =
    chartView === 'cumulative'
      ? 'Target Trajectory'
      : chartView === 'weekly'
        ? 'Required Weekly Pace'
        : 'Required Daily Pace';

  return (
    <div className="sticker-card p-4 sm:p-6 md:p-8 bg-white h-[380px] sm:h-[450px] flex flex-col gap-4 sm:gap-6">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h3 className="text-heading text-lg sm:text-xl flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" /> Progress
        </h3>
        <div className="flex bg-bg-paper p-1 border-2 border-ink rounded-lg gap-1">
          {(['daily', 'weekly', 'cumulative'] as const).map(v => (
            <button
              key={v}
              onClick={() => setChartView(v)}
              className={`text-[9px] sm:text-[10px] font-black uppercase px-2 sm:px-3 py-1 rounded transition-colors ${chartView === v ? 'bg-ink text-white' : 'hover:bg-primary/10'}`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
      <div className="w-full flex-1 min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%" minHeight={250} minWidth={100}>
          <LineChart data={chartData} margin={{ bottom: 5, left: -20, top: 10, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(43, 23, 32, 0.1)" />
            <XAxis 
              dataKey="date" 
              tick={{ fill: '#2b1720', fontSize: 9, fontWeight: 700 }}
              axisLine={{ stroke: '#2b1720', strokeWidth: 2 }}
              tickFormatter={(v) => format(parseISO(v), 'MM/dd')}
            />
            <YAxis 
              tick={{ fill: '#2b1720', fontSize: 9, fontWeight: 700 }}
              axisLine={{ stroke: '#2b1720', strokeWidth: 2 }}
            />
            <Tooltip 
              formatter={(value: number, name: string) => [Math.round(value).toLocaleString(), name]}
              labelFormatter={(value) => format(parseISO(value), 'MMM d, yyyy')}
              contentStyle={{
                backgroundColor: '#fffafc',
                border: '4px solid #2b1720',
                borderRadius: '16px',
                boxShadow: '4px 4px 0 #2b1720',
                fontSize: '12px'
              }}
              itemStyle={{ fontWeight: 800, padding: '2px 0' }}
            />
            <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '10px' }}/>
            <Line name={settings?.personAName || 'Aaron'} type="monotone" dataKey="Aaron" stroke={settings?.personAColor || '#ff4d8d'} strokeWidth={3} dot={{ r: 2 }} activeDot={{ r: 4 }} />
            <Line name={settings?.personBName || 'Electra'} type="monotone" dataKey="Electra" stroke={settings?.personBColor || '#7c3aed'} strokeWidth={3} dot={{ r: 2 }} activeDot={{ r: 4 }} />
            <Line name="Together" type="monotone" dataKey="Team" stroke={settings?.teamColor || '#2b1720'} strokeWidth={4} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            <Line
              name={goalLabel}
              type="monotone"
              dataKey="Goal"
              stroke="#2b1720"
              strokeWidth={2}
              strokeDasharray="8 6"
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ==========================================
// 4. Sub-System Exports
// ==========================================
export { SetupWizard } from './SetupWizard';
export { DailyTimelineLedger } from './DailyTimelineLedger';
