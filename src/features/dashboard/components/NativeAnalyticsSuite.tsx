import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart3, 
  TrendingUp, 
  PieChart as PieChartIcon, 
  Hexagon, 
  Layers,
  Sparkles,
  Maximize2,
  Check,
  ChevronRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import { Settings } from '../../../types';
import { TrackerStats, ChartDatum } from '../../../lib/stats';

interface NativeAnalyticsSuiteProps {
  settings: Settings | null;
  stats?: TrackerStats;
  dailyChartData: ChartDatum[];
  cumulativeChartData: ChartDatum[];
  visibleWriters: ('personA' | 'personB')[];
}

const COLORS = {
  personA: '#3b82f6', // blue
  personB: '#ec4899', // pink
  team: '#8b5cf6',    // purple
  target: '#10b981',  // emerald
  accent: '#f59e0b'   // amber
};

export function NativeAnalyticsSuite({
  settings,
  stats,
  dailyChartData,
  cumulativeChartData,
  visibleWriters
}: NativeAnalyticsSuiteProps) {
  const [activeTab, setActiveTab] = useState<'dualAxes' | 'trajectory' | 'daily' | 'donut' | 'radar'>('dualAxes');

  const personAName = settings?.personAName || 'Aaron';
  const personBName = settings?.personBName || 'Electra';
  const metric = settings?.metric || 'words';

  // 1. Dual-Axes Data Calculation
  const dualAxesData = dailyChartData.map((d, idx) => {
    const cumItem = cumulativeChartData[idx];
    return {
      date: d.date.substring(5),
      [personAName]: d.Aaron || 0,
      [personBName]: d.Electra || 0,
      DailyTotal: d.Team || 0,
      CumulativeTotal: cumItem?.Team || 0,
      TargetTrajectory: cumItem?.Goal || 0
    };
  });

  // 2. Writer Share Donut Data
  const aaronTotal = dailyChartData.reduce((acc, d) => acc + (d.Aaron || 0), 0);
  const electraTotal = dailyChartData.reduce((acc, d) => acc + (d.Electra || 0), 0);
  const totalCombined = aaronTotal + electraTotal;

  const donutData = [
    { name: personAName, value: aaronTotal, color: COLORS.personA },
    { name: personBName, value: electraTotal, color: COLORS.personB }
  ];

  // 3. Sprint Radar Dimensions Calculation
  const reqPerDay = stats?.requiredPerDay || 1;
  const todayTeam = stats?.todayTeam || 0;
  const totalTeam = stats?.totalTeam || 0;
  const goal = stats?.goal || 1;
  const streak = stats?.currentStreak || 0;

  const paceScore = Math.min(100, Math.round((todayTeam / Math.max(1, reqPerDay)) * 100));
  const goalScore = Math.min(100, Math.round((totalTeam / Math.max(1, goal)) * 100));
  const streakScore = Math.min(100, streak * 10);
  
  const totalWriterVal = Math.max(1, aaronTotal + electraTotal);
  const balanceRatio = Math.min(aaronTotal, electraTotal) / Math.max(1, Math.max(aaronTotal, electraTotal));
  const balanceScore = Math.round(balanceRatio * 100) || 85;
  const velocityScore = Math.min(100, Math.round((todayTeam / Math.max(1, reqPerDay)) * 90)) || 85;

  const radarData = [
    { metric: 'Daily Pace', score: paceScore || 75, fullMark: 100 },
    { metric: 'Goal Trajectory', score: goalScore || 60, fullMark: 100 },
    { metric: 'Streak Consistency', score: streakScore || 80, fullMark: 100 },
    { metric: 'Team Balance', score: balanceScore || 85, fullMark: 100 },
    { metric: 'Velocity Ratio', score: velocityScore || 90, fullMark: 100 }
  ];

  return (
    <div className="sticker-card p-5 sm:p-7 bg-bg-surface flex flex-col gap-6">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-ink/15 pb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h3 className="text-lg sm:text-xl font-black text-ink tracking-tight">
            Analytics
          </h3>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none bg-bg-paper p-1 border-2 border-ink rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('dualAxes')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'dualAxes'
                ? 'bg-ink text-bg-paper shadow-xs'
                : 'text-ink/70 hover:text-ink'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Velocity
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('trajectory')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'trajectory'
                ? 'bg-ink text-bg-paper shadow-xs'
                : 'text-ink/70 hover:text-ink'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" /> Trajectory
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('daily')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'daily'
                ? 'bg-ink text-bg-paper shadow-xs'
                : 'text-ink/70 hover:text-ink'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" /> Daily
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('donut')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'donut'
                ? 'bg-ink text-bg-paper shadow-xs'
                : 'text-ink/70 hover:text-ink'
            }`}
          >
            <PieChartIcon className="w-3.5 h-3.5" /> Share
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('radar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'radar'
                ? 'bg-ink text-bg-paper shadow-xs'
                : 'text-ink/70 hover:text-ink'
            }`}
          >
            <Hexagon className="w-3.5 h-3.5" /> Radar
          </button>
        </div>
      </div>

      {/* Chart View Content */}
      <div className="w-full h-[420px] sm:h-[500px] relative">
        {/* 1. Dual-Axes Velocity Chart */}
        {activeTab === 'dualAxes' && (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={dualAxesData} margin={{ top: 20, right: 20, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-ink)" strokeOpacity={0.12} />
              <XAxis dataKey="date" tick={{ fill: 'var(--color-ink)', fontSize: 11, fontWeight: 700 }} />
              <YAxis yAxisId="left" tick={{ fill: 'var(--color-ink)', fontSize: 11, fontWeight: 700 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: 'var(--color-ink)', fontSize: 11, fontWeight: 700 }} />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--color-bg-surface)', border: '2px solid var(--color-ink)', borderRadius: '12px', fontWeight: 'bold' }}
              />
              <Legend verticalAlign="top" wrapperStyle={{ fontWeight: 'bold', fontSize: '12px', paddingBottom: '10px' }} />
              {visibleWriters.includes('personA') && <Bar yAxisId="left" name={personAName} dataKey={personAName} fill={COLORS.personA} stackId="daily" />}
              {visibleWriters.includes('personB') && <Bar yAxisId="left" name={personBName} dataKey={personBName} fill={COLORS.personB} stackId="daily" />}
              <Line yAxisId="right" name="Cumulative Total" dataKey="CumulativeTotal" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} />
              <Line yAxisId="right" name="Target Trajectory" dataKey="TargetTrajectory" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        )}

        {/* 2. Cumulative Progress Trajectory */}
        {activeTab === 'trajectory' && (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={cumulativeChartData} margin={{ top: 20, right: 20, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-ink)" strokeOpacity={0.12} />
              <XAxis dataKey="date" tickFormatter={(d) => d.substring(5)} tick={{ fill: 'var(--color-ink)', fontSize: 11, fontWeight: 700 }} />
              <YAxis tick={{ fill: 'var(--color-ink)', fontSize: 11, fontWeight: 700 }} />
              <Tooltip contentStyle={{ backgroundColor: 'var(--color-bg-surface)', border: '2px solid var(--color-ink)', borderRadius: '12px', fontWeight: 'bold' }} />
              <Legend verticalAlign="top" wrapperStyle={{ fontWeight: 'bold', fontSize: '12px', paddingBottom: '10px' }} />
              <Line name="Total Progress" dataKey="Team" stroke="#ec4899" strokeWidth={4} dot={{ r: 5 }} />
              <Line name="Target Trajectory Pace" dataKey="Goal" stroke="#111827" strokeWidth={2} strokeDasharray="6 6" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        )}

        {/* 3. Daily Output vs Target */}
        {activeTab === 'daily' && (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={dailyChartData} margin={{ top: 20, right: 20, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-ink)" strokeOpacity={0.12} />
              <XAxis dataKey="date" tickFormatter={(d) => d.substring(5)} tick={{ fill: 'var(--color-ink)', fontSize: 11, fontWeight: 700 }} />
              <YAxis tick={{ fill: 'var(--color-ink)', fontSize: 11, fontWeight: 700 }} />
              <Tooltip contentStyle={{ backgroundColor: 'var(--color-bg-surface)', border: '2px solid var(--color-ink)', borderRadius: '12px', fontWeight: 'bold' }} />
              <Legend verticalAlign="top" wrapperStyle={{ fontWeight: 'bold', fontSize: '12px', paddingBottom: '10px' }} />
              {visibleWriters.includes('personA') && <Bar name={personAName} dataKey="Aaron" fill={COLORS.personA} radius={[4, 4, 0, 0]} />}
              {visibleWriters.includes('personB') && <Bar name={personBName} dataKey="Electra" fill={COLORS.personB} radius={[4, 4, 0, 0]} />}
              <ReferenceLine y={reqPerDay} label={`Target Pace (${Math.round(reqPerDay)})`} stroke="#10b981" strokeWidth={2} strokeDasharray="4 4" />
            </ComposedChart>
          </ResponsiveContainer>
        )}

        {/* 4. Writer Share Donut Chart */}
        {activeTab === 'donut' && (
          <div className="w-full h-full flex flex-col md:flex-row items-center justify-center gap-8">
            <div className="w-full md:w-1/2 h-[300px] sm:h-[380px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={75}
                    outerRadius={115}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="var(--color-ink)" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'var(--color-bg-surface)', border: '2px solid var(--color-ink)', borderRadius: '12px', fontWeight: 'bold' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs font-black uppercase text-ink/60">Total Written</span>
                <span className="text-2xl font-black text-ink">{totalCombined.toLocaleString()}</span>
                <span className="text-[10px] font-bold text-ink/50 uppercase">{metric}</span>
              </div>
            </div>

            <div className="w-full md:w-1/2 flex flex-col gap-4">
              <div className="p-4 bg-bg-paper border-2 border-ink rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full border border-ink" style={{ backgroundColor: COLORS.personA }} />
                  <div>
                    <h4 className="font-black text-sm text-ink">{personAName}</h4>
                    <p className="text-xs text-ink/70 font-bold">{aaronTotal.toLocaleString()} {metric}</p>
                  </div>
                </div>
                <span className="text-lg font-black font-mono">
                  {totalCombined > 0 ? Math.round((aaronTotal / totalCombined) * 100) : 0}%
                </span>
              </div>

              <div className="p-4 bg-bg-paper border-2 border-ink rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full border border-ink" style={{ backgroundColor: COLORS.personB }} />
                  <div>
                    <h4 className="font-black text-sm text-ink">{personBName}</h4>
                    <p className="text-xs text-ink/70 font-bold">{electraTotal.toLocaleString()} {metric}</p>
                  </div>
                </div>
                <span className="text-lg font-black font-mono">
                  {totalCombined > 0 ? Math.round((electraTotal / totalCombined) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 5. Writing Sprint Radar */}
        {activeTab === 'radar' && (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
              <PolarGrid stroke="var(--color-ink)" strokeOpacity={0.2} />
              <PolarAngleAxis dataKey="metric" tick={{ fill: 'var(--color-ink)', fontSize: 12, fontWeight: 800 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'var(--color-ink)', fontSize: 10 }} />
              <Radar name="Sprint Metrics" dataKey="score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} strokeWidth={3} />
              <Tooltip contentStyle={{ backgroundColor: 'var(--color-bg-surface)', border: '2px solid var(--color-ink)', borderRadius: '12px', fontWeight: 'bold' }} />
            </RadarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
