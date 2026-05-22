import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
    isAuthorized, 
    isLoading, 
    logout, 
    saveEntry, 
    deleteEntry, 
    updateSettings,
    importData
  } = tracker;

  const [showGuide, setShowGuide] = useState(false);
  const [visibleWriters, setVisibleWriters] = useState<('personA' | 'personB')[]>(['personA', 'personB']);

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

  useEffect(() => {
    if (settings && !isLoading && isAuthorized) {
      const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding') === 'true';
      if (!settings.isSetupComplete || !hasSeenOnboarding) {
        setShowGuide(true);
      }
    }
  }, [settings?.isSetupComplete, isLoading, isAuthorized]);

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
          className="h-20 w-20 rounded-full border-4 border-ink object-cover shadow-sticker outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10"
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
    <div className="min-h-screen bg-bg-paper bg-[url('https://www.transparenttextures.com/patterns/felt.png')] text-ink font-sans p-4 md:p-8 selection:bg-primary/20">
      <motion.div 
        variants={parentVariants}
        initial="hidden"
        animate="visible"
        className="max-w-6xl mx-auto flex flex-col gap-8"
      >
        
        {/* Header */}
        <motion.div variants={childVariants}>
          <DashboardHeader
            settings={settings}
            setShowGuide={setShowGuide}
            logout={logout}
            visibleWriters={visibleWriters}
            toggleWriter={toggleWriter}
          />
        </motion.div>

        <motion.div variants={childVariants} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="order-2 lg:order-1 lg:col-span-5 xl:col-span-4">
            <DailyTimelineLedger
              entries={entries}
              settings={settings}
              saveEntry={wrappedSaveEntry}
              deleteEntry={deleteEntry}
              visibleWriters={visibleWriters}
            />
          </div>

          <div className="order-1 lg:order-2 lg:col-span-7 xl:col-span-8 flex flex-col gap-8">
            <GoalSummaryCard settings={settings} stats={stats} />

            <OverallProgressChart
              chartData={cumulativeChartData}
              settings={settings}
              visibleWriters={visibleWriters}
            />

            <DailyWordCountChart
              chartData={dailyChartData}
              settings={settings}
              visibleWriters={visibleWriters}
            />
          </div>
        </motion.div>

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
