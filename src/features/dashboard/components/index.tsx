import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { animate } from 'motion';
import { 
  Settings as SettingsIcon, 
  LogOut, 
  Target, 
  CalendarDays, 
  Gauge, 
  TrendingUp,
  BarChart3,
  Maximize2,
  Minimize2,
  X,
  Sun,
  Moon,
  PenTool,
  Eye,
  Trophy,
  Calendar,
  Lock,
  ArrowRight
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
  Bar,
  ReferenceLine
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { Settings } from '../../../types';
import { TrackerStats, ChartDatum } from '../../../lib/stats';

// ==========================================
// 1. DashboardHeader Component
// ==========================================
interface DashboardHeaderProps {
  settings: Settings | null;
  setShowGuide?: (show: boolean) => void;
  onOpenSettingsTab?: (tab: 'goal' | 'deadline' | 'security') => void;
  activeSettingsTab?: 'goal' | 'deadline' | 'security' | null;
  logout: () => void;
  updateSettings?: (newSettings: Partial<Settings>) => Promise<boolean | void>;
}

export function DashboardHeader({ 
  settings, 
  setShowGuide, 
  onOpenSettingsTab,
  activeSettingsTab,
  logout, 
  updateSettings
}: DashboardHeaderProps) {
  const [easterEggState, setEasterEggState] = React.useState<'idle' | 'spinning' | 'settled'>('idle');
  const easterEggTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const hoverDelayTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleOpenTab = (tab: 'goal' | 'deadline' | 'security') => {
    if (onOpenSettingsTab) {
      onOpenSettingsTab(tab);
    } else if (setShowGuide) {
      setShowGuide(true);
    }
  };

  const handleMouseEnterTitle = () => {
    if (easterEggTimeoutRef.current) {
      clearTimeout(easterEggTimeoutRef.current);
      easterEggTimeoutRef.current = null;
    }
    if (hoverDelayTimeoutRef.current) {
      clearTimeout(hoverDelayTimeoutRef.current);
    }
    hoverDelayTimeoutRef.current = setTimeout(() => {
      setEasterEggState('spinning');
    }, 500);
  };

  const handleMouseLeaveTitle = () => {
    if (hoverDelayTimeoutRef.current) {
      clearTimeout(hoverDelayTimeoutRef.current);
      hoverDelayTimeoutRef.current = null;
    }
    if (easterEggState === 'spinning') {
      setEasterEggState('settled');
      easterEggTimeoutRef.current = setTimeout(() => {
        setEasterEggState('idle');
      }, 2500);
    }
  };

  React.useEffect(() => {
    return () => {
      if (easterEggTimeoutRef.current) {
        clearTimeout(easterEggTimeoutRef.current);
      }
      if (hoverDelayTimeoutRef.current) {
        clearTimeout(hoverDelayTimeoutRef.current);
      }
    };
  }, []);

  return (
    <header className="w-full flex flex-row justify-between items-center gap-3 sm:gap-4 mb-2 sm:mb-4">
      <div className="flex items-center shrink-0">
        <h1 
          className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-[-0.05em] select-none transition-colors ${easterEggState === 'spinning' ? 'smeemo-spinning text-ink' : easterEggState === 'settled' ? 'smeemo-settled text-ink' : 'text-ink'}`}
          onMouseEnter={handleMouseEnterTitle}
          onMouseLeave={handleMouseLeaveTitle}
        >
          Smeemo
        </h1>
      </div>

      {/* Unified Toolbar Capsule - Far Right */}
      <div className="flex items-center gap-1 sm:gap-1.5 p-1 bg-bg-paper/80 backdrop-blur-xs border-2 border-ink shadow-[2px_2px_0_var(--color-ink)] rounded-2xl shrink-0">
        <button
          type="button"
          onClick={() => handleOpenTab('goal')}
          className={`w-8 h-8 sm:w-9 sm:h-9 border border-ink/80 rounded-xl flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-xs ${
            activeSettingsTab === 'goal'
              ? 'bg-[#b82e4a] text-white ring-2 ring-ink ring-offset-1 scale-105 shadow-sticker'
              : 'bg-[#ce3d5a]/90 hover:bg-[#ce3d5a] text-white'
          }`}
          title="The Goal Settings"
          aria-label="The Goal Settings"
        >
          <Trophy className="w-4 h-4 text-[#facc15]" />
        </button>

        <button
          type="button"
          onClick={() => handleOpenTab('deadline')}
          className={`w-8 h-8 sm:w-9 sm:h-9 border border-ink/80 rounded-xl flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-xs ${
            activeSettingsTab === 'deadline'
              ? 'bg-[#b82e4a] text-white ring-2 ring-ink ring-offset-1 scale-105 shadow-sticker'
              : 'bg-[#ce3d5a]/90 hover:bg-[#ce3d5a] text-white'
          }`}
          title="The Deadline Settings"
          aria-label="The Deadline Settings"
        >
          <Calendar className="w-4 h-4 text-[#5eead4]" />
        </button>

        <button
          type="button"
          onClick={() => handleOpenTab('security')}
          className={`w-8 h-8 sm:w-9 sm:h-9 border border-ink/80 rounded-xl flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-xs ${
            activeSettingsTab === 'security'
              ? 'bg-[#b82e4a] text-white ring-2 ring-ink ring-offset-1 scale-105 shadow-sticker'
              : 'bg-[#ce3d5a]/90 hover:bg-[#ce3d5a] text-white'
          }`}
          title="Security & Passcode Settings"
          aria-label="Security & Passcode Settings"
        >
          <Lock className="w-4 h-4 text-[#ff80bf]" />
        </button>

        <div className="w-[1.5px] h-5 bg-ink/20 mx-0.5" />

        <button
          type="button"
          onClick={logout}
          className="w-8 h-8 sm:w-9 sm:h-9 bg-bg-surface hover:bg-red-500 hover:text-white text-ink/70 border border-ink/40 hover:border-ink rounded-xl flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-xs"
          title="Lock / Logout"
          aria-label="Lock / Logout"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}

// ==========================================
// 1.5. AnimatedNumber Component
// ==========================================
function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const prevValue = React.useRef(0);

  useEffect(() => {
    setDisplay(value); // fallback initially if animate fails
    const controls = animate(prevValue.current, value, {
      type: "spring",
      stiffness: 55,
      damping: 12,
      onUpdate: (latest) => setDisplay(Math.round(latest))
    });
    prevValue.current = value;
    return () => controls.stop();
  }, [value]);

  return <span className="tabular-nums">{display}</span>;
}

// ==========================================
// 2. GoalSummaryCard Component (Deprecated)
// ==========================================
export function GoalSummaryCard({ stats }: { stats?: TrackerStats; settings?: Settings | null }) {
  return null;
}

// ==========================================
// 3. CustomChartTooltip
// ==========================================
const CustomChartTooltip = ({ active, payload, label, settings, visibleWriters, isCumulative }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const showTeam = visibleWriters.length === 2;

    const personAName = settings?.personAName || 'Aaron';
    const personBName = settings?.personBName || 'Electra';
    const personAColor = settings?.personAColor || '#ff4d8d';
    const personBColor = settings?.personBColor || '#7c3aed';
    const teamColor = settings?.teamColor || 'var(--color-ink)';

    let totalVal = 0;
    if (showTeam) {
      totalVal = data.Team !== undefined ? data.Team : ((data.Aaron ?? 0) + (data.Electra ?? 0));
    } else if (visibleWriters.includes('personA')) {
      totalVal = data.Aaron ?? 0;
    } else if (visibleWriters.includes('personB')) {
      totalVal = data.Electra ?? 0;
    }

    const goalVal = data.Goal ?? 0;
    const diff = totalVal - goalVal;
    const metTarget = goalVal > 0 && diff >= 0;

    const getFormattedLabel = () => {
      if (!label || typeof label !== 'string') return '';
      try {
        const d = parseISO(label);
        return !isNaN(d.getTime()) ? format(d, 'EEEE, MMMM d, yyyy') : label;
      } catch {
        return label;
      }
    };

    return (
      <div className="bg-bg-surface border-4 border-ink rounded-2xl p-4 shadow-sticker text-ink z-50 min-w-[200px]">
        <p className="font-bold border-b-2 border-ink/10 pb-2 mb-2 text-xs uppercase tracking-widest">{getFormattedLabel()}</p>
        
        <div className="flex flex-col gap-2">
          {showTeam ? (
            <>
              {data.Team !== undefined && (
                <div className="flex justify-between items-center gap-6">
                  <span className="font-bold flex items-center gap-2 text-sm">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: teamColor }} /> Team Total
                  </span>
                  <span className="font-mono font-bold text-base tabular-nums">{Math.round(data.Team).toLocaleString()}</span>
                </div>
              )}
              {data.Aaron !== undefined && (
                <div className="flex justify-between items-center gap-6 opacity-80 pl-2">
                  <span className="font-bold flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: personAColor }} /> {personAName}
                  </span>
                  <span className="font-mono text-sm tabular-nums">{Math.round(data.Aaron).toLocaleString()}</span>
                </div>
              )}
              {data.Electra !== undefined && (
                <div className="flex justify-between items-center gap-6 opacity-80 pl-2">
                  <span className="font-bold flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: personBColor }} /> {personBName}
                  </span>
                  <span className="font-mono text-sm tabular-nums">{Math.round(data.Electra).toLocaleString()}</span>
                </div>
              )}
            </>
          ) : (
            <>
               {visibleWriters.includes('personA') && data.Aaron !== undefined && (
                 <div className="flex justify-between items-center gap-6">
                    <span className="font-bold flex items-center gap-2 text-sm">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: personAColor }} /> {personAName}
                    </span>
                    <span className="font-mono font-bold text-base tabular-nums">{Math.round(data.Aaron).toLocaleString()}</span>
                 </div>
               )}
               {visibleWriters.includes('personB') && data.Electra !== undefined && (
                 <div className="flex justify-between items-center gap-6">
                    <span className="font-bold flex items-center gap-2 text-sm">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: personBColor }} /> {personBName}
                    </span>
                    <span className="font-mono font-bold text-base tabular-nums">{Math.round(data.Electra).toLocaleString()}</span>
                 </div>
               )}
            </>
          )}

          {goalVal > 0 && (
            <div className="flex justify-between items-center gap-6 mt-1 pt-2 border-t-2 border-ink/10">
              <span className="font-bold flex items-center gap-2 text-sm">
                <span className="w-3 h-3 rounded-full bg-ink/30 border-2 border-ink border-dashed" /> {isCumulative ? 'Target Trajectory' : 'Daily Target'}
              </span>
              <span className="font-mono font-bold text-sm text-ink/70 tabular-nums">{Math.round(goalVal).toLocaleString()}</span>
            </div>
          )}

          {!isCumulative && goalVal > 0 && (
            <div className={`mt-1 pt-2 border-t-2 border-ink/10 text-xs font-extrabold flex items-center justify-between px-2.5 py-1.5 rounded-lg ${
              metTarget 
                ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 border border-emerald-500/30' 
                : 'bg-amber-500/15 text-amber-900 dark:text-amber-200 border border-amber-500/30'
            }`}>
              <span>{metTarget ? '🎯 Met Pace Goal!' : '⚠️ Below Daily Pace'}</span>
              <span className="font-mono">
                {diff >= 0 ? `+${Math.round(diff).toLocaleString()}` : `${Math.round(diff).toLocaleString()}`}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

// ==========================================
// 3.5. CustomHierarchicalXAxisTick Component
// ==========================================
interface CustomXAxisTickProps {
  x?: number | string;
  y?: number | string;
  payload?: any;
  index?: number;
  chartData?: ChartDatum[];
}

const CustomHierarchicalXAxisTick: React.FC<CustomXAxisTickProps> = ({
  x = 0,
  y = 0,
  payload,
  index = 0,
  chartData = []
}) => {
  if (!payload || !payload.value) return null;

  let dateObj: Date;
  try {
    dateObj = parseISO(payload.value);
  } catch {
    return null;
  }

  const dayStr = format(dateObj, 'd');
  const monthAbbrUpper = format(dateObj, 'MMM').toUpperCase();

  let isMonthStart = index === 0;
  if (!isMonthStart && chartData && chartData[index - 1]) {
    try {
      const prevDate = parseISO(chartData[index - 1].date);
      if (prevDate.getMonth() !== dateObj.getMonth() || prevDate.getFullYear() !== dateObj.getFullYear()) {
        isMonthStart = true;
      }
    } catch {
      // ignore
    }
  }

  return (
    <g transform={`translate(${x},${y})`}>
      <line x1={0} y1={0} x2={0} y2={4} stroke="var(--color-ink)" strokeWidth={1.5} />
      <text
        x={0}
        y={15}
        textAnchor="middle"
        fill="var(--color-ink)"
        fontSize={11}
        fontWeight={800}
        fontFamily="sans-serif"
      >
        {dayStr}
      </text>

      {isMonthStart && (
        <g transform="translate(0, 32)">
          <rect
            x={-24}
            y={-10}
            width={48}
            height={18}
            rx={5}
            fill="var(--color-ink)"
          />
          <text
            x={0}
            y={2}
            textAnchor="middle"
            fill="var(--color-bg-surface)"
            fontSize={9}
            fontWeight={900}
            letterSpacing={0.8}
            fontFamily="sans-serif"
          >
            {monthAbbrUpper}
          </text>
        </g>
      )}
    </g>
  );
};

// ==========================================
// 4. OverallProgressChart Component
// ==========================================
interface OverallProgressChartProps {
  chartData: ChartDatum[];
  settings: Settings | null;
  stats?: TrackerStats;
  visibleWriters: ('personA' | 'personB')[];
}

export function OverallProgressChart({ chartData, settings, stats, visibleWriters }: OverallProgressChartProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!isExpanded) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsExpanded(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isExpanded]);

  let barDataKey = "Team";
  let barName = "Total Progress";
  let barColor = settings?.teamColor || "var(--color-primary)";

  if (visibleWriters.length === 1) {
    if (visibleWriters.includes('personA')) {
      barDataKey = "Aaron";
      barName = settings?.personAName || 'Aaron';
      barColor = settings?.personAColor || '#ff4d8d';
    } else {
      barDataKey = "Electra";
      barName = settings?.personBName || 'Electra';
      barColor = settings?.personBColor || '#7c3aed';
    }
  }

  const totalVal = stats?.totalTeam ?? 0;
  const goalVal = stats?.goal ?? 1;
  const goalPct = Math.min(100, Math.round((totalVal / (goalVal || 1)) * 100));
  const streakDays = stats?.currentStreak ?? 0;
  const dailyReq = Math.ceil(stats?.requiredPerDay ?? 0);

  const renderChart = () => (
    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
      <ComposedChart data={chartData} margin={{ bottom: 10, left: 5, top: 10, right: 15 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-ink)" strokeOpacity={0.12} />
        <XAxis 
          dataKey="date" 
          height={50}
          interval={0}
          axisLine={{ stroke: 'var(--color-ink)', strokeWidth: 2 }}
          tick={(props) => <CustomHierarchicalXAxisTick {...props} chartData={chartData} />}
        />
        <YAxis 
          tick={{ fill: 'var(--color-ink)', fontSize: 11, fontWeight: 700 }}
          axisLine={{ stroke: 'var(--color-ink)', strokeWidth: 2 }}
          tickFormatter={(v) => v.toLocaleString()}
          dx={-2}
        />
        <Tooltip content={<CustomChartTooltip settings={settings} visibleWriters={visibleWriters} isCumulative={true} />} />
        <Legend verticalAlign="top" height={32} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--color-ink)' }}/>
        {visibleWriters.length > 0 && (
          <Bar name={barName} dataKey={barDataKey} fill={barColor} radius={[4, 4, 0, 0]} />
        )}
        <Line
          name="Target Trajectory"
          type="monotone"
          dataKey="Goal"
          stroke="var(--color-ink)"
          strokeWidth={2}
          strokeDasharray="8 6"
          dot={false}
          activeDot={{ r: 4 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );

  return (
    <>
      <div className="sticker-card p-5 sm:p-7 bg-bg-surface flex flex-col gap-4">
        <div className="flex justify-between items-start sm:items-center flex-wrap gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <h3 className="text-heading text-lg sm:text-2xl flex items-center gap-2 font-black">
              <TrendingUp className="w-5 h-5 text-primary" /> Overall Progress
            </h3>
            
            {stats && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-black px-2.5 py-0.5 rounded-lg bg-bg-paper border-2 border-ink/20 text-ink font-mono">
                  {totalVal.toLocaleString()} / {goalVal.toLocaleString()} {settings?.metric} ({goalPct}%)
                </span>
                <span className="text-xs font-black px-2.5 py-0.5 rounded-lg bg-accent/10 border-2 border-accent/30 text-accent font-mono flex items-center gap-1">
                  🔥 {streakDays}d streak
                </span>
                {dailyReq > 0 && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-ink/5 text-ink/70 hidden md:inline-block">
                    Pace: ~{dailyReq.toLocaleString()}/day
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsExpanded(true)}
              title="Maximize chart"
              className="w-9 h-9 flex border-[3px] border-ink rounded-xl items-center justify-center hover:bg-ink/5 active:scale-[0.96] transition-[transform,background-color] duration-100 ease-out cursor-pointer"
            >
              <Maximize2 className="w-4 h-4 text-ink" />
            </button>
          </div>
        </div>

        <div className="w-full h-[400px] sm:h-[480px] md:h-[560px] lg:h-[620px] relative min-h-[300px] mt-1">
          {renderChart()}
        </div>
      </div>

      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="fixed inset-0 w-screen h-screen z-[99999] bg-bg-surface text-ink p-4 sm:p-6 md:p-8 flex flex-col gap-4 overflow-hidden"
            >
              <div className="flex justify-between items-center gap-3 border-b-3 border-ink/15 pb-4 shrink-0">
                <div className="flex items-center gap-3 flex-wrap min-w-0">
                  <h3 className="text-heading text-xl sm:text-2xl flex items-center gap-2 shrink-0">
                    <TrendingUp className="w-6 h-6 text-primary" /> Overall Progress
                  </h3>
                  {stats && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-bg-paper border-2 border-ink/20 text-ink font-mono">
                        {totalVal.toLocaleString()} / {goalVal.toLocaleString()} {settings?.metric} ({goalPct}%)
                      </span>
                      <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-accent/10 border-2 border-accent/30 text-accent font-mono flex items-center gap-1">
                        🔥 {streakDays}d streak
                      </span>
                      {dailyReq > 0 && (
                        <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-ink/5 text-ink/80">
                          Target Pace: ~{dailyReq.toLocaleString()}/day
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setIsExpanded(false)}
                  title="Exit fullscreen (Esc)"
                  className="flex items-center gap-2 px-3.5 py-2 bg-ink text-bg-paper rounded-xl font-black text-xs uppercase tracking-wider border-2 border-ink hover:bg-ink/85 active:scale-95 transition-all cursor-pointer shrink-0 shadow-sm"
                >
                  <Minimize2 className="w-4 h-4" /> Minimize
                </button>
              </div>

              <div className="w-full flex-1 min-h-0 relative">
                <div className="absolute inset-0">
                  {renderChart()}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}

// ==========================================
// 5. DailyWordCountChart Component
// ==========================================
interface DailyWordCountChartProps {
  chartData: ChartDatum[];
  settings: Settings | null;
  stats?: TrackerStats;
  visibleWriters: ('personA' | 'personB')[];
}

export function DailyWordCountChart({ chartData, settings, stats, visibleWriters }: DailyWordCountChartProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [chartType, setChartType] = useState<'bars' | 'lines'>('bars');

  useEffect(() => {
    if (!isExpanded) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsExpanded(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isExpanded]);

  const showPersonA = visibleWriters.includes('personA');
  const showPersonB = visibleWriters.includes('personB');
  const showTeam = visibleWriters.length === 2;
  
  const metricLabel = settings?.metric === 'pages' ? 'Page' : 'Word';

  const todayVal = stats?.todayTeam ?? 0;
  const todayReq = Math.ceil(stats?.requiredPerDay ?? 0);
  const todayPct = todayReq > 0 ? Math.min(100, Math.round((todayVal / todayReq) * 100)) : 100;
  const weekVal = stats?.weekTeam ?? 0;
  const weekReq = Math.ceil(stats?.requiredPerWeek ?? 0);

  // Smart Analytics derived from chartData
  const daysWithGoal = chartData.filter(d => (d.Goal ?? 0) > 0);
  const metTargetCount = daysWithGoal.filter(d => {
    const val = showTeam ? (d.Team ?? 0) : (showPersonA ? (d.Aaron ?? 0) : (d.Electra ?? 0));
    return val >= (d.Goal ?? 0);
  }).length;
  const targetHitRate = daysWithGoal.length > 0 ? Math.round((metTargetCount / daysWithGoal.length) * 100) : 0;

  let maxSingleDay = 0;
  chartData.forEach(d => {
    const val = showTeam ? (d.Team ?? 0) : (showPersonA ? (d.Aaron ?? 0) : (d.Electra ?? 0));
    if (val > maxSingleDay) maxSingleDay = val;
  });

  const personAColor = settings?.personAColor || '#ff4d8d';
  const personBColor = settings?.personBColor || '#7c3aed';
  const teamColor = settings?.teamColor || 'var(--color-ink)';

  const renderChart = () => (
    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
      <ComposedChart data={chartData} margin={{ bottom: 10, left: 5, top: 10, right: 15 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-ink)" strokeOpacity={0.12} />
        <XAxis 
          dataKey="date" 
          height={50}
          interval={0}
          axisLine={{ stroke: 'var(--color-ink)', strokeWidth: 2 }}
          tick={(props) => <CustomHierarchicalXAxisTick {...props} chartData={chartData} />}
        />
        <YAxis 
          tick={{ fill: 'var(--color-ink)', fontSize: 11, fontWeight: 700 }}
          axisLine={{ stroke: 'var(--color-ink)', strokeWidth: 2 }}
          tickFormatter={(v) => v.toLocaleString()}
          dx={-2}
        />
        <Tooltip content={<CustomChartTooltip settings={settings} visibleWriters={visibleWriters} isCumulative={false} />} />
        <Legend verticalAlign="top" height={32} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--color-ink)' }}/>
        
        {chartType === 'bars' ? (
          <>
            {showTeam ? (
              <>
                <Bar 
                  dataKey="Aaron" 
                  name={settings?.personAName || 'Aaron'} 
                  stackId="daily" 
                  fill={personAColor} 
                  radius={[0, 0, 4, 4]} 
                />
                <Bar 
                  dataKey="Electra" 
                  name={settings?.personBName || 'Electra'} 
                  stackId="daily" 
                  fill={personBColor} 
                  radius={[4, 4, 0, 0]} 
                />
              </>
            ) : (
              <>
                {showPersonA && (
                  <Bar 
                    dataKey="Aaron" 
                    name={settings?.personAName || 'Aaron'} 
                    fill={personAColor} 
                    radius={[6, 6, 0, 0]} 
                  />
                )}
                {showPersonB && (
                  <Bar 
                    dataKey="Electra" 
                    name={settings?.personBName || 'Electra'} 
                    fill={personBColor} 
                    radius={[6, 6, 0, 0]} 
                  />
                )}
              </>
            )}
          </>
        ) : (
          <>
            {showPersonA && (
              <Line legendType="none" name={settings?.personAName || 'Aaron'} type="monotone" dataKey="Aaron" stroke={personAColor} strokeWidth={3} dot={{ r: 2 }} activeDot={{ r: 4 }} />
            )}
            {showPersonB && (
              <Line legendType="none" name={settings?.personBName || 'Electra'} type="monotone" dataKey="Electra" stroke={personBColor} strokeWidth={3} dot={{ r: 2 }} activeDot={{ r: 4 }} />
            )}
            {showTeam && (
              <Line name="Together" type="monotone" dataKey="Team" stroke={teamColor} strokeWidth={4} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            )}
          </>
        )}

        <Line
          name="Required Daily Pace"
          type="monotone"
          dataKey="Goal"
          stroke="var(--color-ink)"
          strokeWidth={2.5}
          strokeDasharray="8 6"
          dot={false}
          activeDot={{ r: 4 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );

  return (
    <>
      <div className="sticker-card p-5 sm:p-7 bg-bg-surface flex flex-col gap-4">
        <div className="flex justify-between items-start sm:items-center flex-wrap gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <h3 className="text-heading text-lg sm:text-2xl flex items-center gap-2 font-black">
              <BarChart3 className="w-5 h-5 text-primary" /> Daily Output & Target Pace
            </h3>

            {stats && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-black px-2.5 py-0.5 rounded-lg bg-bg-paper border-2 border-ink/20 text-ink font-mono">
                  Today: {todayVal.toLocaleString()} {todayReq > 0 ? `/ ${todayReq.toLocaleString()}` : ''} ({todayPct}%)
                </span>
                {daysWithGoal.length > 0 && (
                  <span className="text-xs font-black px-2.5 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-2 border-emerald-500/30 font-mono">
                    🎯 Target Hit: {metTargetCount}/{daysWithGoal.length}d ({targetHitRate}%)
                  </span>
                )}
                {maxSingleDay > 0 && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-ink/5 text-ink/80 font-mono hidden md:inline-block">
                    🚀 Best Day: {maxSingleDay.toLocaleString()}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Chart Type Toggle */}
            <div className="flex items-center p-0.5 bg-bg-paper border-2 border-ink rounded-xl shadow-xs">
              <button
                type="button"
                onClick={() => setChartType('bars')}
                className={`px-2.5 py-1 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                  chartType === 'bars'
                    ? 'bg-ink text-bg-paper'
                    : 'text-ink/70 hover:text-ink'
                }`}
              >
                Bars
              </button>
              <button
                type="button"
                onClick={() => setChartType('lines')}
                className={`px-2.5 py-1 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                  chartType === 'lines'
                    ? 'bg-ink text-bg-paper'
                    : 'text-ink/70 hover:text-ink'
                }`}
              >
                Lines
              </button>
            </div>

            <button 
              onClick={() => setIsExpanded(true)}
              title="Maximize chart"
              className="w-9 h-9 flex border-[3px] border-ink rounded-xl items-center justify-center hover:bg-ink/5 active:scale-[0.96] transition-[transform,background-color] duration-100 ease-out cursor-pointer"
            >
              <Maximize2 className="w-4 h-4 text-ink" />
            </button>
          </div>
        </div>

        <div className="w-full h-[400px] sm:h-[480px] md:h-[560px] lg:h-[620px] relative min-h-[300px] mt-1">
          {renderChart()}
        </div>
      </div>

      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="fixed inset-0 w-screen h-screen z-[99999] bg-bg-surface text-ink p-4 sm:p-6 md:p-8 flex flex-col gap-4 overflow-hidden"
            >
              <div className="flex justify-between items-center gap-3 border-b-3 border-ink/15 pb-4 shrink-0">
                <div className="flex items-center gap-3 flex-wrap min-w-0">
                  <h3 className="text-heading text-xl sm:text-2xl flex items-center gap-2 shrink-0">
                    <BarChart3 className="w-6 h-6 text-primary" /> Daily Output & Target Pace
                  </h3>
                  {stats && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-bg-paper border-2 border-ink/20 text-ink font-mono">
                        Today: {todayVal.toLocaleString()} {todayReq > 0 ? `/ ${todayReq.toLocaleString()}` : ''} ({todayPct}%)
                      </span>
                      {daysWithGoal.length > 0 && (
                        <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-2 border-emerald-500/30 font-mono">
                          🎯 Target Hit: {metTargetCount}/{daysWithGoal.length}d ({targetHitRate}%)
                        </span>
                      )}
                      {maxSingleDay > 0 && (
                        <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-ink/5 text-ink/80 font-mono">
                          🚀 Best Day: {maxSingleDay.toLocaleString()}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center p-1 bg-bg-paper border-2 border-ink rounded-xl shadow-xs">
                    <button
                      type="button"
                      onClick={() => setChartType('bars')}
                      className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                        chartType === 'bars'
                          ? 'bg-ink text-bg-paper'
                          : 'text-ink/70 hover:text-ink'
                      }`}
                    >
                      Bars
                    </button>
                    <button
                      type="button"
                      onClick={() => setChartType('lines')}
                      className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                        chartType === 'lines'
                          ? 'bg-ink text-bg-paper'
                          : 'text-ink/70 hover:text-ink'
                      }`}
                    >
                      Lines
                    </button>
                  </div>

                  <button
                    onClick={() => setIsExpanded(false)}
                    title="Exit fullscreen (Esc)"
                    className="flex items-center gap-2 px-3.5 py-2 bg-ink text-bg-paper rounded-xl font-black text-xs uppercase tracking-wider border-2 border-ink hover:bg-ink/85 active:scale-95 transition-all cursor-pointer shrink-0 shadow-sm"
                  >
                    <Minimize2 className="w-4 h-4" /> Minimize
                  </button>
                </div>
              </div>

              <div className="w-full flex-1 min-h-0 relative">
                <div className="absolute inset-0">
                  {renderChart()}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}

// ==========================================
// 5. Sub-System Exports
// ==========================================
export { SetupWizard } from './SetupWizard';
export { DailyTimelineLedger } from './DailyTimelineLedger';
export { NativeAnalyticsSuite } from './NativeAnalyticsSuite';
