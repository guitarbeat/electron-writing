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
  History
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
import { format, parseISO, eachDayOfInterval, subDays, startOfMonth, endOfMonth, isSameDay } from 'date-fns';
import { Entry, Settings } from '../../types';
import { AuthorAvatar } from '../../components/ui/AuthorAvatar';

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
              <h1 className="text-display">Clean Writer</h1>
            </div>
            <p className="text-heading text-ink-muted italic opacity-70">
              Collaborative Project: {settings?.personAName} & {settings?.personBName}
            </p>
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
                <MiniStatCard label="Today" value={stats.todayTeam} subValue="Team" color="bg-accent" />
                <MiniStatCard label="Active Days" value={stats.activeDays} subValue="Total" color="bg-mint" />
              </div>

              {settings?.goalsEnabled && (
                <div className="sticker-card p-6 bg-white flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-label">Weekly Team Goal</h3>
                    <Trophy className="w-5 h-5 text-accent" />
                  </div>
                  <div className="relative h-6 bg-bg-paper border-2 border-ink rounded-full overflow-hidden">
                    <motion.div 
                      className="absolute top-0 left-0 h-full bg-primary"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (stats.weekTeam / (settings?.teamWeeklyGoal || 1)) * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between font-black text-xs uppercase">
                    <span>{stats.weekTeam} {settings?.metric || 'words'}</span>
                    <span>Goal: {settings?.teamWeeklyGoal}</span>
                  </div>
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
                            Weekly Sprint Velocity
                         </h3>
                         <p className="text-[10px] font-bold italic text-ink/40">Duo effort vs. {settings?.teamWeeklyGoal || 0} {settings?.metric || 'word'} target</p>
                      </div>
                      <div className="bg-ink text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest hidden md:block">
                         Week {format(new Date(), 'II')}
                      </div>
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
                              animate={{ x: `${Math.min(85, (stats.weekAaron / (settings?.individualGoalsEnabled ? (settings.personAWeeklyGoal || 1) : (Math.max(1, settings?.teamWeeklyGoal || 0) / 2))) * 100)}%` }}
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
                                       ? Math.round((stats.weekAaron / (settings.personAWeeklyGoal || 1)) * 100)
                                       : settings?.teamWeeklyGoal ? Math.round((stats.weekAaron / (settings.teamWeeklyGoal / 2)) * 100) : 0}%
                                  </div>
                               </div>
                               <div className="flex flex-col -gap-1">
                                  <span className="text-[10px] font-black uppercase leading-tight">{settings?.personAName}</span>
                                  <span className="text-[9px] font-mono opacity-50">{stats.weekAaron} / {settings?.individualGoalsEnabled ? settings.personAWeeklyGoal : (settings?.teamWeeklyGoal || 0) / 2} {settings?.metric || 'words'}</span>
                               </div>
                            </motion.div>
                         </div>

                         {/* Team divider line */}
                         <div className="h-0.5 w-full bg-ink/5" />

                         {/* Electra Row */}
                         <div className="relative w-full h-10 flex items-center">
                            <motion.div 
                              className="absolute left-0 flex items-center gap-3 drop-shadow-sticker"
                              animate={{ x: `${Math.min(85, (stats.weekElectra / (settings?.individualGoalsEnabled ? (settings.personBWeeklyGoal || 1) : (Math.max(1, settings?.teamWeeklyGoal || 0) / 2))) * 100)}%` }}
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
                                       ? Math.round((stats.weekElectra / (settings.personBWeeklyGoal || 1)) * 100)
                                       : settings?.teamWeeklyGoal ? Math.round((stats.weekElectra / (settings.teamWeeklyGoal / 2)) * 100) : 0}%
                                  </div>
                               </div>
                               <div className="flex flex-col -gap-1">
                                  <span className="text-[10px] font-black uppercase leading-tight">{settings?.personBName}</span>
                                  <span className="text-[9px] font-mono opacity-50">{stats.weekElectra} / {settings?.individualGoalsEnabled ? settings.personBWeeklyGoal : (settings?.teamWeeklyGoal || 0) / 2} {settings?.metric || 'words'}</span>
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

              {/* History Feed (Vertical Calendar Style) */}
              <div className="flex flex-col gap-6">
                <div className="flex justify-between items-center px-4 md:px-0">
                   <div className="flex flex-col gap-1">
                      <h3 className="text-label">Writing History</h3>
                      <p className="text-[10px] font-bold italic text-ink/40">A chronological record of duo-author output</p>
                   </div>
                </div>

                <div className="flex flex-col gap-8 relative pl-4 md:pl-8">
                  {/* Timeline Line */}
                  <div className="absolute left-[30px] md:left-[46px] top-0 bottom-0 w-1 bg-ink/10 rounded-full" />

                  {entries.slice(0, 20).map((entry, index) => {
                    const entryDate = parseISO(entry.date);
                    return (
                      <motion.div 
                        key={entry.id}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.05 }}
                        className="relative flex gap-6 md:gap-10 items-start group"
                      >
                        {/* Date Marker */}
                        <div className="relative z-10 flex flex-col items-center">
                          <div className="w-8 h-8 md:w-12 md:h-12 bg-white border-4 border-ink rounded-xl flex flex-col items-center justify-center shadow-sticker group-hover:bg-primary/10 transition-colors">
                            <span className="text-[10px] md:text-xs font-black leading-none uppercase">{format(entryDate, 'MMM')}</span>
                            <span className="text-xs md:text-lg font-black leading-none">{format(entryDate, 'd')}</span>
                          </div>
                          <div className="text-[8px] font-black uppercase text-ink/30 mt-2 tracking-widest">{format(entryDate, 'EEE')}</div>
                        </div>

                        {/* Entry Content Card */}
                        <div className="flex-1 sticker-card bg-white p-5 md:p-6 flex flex-col gap-4 group-hover:translate-x-1 transition-transform">
                          <div className="flex flex-wrap justify-between items-start gap-4">
                            <div className="flex gap-2">
                              <div 
                                className="px-3 py-1 rounded-full border-2 border-ink text-[10px] font-black uppercase shadow-[2px_2px_0_#2b1720]"
                                style={{ backgroundColor: settings?.personAColor + '20', color: settings?.personAColor }}
                              >
                                {settings?.personAName}: {entry.aaronWords.toLocaleString()} {settings?.metric || 'words'}
                              </div>
                              <div 
                                className="px-3 py-1 rounded-full border-2 border-ink text-[10px] font-black uppercase shadow-[2px_2px_0_#2b1720]"
                                style={{ backgroundColor: settings?.personBColor + '20', color: settings?.personBColor }}
                              >
                                {settings?.personBName}: {entry.electraWords.toLocaleString()} {settings?.metric || 'words'}
                              </div>
                            </div>

                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => {
                                  setEditingEntry(entry);
                                  document.getElementById('quick-log')?.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="p-2 hover:bg-bg-paper rounded-lg border border-transparent hover:border-ink/10 transition-all text-ink/40 hover:text-primary"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => deleteEntry(entry.id)}
                                className="p-2 hover:bg-bg-paper rounded-lg border border-transparent hover:border-ink/10 transition-all text-ink/40 hover:text-red-500"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {entry.note ? (
                            <div className="relative pl-4 border-l-4 border-accent/20">
                              <p className="text-sm md:text-base italic font-serif leading-relaxed text-ink/80">"{entry.note}"</p>
                            </div>
                          ) : (
                            <p className="text-xs font-bold italic text-ink/20">No field notes recorded for this date.</p>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}

                  {entries.length === 0 && (
                    <div className="sticker-card bg-white p-12 text-center flex flex-col items-center gap-4">
                      <History className="w-12 h-12 text-ink/10" />
                      <div className="flex flex-col gap-1">
                        <p className="text-display text-xl">The Ledger is Silent</p>
                        <p className="text-sm font-bold italic text-ink/40">Ready to log your first collaborative milestone?</p>
                      </div>
                    </div>
                  )}
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

function MiniStatCard({ label, value, subValue, color }: { label: string, value: number, subValue: string, color: string }) {
  return (
    <div className={`sticker-card p-6 bg-white flex flex-col items-center justify-center text-center gap-1 group hover:rotate-2 transition-transform`}>
      <p className="text-label text-[10px] opacity-60 tracking-widest">{label}</p>
      <p className="text-data text-ink">{value}</p>
      <p className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border-2 border-ink ${color} shadow-[2px_2px_0_#2b1720] mt-2`}>
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
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(false);

  React.useEffect(() => {
    if (initialData) {
      setDate(initialData.date);
      setAaron(initialData.aaronWords.toString());
      setElectra(initialData.electraWords.toString());
      setNote(initialData.note || '');
    } else {
      setDate(format(new Date(), 'yyyy-MM-dd'));
      setAaron('');
      setElectra('');
      setNote('');
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
      electraWords: electraVal,
      note
    });
    if (success) {
      setAaron('');
      setElectra('');
      setNote('');
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

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black uppercase tracking-[0.15em] pl-1 opacity-50 text-ink">Notes</label>
          <input 
            type="text" 
            placeholder="Drafted opening scene..."
            value={note}
            onChange={e => setNote(e.target.value)}
            className="input-playful py-3 px-4 text-sm italic"
          />
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

  const levelColors = {
    0: 'bg-bg-paper',
    1: 'bg-primary/20',
    2: 'bg-primary/40',
    3: 'bg-primary/70',
    4: 'bg-primary'
  };

  if (view === 'personB') {
    levelColors[1] = 'bg-secondary/20';
    levelColors[2] = 'bg-secondary/40';
    levelColors[3] = 'bg-secondary/70';
    levelColors[4] = 'bg-secondary';
  } else if (view === 'team') {
    const teamColor = settings?.teamColor || '#2b1720';
    // Since we don't have secondary opacity for arbitrary hex easily without a helper,
    // we use the team color if it's the primary/secondary, or fallback to accent.
    levelColors[1] = 'bg-accent/20';
    levelColors[2] = 'bg-accent/40';
    levelColors[3] = 'bg-accent/70';
    levelColors[4] = 'bg-accent';
  }

  return (
    <div className="flex flex-wrap gap-2 justify-center py-4">
      {days.map((d, i) => (
        <div 
          key={d.dateStr}
          className={`w-4 h-4 rounded-sm border border-ink/5 ${levelColors[d.level as keyof typeof levelColors]}`}
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
    individualGoalsEnabled: false,
    metric: 'words',
    teamWeeklyGoal: 7000,
    personAWeeklyGoal: 3500,
    personBWeeklyGoal: 3500,
    activityThresholds: [250, 750, 1500],
    defaultChartView: 'daily',
    defaultGridView: 'team',
    updatedAt: new Date()
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const steps = [
    {
      title: "Welcome to Clean Writer",
      description: "Clean Writer is a private suite for partners to track their progress. Let's personalize your workspace.",
      icon: <History className="w-8 h-8 text-primary" />
    },
    {
      title: "The Authors",
      description: "Define your names and preferred colors for all readouts.",
      icon: <Edit3 className="w-8 h-8 text-secondary" />
    },
    {
      title: "The Goals",
      description: "What are you tracking this week? Set your targets and chosen metric.",
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
            <div className="grid grid-cols-2 gap-6 animate-in slide-in-from-bottom-4">
              <div className="flex flex-col gap-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-ink/40">Writer A</label>
                <input className="input-playful w-full py-2" value={formData.personAName} onChange={e => setFormData({...formData, personAName: e.target.value})} />
                <input type="color" className="w-full h-10 rounded border-2 border-ink" value={formData.personAColor} onChange={e => setFormData({...formData, personAColor: e.target.value})} />
              </div>
              <div className="flex flex-col gap-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-ink/40">Writer B</label>
                <input className="input-playful w-full py-2" value={formData.personBName} onChange={e => setFormData({...formData, personBName: e.target.value})} />
                <input type="color" className="w-full h-10 rounded border-2 border-ink" value={formData.personBColor} onChange={e => setFormData({...formData, personBColor: e.target.value})} />
              </div>
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
              
              <div className="flex flex-col gap-4">
                <div className="bg-white p-6 border-4 border-ink rounded-2xl flex flex-col gap-3 shadow-sticker">
                   <div className="flex justify-between items-center">
                      <label className="text-label text-[10px]">Team Weekly Target</label>
                      <input 
                        type="number"
                        value={formData.teamWeeklyGoal}
                        onChange={e => setFormData({...formData, teamWeeklyGoal: parseInt(e.target.value) || 0})}
                        className="w-24 bg-transparent text-right text-[10px] font-black uppercase text-accent border-b-2 border-accent/20 focus:border-accent outline-none"
                      />
                   </div>
                   <input 
                    type="range" 
                    min="0" 
                    max="100000" 
                    step="500"
                    value={formData.teamWeeklyGoal} 
                    onChange={e => setFormData({...formData, teamWeeklyGoal: parseInt(e.target.value)})} 
                    className="accent-accent h-2"
                  />
                </div>

                <div className="flex items-center gap-3 px-2">
                  <input 
                    type="checkbox" 
                    id="indiv-goals"
                    checked={formData.individualGoalsEnabled} 
                    onChange={e => setFormData({...formData, individualGoalsEnabled: e.target.checked})} 
                    className="w-5 h-5 border-2 border-ink rounded accent-primary" 
                  />
                  <label htmlFor="indiv-goals" className="text-[10px] font-black uppercase tracking-widest cursor-pointer">Individual Goals</label>
                </div>

                {formData.individualGoalsEnabled && (
                  <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                    <div className="bg-white p-4 border-4 border-ink rounded-2xl flex flex-col gap-2 shadow-sticker">
                      <label className="text-[9px] font-black uppercase opacity-40">{formData.personAName}</label>
                      <input 
                        type="number"
                        value={formData.personAWeeklyGoal}
                        onChange={e => setFormData({...formData, personAWeeklyGoal: parseInt(e.target.value) || 0})}
                        className="bg-transparent text-xs font-black uppercase text-primary border-b-2 border-primary/20 focus:border-primary outline-none"
                      />
                    </div>
                    <div className="bg-white p-4 border-4 border-ink rounded-2xl flex flex-col gap-2 shadow-sticker">
                      <label className="text-[9px] font-black uppercase opacity-40">{formData.personBName}</label>
                      <input 
                        type="number"
                        value={formData.personBWeeklyGoal}
                        onChange={e => setFormData({...formData, personBWeeklyGoal: parseInt(e.target.value) || 0})}
                        className="bg-transparent text-xs font-black uppercase text-secondary border-b-2 border-secondary/20 focus:border-secondary outline-none"
                      />
                    </div>
                  </div>
                )}
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
