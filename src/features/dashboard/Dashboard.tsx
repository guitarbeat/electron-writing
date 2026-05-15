import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart3, 
  Calendar, 
  Settings as SettingsIcon, 
  Plus, 
  Trash2, 
  Edit3, 
  ArrowRight,
  LogOut,
  Download,
  Upload,
  Trophy,
  History,
  PenLine,
  Check
} from 'lucide-react';
import { useTracker } from '../../hooks/useTracker';
import { calculateTrackerStats, getChartData } from '../../lib/stats';
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
import { format, parseISO, eachDayOfInterval, subDays, startOfMonth, endOfMonth, isSameDay, startOfDay } from 'date-fns';
import { Entry, Settings } from '../../types';
import { AuthorAvatar } from '../../components/ui/AuthorAvatar';
import { cn } from '../../lib/utils';

export function Dashboard() {
  const { 
    entries, 
    settings, 
    isAuthorized, 
    isLoading, 
    logout, 
    saveEntry, 
    deleteEntry, 
    updateSettings,
    importData
  } = useTracker();

  const [chartView, setChartView] = useState<'daily' | 'weekly' | 'cumulative'>('daily');
  const [gridView, setGridView] = useState<'team' | 'personA' | 'personB'>('team');
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  const stats = useMemo(() => calculateTrackerStats(entries, settings), [entries, settings]);
  const chartData = useMemo(() => getChartData(entries, chartView), [entries, chartView]);

  const heatmapStats = useMemo(() => {
    if (entries.length === 0) return { rows: [], totalWordsWritten: 0 };
    
    // Sort entries by date
    const sortedEntries = [...entries].sort((a, b) => a.date.localeCompare(b.date));
    const start = parseISO(sortedEntries[0].date);
    const end = settings?.deadline ? parseISO(settings.deadline) : new Date();
    const interval = eachDayOfInterval({ start: startOfMonth(start), end: endOfMonth(end) });

    const rows = interval.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const entry = entries.find(e => e.date === dateStr);
      return {
        dateStr,
        dateObj: day,
        wordsWritten: (entry?.aaronWords || 0) + (entry?.electraWords || 0),
        authorsDaily: {
          personA: entry?.aaronWords || 0,
          personB: entry?.electraWords || 0
        },
        target: (settings?.projectGoal || 0) / (interval.length || 1),
        status: entry ? 'Logged' : 'Pending'
      };
    });

    return { 
      rows, 
      totalWordsWritten: stats.teamTotal,
      dynamicBaseline: (settings?.projectGoal || 0) / (interval.length || 1)
    };
  }, [entries, settings, stats.teamTotal]);

  // Sync settings when they load
  React.useEffect(() => {
    if (settings) {
      if (settings.defaultGridView) setGridView(settings.defaultGridView as any);
      if (settings.defaultChartView) setChartView(settings.defaultChartView as any);
    }
  }, [settings]);

  React.useEffect(() => {
    const hasSeenGuide = localStorage.getItem('clean_writer_guide_seen');
    if (!hasSeenGuide && entries.length === 0 && !isLoading && isAuthorized) {
      setShowGuide(true);
      localStorage.setItem('clean_writer_guide_seen', 'true');
    }
  }, [entries.length, isLoading, isAuthorized]);

  if (isLoading) return <div className="min-h-screen bg-bg-paper flex items-center justify-center font-black uppercase tracking-widest text-ink">Loading...</div>;

  return (
    <div className="min-h-screen bg-bg-paper text-ink font-sans p-4 md:p-8 selection:bg-primary/20 bg-[url('https://www.transparenttextures.com/patterns/felt.png')]">
      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <h1 className="text-display">Smeemo</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowGuide(true)}
              className="button-playful bg-white text-ink text-xs px-5 py-3 flex items-center gap-2"
            >
              <SettingsIcon className="w-4 h-4" />
              Writing Setup
            </button>
            <button
              onClick={logout}
              className="button-playful bg-red-100 text-red-600 shadow-[4px_4px_0_#ef4444] border-red-500 hover:bg-red-200 p-3"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Quick Log & Stats */}
            <div className="lg:col-span-4 flex flex-col gap-8 sticky top-8">
              <QuickLogCard 
                onSave={async (data) => {
                  const success = await saveEntry(data);
                  if (success) setEditingEntry(null);
                  return success;
                }} 
                settings={settings} 
                initialData={editingEntry}
                onCancel={() => setEditingEntry(null)}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <MiniStatCard label="Today" value={stats.todayTeam} subValue="Team" hexColor={settings?.teamColor || "#facc15"} />
                <MiniStatCard label="Active Days" value={stats.activeDays} subValue="Total" color="bg-mint" />
              </div>

              {settings?.goalsEnabled && (
                 <div className="sticker-card p-6 bg-white flex flex-col gap-4">
                   <div className="flex justify-between items-center">
                     <h3 className="text-label">Project Team Goal</h3>
                     <Trophy className="w-5 h-5 text-accent" />
                   </div>
                   <div className="relative h-6 bg-bg-paper border-2 border-ink rounded-full overflow-hidden">
                     <motion.div 
                       className="absolute top-0 left-0 h-full bg-primary"
                       initial={{ width: 0 }}
                       animate={{ width: `${Math.min(100, (stats.teamTotal / (settings?.projectGoal || 1)) * 100)}%` }}
                     />
                   </div>
                   <div className="flex justify-between font-black text-xs uppercase">
                     <span>{stats.teamTotal} {settings?.metric || 'words'}</span>
                     <span>Goal: {settings?.projectGoal}</span>
                   </div>
                   {settings?.deadline && (
                     <div className="text-[9px] font-black uppercase opacity-40 text-center">
                       Deadline: {format(parseISO(settings.deadline), 'MMM d, yyyy')}
                     </div>
                   )}
                 </div>
               )}
            </div>

            {/* Right Column: Visualization & History */}
            <div className="lg:col-span-8 flex flex-col gap-8">
              {/* Activity Race */}
               {settings?.goalsEnabled && (
                 <div className="sticker-card p-6 md:p-8 bg-white flex flex-col gap-10 overflow-hidden relative">
                    <div className="flex justify-between items-center relative z-10">
                       <div className="flex flex-col gap-1">
                           <h3 className="text-label flex items-center gap-2">
                             <Trophy className="w-5 h-5 text-accent" />
                             Project Sprint Progress
                          </h3>
                          <p className="text-[10px] font-bold italic text-ink/40">Duo effort vs. {settings?.projectGoal || 0} {settings?.metric || 'word'} target</p>
                       </div>
                       {settings?.deadline && (
                         <div className="bg-ink text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest hidden md:block">
                            Ends {format(parseISO(settings.deadline), 'MM/dd')}
                         </div>
                       )}
                    </div>
 
                    <div className="relative h-32 bg-bg-paper border-4 border-ink rounded-2xl overflow-hidden shadow-inner group/race">
                       {/* Grid background for race feel */}
                       <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(90deg, #2b1720 1px, transparent 1px)', backgroundSize: '20px 100%' }} />
                       
                       {/* Grid finish line */}
                       <div className="absolute right-12 top-0 bottom-0 w-4 border-x-4 border-dashed border-ink/20 flex items-center justify-center">
                          <div className="text-[8px] font-black uppercase -rotate-90 text-ink/20 tracking-[1em]">FINISH</div>
                       </div>
                       
                       <div className="flex flex-col justify-around h-full py-4 px-6 relative">
                          {/* Aaron Row */}
                          <div className="relative w-full h-10 flex items-center">
                             <motion.div 
                               className="absolute left-0 flex items-center gap-3 drop-shadow-sticker"
                               animate={{ x: `${Math.min(85, (stats.aaronTotal / (settings?.individualGoalsEnabled ? (settings.personAGoal || 1) : (Math.max(1, settings?.projectGoal || 0) / 2))) * 100)}%` }}
                               transition={{ 
                                 type: 'spring', 
                                 stiffness: 60, 
                                 damping: 12,
                                 bounce: 0.5
                               }}
                             >
                                <div className="relative">
                                   <AuthorAvatar name={settings?.personAName || 'A'} color={settings?.personAColor || '#ff4d8d'} size="md" />
                                   <div className="absolute -top-1 -right-1 bg-white border-2 border-ink rounded-full px-1.5 py-0.5 text-[8px] font-black">
                                      {settings?.individualGoalsEnabled 
                                        ? Math.round((stats.aaronTotal / (settings.personAGoal || 1)) * 100)
                                        : settings?.projectGoal ? Math.round((stats.aaronTotal / (settings.projectGoal / 2)) * 100) : 0}%
                                   </div>
                                </div>
                                <div className="flex flex-col -gap-1">
                                   <span className="text-[10px] font-black uppercase leading-tight">{settings?.personAName}</span>
                                   <span className="text-[9px] font-mono opacity-50">{stats.aaronTotal} / {settings?.individualGoalsEnabled ? settings.personAGoal : (settings?.projectGoal || 0) / 2} {settings?.metric || 'words'}</span>
                                </div>
                             </motion.div>
                          </div>
 
                          {/* Team divider line */}
                          <div className="h-0.5 w-full bg-ink/5" />
 
                          {/* Electra Row */}
                          <div className="relative w-full h-10 flex items-center">
                             <motion.div 
                               className="absolute left-0 flex items-center gap-3 drop-shadow-sticker"
                               animate={{ x: `${Math.min(85, (stats.electraTotal / (settings?.individualGoalsEnabled ? (settings.personBGoal || 1) : (Math.max(1, settings?.projectGoal || 0) / 2))) * 100)}%` }}
                               transition={{ 
                                 type: 'spring', 
                                 stiffness: 60, 
                                 damping: 12,
                                 bounce: 0.5
                               }}
                             >
                                <div className="relative">
                                   <AuthorAvatar name={settings?.personBName || 'B'} color={settings?.personBColor || '#7c3aed'} size="md" />
                                   <div className="absolute -top-1 -right-1 bg-white border-2 border-ink rounded-full px-1.5 py-0.5 text-[8px] font-black">
                                      {settings?.individualGoalsEnabled
                                        ? Math.round((stats.electraTotal / (settings.personBGoal || 1)) * 100)
                                        : settings?.projectGoal ? Math.round((stats.electraTotal / (settings.projectGoal / 2)) * 100) : 0}%
                                   </div>
                                </div>
                                <div className="flex flex-col -gap-1">
                                   <span className="text-[10px] font-black uppercase leading-tight">{settings?.personBName}</span>
                                   <span className="text-[9px] font-mono opacity-50">{stats.electraTotal} / {settings?.individualGoalsEnabled ? settings.personBGoal : (settings?.projectGoal || 0) / 2} {settings?.metric || 'words'}</span>
                                </div>
                             </motion.div>
                          </div>
                       </div>
                    </div>
                 </div>
               )}

              {/* Chart */}
              <div className="sticker-card p-6 md:p-8 bg-white h-[450px] flex flex-col gap-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-label flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Writing Progress
                  </h3>
                  <div className="flex bg-bg-paper p-1 border-2 border-ink rounded-lg gap-1">
                    {(['daily', 'weekly', 'cumulative'] as const).map(v => (
                      <button
                        key={v}
                        onClick={() => setChartView(v)}
                        className={`text-[10px] font-black uppercase px-3 py-1 rounded transition-colors ${chartView === v ? 'bg-ink text-white' : 'hover:bg-primary/10'}`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex-1 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(43, 23, 32, 0.1)" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fill: '#2b1720', fontSize: 10, fontWeight: 700 }}
                        axisLine={{ stroke: '#2b1720', strokeWidth: 2 }}
                        tickFormatter={(v) => format(parseISO(v), 'MMM d')}
                      />
                      <YAxis 
                        tick={{ fill: '#2b1720', fontSize: 10, fontWeight: 700 }}
                        axisLine={{ stroke: '#2b1720', strokeWidth: 2 }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fffafc', 
                          border: '4px solid #2b1720',
                          borderRadius: '16px',
                          boxShadow: '4px 4px 0 #2b1720'
                        }}
                        itemStyle={{ fontWeight: 800 }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontWeight: 800, textTransform: 'uppercase', fontSize: '10px' }} />
                      <Line type="monotone" dataKey="Aaron" stroke={settings?.personAColor || "#ff4d8d"} strokeWidth={4} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 8 }} />
                      <Line type="monotone" dataKey="Electra" stroke={settings?.personBColor || "#7c3aed"} strokeWidth={4} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 8 }} />
                      <Line type="monotone" dataKey="Team" stroke={settings?.teamColor || "#facc15"} strokeWidth={4} strokeDasharray="5 5" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Activity Grid */}
              <div className="sticker-card p-6 md:p-8 bg-white flex flex-col gap-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-label flex items-center gap-2">
                    <History className="w-5 h-5 text-mint" />
                    Momentum Grid
                  </h3>
                  <div className="flex bg-bg-paper p-1 border-2 border-ink rounded-lg gap-1">
                    {(['team', 'personA', 'personB'] as const).map(v => (
                      <button
                        key={v}
                        onClick={() => setGridView(v)}
                        className={`text-[10px] font-black uppercase px-3 py-1 rounded transition-colors ${gridView === v ? 'bg-ink text-white' : 'hover:bg-primary/10'}`}
                      >
                        {v === 'team' ? 'Team' : v === 'personA' ? (settings?.personAName || 'A') : (settings?.personBName || 'B')}
                      </button>
                    ))}
                  </div>
                </div>
                <ActivityGrid entries={entries} view={gridView} settings={settings} />
              </div>

              <div className="flex flex-col gap-6">
  
                <div className="sticker-card bg-white p-0 overflow-hidden">
                  <CalendarHeatMap 
                    stats={heatmapStats} 
                    settings={{
                      ...settings,
                      authors: [
                        { id: 'personA', name: settings?.personAName || 'A', color: settings?.personAColor || '#ff4d8d' },
                        { id: 'personB', name: settings?.personBName || 'B', color: settings?.personBColor || '#7c3aed' }
                      ],
                      trackingUnit: settings?.metric || 'words'
                    }}
                    updateLog={async (authorId: string, dateStr: string, field: string, value: number) => {
                      const entry = entries.find(e => e.date === dateStr);
                      const baseEntry = entry || { date: dateStr, aaronWords: 0, electraWords: 0 };
                      
                      const updatedEntry = {
                        ...baseEntry,
                        [authorId === 'personA' ? 'aaronWords' : 'electraWords']: value
                      };
                      
                      await saveEntry(updatedEntry);
                    }}
                  />
                </div>
              </div>
            </div>

          </div>

        <AnimatePresence>
          {showGuide && (
            <SetupWizard 
              settings={settings} 
              onClose={() => setShowGuide(false)} 
              onSave={updateSettings} 
              onImport={importData}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function MiniStatCard({ label, value, subValue, color, hexColor }: { label: string, value: number, subValue: string, color?: string, hexColor?: string }) {
  return (
    <div className={`sticker-card p-6 bg-white flex flex-col items-center justify-center text-center gap-1 group hover:rotate-2 transition-transform`}>
      <p className="text-label text-[10px] opacity-60 tracking-widest">{label}</p>
      <p className="text-data text-ink">{value}</p>
      <p 
        className={cn(
          "text-[10px] font-black uppercase px-2 py-0.5 rounded border-2 border-ink shadow-[2px_2px_0_#2b1720] mt-2 transition-colors",
          color && !hexColor && color
        )}
        style={hexColor ? { backgroundColor: hexColor } : {}}
      >
        {subValue}
      </p>
    </div>
  );
}

function QuickLogCard({ 
  onSave, 
  settings, 
  initialData,
  onCancel
}: { 
  onSave: (entry: Partial<Entry>) => Promise<boolean>, 
  settings: Settings | null,
  initialData?: Entry | null,
  onCancel?: () => void
}) {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [aaron, setAaron] = useState('');
  const [electra, setElectra] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(false);

  React.useEffect(() => {
    if (initialData) {
      setDate(initialData.date);
      setAaron(initialData.aaronWords.toString());
      setElectra(initialData.electraWords.toString());
    } else {
      setDate(format(new Date(), 'yyyy-MM-dd'));
      setAaron('');
      setElectra('');
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const aaronVal = parseInt(aaron) || 0;
    const electraVal = parseInt(electra) || 0;

    if (aaronVal <= 0 && electraVal <= 0) {
      setError(true);
      setTimeout(() => setError(false), 500);
      return;
    }

    setIsSaving(true);
    const success = await onSave({
      date,
      aaronWords: aaronVal,
      electraWords: electraVal
    });
    if (success) {
      setAaron('');
      setElectra('');
    }
    setIsSaving(false);
  };

  return (
    <div className={`sticker-card p-8 bg-bg-surface flex flex-col gap-6 ${error ? 'animate-shake border-primary' : ''}`} id="quick-log">
      <h3 className="text-label flex items-center gap-2">
        <Plus className="w-5 h-5 text-primary" />
        Writing Input: Daily Output
      </h3>
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black uppercase tracking-[0.15em] pl-1 opacity-50 text-ink">Date</label>
          <input 
            type="date" 
            value={date} 
            onChange={e => setDate(e.target.value)}
            className="input-playful py-2 px-3 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-[0.15em] pl-1 opacity-50" style={{ color: settings?.personAColor }}>
              {settings?.personAName}'S {settings?.metric?.toUpperCase() || 'WORDS'}
            </label>
            <input 
              type="number" 
              placeholder="0"
              value={aaron}
              onChange={e => setAaron(e.target.value)}
              className="input-playful py-3 px-4 text-center text-lg"
              style={{ borderColor: aaron ? settings?.personAColor : undefined }}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-[0.15em] pl-1 opacity-50" style={{ color: settings?.personBColor }}>
              {settings?.personBName}'S {settings?.metric?.toUpperCase() || 'WORDS'}
            </label>
            <input 
              type="number" 
              placeholder="0"
              value={electra}
              onChange={e => setElectra(e.target.value)}
              className="input-playful py-3 px-4 text-center text-lg"
              style={{ borderColor: electra ? settings?.personBColor : undefined }}
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={isSaving}
          className={`button-playful mt-2 w-full flex items-center justify-center gap-2 group ${initialData ? 'bg-secondary' : 'bg-primary'}`}
        >
          {isSaving ? 'Synching...' : (
            <>
              {initialData ? 'Update Entry' : 'Log Entry'}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>

        {initialData && (
          <button 
            type="button"
            onClick={onCancel}
            className="text-[10px] font-black uppercase text-ink/40 hover:text-ink transition-colors"
          >
            Cancel Edit
          </button>
        )}
      </form>
    </div>
  );
}

function ActivityGrid({ entries, view, settings }: { entries: Entry[], view: 'team' | 'personA' | 'personB', settings: Settings | null }) {
  const days = useMemo(() => {
    const today = new Date();
    const start = subDays(today, 120); // Show last 120 days
    const interval = eachDayOfInterval({ start, end: today });
    
    return interval.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const entry = entries.find(e => e.date === dateStr);
      let count = 0;
      if (view === 'team') count = (entry?.aaronWords || 0) + (entry?.electraWords || 0);
      else if (view === 'personA') count = entry?.aaronWords || 0;
      else if (view === 'personB') count = entry?.electraWords || 0;
      
      const thresholds = settings?.activityThresholds || [250, 750, 1500];
      let level = 0;
      if (count > 0) {
        if (count < thresholds[0]) level = 1;
        else if (count < thresholds[1]) level = 2;
        else if (count < thresholds[2]) level = 3;
        else level = 4;
      }

      return { day, count, level, dateStr };
    });
  }, [entries, view, settings]);

  const levelColors = useMemo(() => {
    const baseColor = view === 'personA' ? (settings?.personAColor || '#ff4d8d') : 
                      view === 'personB' ? (settings?.personBColor || '#7c3aed') : 
                      (settings?.teamColor || '#2b1720');
    
    // Simple helper to add alpha to hex
    const withAlpha = (hex: string, alpha: number) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    return {
      0: 'transparent',
      1: withAlpha(baseColor, 0.1),
      2: withAlpha(baseColor, 0.3),
      3: withAlpha(baseColor, 0.6),
      4: baseColor
    };
  }, [view, settings]);

  if (days.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 justify-center py-4">
      {days.map((d) => (
        <div 
          key={d.dateStr}
          className="w-4 h-4 rounded-sm border border-ink/5 transition-colors"
          style={{ backgroundColor: levelColors[d.level as keyof typeof levelColors] }}
          title={`${d.dateStr}: ${d.count} ${settings?.metric || 'words'}`}
        />
      ))}
    </div>
  );
}

function SetupWizard({ 
  settings, 
  onClose, 
  onSave, 
  onImport 
}: { 
  settings: Settings | null, 
  onClose: () => void, 
  onSave: (s: Partial<Settings>) => Promise<boolean>,
  onImport: (data: any, mode: 'merge' | 'replace') => Promise<boolean>
}) {
  const [formData, setFormData] = useState<Settings>(settings || {
    personAName: 'Aaron',
    personBName: 'Electra',
    personAColor: '#ff4d8d',
    personBColor: '#7c3aed',
    teamColor: '#2b1720',
    goalsEnabled: true,
    individualGoalsEnabled: true,
    metric: 'words',
    projectGoal: 50000,
    personAGoal: 25000,
    personBGoal: 25000,
    deadline: format(subDays(new Date(), -90), 'yyyy-MM-dd'),
    activityThresholds: [250, 750, 1500],
    defaultChartView: 'daily',
    defaultGridView: 'team',
    updatedAt: new Date()
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [allocationRatio, setAllocationRatio] = useState(50); // 50% for Person A
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Sync goals when team goal or ratio changes
  React.useEffect(() => {
    const aGoal = Math.round(formData.projectGoal * (allocationRatio / 100));
    const bGoal = formData.projectGoal - aGoal;
    setFormData(prev => ({
      ...prev,
      personAGoal: aGoal,
      personBGoal: bGoal,
      individualGoalsEnabled: true
    }));
  }, [formData.projectGoal, allocationRatio]);

  const steps = [
    {
      title: "Welcome to Smeemo",
      description: "Smeemo is a private suite for partners to track their progress. Let's personalize your workspace.",
      icon: <History className="w-8 h-8 text-primary" />
    },
    {
      title: "The Authors",
      description: "Define your names and preferred colors for all readouts.",
      icon: <Edit3 className="w-8 h-8 text-secondary" />
    },
    {
      title: "The Project",
      description: "Set your absolute target and the final deadline for the race.",
      icon: <Trophy className="w-8 h-8 text-accent" />
    },
    {
      title: "Data Integrity",
      description: "Import existing logs or keep this guide for later reference.",
      icon: <Download className="w-8 h-8 text-mint" />
    }
  ];

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(formData);
    setIsSaving(false);
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const mode = confirm('Click OK to MERGE or CANCEL to REPLACE all existing data.') ? 'merge' : 'replace';
        setIsSaving(true);
        const success = await onImport(json, mode);
        setIsSaving(false);
        if (success) alert('Import Successful! 📚');
      } catch (err) {
        alert('Invalid JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-ink/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="sticker-card max-w-xl w-full bg-bg-paper flex flex-col gap-8 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full -translate-y-1/2 translate-x-1/2" />
        
        <div className="p-8 pb-0">
          <div className="flex flex-col items-center text-center gap-4 relative">
            <div className="w-16 h-16 bg-white border-4 border-ink rounded-2xl flex items-center justify-center shadow-sticker">
              {steps[currentStep].icon}
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="text-display text-2xl">{steps[currentStep].title}</h2>
              <p className="text-sm font-bold italic text-ink/60">{steps[currentStep].description}</p>
            </div>
          </div>
        </div>

        <div className="px-8 flex-1">
          {currentStep === 1 && (
            <div className="flex flex-col gap-8 animate-in slide-in-from-bottom-4">
              <AuthorSettingInput 
                label="Writer A" 
                name={formData.personAName} 
                color={formData.personAColor} 
                onNameChange={e => setFormData({...formData, personAName: e.target.value})} 
                onColorChange={e => setFormData({...formData, personAColor: e.target.value})} 
              />
              <AuthorSettingInput 
                label="Writer B" 
                name={formData.personBName} 
                color={formData.personBColor} 
                onNameChange={e => setFormData({...formData, personBName: e.target.value})} 
                onColorChange={e => setFormData({...formData, personBColor: e.target.value})} 
              />
            </div>
          )}

          {currentStep === 2 && (
            <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4">
              <div className="grid grid-cols-2 gap-4">
                {(['words', 'pages'] as const).map(m => (
                  <button 
                    key={m}
                    onClick={() => setFormData({...formData, metric: m})}
                    className={`py-4 text-xs font-black uppercase rounded-xl border-4 border-ink transition-transform hover:scale-[1.02] active:scale-95 ${formData.metric === m ? 'bg-ink text-white shadow-sticker' : 'bg-white hover:bg-primary/5'}`}
                  >
                    Track {m}
                  </button>
                ))}
              </div>
              
              <div className="flex flex-col gap-6">
                <div className="bg-white p-6 border-4 border-ink rounded-2xl flex flex-col gap-3 shadow-sticker">
                   <div className="flex justify-between items-center">
                      <label className="text-label text-[10px]">Project Target ({formData.metric})</label>
                      <input 
                        type="number"
                        value={formData.projectGoal}
                        onChange={e => setFormData({...formData, projectGoal: parseInt(e.target.value) || 0})}
                        className="w-24 bg-transparent text-right text-[10px] font-black uppercase text-accent border-b-2 border-accent/20 focus:border-accent outline-none"
                      />
                   </div>
                   <input 
                    type="range" 
                    min="0" 
                    max="200000" 
                    step="1000"
                    value={formData.projectGoal} 
                    onChange={e => setFormData({...formData, projectGoal: parseInt(e.target.value)})} 
                    className="accent-accent h-2"
                  />
                </div>

                <div className="bg-white p-6 border-4 border-ink rounded-2xl flex flex-col gap-3 shadow-sticker">
                   <div className="flex justify-between items-center">
                      <label className="text-label text-[10px]">Project Deadline</label>
                   </div>
                   <input 
                    type="date" 
                    value={formData.deadline}
                    onChange={e => setFormData({...formData, deadline: e.target.value})} 
                    className="input-playful w-full py-2 text-sm"
                  />
                  <p className="text-[9px] font-bold italic text-ink/40">The heatmap and race will end on this date.</p>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-end px-2">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-black uppercase opacity-40">Goal Allocation</span>
                      <p className="text-[9px] font-bold italic text-ink/40">How should we split the weight?</p>
                    </div>
                    <div className="text-[10px] font-black uppercase text-primary">
                      {allocationRatio}% / {100 - allocationRatio}%
                    </div>
                  </div>

                  <div className="bg-white p-6 border-4 border-ink rounded-2xl flex flex-col gap-6 shadow-sticker relative overflow-hidden">
                    {/* Visual split indicator */}
                    <div className="absolute top-0 left-0 bottom-0 right-0 pointer-events-none flex">
                      <div className="h-full bg-primary/5 transition-all" style={{ width: `${allocationRatio}%` }} />
                      <div className="h-full bg-secondary/5 transition-all flex-1" />
                    </div>

                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      step="5"
                      value={allocationRatio} 
                      onChange={e => setAllocationRatio(parseInt(e.target.value))} 
                      className="accent-primary h-2 relative z-10"
                    />

                    <div className="grid grid-cols-2 gap-4 relative z-10">
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-black uppercase" style={{ color: formData.personAColor }}>{formData.personAName}</label>
                        <div className="text-xl font-black font-mono">
                          {formData.personAGoal.toLocaleString()}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 text-right">
                        <label className="text-[9px] font-black uppercase" style={{ color: formData.personBColor }}>{formData.personBName}</label>
                        <div className="text-xl font-black font-mono">
                          {formData.personBGoal.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4">
              <p className="text-sm font-bold italic text-ink/60 text-center">Need to move data from another machine?</p>
              <div className="grid grid-cols-2 gap-4">
                 <button onClick={() => window.location.href = '/api/export'} className="button-playful bg-mint text-ink py-4">
                    <Download className="w-4 h-4 mx-auto mb-1" /> Export
                 </button>
                 <button onClick={() => fileInputRef.current?.click()} className="button-playful bg-[#facc15] text-ink py-4">
                    <Upload className="w-4 h-4 mx-auto mb-1" /> Import
                 </button>
                 <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".json" />
              </div>
            </div>
          )}
        </div>

        <div className="p-8 pt-0 flex flex-col gap-6">
          <div className="flex justify-center gap-2">
            {steps.map((_, i) => (
              <div 
                key={i} 
                className={`h-2 rounded-full transition-all border-2 border-ink ${i === currentStep ? 'w-10 bg-primary' : 'w-2 bg-white'}`} 
              />
            ))}
          </div>

          <div className="flex gap-4">
            {currentStep > 0 && (
              <button 
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="button-playful bg-white text-ink flex-1"
                disabled={isSaving}
              >
                Back
              </button>
            )}
            <button 
              onClick={handleSave}
              className="button-playful bg-primary text-ink flex-[2] relative"
              disabled={isSaving}
            >
              {isSaving ? 'Synching...' : currentStep === steps.length - 1 ? "Let's Write!" : 'Next Step'}
              {!isSaving && <ArrowRight className="w-4 h-4 absolute right-6 top-1/2 -translate-y-1/2" />}
            </button>
          </div>
          
          {currentStep === 0 && (
            <button onClick={onClose} className="text-[10px] font-black uppercase text-ink/20 hover:text-ink transition-colors text-center">
              Skip for now
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function AuthorSettingInput({ label, name, color, onNameChange, onColorChange }: any) {
  const colorInputRef = React.useRef<HTMLInputElement>(null);
  
  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between items-center px-1">
        <label className="text-[10px] font-black uppercase tracking-widest text-ink/40">{label}</label>
        <span className="text-[8px] font-bold italic text-ink/30 uppercase">Click outline to change color</span>
      </div>
      <div 
        className="relative sticker-card bg-white p-1 border-[10px] transition-all cursor-pointer group"
        style={{ borderColor: color }}
        onClick={() => colorInputRef.current?.click()}
      >
        <input 
          className="w-full py-5 px-6 text-2xl font-black uppercase bg-transparent outline-none border-none text-ink placeholder:text-ink/10" 
          placeholder="ENTER NAME"
          value={name} 
          onChange={onNameChange}
          onClick={(e) => e.stopPropagation()} 
        />
        <div className="absolute right-6 top-1/2 -translate-y-1/2 transition-transform group-hover:scale-110">
           <PenLine className="w-6 h-6 opacity-10" />
        </div>
        <input 
          ref={colorInputRef}
          type="color" 
          className="absolute inset-0 opacity-0 w-0 h-0 pointer-events-none" 
          value={color} 
          onChange={onColorChange} 
        />
      </div>
    </div>
  );
}

function CalendarHeatMap({ stats, settings, logs, updateLog, onDateClick, selectedDateStr, isExpanded, authorId }: any) {
  const months = useMemo(() => {
    if (!stats.rows.length) return [];
    
    // Convert current time to local day for comparison
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

  const author = authorId ? settings.authors.find((a: any) => a.id === authorId) : null;
  const unit = settings.trackingUnit === 'pages' ? 'pages' : 'words';

  return (
    <div className="flex flex-col w-full relative bg-transparent">
      <div className="flex items-center justify-between px-6 py-4 border-b-4 border-ink bg-white z-30 shrink-0">
        <div className="flex items-center gap-2">
           <div className="relative flex h-3 w-3">
             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-mint opacity-75"></span>
             <span className="relative inline-flex rounded-full h-3 w-3 bg-mint border border-ink"></span>
           </div>
           <span className="text-[9px] font-black text-ink tracking-widest uppercase font-mono">Real-Time</span>
        </div>
      </div>
      
      <div className="px-4 pt-4 pb-10 max-h-[800px] overflow-y-auto scrollbar-hide">
        <HeatMapGrid 
          months={months} 
          stats={stats} 
          onDateClick={onDateClick} 
          selectedDateStr={selectedDateStr} 
          unit={unit} 
          authorId={authorId}
          authors={authorId ? [author] : settings.authors}
          updateLog={updateLog}
        />
        
        <div className="mt-8 pt-6 border-t-4 border-ink/10 mb-4 font-mono">
          <HeatMapLegend />
        </div>
      </div>
    </div>
  );
}

function HeatMapGrid({ months, stats, onDateClick, selectedDateStr, unit, authorId, authors, updateLog }: any) {
  const authorsToRender = authors || (authorId ? [ { id: authorId } ] : []);

  return (
    <div className="w-full flex-1 flex flex-col">
      <div className="grid grid-cols-[80px_1fr_1fr] md:grid-cols-[120px_1fr_1fr] gap-0">
        {/* Header */}
        <div className="sticky top-0 bg-white z-20 py-4 border-b-4 border-ink flex items-center justify-center font-black text-[10px] uppercase tracking-widest text-ink/20">Date</div>
        {authorsToRender.map(author => (
          <div key={author.id} className="sticky top-0 bg-white z-20 py-4 border-b-4 border-ink flex items-center justify-center gap-2 px-4">
            <div className="w-3 h-3 rounded-full border-2 border-ink hidden md:block" style={{ backgroundColor: author.color }} />
            <span className="text-[10px] font-black uppercase tracking-widest truncate">{author.name}</span>
          </div>
        ))}

        {/* Rows */}
        {months.map((month: any) => (
          <React.Fragment key={month.label + month.yearLabel}>
            <div className="col-span-3 py-4 bg-bg-surface px-6 border-b-2 border-ink/10">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">{month.label} {month.yearLabel}</span>
            </div>
            {month.days.map((day: any, di: number) => {
              if (!day) return null;
              const isToday = isSameDay(day, startOfDay(new Date()));
              return (
                <React.Fragment key={di}>
                  <div className={`py-3 px-4 border-b-2 border-ink/5 flex flex-col items-center justify-center transition-colors ${isToday ? 'bg-primary/5' : ''}`}>
                    <span className={`text-[10px] font-black uppercase leading-none ${isToday ? 'text-primary' : 'opacity-20'}`}>{format(day, 'EEE')}</span>
                    <span className={`text-sm font-black leading-none mt-1 ${isToday ? 'text-primary scale-110' : 'opacity-40'}`}>{format(day, 'd')}</span>
                  </div>
                  {authorsToRender.map(author => (
                    <div key={author.id} className={`py-3 border-b-2 border-l-2 border-ink/5 flex justify-center transition-colors ${isToday ? 'bg-primary/5' : ''}`}>
                      <HeatMapCell 
                         day={day}
                         author={author}
                         stats={stats}
                         unit={unit}
                         onDateClick={onDateClick}
                         selectedDateStr={selectedDateStr}
                         updateLog={updateLog}
                         getHeatmapColor={getHeatmapColor}
                      />
                    </div>
                  ))}
                </React.Fragment>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function HeatMapCell({ 
  day, 
  author, 
  stats, 
  unit, 
  onDateClick, 
  selectedDateStr, 
  updateLog, 
  getHeatmapColor 
}: any) {
  const dateStr = format(day, 'yyyy-MM-dd');
  const row = stats.rows.find((r: any) => r.dateStr === dateStr);
  const words = row && row.status !== 'Pending' ? (author.id && row.authorsDaily ? (row.authorsDaily[author.id] || 0) : row.wordsWritten) : 0;
  const target = row ? row.target : stats.dynamicBaseline;
  
  const isSelected = dateStr === selectedDateStr;
  
  const style = useMemo(() => {
    const targetVal = row ? row.target : stats.dynamicBaseline;
    const baseColor = author.color || '#ff4d8d';
    
    const withAlpha = (hex: string, alpha: number) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    if (words === 0) return { backgroundColor: 'transparent', borderColor: 'rgba(43, 23, 32, 0.05)', color: 'transparent' };
    
    let alpha = 0.2;
    let borderColor = withAlpha(baseColor, 0.4);
    let textColor = '#2b1720';
    let boxShadow = 'none';

    if (words < targetVal * 0.5) alpha = 0.2;
    else if (words < targetVal) {
      alpha = 0.4;
      borderColor = withAlpha(baseColor, 0.6);
    } else if (words >= targetVal * 1.5) {
      alpha = 1;
      borderColor = '#2b1720';
      textColor = '#fff';
      boxShadow = '2px 2px 0 #2b1720';
    } else {
      alpha = 0.8;
      borderColor = '#2b1720';
      textColor = '#fff';
    }

    return {
      backgroundColor: withAlpha(baseColor, alpha),
      borderColor,
      color: textColor,
      boxShadow
    };
  }, [words, row, stats.dynamicBaseline, author.color]);

  const [isEditing, setIsEditing] = useState(false);
  const [editVal, setEditVal] = useState(words.toString());
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleCommit = () => {
    setIsEditing(false);
    const num = parseInt(editVal);
    if (!isNaN(num) && num !== words && updateLog) {
      updateLog(author.id, dateStr, 'wordsWritten', num);
    } else {
      setEditVal(words.toString());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleCommit();
    if (e.key === 'Escape') {
      setIsEditing(false);
      setEditVal(words.toString());
    }
  };

  const tooltip = `${format(day, 'MMM d, yyyy')}${author.name ? ` (${author.name})` : ''}: ${words} ${unit}`;

  return (
    <div 
      title={isEditing ? undefined : tooltip}
      onClick={() => {
        if (onDateClick) onDateClick(dateStr);
        setIsEditing(true);
      }}
      className={cn(
        "w-11 h-11 rounded-xl border-4 transition-all duration-300 relative flex items-center justify-center overflow-hidden",
        !isEditing && "hover:scale-110 hover:shadow-sticker hover:z-10 hover:rotate-2",
        "cursor-pointer",
        isSelected && "ring-4 ring-primary ring-offset-2 scale-105 z-10 shadow-sticker"
      )}
      style={isEditing ? {} : style}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type="number"
          value={editVal}
          onChange={(e) => setEditVal(e.target.value)}
          onBlur={handleCommit}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
          className="absolute inset-0 w-full h-full bg-white text-ink font-mono text-[10px] font-black text-center border-none focus:ring-0 p-0 m-0"
        />
      ) : (
        words > 0 ? (
          <span className="text-[10px] font-black font-mono leading-none tracking-tight">
            {words >= 1000 ? `${(words / 1000).toFixed(1)}k` : words}
          </span>
        ) : (
          <div className="w-1.5 h-1.5 rounded-full bg-ink/20" />
        )
      )}
    </div>
  );
}

function getHeatmapColor(wordsWritten: number, target: number) {
  if (wordsWritten === 0) return 'bg-bg-paper border-ink/5 text-transparent';
  if (wordsWritten < target * 0.5) return 'bg-accent/20 border-accent/40 text-ink';
  if (wordsWritten < target) return 'bg-accent/40 border-accent/60 text-ink';
  if (wordsWritten >= target * 1.5) return 'bg-primary border-ink shadow-[2px_2px_0_#2b1720] text-white';
  return 'bg-accent border-ink text-white';
}

function HeatMapLegend() {
  return (
    <div className="flex space-x-1.5 text-[9px] text-ink font-black uppercase tracking-[0.2em] items-center font-mono">
      <span className="mr-1 opacity-20">Low</span>
      <div className="w-3.5 h-3.5 rounded-md border-2 border-ink/5" style={{ backgroundColor: 'rgba(43, 23, 32, 0.05)' }}></div>
      <div className="w-3.5 h-3.5 rounded-md border-2 border-ink/10" style={{ backgroundColor: 'rgba(43, 23, 32, 0.2)' }}></div>
      <div className="w-3.5 h-3.5 rounded-md border-2 border-ink/20" style={{ backgroundColor: 'rgba(43, 23, 32, 0.4)' }}></div>
      <div className="w-3.5 h-3.5 rounded-md border-2 border-ink/30" style={{ backgroundColor: 'rgba(43, 23, 32, 0.6)' }}></div>
      <div className="w-3.5 h-3.5 rounded-md border-2 border-ink shadow-[2px_2px_0_#2b1720]" style={{ backgroundColor: 'rgba(43, 23, 32, 1)' }}></div>
      <span className="ml-1 opacity-20">High</span>
    </div>
  );
}
