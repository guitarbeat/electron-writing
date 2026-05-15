import React, { useState, useMemo, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { useTracker } from '../../hooks/useTracker';
import { calculateTrackerStats, getChartData, getHeatmapStats } from '../../lib/stats';
import { format, parseISO, eachDayOfInterval, startOfMonth, endOfMonth } from 'date-fns';
import { SetupWizard } from './components/SetupWizard';
import { GoalSummaryCard } from './components/GoalSummaryCard';
import { QuickLogForm } from './components/QuickLogForm';
import { ProgressChart } from './components/ProgressChart';
import { DashboardHeader } from './components/DashboardHeader';
import { ConsistencyGrid } from './components/ConsistencyGrid';

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
    if (settings && !isLoading && isAuthorized) {
      const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding') === 'true';
      if (!settings.isSetupComplete || !hasSeenOnboarding) {
        setShowGuide(true);
      }
    }
  }, [settings?.isSetupComplete, isLoading, isAuthorized]);

  const heatmapStats = useMemo(() => getHeatmapStats(entries, settings, gridView), [entries, settings, gridView]);

  if (isLoading) return <div className="min-h-screen bg-bg-paper flex items-center justify-center font-black uppercase tracking-widest text-ink">Loading...</div>;

  const currentEntry = entries.find(e => e.date === logDate);
  const metricLabel = settings?.metric === 'pages' ? 'Pages' : 'Words';

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
            
            {/* Left Column */}
            <div className="lg:col-span-4 flex flex-col gap-8 sticky top-8">
              
              <GoalSummaryCard settings={settings} totalTeam={stats.totalTeam} />

              {/* Quick Log Form */}
              <QuickLogForm
                logDate={logDate}
                setLogDate={setLogDate}
                entries={entries}
                settings={settings}
                saveEntry={saveEntry}
                deleteEntry={deleteEntry}
              />
            </div>

            {/* Right Column: Visualization & History */}
            <div className="lg:col-span-8 flex flex-col gap-8">
              {/* Chart */}
              <ProgressChart
                chartView={chartView}
                setChartView={setChartView}
                chartData={chartData}
                settings={settings}
              />

              {/* Activity Grid */}
              <ConsistencyGrid
                gridView={gridView}
                setGridView={setGridView}
                heatmapStats={heatmapStats}
                settings={settings}
                logDate={logDate}
                setLogDate={setLogDate}
              />
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