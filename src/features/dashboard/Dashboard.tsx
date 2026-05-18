import React, { useState, useMemo, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { useTracker } from '../../hooks/useTracker';
import { calculateTrackerStats, getChartData } from '../../lib/stats';
import { Entry, Settings } from '../../types';
import {
  SetupWizard,
  GoalSummaryCard,
  ProgressChart,
  DashboardHeader,
  DailyTimelineLedger
} from './components';


export interface DashboardProps {}

export function Dashboard(_props: DashboardProps) {
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
  const chartData = useMemo(() => getChartData(entries, chartView, settings), [entries, chartView, settings]);

  const initializedRef = React.useRef(false);

  useEffect(() => {
    if (settings && !initializedRef.current) {
      if (settings.defaultChartView) setChartView(settings.defaultChartView as any);
      initializedRef.current = true;
    }
  }, [settings]);

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

  if (isLoading) return <div className="min-h-screen bg-bg-paper flex items-center justify-center font-black uppercase tracking-widest text-ink">Loading...</div>;

  return (
    <div className="min-h-screen bg-bg-paper text-ink font-sans p-4 md:p-8 selection:bg-primary/20 bg-[url('https://www.transparenttextures.com/patterns/felt.png')]">
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
            <ProgressChart
              chartView={chartView}
              setChartView={setChartView}
              chartData={chartData}
              settings={settings}
            />

            <GoalSummaryCard settings={settings} stats={stats} />
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
