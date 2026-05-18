import React, { useState, useMemo, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
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

  if (!settings) return null;

  return (
    <div className="min-h-screen bg-bg-paper bg-[url('https://www.transparenttextures.com/patterns/felt.png')] text-ink font-sans p-4 md:p-8 selection:bg-primary/20">
      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        
        {/* Header */}
        <DashboardHeader
          settings={settings}
          setShowGuide={setShowGuide}
          logout={logout}
          visibleWriters={visibleWriters}
          toggleWriter={toggleWriter}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
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
      </div>
    </div>
  );
}
