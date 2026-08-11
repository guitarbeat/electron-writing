import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings as SettingsIcon, Trophy, Calendar, ArrowRight, Lock, Target, X, Zap, Sun, Moon } from 'lucide-react';
import { format, addMonths, endOfYear, differenceInDays, parseISO, isValid } from 'date-fns';
import { Settings } from '../../../types';
import { UserSettingsInput, Knob, CalendarPicker } from '../../../components/ui';
import { cn } from '../../../lib/utils';

export function ProjectSettingsStep({
  formData,
  setFormData,
  originalSettings,
}: {
  formData: Settings;
  setFormData: React.Dispatch<React.SetStateAction<Settings>>;
  originalSettings?: Settings | null;
}) {
  const wordPresets = [
    { label: '10K', value: 10000, desc: 'Novelette' },
    { label: '50K', value: 50000, desc: 'NaNoWriMo' },
    { label: '80K', value: 80000, desc: 'Full Novel' },
    { label: '100K', value: 100000, desc: 'Epic' },
  ];

  const pagePresets = [
    { label: '50 pgs', value: 50, desc: 'Screenplay' },
    { label: '150 pgs', value: 150, desc: 'Novella' },
    { label: '300 pgs', value: 300, desc: 'Standard' },
    { label: '500 pgs', value: 500, desc: 'Tome' },
  ];

  const currentPresets = formData.metric === 'pages' ? pagePresets : wordPresets;

  const today = new Date();
  const parsedDeadline = parseISO(formData.deadline);
  const isValidDate = isValid(parsedDeadline);
  const daysLeft = isValidDate ? Math.max(1, differenceInDays(parsedDeadline, today)) : 1;
  const dailyPace = Math.ceil((formData.projectGoal || 0) / daysLeft);

  return (
    <div className="flex flex-col gap-5 animate-in slide-in-from-bottom-4">
      <div className="grid grid-cols-2 gap-3">
        {(["words", "pages"] as const).map((metric) => (
          <button
            key={metric}
            type="button"
            onClick={() => {
              const defaultGoal = metric === 'pages' ? 300 : 50000;
              setFormData({ ...formData, metric, projectGoal: defaultGoal });
            }}
            className={`py-3 text-xs font-black uppercase rounded-xl border-3 border-ink transition-[transform,background-color,border-color,color] duration-150 ease-out hover:scale-[1.02] active:scale-[0.96] ${
              formData.metric === metric
                ? "bg-ink text-bg-paper shadow-sticker border-ink"
                : "bg-bg-surface hover:bg-primary/5 text-ink"
            }`}
          >
            Track in {metric}
          </button>
        ))}
      </div>

      <div className="bg-bg-surface p-5 md:p-6 border-3 sm:border-4 border-ink rounded-2xl flex flex-col items-center gap-5 shadow-sticker relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-accent/20" />
        
        {originalSettings?.isSetupComplete && (
          <div className="text-[10px] font-bold text-ink/40 uppercase mb-[-10px]">
            Previous: {originalSettings.projectGoal.toLocaleString()} {originalSettings.metric}
          </div>
        )}

        <Knob
          label={`Project Target (${formData.metric})`}
          value={formData.projectGoal}
          min={0}
          max={formData.metric === 'pages' ? 1000 : 200000}
          step={formData.metric === 'pages' ? 1 : 100}
          onChange={(value) =>
            setFormData({ ...formData, projectGoal: value })
          }
          unit={formData.metric}
          color="#facc15"
        />

        <div className="flex flex-col items-center gap-3 w-full">
          <input
            type="number"
            value={Number.isNaN(formData.projectGoal) ? '' : (formData.projectGoal ?? '')}
            onChange={(event) => {
              const val = parseInt(event.target.value, 10);
              setFormData({
                ...formData,
                projectGoal: Number.isNaN(val) ? 0 : val,
              });
            }}
            className="bg-bg-paper px-4 py-2 rounded-xl border-2 border-ink text-center font-mono font-bold text-lg w-36 focus:bg-bg-surface transition-colors tabular-nums"
          />

          <div className="flex items-center justify-center gap-1.5 flex-wrap w-full pt-1">
            {currentPresets.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => setFormData({ ...formData, projectGoal: preset.value })}
                className={cn(
                  "px-2.5 py-1.5 rounded-lg border-2 text-[10px] font-black uppercase transition-[transform,background-color] duration-150 active:scale-[0.95]",
                  formData.projectGoal === preset.value
                    ? "bg-ink text-bg-paper border-ink shadow-sm"
                    : "bg-bg-surface text-ink border-ink/30 hover:border-ink hover:bg-bg-paper"
                )}
              >
                {preset.label} <span className="opacity-60 font-medium">({preset.desc})</span>
              </button>
            ))}
          </div>

          <div className="mt-1 px-3 py-1.5 rounded-lg bg-bg-paper border border-ink/20 flex items-center gap-2 text-xs font-bold text-ink/80">
            <Zap className="w-3.5 h-3.5 text-accent shrink-0" />
            <span>
              Target pace: <strong className="text-ink font-mono font-black">~{dailyPace.toLocaleString()}</strong> {formData.metric}/day ({daysLeft} days remaining)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SecurityStep({
  formData,
  setFormData,
}: {
  formData: Settings;
  setFormData: React.Dispatch<React.SetStateAction<Settings>>;
}) {
  return (
    <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4">
      <div className="bg-bg-surface p-8 border-4 border-ink rounded-[32px] flex flex-col items-center gap-6 shadow-sticker">
        <div className="w-full">
           <label className="text-[10px] font-black uppercase text-ink/40 mb-2 block px-2">Shared Passcode</label>
           <input
             type="text"
             value={formData.passcode || ""}
             onChange={(e) => setFormData({ ...formData, passcode: e.target.value })}
             placeholder="Default is 0000"
             className="input-playful w-full text-center text-xl tracking-widest"
           />
           <p className="text-[9px] font-bold italic text-ink/30 uppercase mt-2 text-center">
             This overrides the environment variable passcode.
           </p>
        </div>
      </div>
    </div>
  );
}

export function DeadlineStep({
  formData,
  setFormData,
  originalSettings,
}: {
  formData: Settings;
  setFormData: React.Dispatch<React.SetStateAction<Settings>>;
  originalSettings?: Settings | null;
}) {
  const today = new Date();
  
  const presets = [
    { label: '+1 Month', date: format(addMonths(today, 1), 'yyyy-MM-dd') },
    { label: '+3 Months', date: format(addMonths(today, 3), 'yyyy-MM-dd') },
    { label: '+6 Months', date: format(addMonths(today, 6), 'yyyy-MM-dd') },
    { label: 'End of Year', date: format(endOfYear(today), 'yyyy-MM-dd') },
  ];

  const parsedDeadline = parseISO(formData.deadline);
  const isValidDate = isValid(parsedDeadline);
  const daysLeft = isValidDate ? Math.max(1, differenceInDays(parsedDeadline, today)) : 1;
  const targetGoal = formData.projectGoal || 50000;
  const dailyPace = Math.ceil(targetGoal / daysLeft);

  return (
    <div className="flex flex-col gap-5 animate-in slide-in-from-bottom-4">
      <div className="flex flex-col gap-4">
        {originalSettings?.isSetupComplete && (
          <div className="text-[10px] font-bold text-ink/40 uppercase mb-[-12px] text-center">
            Previous deadline: {originalSettings.deadline}
          </div>
        )}
        <CalendarPicker
          label="Project Deadline"
          value={formData.deadline}
          onChange={(deadline) => setFormData({ ...formData, deadline })}
          color="#5eead4"
        />

        {/* Quick presets */}
        <div className="flex items-center justify-center gap-2 flex-wrap w-full">
          {presets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => setFormData({ ...formData, deadline: preset.date })}
              className={cn(
                "px-3 py-1.5 rounded-lg border-2 text-[10px] font-black uppercase transition-[transform,background-color] duration-150 active:scale-[0.95]",
                formData.deadline === preset.date
                  ? "bg-ink text-bg-paper border-ink shadow-sm"
                  : "bg-bg-surface text-ink border-ink/30 hover:border-ink hover:bg-bg-paper"
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Live pace preview card */}
        <div className="bg-bg-paper border-2 border-ink rounded-xl p-4 flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#5eead4] border-2 border-ink flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 text-ink" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase text-ink/50">Required Pace</span>
              <span className="text-xs font-bold text-ink">
                {daysLeft} day{daysLeft === 1 ? '' : 's'} remaining
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="font-mono text-base font-black text-ink block tabular-nums">
              ~{dailyPace.toLocaleString()}
            </span>
            <span className="text-[9px] font-bold uppercase text-ink/50 block">
              {formData.metric}/day
            </span>
          </div>
        </div>

        <p className="text-[9px] font-bold italic text-ink/40 px-4 text-center">
          The ledger and pace chart will track your team's velocity against this target.
        </p>
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
    setupUpdateCount: 0,
    updatedAt: new Date(),
    lastModifiedBy: "System",
    passcode: ""
  });
  const [activeTab, setActiveTab] = useState<'menu' | 'co-authors' | 'goal' | 'deadline' | 'security'>('menu');
  const [errorStep, setErrorStep] = useState<number | null>(null);

  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

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

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-ink/80 backdrop-blur-sm z-[100] flex items-center justify-center p-3 sm:p-6 mt-0"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className={`sticker-card max-w-xl w-full bg-bg-paper flex flex-col gap-6 sm:gap-8 relative overflow-hidden max-h-[95vh] overflow-y-auto ${errorStep === currentStep ? 'animate-shake border-red-500' : ''}`}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full -translate-y-1/2 translate-x-1/2" />
        
        {settings?.isSetupComplete && (
          <button 
            onClick={onClose}
            title="Close Settings"
            className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-bg-surface border-[3px] border-ink shadow-sticker hover:bg-ink hover:text-bg-paper active:translate-y-[2px] active:translate-x-[2px] active:shadow-sticker-active transition-colors duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary"
          >
            <X className="w-5 h-5 text-ink" />
          </button>
        )}

        {settings?.isSetupComplete ? (
          <div className="px-6 sm:px-8 py-8 flex flex-col gap-6">
            <div className="flex items-center gap-4 mb-4">
              {activeTab !== 'menu' && (
                <button 
                  onClick={() => setActiveTab('menu')} 
                  className="w-10 h-10 flex shrink-0 items-center justify-center rounded-xl border-[3px] border-ink active:translate-y-[2px] active:translate-x-[2px] bg-bg-surface hover:scale-105 active:scale-95 transition-[transform,background-color] duration-150 ease-out"
                >
                  <ArrowRight className="w-5 h-5 rotate-180" />
                </button>
              )}
              <h1 className="text-display text-3xl font-black pb-1">
                {activeTab === 'menu' ? 'Settings' 
                  : activeTab === 'co-authors' ? 'Co-Authors' 
                  : activeTab === 'goal' ? 'The Goal'
                  : activeTab === 'deadline' ? 'The Deadline'
                  : 'Security'}
              </h1>
            </div>
            
            {activeTab === 'menu' && (
              <div className="flex flex-col gap-4">
                <button onClick={() => setActiveTab('co-authors')} className="button-playful bg-bg-surface text-ink w-full justify-between items-center flex">
                  <div className="flex items-center gap-3"><SettingsIcon className="w-5 h-5 text-accent"/> <span className="font-bold">Co-Authors</span></div> <ArrowRight className="w-4 h-4 text-ink/40"/>
                </button>
                <button onClick={() => setActiveTab('goal')} className="button-playful bg-bg-surface text-ink w-full justify-between items-center flex">
                   <div className="flex items-center gap-3"><Trophy className="w-5 h-5 text-[#facc15]"/> <span className="font-bold">The Goal</span></div> <ArrowRight className="w-4 h-4 text-ink/40"/>
                </button>
                <button onClick={() => setActiveTab('deadline')} className="button-playful bg-bg-surface text-ink w-full justify-between items-center flex">
                    <div className="flex items-center gap-3"><Calendar className="w-5 h-5 text-[#5eead4]"/> <span className="font-bold">The Deadline</span></div> <ArrowRight className="w-4 h-4 text-ink/40"/>
                </button>
                <button onClick={() => setActiveTab('security')} className="button-playful bg-bg-surface text-ink w-full justify-between items-center flex">
                    <div className="flex items-center gap-3"><Lock className="w-5 h-5 text-[#ff4d8d]"/> <span className="font-bold">Security</span></div> <ArrowRight className="w-4 h-4 text-ink/40"/>
                </button>
                <div className="flex items-center justify-between p-4 bg-bg-surface border-4 border-ink rounded-2xl shadow-sticker">
                  <div className="flex items-center gap-3">
                    {formData.theme === 'dark' ? <Moon className="w-5 h-5 text-indigo-600"/> : <Sun className="w-5 h-5 text-amber-500"/>}
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-ink">Appearance</span>
                      <span className="text-xs text-ink/60">{formData.theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 bg-bg-paper p-1 rounded-xl border-2 border-ink">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, theme: 'light' })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${formData.theme !== 'dark' ? 'bg-primary text-white border-2 border-ink' : 'text-ink'}`}
                    >
                      Light
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, theme: 'dark' })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${formData.theme === 'dark' ? 'bg-primary text-white border-2 border-ink' : 'text-ink'}`}
                    >
                      Dark
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => handleSave(true)}
                  className="button-playful bg-primary text-ink w-full mt-4 flex items-center justify-center gap-2"
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save All Changes"}
                </button>
              </div>
            )}

            {activeTab === 'co-authors' && (
              <div className="flex flex-col gap-4 animate-in slide-in-from-right-4">
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

            {activeTab === 'goal' && (
              <div className="flex flex-col gap-4 animate-in slide-in-from-right-4">
                <ProjectSettingsStep formData={formData} setFormData={setFormData} originalSettings={settings} />
              </div>
            )}

            {activeTab === 'deadline' && (
              <div className="flex flex-col gap-4 animate-in slide-in-from-right-4">
                <DeadlineStep formData={formData} setFormData={setFormData} originalSettings={settings} />
              </div>
            )}

            {activeTab === 'security' && (
              <div className="flex flex-col gap-4 animate-in slide-in-from-right-4">
                <SecurityStep formData={formData} setFormData={setFormData} />
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
                  initial={{ opacity: 0, x: 20, filter: "blur(4px)" }}
                  animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, x: -20, filter: "blur(4px)" }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
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
}
