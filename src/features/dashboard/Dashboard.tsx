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
          style={{ '--s': '80px' } as React.CSSProperties}
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
            visibleWriters={visibleWriters}
            toggleWriter={toggleWriter}
          />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <motion.div variants={childVariants} className="order-2 lg:order-1 lg:col-span-5 xl:col-span-4">
            <DailyTimelineLedger
              entries={entries}
              settings={settings}
              saveEntry={wrappedSaveEntry}
              deleteEntry={deleteEntry}
              visibleWriters={visibleWriters}
            />
          </motion.div>

          <div className="order-1 lg:order-2 lg:col-span-7 xl:col-span-8 flex flex-col gap-8">
            <motion.div variants={childVariants}>
              <GoalSummaryCard settings={settings} stats={stats} />
            </motion.div>

            <motion.div variants={childVariants}>
              <OverallProgressChart
                chartData={cumulativeChartData}
                settings={settings}
                visibleWriters={visibleWriters}
              />
            </motion.div>

            <motion.div variants={childVariants}>
              <DailyWordCountChart
                chartData={dailyChartData}
                settings={settings}
                visibleWriters={visibleWriters}
              />
            </motion.div>
          </div>
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
