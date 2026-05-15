import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart3, 
  Settings as SettingsIcon, 
  Trash2, 
  ArrowRight,
  LogOut,
  Download,
  Upload,
  Trophy,
  History,
  PenLine,
  Calendar
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
import { Settings } from '../../types';
import { cn } from '../../lib/utils';
import { Knob } from '../../components/ui/Knob';
import { CalendarPicker } from '../../components/ui/CalendarPicker';

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
  const [showGuide, setShowGuide] = useState(false);

  // Form State
  const [logDate, setLogDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [aaronInput, setAaronInput] = useState<string>('');
  const [electraInput, setElectraInput] = useState<string>('');
  const [noteInput, setNoteInput] = useState<string>('');

  const stats = useMemo(() => calculateTrackerStats(entries, settings), [entries, settings]);
  const chartData = useMemo(() => getChartData(entries, chartView), [entries, chartView]);

  const initializedRef = React.useRef(false);

  useEffect(() => {
    if (settings && !initializedRef.current) {
      if (settings.defaultChartView) setChartView(settings.defaultChartView as any);
      if (settings.defaultGridView) setGridView(settings.defaultGridView as any);
      initializedRef.current = true;
    }
  }, [settings]);

  useEffect(() => {
    if (settings && !settings.isSetupComplete && !isLoading && isAuthorized) {
      setShowGuide(true);
    }
  }, [settings?.isSetupComplete, isLoading, isAuthorized, settings]);

  const [currentLogDateInForm, setCurrentLogDateInForm] = useState(logDate);

  // Sync form with selected logDate
  useEffect(() => {
    const isNewDate = currentLogDateInForm !== logDate;
    if (isNewDate) {
      setCurrentLogDateInForm(logDate);
    }
    
    const existing = entries.find(e => e.date === logDate);
    if (existing) {
      if (isNewDate) {
        setAaronInput(existing.aaronWords > 0 ? existing.aaronWords.toString() : '');
        setElectraInput(existing.electraWords > 0 ? existing.electraWords.toString() : '');
        setNoteInput(existing.note || '');
      } else {
        // If not a new date, only update if the inputs are currently empty/unfocused,
        // or just let the API update seamlessly if we added polling.
        // For simplicity, we just safely merge if they aren't typing actively anything different.
        setAaronInput(prev => (prev === '' && existing.aaronWords > 0) ? existing.aaronWords.toString() : prev);
        setElectraInput(prev => (prev === '' && existing.electraWords > 0) ? existing.electraWords.toString() : prev);
        setNoteInput(prev => (prev === '' && existing.note) ? existing.note : prev);
      }
    } else {
      if (isNewDate) {
        setAaronInput('');
        setElectraInput('');
        setNoteInput('');
      }
    }
  }, [logDate, entries, currentLogDateInForm]);

  const handleSaveLog = async (e: React.FormEvent) => {
    e.preventDefault();
    const aaronW = parseInt(aaronInput) || 0;
    const electraW = parseInt(electraInput) || 0;
    
    if (aaronW === 0 && electraW === 0 && !noteInput) return;

    await saveEntry({
      date: logDate,
      aaronWords: aaronW,
      electraWords: electraW,
      note: noteInput
    });
    
    // reset form but keep date if desired. Usually reset to empty if they saved today.
    // Let's just keep the values there so they see it was saved.
  };

  const handleDeleteLog = async () => {
    if (window.confirm('Delete entry for this date?')) {
      await deleteEntry(logDate);
      setAaronInput('');
      setElectraInput('');
      setNoteInput('');
    }
  };

  const heatmapStats = useMemo(() => {
    if (entries.length === 0) return { rows: [], dynamicBaseline: 0 };
    
    const sortedEntries = [...entries].sort((a, b) => a.date.localeCompare(b.date));
    const start = parseISO(sortedEntries[0].date);
    const end = new Date();
    const interval = eachDayOfInterval({ start: startOfMonth(start), end: endOfMonth(end) });

    const rows = interval.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const entry = entries.find(e => e.date === dateStr);
      let words = 0;
      let target = 0;

      if (gridView === 'team') {
        words = entry ? entry.aaronWords + entry.electraWords : 0;
        target = (settings?.projectGoal || 50000) / 100; // placeholder divided daily goal
      } else if (gridView === 'personA') {
        words = entry ? entry.aaronWords : 0;
        target = (settings?.personAWeeklyGoal || 3500) / 7;
      } else {
        words = entry ? entry.electraWords : 0;
        target = (settings?.personBWeeklyGoal || 3500) / 7;
      }

      return {
        dateStr,
        dateObj: day,
        wordsWritten: words,
        target: target || 500,
        status: entry ? 'Logged' : 'Pending',
        note: entry?.note
      };
    });

    return { 
      rows, 
      dynamicBaseline: (settings?.projectGoal || 50000) / 100
    };
  }, [entries, settings, gridView]);

  if (isLoading) return <div className="min-h-screen bg-bg-paper flex items-center justify-center font-black uppercase tracking-widest text-ink">Loading...</div>;

  const currentEntry = entries.find(e => e.date === logDate);
  const metricLabel = settings?.metric === 'pages' ? 'Pages' : 'Words';

  return (
    <div className="min-h-screen bg-bg-paper text-ink font-sans p-4 md:p-8 selection:bg-primary/20 bg-[url('https://www.transparenttextures.com/patterns/felt.png')]">
      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <h1 className="text-display">Smeemo</h1>
            </div>
            <p className="text-sm font-bold opacity-60">
              {settings?.personAName} & {settings?.personBName}'s Tracker
            </p>
          </div>

          <div className="flex items-center gap-4">
            {settings?.updatedAt && (
              <div className="text-[10px] font-black uppercase text-ink/40 tracking-widest text-right">
                LAST MODIFIED {settings.lastModifiedBy && settings.lastModifiedBy !== 'System' ? `BY ${settings.lastModifiedBy.toUpperCase()}` : ''}:<br/>
                {new Date(settings.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
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
            
            {/* Left Column */}
            <div className="lg:col-span-4 flex flex-col gap-8 sticky top-8">
              
              {/* Quick Log Form */}
              <div className="sticker-card p-6 bg-white flex flex-col gap-6">
                 <div className="flex justify-between items-center">
                   <h3 className="text-label flex items-center gap-2">
                     <PenLine className="w-5 h-5" /> Quick Log
                   </h3>
                 </div>
                 
                 <form onSubmit={handleSaveLog} className="flex flex-col gap-4">
                   <div className="flex flex-col gap-1">
                     <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Date</label>
                     <input 
                       type="date"
                       required
                       value={logDate}
                       onChange={e => setLogDate(e.target.value)}
                       className="w-full bg-bg-paper px-4 py-2 rounded-xl border-2 border-ink font-mono focus:bg-white transition-colors"
                     />
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                     <div className="flex flex-col gap-1">
                       <label className="text-[10px] font-black uppercase tracking-widest opacity-60" style={{ color: settings?.personAColor }}>{settings?.personAName} {metricLabel}</label>
                       <input 
                         type="number"
                         min="0"
                         value={aaronInput}
                         onChange={e => setAaronInput(e.target.value)}
                         placeholder="0"
                         className="w-full bg-bg-paper px-4 py-2 rounded-xl border-2 border-ink font-mono focus:bg-white transition-colors"
                       />
                     </div>
                     <div className="flex flex-col gap-1">
                       <label className="text-[10px] font-black uppercase tracking-widest opacity-60" style={{ color: settings?.personBColor }}>{settings?.personBName} {metricLabel}</label>
                       <input 
                         type="number"
                         min="0"
                         value={electraInput}
                         onChange={e => setElectraInput(e.target.value)}
                         placeholder="0"
                         className="w-full bg-bg-paper px-4 py-2 rounded-xl border-2 border-ink font-mono focus:bg-white transition-colors"
                       />
                     </div>
                   </div>

                   <div className="flex flex-col gap-1">
                     <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Note (Optional)</label>
                     <input 
                       type="text"
                       value={noteInput}
                       onChange={e => setNoteInput(e.target.value)}
                       placeholder="What did you work on?"
                       className="w-full bg-bg-paper px-4 py-2 rounded-xl border-2 border-ink font-sans focus:bg-white transition-colors"
                     />
                   </div>

                   <div className="flex gap-2 mt-2">
                     <button type="submit" className="button-playful bg-primary text-ink flex-1 py-3">
                       Save Entry
                     </button>
                     {currentEntry && (
                       <button type="button" onClick={handleDeleteLog} className="button-playful bg-red-100 text-red-600 border-red-500 hover:bg-red-200 px-4">
                         <Trash2 className="w-5 h-5 mx-auto" />
                       </button>
                     )}
                   </div>
                 </form>
              </div>

              {/* Stats Overview */}
              <div className="grid grid-cols-2 gap-4">
                <MiniStatCard 
                   label={`Today's ${settings?.personAName}`} 
                   value={stats.todayAaron} 
                   hexColor={settings?.personAColor || "#ff4d8d"} 
                   onColorChange={(color) => updateSettings({ personAColor: color })}
                />
                <MiniStatCard 
                   label={`Today's ${settings?.personBName}`} 
                   value={stats.todayElectra} 
                   hexColor={settings?.personBColor || "#7c3aed"} 
                   onColorChange={(color) => updateSettings({ personBColor: color })}
                />
                <MiniStatCard 
                   label="Today" 
                   value={stats.todayTeam} 
                   hexColor={settings?.teamColor || "#2b1720"} 
                   textColor="#fff" 
                   onColorChange={(color) => updateSettings({ teamColor: color })}
                />
                <MiniStatCard label="Active Days" value={stats.activeDays} hexColor="#5eead4" />
              </div>

              {/* Goals */}
              {settings?.goalsEnabled && (
                 <div className="flex flex-col gap-4">
                   <GoalCard 
                      title="Project Target"
                      progress={stats.totalTeam || 0}
                      target={settings?.projectGoal || 50000}
                      color={settings?.teamColor || "#2b1720"}
                      textColor={"#ffffff"}
                      onColorChange={(color) => updateSettings({ teamColor: color })}
                   />
                 </div>
               )}
            </div>

            {/* Right Column: Visualization & History */}
            <div className="lg:col-span-8 flex flex-col gap-8">
              {/* Chart */}
              <div className="sticker-card p-6 md:p-8 bg-white h-[450px] flex flex-col gap-6">
                <div className="flex justify-between items-center flex-wrap gap-4">
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
                <div className="w-full h-[300px]">
                  <ResponsiveContainer width="100%" height={300} minWidth={0} minHeight={0}>
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
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }}/>
                      <Line name={settings?.personAName} type="monotone" dataKey="Aaron" stroke={settings?.personAColor} strokeWidth={3} dot={{ r: 3, strokeWidth: 2 }} />
                      <Line name={settings?.personBName} type="monotone" dataKey="Electra" stroke={settings?.personBColor} strokeWidth={3} dot={{ r: 3, strokeWidth: 2 }} />
                      <Line name="Team" type="monotone" dataKey="Team" stroke={settings?.teamColor} strokeWidth={5} dot={{ r: 4, strokeWidth: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Activity Grid */}
              <div className="flex flex-col gap-6">
                <div className="sticker-card bg-white p-6 md:p-8 flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-label flex items-center gap-2">
                       Consistency Grid
                    </h3>
                    <div className="flex bg-bg-paper p-1 border-2 border-ink rounded-lg gap-1">
                      {(['team', 'personA', 'personB'] as const).map(v => (
                        <button
                          key={v}
                          onClick={() => setGridView(v)}
                          className={`text-[10px] font-black uppercase px-3 py-1 rounded transition-colors ${gridView === v ? 'bg-ink text-white' : 'hover:bg-primary/10'}`}
                        >
                          {v === 'personA' ? settings?.personAName : v === 'personB' ? settings?.personBName : 'Team'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <CalendarHeatMap 
                    stats={heatmapStats} 
                    settings={settings}
                    activeColor={
                      gridView === 'team' ? settings?.teamColor :
                      gridView === 'personA' ? settings?.personAColor :
                      settings?.personBColor
                    }
                    onDateClick={(d: string) => { setLogDate(d); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    selectedDateStr={logDate}
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

function LongPressColorArea({ color, onColorChange, children, className, style }: any) {
  const colorInputRef = React.useRef<HTMLInputElement>(null);
  const timerRef = React.useRef<any>(null);

  const startPress = React.useCallback((e: React.SyntheticEvent) => {
    if (!onColorChange) return;
    timerRef.current = setTimeout(() => {
      if (colorInputRef.current) {
         colorInputRef.current.style.pointerEvents = 'auto';
         colorInputRef.current.click();
      }
    }, 500);
  }, [onColorChange]);

  const endPress = React.useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return (
    <div 
       className={cn("relative group", className)} 
       style={style}
       onMouseDown={startPress}
       onMouseUp={endPress}
       onMouseLeave={endPress}
       onTouchStart={startPress}
       onTouchEnd={endPress}
       onContextMenu={(e) => {
           if (onColorChange) {
             e.preventDefault();
             if (colorInputRef.current) colorInputRef.current.click();
           }
       }}
    >
       {children}
       {onColorChange && (
          <>
            <input 
              ref={colorInputRef}
              type="color" 
              value={color || '#ffffff'}
              onChange={e => {
                  onColorChange(e.target.value);
                  if (colorInputRef.current) colorInputRef.current.style.pointerEvents = 'none';
              }}
              onBlur={() => {
                  if (colorInputRef.current) colorInputRef.current.style.pointerEvents = 'none';
              }}
              className="opacity-0 absolute w-full h-full inset-0 pointer-events-none"
            />
            <div className="absolute -bottom-2 right-2 text-[8px] font-black italic text-ink/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none uppercase bg-white/50 px-1 rounded">Hold for color</div>
          </>
       )}
    </div>
  );
}

function MiniStatCard({ label, value, color, hexColor, textColor = '#2b1720', onColorChange }: { label: string, value: number, color?: string, hexColor?: string, textColor?: string, onColorChange?: (c: string) => void }) {
  return (
    <LongPressColorArea 
      color={hexColor} 
      onColorChange={onColorChange}
      className={cn("sticker-card p-4 bg-white flex flex-col items-center justify-center text-center gap-1 transition-transform")}
      style={hexColor ? { backgroundColor: hexColor, borderColor: '#2b1720' } : {}}
    >
      <p className="text-[10px] font-black uppercase opacity-60 tracking-widest" style={{ color: textColor }}>{label}</p>
      <p className="text-display text-2xl" style={{ color: textColor }}>{value}</p>
    </LongPressColorArea>
  );
}

function GoalCard({ title, progress, target, color, textColor = '#2b1720', onColorChange }: { title: string, progress: number, target: number, color: string, textColor?: string, onColorChange?: (c: string) => void }) {
   const percent = Math.min(100, (progress / (target || 1)) * 100);
   return (
     <LongPressColorArea color={color} onColorChange={onColorChange} className="sticker-card p-4 bg-white flex flex-col gap-3">
       <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
         <span>{title}</span>
         <Trophy className="w-4 h-4" />
       </div>
       <div className="relative h-4 border-2 border-ink rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(43,23,32,0.1)' }}>
         <motion.div 
           className="absolute top-0 left-0 h-full border-r-2 border-ink"
           style={{ backgroundColor: color }}
           initial={{ width: 0 }}
           animate={{ width: `${percent}%` }}
         />
       </div>
       <div className="flex justify-between font-black text-xs">
         <span>{progress}</span>
         <span>{target}</span>
       </div>
     </LongPressColorArea>
   );
}


function ProjectSettingsStep({
  formData,
  setFormData,
}: {
  formData: Settings;
  setFormData: React.Dispatch<React.SetStateAction<Settings>>;
}) {
  return (
    <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4">
      <div className="grid grid-cols-2 gap-4">
        {(["words", "pages"] as const).map((metric) => (
          <button
            key={metric}
            onClick={() => setFormData({ ...formData, metric })}
            className={`py-4 text-xs font-black uppercase rounded-xl border-4 border-ink transition-transform hover:scale-[1.02] active:scale-95 ${
              formData.metric === metric
                ? "bg-ink text-white shadow-sticker"
                : "bg-white hover:bg-primary/5"
            }`}
          >
            Track {metric}
          </button>
        ))}
      </div>

      <div className="bg-white p-6 md:p-8 border-4 border-ink rounded-[32px] flex flex-col items-center gap-6 shadow-sticker relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-accent/20" />

        <Knob
          label={`Project Target (${formData.metric})`}
          value={formData.projectGoal}
          min={1000}
          max={200000}
          step={1000}
          onChange={(value) =>
            setFormData({ ...formData, projectGoal: value })
          }
          unit={formData.metric}
          color="#facc15"
        />

        <div className="flex flex-col items-center gap-1">
          <input
            type="number"
            value={formData.projectGoal}
            onChange={(event) =>
              setFormData({
                ...formData,
                projectGoal: parseInt(event.target.value) || 0,
              })
            }
            className="bg-bg-paper px-4 py-2 rounded-xl border-2 border-ink text-center font-mono font-bold text-lg w-32 focus:bg-white transition-colors"
          />

          <p className="text-[9px] font-bold italic text-ink/30 uppercase mt-1">
            Spin to set absolute target
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <CalendarPicker
          label="Project Deadline"
          value={formData.deadline}
          onChange={(deadline) => setFormData({ ...formData, deadline })}
          color="#5eead4"
        />

        <p className="text-[9px] font-bold italic text-ink/40 px-4 text-center">
          The heatmap will end on this date.
        </p>
      </div>
    </div>
  );
}

type SetupWizardActionsProps = {
  currentStep: number;
  totalSteps: number;
  isSaving: boolean;
  onBack: () => void;
  onNext: () => void;
};

export function SetupWizardActions({
  currentStep,
  totalSteps,
  isSaving,
  onBack,
  onNext,
}: SetupWizardActionsProps) {
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <div className="flex gap-4">
      {currentStep > 0 && (
        <button
          onClick={onBack}
          className="button-playful bg-white text-ink flex-1"
          disabled={isSaving}
        >
          Back
        </button>
      )}

      <button
        onClick={onNext}
        className="button-playful bg-primary text-ink flex-[2] relative"
        disabled={isSaving}
      >
        {isSaving ? "Synching..." : isLastStep ? "Let's Write!" : "Next Step"}

        {!isSaving && (
          <ArrowRight className="w-4 h-4 absolute right-6 top-1/2 -translate-y-1/2" />
        )}
      </button>
    </div>
  );
}

import { LongPressInput } from '../../components/ui/LongPressInput';

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
    personAWeeklyGoal: 3500,
    personBWeeklyGoal: 3500,
    activityThresholds: [250, 750, 1500],
    defaultChartView: 'daily',
    defaultGridView: 'team',
    isSetupComplete: false,
    metric: 'words',
    projectGoal: 50000,
    deadline: '2026-12-31',
    updatedAt: new Date()
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const steps = [
    {
      title: "Welcome to Smeemo",
      description: "A private tracker for you and your writing partner.",
      icon: <History className="w-8 h-8 text-primary" />
    },
    {
      title: "The Writers",
      description: "Configure your team.",
      icon: <SettingsIcon className="w-8 h-8 text-accent" />
    },
    {
      title: "Project Target",
      description: "What are we aiming for?",
      icon: <Trophy className="w-8 h-8 text-[#facc15]" />
    },
    {
      title: "Project Deadline",
      description: "When should we finish?",
      icon: <Calendar className="w-8 h-8 text-mint" />
    }
  ];

  const handleSave = async (isSkip = false) => {
    setIsSaving(true);
    const finalData = { ...formData, lastModifiedBy: "A Writer" };
    if (isSkip || currentStep === steps.length - 1) {
      finalData.isSetupComplete = true;
    }
    await onSave(finalData);
    setIsSaving(false);
    if (!isSkip && currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      window.location.reload(); 
      if (onClose) onClose();
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-ink/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6 mt-0"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="sticker-card max-w-xl w-full bg-bg-paper flex flex-col gap-8 relative overflow-hidden max-h-[90vh] overflow-y-auto"
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
            <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4">
               <div className="grid grid-cols-2 gap-4">
                  <LongPressInput
                     value={formData.personAName}
                     onChangeName={(v) => setFormData({...formData, personAName: v})}
                     color={formData.personAColor}
                     onChangeColor={(c) => setFormData({...formData, personAColor: c})}
                     placeholder="Aaron"
                  />
                  <LongPressInput
                     value={formData.personBName}
                     onChangeName={(v) => setFormData({...formData, personBName: v})}
                     color={formData.personBColor}
                     onChangeColor={(c) => setFormData({...formData, personBColor: c})}
                     placeholder="Electra"
                  />
               </div>
            </div>
          )}

          {currentStep === 2 && (
             <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4">
               <div className="grid grid-cols-2 gap-4">
                 {(["words", "pages"] as const).map((metric) => (
                   <button
                     key={metric}
                     onClick={() => setFormData({ ...formData, metric })}
                     className={`py-4 text-xs font-black uppercase rounded-xl border-4 border-ink transition-transform hover:scale-[1.02] active:scale-95 ${
                       formData.metric === metric
                         ? "bg-ink text-white shadow-sticker"
                         : "bg-white hover:bg-primary/5"
                     }`}
                   >
                     Track {metric}
                   </button>
                 ))}
               </div>

               <div className="bg-white p-6 md:p-8 border-4 border-ink rounded-[32px] flex flex-col items-center gap-6 shadow-sticker relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-1 bg-accent/20" />
                 <Knob
                   label={`Project Target (${formData.metric})`}
                   value={formData.projectGoal}
                   min={100}
                   max={formData.metric === 'pages' ? 1000 : 200000}
                   step={formData.metric === 'pages' ? 10 : 1000}
                   onChange={(value) =>
                     setFormData({ ...formData, projectGoal: value })
                   }
                   unit={formData.metric}
                   color="#facc15"
                 />
                 <div className="flex flex-col items-center gap-1">
                   <input
                     type="number"
                     value={formData.projectGoal}
                     onChange={(event) =>
                       setFormData({
                         ...formData,
                         projectGoal: parseInt(event.target.value) || 0,
                       })
                     }
                     className="bg-bg-paper px-4 py-2 rounded-xl border-2 border-ink text-center font-mono font-bold text-lg w-32 focus:bg-white transition-colors"
                   />
                   <p className="text-[9px] font-bold italic text-ink/30 uppercase mt-1">
                     Spin to set absolute target
                   </p>
                 </div>
               </div>
             </div>
          )}

          {currentStep === 3 && (
            <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4">
              <CalendarPicker
                label="Project Deadline"
                value={formData.deadline}
                onChange={(deadline) => setFormData({ ...formData, deadline })}
                color="#5eead4"
              />
              <p className="text-[9px] font-bold italic text-ink/40 px-4 text-center">
                The heatmap will end on this date.
              </p>
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

          <SetupWizardActions 
             currentStep={currentStep}
             totalSteps={steps.length}
             isSaving={isSaving}
             onBack={() => setCurrentStep(prev => prev - 1)}
             onNext={() => handleSave(false)}
          />
          
          {currentStep === 0 && (
            <button onClick={() => handleSave(true)} className="text-[10px] font-black uppercase text-ink/20 hover:text-ink transition-colors text-center">
              Skip for now
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function CalendarHeatMap({ stats, settings, activeColor, onDateClick, selectedDateStr }: any) {
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

function HeatMapGrid({ months, stats, onDateClick, selectedDateStr, activeColor }: any) {
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

function HeatMapCell({ 
  day, 
  stats, 
  onDateClick, 
  selectedDateStr, 
  activeColor 
}: any) {
  const dateStr = format(day, 'yyyy-MM-dd');
  const row = stats.rows.find((r: any) => r.dateStr === dateStr);
  const words = row && row.status !== 'Pending' ? row.wordsWritten : 0;
  const target = row ? row.target : stats.dynamicBaseline;
  
  const isSelected = dateStr === selectedDateStr;
  
  const style = useMemo(() => {
    const targetVal = row ? row.target : stats.dynamicBaseline;
    const baseColor = activeColor || '#facc15';
    
    const withAlpha = (hex: string, alpha: number) => {
      const hexClean = hex.replace('#', '');
      const r = parseInt(hexClean.slice(0, 2), 16);
      const g = parseInt(hexClean.slice(2, 4), 16);
      const b = parseInt(hexClean.slice(4, 6), 16);
      // Fallback for missing colors
      if (isNaN(r) || isNaN(g) || isNaN(b)) return `rgba(43, 23, 32, ${alpha})`;
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    if (words === 0) return { backgroundColor: 'transparent', borderColor: 'rgba(43, 23, 32, 0.05)', color: 'transparent' };
    
    let alpha = 0.2;
    let borderColor = withAlpha(baseColor, 0.4);
    let textColor = '#2b1720';
    let boxShadow = 'none';

    if (words < targetVal * 0.5) alpha = 0.4;
    else if (words < targetVal) {
      alpha = 0.6;
      borderColor = withAlpha(baseColor, 0.8);
    } else {
      alpha = 1;
      borderColor = '#2b1720';
      textColor = '#fff';
      boxShadow = '2px 2px 0 #2b1720';
    }

    return {
      backgroundColor: withAlpha(baseColor, alpha),
      borderColor,
      color: textColor,
      boxShadow
    };
  }, [words, row, stats.dynamicBaseline, activeColor]);

  const tooltip = `${format(day, 'MMM d, yyyy')}: ${words} words` + (row?.note ? ` - ${row.note}` : '');

  return (
    <button 
      title={tooltip}
      onClick={() => onDateClick && onDateClick(dateStr)}
      className={cn(
        "aspect-square rounded-lg border-2 transition-all duration-300 relative flex items-center justify-center overflow-hidden",
        "hover:scale-105 hover:shadow-sticker hover:z-10",
        isSelected && "ring-4 ring-primary ring-offset-2 scale-105 z-10 shadow-sticker"
      )}
      style={style}
    />
  );
}
