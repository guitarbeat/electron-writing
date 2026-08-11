import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PenTool, Eye, Columns, PlusCircle, BarChart3, Sparkles } from 'lucide-react';
import { calculateTrackerStats, getChartData } from '../../lib/stats';
import { Entry, Settings } from '../../types';
import {
  SetupWizard,
  GoalSummaryCard,
  OverallProgressChart,
  DailyWordCountChart,
  DashboardHeader,
  DailyTimelineLedger
} from './components';


export interface DashboardProps {
  tracker: ReturnType<typeof import('../../hooks/useTracker').useTracker>;
}

export function Dashboard({ tracker }: DashboardProps) {
  const { 
    entries, 
    settings, 
    logout, 
    saveEntry, 
    deleteEntry, 
    updateSettings,
    importData
  } = tracker;

  const [showGuide, setShowGuide] = useState(false);
  const [visibleWriters, setVisibleWriters] = useState<('personA' | 'personB')[]>(['personA', 'personB']);
  const [showLog, setShowLog] = useState(true);
  const [showLook, setShowLook] = useState(true);

  const toggleLog = () => {
    setShowLog(prev => {
      const next = !prev;
      if (!next && !showLook) {
        setShowLook(true);
      }
      return next;
    });
  };

  const toggleLook = () => {
    setShowLook(prev => {
      const next = !prev;
      if (!next && !showLog) {
        setShowLog(true);
      }
      return next;
    });
  };

  const toggleWriter = (writer: 'personA' | 'personB') => {
    setVisibleWriters(prev => {
      if (prev.includes(writer)) {
        if (prev.length === 1) return ['personA', 'personB'];
        return prev.filter(w => w !== writer);
      } else {
        return [...prev, writer];
      }
    });
  };

  const stats = useMemo(() => calculateTrackerStats(entries, settings), [entries, settings]);
  const cumulativeChartData = useMemo(() => getChartData(entries, 'cumulative', settings), [entries, settings]);
  const dailyChartData = useMemo(() => getChartData(entries, 'daily', settings), [entries, settings]);

  const wrappedSaveEntry = async (entry: Partial<Entry>) => {
    await saveEntry(entry);
    return true;
  };

  const wrappedUpdateSettings = async (newSettings: Partial<Settings>) => {
    await updateSettings(newSettings);
    return true;
  };

  if (!settings) {
    return (
      <div className="min-h-screen bg-bg-paper bg-[url('https://www.transparenttextures.com/patterns/felt.png')] flex items-center justify-center flex-col gap-4 text-ink">
        <img
          src="/smeemo.png"
          alt="Smeemo"
          className="object-cover spiky-effect"
          style={{ '--s': '150px' } as React.CSSProperties}
          referrerPolicy="no-referrer"
        />
        <div className="text-display text-2xl animate-pulse">Smeemo is waking up...</div>
      </div>
    );
  }

  const parentVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.05
      }
    }
  };

  const childVariants = {
    hidden: { opacity: 0, y: 15, filter: "blur(4px)" },
    visible: { 
      opacity: 1, 
      y: 0, 
      filter: "blur(0px)",
      transition: { type: "spring", duration: 0.45, bounce: 0 }
    }
  };

  return (
    <div className="min-h-screen bg-bg-paper bg-[url('https://www.transparenttextures.com/patterns/felt.png')] text-ink font-sans p-3 sm:p-6 md:p-8 lg:p-10 selection:bg-primary/20">
      <motion.div 
        variants={parentVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl xl:max-w-[1440px] w-full mx-auto flex flex-col gap-6 md:gap-8"
      >
        
        {/* Header */}
        <motion.div variants={childVariants}>
          <DashboardHeader
            settings={settings}
            setShowGuide={setShowGuide}
            logout={logout}
            updateSettings={wrappedUpdateSettings}
          />
        </motion.div>

        {/* Home Page Controls Toolbar */}
        <motion.div variants={childVariants} className="flex flex-wrap items-center justify-between gap-3 bg-bg-surface border-[3px] sm:border-4 border-ink p-3 sm:p-4 rounded-2xl shadow-sticker">
          {/* Writer Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-black uppercase tracking-wider text-ink/60 mr-1">Writers:</span>
            <button 
              type="button"
              onClick={() => toggleWriter('personA')}
              className={`bg-bg-paper border-2 sm:border-[3px] border-ink shadow-sticker px-3 py-1.5 flex items-center gap-2 min-w-0 transition-all duration-150 ease-out cursor-pointer active:translate-x-0.5 active:translate-y-0.5 ${
                visibleWriters.includes('personA') ? 'opacity-100 hover:scale-[1.02]' : 'opacity-40 hover:opacity-70'
              }`}
            >
              <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-ink shrink-0" style={{ backgroundColor: settings?.personAColor || '#ff4d8d' }} />
              <span className="text-label text-xs sm:text-sm font-black text-ink">{settings?.personAName || 'Aaron'}</span>
            </button>

            <button 
              type="button"
              onClick={() => toggleWriter('personB')}
              className={`bg-bg-paper border-2 sm:border-[3px] border-ink shadow-sticker px-3 py-1.5 flex items-center gap-2 min-w-0 transition-all duration-150 ease-out cursor-pointer active:translate-x-0.5 active:translate-y-0.5 ${
                visibleWriters.includes('personB') ? 'opacity-100 hover:scale-[1.02]' : 'opacity-40 hover:opacity-70'
              }`}
            >
              <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-ink shrink-0" style={{ backgroundColor: settings?.personBColor || '#7c3aed' }} />
              <span className="text-label text-xs sm:text-sm font-black text-ink">{settings?.personBName || 'Electra'}</span>
            </button>
          </div>

          {/* View Toggles (LOG & LOOK) */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={toggleLog}
              title={showLog ? "Click to hide Log timeline" : "Click to show Log timeline"}
              className={`bg-bg-paper border-2 sm:border-[3px] border-ink px-3 py-1.5 flex items-center gap-2 transition-all duration-150 ease-out cursor-pointer active:translate-x-0.5 active:translate-y-0.5 ${
                showLog ? 'opacity-100 shadow-sticker hover:scale-[1.02]' : 'opacity-40 hover:opacity-70 shadow-none'
              }`}
            >
              <div className="w-4 h-4 border-2 border-ink shrink-0 bg-primary flex items-center justify-center text-ink">
                <PenTool className="w-2.5 h-2.5 stroke-[3]" />
              </div>
              <span className="text-label text-xs font-black tracking-wider text-ink uppercase">LOG</span>
              <span className="text-[10px] font-mono font-bold bg-ink/10 px-1.5 py-0.5 rounded text-ink/70">
                {entries.length}
              </span>
            </button>

            <button
              type="button"
              onClick={toggleLook}
              title={showLook ? "Click to hide Look analytics" : "Click to show Look analytics"}
              className={`bg-bg-paper border-2 sm:border-[3px] border-ink px-3 py-1.5 flex items-center gap-2 transition-all duration-150 ease-out cursor-pointer active:translate-x-0.5 active:translate-y-0.5 ${
                showLook ? 'opacity-100 shadow-sticker hover:scale-[1.02]' : 'opacity-40 hover:opacity-70 shadow-none'
              }`}
            >
              <div className="w-4 h-4 border-2 border-ink shrink-0 bg-secondary flex items-center justify-center text-ink">
                <Eye className="w-2.5 h-2.5 stroke-[3]" />
              </div>
              <span className="text-label text-xs font-black tracking-wider text-ink uppercase">LOOK</span>
              <span className="text-[10px] font-mono font-bold bg-ink/10 px-1.5 py-0.5 rounded text-ink/70">
                {stats.totalTeam ? `${stats.totalTeam.toLocaleString()}w` : '0w'}
              </span>
            </button>
          </div>
        </motion.div>

        {/* Dynamic Grid Layout based on Active Toggles */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LOG Component (DailyTimelineLedger) */}
          {showLog && (
            <motion.div 
              variants={childVariants} 
              className={`order-2 lg:order-1 ${
                showLook ? 'lg:col-span-4 xl:col-span-3' : 'lg:col-span-12 max-w-4xl mx-auto w-full'
              }`}
            >
              <DailyTimelineLedger
                entries={entries}
                settings={settings}
                saveEntry={wrappedSaveEntry}
                deleteEntry={deleteEntry}
                visibleWriters={visibleWriters}
              />
            </motion.div>
          )}

          {/* LOOK Component (Charts) */}
          {showLook && (
            <div className={`order-1 lg:order-2 flex flex-col gap-8 ${
              showLog ? 'lg:col-span-8 xl:col-span-9' : 'lg:col-span-12'
            }`}>
              <motion.div variants={childVariants}>
                <OverallProgressChart
                  chartData={cumulativeChartData}
                  settings={settings}
                  stats={stats}
                  visibleWriters={visibleWriters}
                />
              </motion.div>

              <motion.div variants={childVariants}>
                <DailyWordCountChart
                  chartData={dailyChartData}
                  settings={settings}
                  stats={stats}
                  visibleWriters={visibleWriters}
                />
              </motion.div>
            </div>
          )}
        </div>


        <AnimatePresence>
          {showGuide && (
            <SetupWizard 
              settings={settings} 
              onClose={() => setShowGuide(false)} 
              onSave={wrappedUpdateSettings} 
              onImport={importData}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

