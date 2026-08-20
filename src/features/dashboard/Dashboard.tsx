import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PenTool, Eye, Pencil, Check } from 'lucide-react';
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

interface WriterChipProps {
  name: string;
  color: string;
  isVisible: boolean;
  onToggle: () => void;
  onUpdateName: (name: string) => void;
  onUpdateColor: (color: string) => void;
}

function WriterChip({
  name,
  color,
  isVisible,
  onToggle,
  onUpdateName,
  onUpdateColor
}: WriterChipProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraftName(name);
  }, [name]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    const trimmed = draftName.trim();
    if (trimmed && trimmed !== name) {
      onUpdateName(trimmed);
    } else {
      setDraftName(name);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setDraftName(name);
      setIsEditing(false);
    }
  };

  const handleChipKeyDown = (e: React.KeyboardEvent) => {
    if (isEditing) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onToggle();
    }
  };

  return (
    <div
      role="button"
      tabIndex={isEditing ? -1 : 0}
      onKeyDown={handleChipKeyDown}
      onClick={!isEditing ? onToggle : undefined}
      title={!isEditing ? (isVisible ? `Click to filter out ${name}` : `Click to show ${name}`) : undefined}
      style={{
        backgroundColor: isVisible ? `${color}20` : undefined,
        borderColor: isVisible ? 'var(--color-ink)' : 'rgba(0,0,0,0.2)',
      }}
      className={`group relative border-2 px-3 py-1.5 rounded-full flex items-center gap-2 min-w-0 transition-all duration-200 ease-out select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-1 ${
        !isEditing ? 'cursor-pointer active:translate-x-0.5 active:translate-y-0.5' : ''
      } ${
        isVisible 
          ? 'opacity-100 shadow-[2px_2px_0_var(--color-ink)] hover:scale-[1.02]' 
          : 'bg-bg-paper/40 opacity-40 hover:opacity-75 border-dashed shadow-none'
      }`}
    >
      {/* Color Swatch & Active Checkmark / Color Picker */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`relative w-4 h-4 rounded-full border-2 border-ink shrink-0 cursor-pointer overflow-hidden transition-transform hover:scale-110 active:scale-95 flex items-center justify-center ${
          isVisible ? 'shadow-xs' : 'grayscale opacity-60'
        }`} 
        style={{ backgroundColor: color }}
        title="Click to change writer color"
      >
        <input
          type="color"
          value={color}
          onChange={(e) => onUpdateColor(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-20"
        />
        {isVisible && (
          <Check className="w-2.5 h-2.5 text-white stroke-[3.5] relative z-10 pointer-events-none drop-shadow-xs" />
        )}
      </div>

      {isEditing ? (
        <div 
          onClick={(e) => e.stopPropagation()} 
          className="flex items-center gap-1 cursor-default"
        >
          <input
            ref={inputRef}
            type="text"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            onClick={(e) => e.stopPropagation()}
            className="text-xs sm:text-sm font-black uppercase text-ink bg-bg-surface border-2 border-ink px-2 py-0.5 rounded-full outline-none w-20 sm:w-28 font-mono shadow-inner"
            placeholder="Name..."
            maxLength={18}
          />
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSave();
            }}
            title="Save name"
            className="p-0.5 text-ink hover:text-green-600 active:scale-90 transition-transform cursor-pointer"
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 pointer-events-none">
          <span 
            className={`text-xs sm:text-sm font-black tracking-wider uppercase transition-colors ${
              isVisible ? 'text-ink' : 'text-ink/60'
            }`}
          >
            {name}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            title={`Edit name "${name}"`}
            className="pointer-events-auto opacity-0 group-hover:opacity-100 hover:opacity-100 focus:opacity-100 text-ink/50 hover:text-ink transition-opacity p-0.5 cursor-pointer"
          >
            <Pencil className="w-3 h-3 stroke-[2.5]" />
          </button>
        </div>
      )}
    </div>
  );
}


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

  const [settingsTab, setSettingsTab] = useState<'goal' | 'deadline' | 'security' | null>(null);
  const [visibleWriters, setVisibleWriters] = useState<('personA' | 'personB')[]>(['personA', 'personB']);
  const [activeView, setActiveView] = useState<'log' | 'look'>('log');

  const toggleWriter = (writer: 'personA' | 'personB') => {
    setVisibleWriters(prev => {
      if (prev.includes(writer)) {
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
    hidden: { opacity: 0, y: 15 },
    visible: { 
      opacity: 1, 
      y: 0, 
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
            onOpenSettingsTab={(tab) => setSettingsTab(tab)}
            activeSettingsTab={settingsTab}
            logout={logout}
            updateSettings={wrappedUpdateSettings}
          />
        </motion.div>

        {/* Toggles Bar (No outer container card) */}
        <motion.div variants={childVariants} className="flex flex-wrap items-center justify-between gap-3">
          {/* Writer Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <WriterChip
              name={settings?.personAName || 'Aaron'}
              color={settings?.personAColor || '#ff4d8d'}
              isVisible={visibleWriters.includes('personA')}
              onToggle={() => toggleWriter('personA')}
              onUpdateName={(name) => wrappedUpdateSettings({ personAName: name })}
              onUpdateColor={(color) => wrappedUpdateSettings({ personAColor: color })}
            />

            <WriterChip
              name={settings?.personBName || 'Electra'}
              color={settings?.personBColor || '#7c3aed'}
              isVisible={visibleWriters.includes('personB')}
              onToggle={() => toggleWriter('personB')}
              onUpdateName={(name) => wrappedUpdateSettings({ personBName: name })}
              onUpdateColor={(color) => wrappedUpdateSettings({ personBColor: color })}
            />
          </div>

          {/* View Segmented Pill Slider (iOS/macOS style exclusive tabs) */}
          <div 
            role="tablist"
            aria-label="Dashboard Views"
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                e.preventDefault();
                setActiveView(prev => prev === 'log' ? 'look' : 'log');
              }
            }}
            className="relative bg-bg-paper/90 backdrop-blur-xs p-1 rounded-2xl border-2 border-ink shadow-[2px_2px_0_var(--color-ink)] flex items-center select-none"
          >
            <button
              type="button"
              role="tab"
              id="tab-log"
              aria-selected={activeView === 'log'}
              aria-controls="panel-log"
              onClick={() => setActiveView('log')}
              title="Switch to Log timeline view (← / →)"
              className={`relative z-10 px-3.5 py-1.5 rounded-xl text-xs font-black tracking-wider uppercase transition-colors duration-200 cursor-pointer flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink ${
                activeView === 'log' ? 'text-white' : 'text-ink/60 hover:text-ink'
              }`}
            >
              {activeView === 'log' && (
                <motion.div
                  layoutId="segmentedActivePill"
                  className="absolute inset-0 rounded-xl bg-primary border-2 border-ink shadow-xs"
                  transition={{ type: "spring", stiffness: 450, damping: 32 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <PenTool className={`w-3.5 h-3.5 stroke-[2.5] ${activeView === 'log' ? 'text-white' : 'text-primary'}`} />
                <span>LOG</span>
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
                  activeView === 'log' ? 'bg-white/20 text-white' : 'bg-ink/10 text-ink/70'
                }`}>
                  {entries.length}
                </span>
              </span>
            </button>

            <button
              type="button"
              role="tab"
              id="tab-look"
              aria-selected={activeView === 'look'}
              aria-controls="panel-look"
              onClick={() => setActiveView('look')}
              title="Switch to Look analytics view (← / →)"
              className={`relative z-10 px-3.5 py-1.5 rounded-xl text-xs font-black tracking-wider uppercase transition-colors duration-200 cursor-pointer flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink ${
                activeView === 'look' ? 'text-ink' : 'text-ink/60 hover:text-ink'
              }`}
            >
              {activeView === 'look' && (
                <motion.div
                  layoutId="segmentedActivePill"
                  className="absolute inset-0 rounded-xl bg-secondary border-2 border-ink shadow-xs"
                  transition={{ type: "spring", stiffness: 450, damping: 32 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <Eye className={`w-3.5 h-3.5 stroke-[2.5] ${activeView === 'look' ? 'text-ink' : 'text-secondary-foreground'}`} />
                <span>LOOK</span>
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
                  activeView === 'look' ? 'bg-ink/15 text-ink' : 'bg-ink/10 text-ink/70'
                }`}>
                  {stats.totalTeam ? `${stats.totalTeam.toLocaleString()}w` : '0w'}
                </span>
              </span>
            </button>
          </div>
        </motion.div>

        {/* Exclusive Tab View Content */}
        <div className="w-full">
          <AnimatePresence mode="wait">
            {activeView === 'log' ? (
              <motion.div 
                key="log-view"
                id="panel-log"
                role="tabpanel"
                aria-labelledby="tab-log"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-4xl mx-auto"
              >
                <DailyTimelineLedger
                  entries={entries}
                  settings={settings}
                  saveEntry={wrappedSaveEntry}
                  deleteEntry={deleteEntry}
                  visibleWriters={visibleWriters}
                />
              </motion.div>
            ) : (
              <motion.div 
                key="look-view"
                id="panel-look"
                role="tabpanel"
                aria-labelledby="tab-look"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full flex flex-col gap-6 md:gap-8"
              >
                {/* Dynamic Quick Stat Banner based on filtered writers */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  <div className="sticker-card p-3.5 sm:p-4 bg-bg-surface flex flex-col justify-between">
                    <span className="text-[10px] sm:text-xs font-black uppercase text-ink/60 tracking-wider">
                      {visibleWriters.length === 2 ? 'Total Team Words' : visibleWriters.includes('personA') ? `${settings.personAName || 'Aaron'} Total` : visibleWriters.includes('personB') ? `${settings.personBName || 'Electra'} Total` : 'Total Words'}
                    </span>
                    <div className="text-xl sm:text-2xl lg:text-3xl font-black font-mono mt-1 text-ink tabular-nums">
                      {(visibleWriters.length === 2 
                        ? stats.totalTeam 
                        : visibleWriters.includes('personA') 
                          ? stats.totalAaron 
                          : visibleWriters.includes('personB') 
                            ? stats.totalElectra 
                            : 0
                      ).toLocaleString()}
                    </div>
                  </div>

                  <div className="sticker-card p-3.5 sm:p-4 bg-bg-surface flex flex-col justify-between">
                    <span className="text-[10px] sm:text-xs font-black uppercase text-ink/60 tracking-wider">
                      Goal Progress
                    </span>
                    <div className="text-xl sm:text-2xl lg:text-3xl font-black font-mono mt-1 text-primary tabular-nums">
                      {Math.min(100, Math.round(((visibleWriters.length === 2 ? stats.totalTeam : visibleWriters.includes('personA') ? stats.totalAaron : stats.totalElectra) / (stats.goal || 1)) * 100))}%
                    </div>
                  </div>

                  <div className="sticker-card p-3.5 sm:p-4 bg-bg-surface flex flex-col justify-between">
                    <span className="text-[10px] sm:text-xs font-black uppercase text-ink/60 tracking-wider">
                      Active Streak
                    </span>
                    <div className="text-xl sm:text-2xl lg:text-3xl font-black font-mono mt-1 text-accent flex items-center gap-1">
                      🔥 {stats.currentStreak}d
                    </div>
                  </div>

                  <div className="sticker-card p-3.5 sm:p-4 bg-bg-surface flex flex-col justify-between">
                    <span className="text-[10px] sm:text-xs font-black uppercase text-ink/60 tracking-wider">
                      Required Pace
                    </span>
                    <div className="text-xl sm:text-2xl lg:text-3xl font-black font-mono mt-1 text-ink tabular-nums">
                      ~{Math.ceil(stats.requiredPerDay).toLocaleString()}<span className="text-xs font-bold text-ink/60">/d</span>
                    </div>
                  </div>
                </div>

                <OverallProgressChart
                  chartData={cumulativeChartData}
                  settings={settings}
                  stats={stats}
                  visibleWriters={visibleWriters}
                />
                <DailyWordCountChart
                  chartData={dailyChartData}
                  settings={settings}
                  stats={stats}
                  visibleWriters={visibleWriters}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>


        <AnimatePresence>
          {settingsTab && (
            <SetupWizard 
              settings={settings} 
              onClose={() => setSettingsTab(null)} 
              onSave={wrappedUpdateSettings} 
              onImport={importData}
              initialTab={settingsTab}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

