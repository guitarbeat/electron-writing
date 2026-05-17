import React, { useState, useMemo, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { useTracker } from '../../hooks/useTracker';
import { calculateTrackerStats, getChartData } from '../../lib/stats';
import { SetupWizard } from './components/SetupWizard';
import { GoalSummaryCard } from './components/GoalSummaryCard';
import { ProgressChart } from './components/ProgressChart';
import { DashboardHeader } from './components/DashboardHeader';
import { DailyTimelineLedger } from './components/DailyTimelineLedger';

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
  const [showGuide, setShowGuide] = useState(false);

  const stats = useMemo(() => calculateTrackerStats(entries, settings), [entries, settings]);
  const chartData = useMemo(() => getChartData(entries, chartView), [entries, chartView]);

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

  if (isLoading) return <div className="min-h-screen bg-bg-paper flex items-center justify-center font-black uppercase tracking-widest text-ink">Loading...</div>;

  return (
    <div className="min-h-screen bg-bg-paper text-ink font-sans p-4 md:p-8 selection:bg-primary/20 bg-[url('https://www.transparenttextures.com/patterns/felt.png')]">
      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        
        {/* Header */}
        <DashboardHeader
          settings={settings}
          setShowGuide={setShowGuide}
          logout={logout}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-4">
            <GoalSummaryCard settings={settings} totalTeam={stats.totalTeam} />
          </div>

          <div className="lg:col-span-8">
            <ProgressChart
              chartView={chartView}
              setChartView={setChartView}
              chartData={chartData}
              settings={settings}
            />
          </div>
        </div>

        <DailyTimelineLedger
          entries={entries}
          settings={settings}
          saveEntry={saveEntry}
          deleteEntry={deleteEntry}
        />

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
