import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Settings as SettingsIcon, Trophy, Calendar, ArrowRight, Lock, X, Zap, Minus, Plus } from 'lucide-react';
import { format, addMonths, endOfYear, differenceInDays, parseISO, isValid } from 'date-fns';
import { Settings } from '../../../types';
import { UserSettingsInput, CalendarPicker } from '../../../components/ui';
import { cn } from '../../../lib/utils';

function safeParseDeadline(deadline?: string | null): Date {
  if (!deadline || typeof deadline !== 'string' || !deadline.trim()) {
    return addMonths(new Date(), 3);
  }
  try {
    const parsed = parseISO(deadline);
    return isValid(parsed) ? parsed : addMonths(new Date(), 3);
  } catch {
    return addMonths(new Date(), 3);
  }
}

export function ProjectSettingsStep({
  formData,
  setFormData,
  originalSettings,
  onAutoSave,
}: {
  formData: Settings;
  setFormData: React.Dispatch<React.SetStateAction<Settings>>;
  originalSettings?: Settings | null;
  onAutoSave?: (partial: Partial<Settings>) => void;
}) {
  const isPages = formData.metric === 'pages';
  const stepAmount = isPages ? 10 : 5000;

  const handleMetricChange = (metric: 'words' | 'pages') => {
    const defaultGoal = metric === 'pages' ? 300 : 50000;
    setFormData((prev) => ({ ...prev, metric, projectGoal: defaultGoal }));
    if (onAutoSave) {
      onAutoSave({ metric, projectGoal: defaultGoal });
    }
  };

  const handleGoalChange = (goal: number) => {
    const clamped = Math.max(0, goal);
    setFormData((prev) => ({ ...prev, projectGoal: clamped }));
    if (onAutoSave) {
      onAutoSave({ projectGoal: clamped });
    }
  };

  const adjustGoal = (delta: number) => {
    const current = formData.projectGoal || 0;
    handleGoalChange(Math.max(0, current + delta));
  };

  return (
    <div className="flex flex-col gap-4 animate-in slide-in-from-bottom-4 w-full">
      {/* Metric Selector Tabs */}
      <div className="grid grid-cols-2 gap-2 bg-bg-surface p-1.5 rounded-2xl border-2 border-ink shadow-sm">
        {(["words", "pages"] as const).map((metric) => (
          <button
            key={metric}
            type="button"
            onClick={() => handleMetricChange(metric)}
            className={`py-2 text-xs font-black uppercase rounded-xl transition-all ${
              formData.metric === metric
                ? "bg-ink text-bg-paper shadow-sm"
                : "text-ink hover:bg-ink/5"
            }`}
          >
            Track in {metric}
          </button>
        ))}
      </div>

      {/* Target Word/Page Count Stepper */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <label className="text-[11px] font-black uppercase text-ink/50 tracking-wider">
            Target {isPages ? 'Pages' : 'Words'}
          </label>
          {originalSettings?.isSetupComplete && originalSettings?.projectGoal != null && (
            <span className="text-[10px] font-bold text-ink/40 uppercase">
              Prev: {Number(originalSettings.projectGoal || 0).toLocaleString()} {originalSettings.metric || 'words'}
            </span>
          )}
        </div>

        {/* Big Numeric Stepper Input */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => adjustGoal(-stepAmount)}
            disabled={(formData.projectGoal || 0) <= 0}
            className="w-12 h-12 shrink-0 rounded-2xl border-3 border-ink bg-bg-surface flex items-center justify-center text-ink shadow-sticker active:translate-x-0.5 active:translate-y-0.5 transition-transform hover:bg-ink/5 disabled:opacity-40 disabled:pointer-events-none"
            title={`Decrease by ${stepAmount.toLocaleString()}`}
          >
            <Minus className="w-5 h-5 stroke-[3]" />
          </button>

          <div className="relative flex-1">
            <input
              type="number"
              min={0}
              step={isPages ? 1 : 500}
              value={Number.isNaN(formData.projectGoal) ? '' : (formData.projectGoal ?? '')}
              onChange={(event) => {
                const val = parseInt(event.target.value, 10);
                handleGoalChange(Number.isNaN(val) ? 0 : val);
              }}
              placeholder="0"
              className="w-full text-center font-mono font-black text-3xl py-2.5 px-4 rounded-2xl border-3 border-ink bg-bg-surface text-ink shadow-sticker focus:outline-none focus:ring-2 focus:ring-accent tabular-nums"
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase tracking-wider text-ink/40 pointer-events-none">
              {formData.metric || 'words'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => adjustGoal(stepAmount)}
            className="w-12 h-12 shrink-0 rounded-2xl border-3 border-ink bg-bg-surface flex items-center justify-center text-ink shadow-sticker active:translate-x-0.5 active:translate-y-0.5 transition-transform hover:bg-ink/5"
            title={`Increase by ${stepAmount.toLocaleString()}`}
          >
            <Plus className="w-5 h-5 stroke-[3]" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function SecurityStep({
  formData,
  setFormData,
  onAutoSave,
}: {
  formData: Settings;
  setFormData: React.Dispatch<React.SetStateAction<Settings>>;
  onAutoSave?: (partial: Partial<Settings>) => void;
}) {
  return (
    <div className="flex flex-col gap-4 animate-in slide-in-from-bottom-4 w-full">
      <div className="w-full">
        <label className="text-xs font-black uppercase text-ink/50 mb-2 block px-1">Shared Passcode</label>
        <input
          type="text"
          value={formData.passcode || ""}
          onChange={(e) => {
            const val = e.target.value;
            setFormData((prev) => ({ ...prev, passcode: val }));
            if (onAutoSave) {
              onAutoSave({ passcode: val });
            }
          }}
          placeholder="Default is 0000"
          className="input-playful w-full text-center text-2xl font-mono font-bold tracking-widest py-3"
        />
        <p className="text-[10px] font-bold italic text-ink/40 uppercase mt-2 text-center">
          This overrides the environment variable passcode.
        </p>
      </div>
    </div>
  );
}

export function DeadlineStep({
  formData,
  setFormData,
  originalSettings,
  onAutoSave,
}: {
  formData: Settings;
  setFormData: React.Dispatch<React.SetStateAction<Settings>>;
  originalSettings?: Settings | null;
  onAutoSave?: (partial: Partial<Settings>) => void;
}) {
  const today = new Date();
  
  const presets = [
    { label: '+1 Mo', date: format(addMonths(today, 1), 'yyyy-MM-dd') },
    { label: '+3 Mo', date: format(addMonths(today, 3), 'yyyy-MM-dd') },
    { label: '+6 Mo', date: format(addMonths(today, 6), 'yyyy-MM-dd') },
    { label: 'Year End', date: format(endOfYear(today), 'yyyy-MM-dd') },
  ];

  const targetDate = safeParseDeadline(formData.deadline);
  const daysLeft = Math.max(1, differenceInDays(targetDate, today));
  const targetGoal = formData.projectGoal || 50000;
  const dailyPace = Math.ceil(targetGoal / daysLeft);

  const handleDeadlineChange = (deadline: string) => {
    setFormData((prev) => ({ ...prev, deadline }));
    if (onAutoSave) {
      onAutoSave({ deadline });
    }
  };

  return (
    <div className="flex flex-col gap-3 animate-in slide-in-from-bottom-4">
      {originalSettings?.isSetupComplete && originalSettings.deadline && (
        <div className="text-[10px] font-bold text-ink/40 uppercase text-center -mt-1">
          Previous: {originalSettings.deadline}
        </div>
      )}
      <CalendarPicker
        value={formData.deadline || '2026-12-31'}
        onChange={handleDeadlineChange}
        color="#5eead4"
      />

      {/* Quick presets */}
      <div className="grid grid-cols-4 gap-1.5 w-full max-w-[300px] mx-auto">
        {presets.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => handleDeadlineChange(preset.date)}
            className={cn(
              "py-1.5 px-1 rounded-lg border-2 text-[10px] font-black uppercase transition-all duration-150 active:scale-95 text-center truncate",
              formData.deadline === preset.date
                ? "bg-ink text-bg-paper border-ink shadow-sm"
                : "bg-bg-surface text-ink border-ink/20 hover:border-ink hover:bg-bg-paper"
            )}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Live pace preview card */}
      <div className="bg-bg-surface border-2 border-ink rounded-xl p-2.5 sm:p-3 flex items-center justify-between gap-3 shadow-sm max-w-[300px] w-full mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#5eead4] border-2 border-ink flex items-center justify-center shrink-0">
            <Zap className="w-3.5 h-3.5 text-ink" />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase text-ink/50 leading-tight">Pace Needed</span>
            <span className="text-xs font-bold text-ink leading-tight">
              {daysLeft} day{daysLeft === 1 ? '' : 's'} left
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className="font-mono text-sm font-black text-ink block tabular-nums leading-tight">
            ~{(dailyPace || 0).toLocaleString()}
          </span>
          <span className="text-[8px] font-bold uppercase text-ink/50 block leading-tight">
            {formData.metric}/day
          </span>
        </div>
      </div>
    </div>
  );
}

export function SetupWizardActions({
  currentStep,
  totalSteps,
  isSaving,
  onBack,
  onNext,
}: {
  currentStep: number;
  totalSteps: number;
  isSaving: boolean;
  onBack: () => void;
  onNext: () => void;
}) {
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <div className="flex gap-4">
      {currentStep > 0 && (
        <button
          onClick={onBack}
          className="button-playful bg-bg-surface text-ink flex-1"
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
        {isSaving ? "Synching..." : isLastStep ? "Open Desk" : "Continue"}

        {!isSaving && (
          <ArrowRight className="w-4 h-4 absolute right-6 top-1/2 -translate-y-1/2" />
        )}
      </button>
    </div>
  );
}

// Removed WelcomeOverview

export function SetupWizard({ 
  settings, 
  onClose, 
  onSave, 
  onImport,
  initialTab = 'goal'
}: { 
  settings: Settings | null, 
  onClose: () => void, 
  onSave: (s: Partial<Settings>) => Promise<boolean>,
  onImport: (data: any, mode: 'merge' | 'replace') => Promise<boolean>,
  initialTab?: 'goal' | 'deadline' | 'security'
}) {
  const [formData, setFormData] = useState<Settings>(() => ({
    personAName: settings?.personAName || 'Aaron',
    personBName: settings?.personBName || 'Electra',
    personAColor: settings?.personAColor || '#ff4d8d',
    personBColor: settings?.personBColor || '#7c3aed',
    teamColor: settings?.teamColor || '#2b1720',
    goalsEnabled: settings?.goalsEnabled ?? true,
    individualGoalsEnabled: settings?.individualGoalsEnabled ?? false,
    personAWeeklyGoal: settings?.personAWeeklyGoal || 3500,
    personBWeeklyGoal: settings?.personBWeeklyGoal || 3500,
    activityThresholds: settings?.activityThresholds || [250, 750, 1500],
    defaultChartView: settings?.defaultChartView || 'daily',
    defaultGridView: settings?.defaultGridView || 'team',
    isSetupComplete: settings?.isSetupComplete ?? false,
    metric: settings?.metric || 'words',
    projectGoal: settings?.projectGoal || 50000,
    deadline: settings?.deadline || '2026-12-31',
    setupUpdateCount: settings?.setupUpdateCount || 0,
    updatedAt: settings?.updatedAt || new Date(),
    lastModifiedBy: settings?.lastModifiedBy || "System",
    passcode: settings?.passcode || ""
  }));
  const [activeTab, setActiveTab] = useState<'menu' | 'goal' | 'deadline' | 'security'>(initialTab);
  const [errorStep, setErrorStep] = useState<number | null>(null);

  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && settings?.isSetupComplete && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [settings?.isSetupComplete, onClose]);

  const baseSteps = [
    {
      title: "Co-Authors",
      description: "Who's teaming up for this project?",
      icon: <SettingsIcon className="w-8 h-8 text-accent" />
    },
    {
      title: "The Goal",
      description: "Set your sights on the finish line.",
      icon: <Trophy className="w-8 h-8 text-[#facc15]" />
    },
    {
      title: "The Deadline",
      description: "When does the final draft happen?",
      icon: <Calendar className="w-8 h-8 text-[#5eead4]" />
    }
  ];

  const steps = settings?.isSetupComplete 
    ? baseSteps 
    : [
        ...baseSteps,
        {
          title: "Secret Knock",
          description: "Set a passcode to unlock your desk.",
          icon: <Lock className="w-8 h-8 text-[#ff4d8d]" />
        }
      ];

  const handleSave = async (isSkip = false) => {
    setIsSaving(true);
    setErrorStep(null);
    const finalData = { ...formData, lastModifiedBy: "A Writer" };
    if (isSkip || currentStep === steps.length - 1) {
      finalData.isSetupComplete = true;
    }
    const success = await onSave(finalData);
    setIsSaving(false);

    if (!success) {
      setErrorStep(currentStep);
      return;
    }

    if (!isSkip && currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      localStorage.setItem('hasSeenOnboarding', 'true');
      if (onClose) onClose();
    }
  };

  const modalContent = (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => {
        if (e.target === e.currentTarget && settings?.isSetupComplete && onClose) {
          onClose();
        }
      }}
      className="fixed inset-0 bg-ink/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
    >
      <motion.div 
        initial={{ scale: 0.95, y: 15 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 15 }}
        onClick={(e) => e.stopPropagation()}
        className={`sticker-card max-w-md sm:max-w-lg w-full bg-bg-paper flex flex-col relative overflow-hidden max-h-[88vh] my-auto ${errorStep === currentStep ? 'animate-shake border-red-500' : ''}`}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        
        {settings?.isSetupComplete && (
          <button 
            onClick={onClose}
            title="Close Settings"
            className="absolute top-4 right-4 z-20 w-9 h-9 flex items-center justify-center rounded-full bg-bg-surface border-2 border-ink shadow-sm hover:bg-ink hover:text-bg-paper active:translate-y-[1px] active:translate-x-[1px] transition-all focus-visible:outline-none"
          >
            <X className="w-4 h-4 text-ink" />
          </button>
        )}

        {settings?.isSetupComplete ? (
          <div className="p-5 sm:p-6 flex flex-col gap-4 overflow-y-auto max-h-[85vh]">
            <div className="flex items-center justify-between pr-10">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-ink">
                {activeTab === 'menu' ? 'Settings' 
                  : activeTab === 'goal' ? 'The Goal'
                  : activeTab === 'deadline' ? 'The Deadline'
                  : 'Security'}
              </h2>
            </div>
            
            {activeTab === 'menu' && (
              <div className="flex flex-col gap-4">
                <button onClick={() => setActiveTab('goal')} className="button-playful bg-bg-surface text-ink w-full justify-between items-center flex">
                   <div className="flex items-center gap-3"><Trophy className="w-5 h-5 text-[#facc15]"/> <span className="font-bold">The Goal</span></div> <ArrowRight className="w-4 h-4 text-ink/40"/>
                </button>
                <button onClick={() => setActiveTab('deadline')} className="button-playful bg-bg-surface text-ink w-full justify-between items-center flex">
                    <div className="flex items-center gap-3"><Calendar className="w-5 h-5 text-[#5eead4]"/> <span className="font-bold">The Deadline</span></div> <ArrowRight className="w-4 h-4 text-ink/40"/>
                </button>
                <button onClick={() => setActiveTab('security')} className="button-playful bg-bg-surface text-ink w-full justify-between items-center flex">
                    <div className="flex items-center gap-3"><Lock className="w-5 h-5 text-[#ff4d8d]"/> <span className="font-bold">Security</span></div> <ArrowRight className="w-4 h-4 text-ink/40"/>
                </button>
              </div>
            )}

            {activeTab === 'goal' && (
              <div className="flex flex-col gap-4 animate-in slide-in-from-right-4">
                <ProjectSettingsStep 
                  formData={formData} 
                  setFormData={setFormData} 
                  originalSettings={settings} 
                  onAutoSave={(partial) => onSave(partial)}
                />
              </div>
            )}

            {activeTab === 'deadline' && (
              <div className="flex flex-col gap-4 animate-in slide-in-from-right-4">
                <DeadlineStep 
                  formData={formData} 
                  setFormData={setFormData} 
                  originalSettings={settings} 
                  onAutoSave={(partial) => onSave(partial)}
                />
              </div>
            )}

            {activeTab === 'security' && (
              <div className="flex flex-col gap-4 animate-in slide-in-from-right-4">
                <SecurityStep 
                  formData={formData} 
                  setFormData={setFormData} 
                  onAutoSave={(partial) => onSave(partial)}
                />
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="p-6 sm:p-8 pb-0">
              <div className="flex flex-col items-center text-center gap-4 relative">
                <div className="w-16 h-16 bg-bg-surface border-4 border-ink rounded-2xl flex items-center justify-center shadow-sticker">
                  {steps[currentStep].icon}
                </div>
                <div className="flex flex-col gap-1">
                  <h2 className="text-display text-2xl">{steps[currentStep].title}</h2>
                  <p className="text-sm font-bold italic text-ink/60">{steps[currentStep].description}</p>
                </div>
              </div>
            </div>

            <div className="px-6 sm:px-8 flex-1 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="w-full"
                >
                  {currentStep === 0 && (
                    <div className="flex flex-col gap-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <UserSettingsInput
                            value={formData.personAName}
                            onChangeName={(v) => setFormData({...formData, personAName: v})}
                            color={formData.personAColor}
                            onChangeColor={(c) => setFormData({...formData, personAColor: c})}
                            placeholder="Aaron"
                          />
                          <UserSettingsInput
                            value={formData.personBName}
                            onChangeName={(v) => setFormData({...formData, personBName: v})}
                            color={formData.personBColor}
                            onChangeColor={(c) => setFormData({...formData, personBColor: c})}
                            placeholder="Electra"
                          />
                      </div>
                    </div>
                  )}

                  {currentStep === 1 && (
                    <ProjectSettingsStep formData={formData} setFormData={setFormData} originalSettings={settings} />
                  )}

                  {currentStep === 2 && (
                    <DeadlineStep formData={formData} setFormData={setFormData} originalSettings={settings} />
                  )}
                  
                  {currentStep === 3 && (
                    <SecurityStep formData={formData} setFormData={setFormData} />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="p-6 sm:p-8 pt-0 flex flex-col gap-6">
              <div className="flex justify-center gap-2">
                {steps.map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-2 rounded-full transition-[width,background-color] duration-300 ease-out border-2 border-ink ${i === currentStep ? 'w-10 bg-primary' : 'w-2 bg-bg-surface'}`} 
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
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(modalContent, document.body);
}
