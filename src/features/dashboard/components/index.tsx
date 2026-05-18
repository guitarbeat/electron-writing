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
  Legend,
  ComposedChart,
  Bar
} from 'recharts';
import { format, parseISO, addDays } from 'date-fns';
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
  const defaultDeadline = addDays(new Date(), 10);
  const deadline = settings?.deadline ? format(parseISO(settings.deadline), 'MMMM d, yyyy') : format(defaultDeadline, 'MMMM d, yyyy');
  const progressPercent = Math.min(100, Math.round((stats.totalTeam / goal) * 100)) || 0;
  const pacePerDay = Math.ceil(stats.requiredPerDay);
  const metricUnit = metric.toLowerCase();
  
  // To avoid dividing by zero today if goal is met
  const todayGoal = pacePerDay; 
  const todayPercent = todayGoal > 0 ? Math.min(100, Math.round((stats.todayTeam / todayGoal) * 100)) : 100;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
      
      {/* 1. Total Words/Pages to Goal */}
      <div className="bg-bg-paper border-4 border-ink rounded-3xl p-5 lg:p-6 flex flex-col xl:flex-row items-center xl:items-start justify-center xl:justify-start gap-4 shadow-sticker hover:shadow-sticker-hover hover:-translate-y-1 transition-all group">
        <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90 group-hover:scale-110 transition-transform duration-500 origin-center" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" stroke="var(--color-ink)" strokeOpacity="0.1" strokeWidth="10" fill="none" />
            <circle cx="50" cy="50" r="40" stroke="var(--color-primary)" strokeWidth="10" fill="none" 
              strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * progressPercent) / 100} 
              strokeLinecap="round" className="transition-all duration-1000 ease-out" />
          </svg>
        </div>
        <div className="flex flex-col items-center xl:items-start text-center xl:text-left min-w-0 flex-1">
          <div className="flex items-baseline justify-center xl:justify-start flex-wrap gap-x-1.5">
            <span className="text-3xl lg:text-4xl font-display text-ink leading-none">{stats.totalTeam.toLocaleString()}</span>
            <span className="text-sm lg:text-base font-bold font-sans text-ink/70 leading-none">/ {goal.toLocaleString()}</span>
          </div>
          <div className="text-xs lg:text-sm font-black uppercase tracking-widest text-ink/70 mt-2">
            Total<br className="hidden xl:block" /> {metric}
          </div>
        </div>
      </div>

      {/* 2. Words needed today */}
      <div className="bg-bg-paper border-4 border-ink rounded-3xl p-5 lg:p-6 flex flex-col xl:flex-row items-center xl:items-start justify-center xl:justify-start gap-4 shadow-sticker hover:shadow-sticker-hover hover:-translate-y-1 transition-all group">
        <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90 group-hover:scale-110 transition-transform duration-500 origin-center" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" stroke="var(--color-ink)" strokeOpacity="0.1" strokeWidth="10" fill="none" />
            <circle cx="50" cy="50" r="40" stroke="var(--color-accent)" strokeWidth="10" fill="none" 
              strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * todayPercent) / 100} 
              strokeLinecap="round" className="transition-all duration-1000 ease-out" />
          </svg>
        </div>
        <div className="flex flex-col items-center xl:items-start text-center xl:text-left min-w-0 flex-1">
          <div className="flex items-baseline justify-center xl:justify-start flex-wrap gap-x-1.5">
            <span className="text-3xl lg:text-4xl font-display text-ink leading-none">{stats.todayTeam.toLocaleString()}</span>
            <span className="text-sm lg:text-base font-bold font-sans text-ink/70 leading-none">/ {todayGoal.toLocaleString()}</span>
          </div>
          <div className="text-xs lg:text-sm font-black uppercase tracking-widest text-ink/70 mt-2">
            Needed<br className="hidden xl:block" /> Today
          </div>
        </div>
      </div>

      {/* 3. Streak */}
      <div className="bg-bg-paper border-4 border-ink rounded-3xl p-5 lg:p-6 flex flex-col xl:flex-row items-center xl:items-start justify-center xl:justify-start gap-4 shadow-sticker hover:shadow-sticker-hover hover:-translate-y-1 transition-all group">
        <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full transform -rotate-90 group-hover:scale-110 transition-transform duration-500 origin-center" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" stroke="var(--color-ink)" strokeOpacity="0.1" strokeWidth="10" fill="none" />
          </svg>
          <CalendarDays className="w-8 h-8 text-ink/80 relative z-10 group-hover:scale-110 transition-transform duration-500" />
        </div>
        <div className="flex flex-col items-center xl:items-start text-center xl:text-left min-w-0 flex-1">
          <div className="flex items-baseline justify-center xl:justify-start flex-wrap gap-x-1.5">
            <span className="text-3xl lg:text-4xl font-display text-ink leading-none">{stats.currentStreak.toLocaleString()}</span>
          </div>
          <div className="text-xs lg:text-sm font-black uppercase tracking-widest text-ink/70 mt-2">
            Days In<br className="hidden xl:block" /> A Row
          </div>
        </div>
      </div>
      
    </div>
  );
}

// ==========================================
// 3. OverallProgressChart Component
// ==========================================
interface OverallProgressChartProps {
  chartData: ChartDatum[];
  settings: Settings | null;
}

export function OverallProgressChart({ chartData, settings }: OverallProgressChartProps) {
  return (
    <div className="sticker-card p-4 sm:p-6 md:p-8 bg-white h-[380px] sm:h-[450px] flex flex-col gap-4 sm:gap-6">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h3 className="text-heading text-lg sm:text-xl flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" /> My Overall Progress
        </h3>
      </div>
      <div className="w-full h-[250px] sm:h-[300px] mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ bottom: 5, left: 10, top: 10, right: 10 }}>
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
              tickFormatter={(v) => v.toLocaleString()}
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
            <Bar name="Total Progress" dataKey="Team" fill="#4B778D" />
            <Line
              name="Target Trajectory"
              type="monotone"
              dataKey="Goal"
              stroke="#2b1720"
              strokeWidth={2}
              strokeDasharray="8 6"
              dot={false}
              activeDot={{ r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ==========================================
// 4. DailyWordCountChart Component
// ==========================================
interface DailyWordCountChartProps {
  chartData: ChartDatum[];
  settings: Settings | null;
}

export function DailyWordCountChart({ chartData, settings }: DailyWordCountChartProps) {
  return (
    <div className="sticker-card p-4 sm:p-6 md:p-8 bg-white h-[380px] sm:h-[450px] flex flex-col gap-4 sm:gap-6">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h3 className="text-heading text-lg sm:text-xl flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" /> My Daily Word Count
        </h3>
      </div>
      <div className="w-full h-[250px] sm:h-[300px] mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ bottom: 5, left: 10, top: 10, right: 10 }}>
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
              tickFormatter={(v) => v.toLocaleString()}
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
              name="Required Daily Pace"
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
// 5. Sub-System Exports
// ==========================================
export { SetupWizard } from './SetupWizard';
export { DailyTimelineLedger } from './DailyTimelineLedger';
