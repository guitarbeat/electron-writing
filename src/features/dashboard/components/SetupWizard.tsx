import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Settings as SettingsIcon, Trophy, Calendar, ArrowRight, Lock, Target } from 'lucide-react';
import { Settings } from '../../../types';
import { UserSettingsInput, Knob, CalendarPicker } from '../../../components/ui';

export function ProjectSettingsStep({
  formData,
  setFormData,
}: {
  formData: Settings;
  setFormData: React.Dispatch<React.SetStateAction<Settings>>;
}) {
  return (
    <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {(["words", "pages"] as const).map((metric) => (
          <button
            key={metric}
            onClick={() => setFormData({ ...formData, metric })}
            className={`py-4 text-xs font-black uppercase rounded-xl border-4 border-ink transition-transform hover:scale-[1.02] active:scale-95 ${
              formData.metric === metric
                ? "bg-ink text-white shadow-sticker"
                : "bg-white hover:bg-primary/5"
            }`}
          >
            Track {metric}
          </button>
        ))}
      </div>

      <div className="bg-white p-6 md:p-8 border-4 border-ink rounded-[32px] flex flex-col items-center gap-6 shadow-sticker relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-accent/20" />

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

        <div className="flex flex-col items-center gap-1">
          <input
            type="number"
            value={formData.projectGoal}
            onChange={(event) =>
              setFormData({
                ...formData,
                projectGoal: parseInt(event.target.value) || 0,
              })
            }
            className="bg-bg-paper px-4 py-2 rounded-xl border-2 border-ink text-center font-mono font-bold text-lg w-32 focus:bg-white transition-colors"
          />

          <p className="text-[9px] font-bold italic text-ink/30 uppercase mt-1">
            Spin to set absolute target
          </p>
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
      <div className="bg-white p-8 border-4 border-ink rounded-[32px] flex flex-col items-center gap-6 shadow-sticker">
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
}: {
  formData: Settings;
  setFormData: React.Dispatch<React.SetStateAction<Settings>>;
}) {
  return (
    <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4">
      <div className="flex flex-col gap-4">
        <CalendarPicker
          label="Project Deadline"
          value={formData.deadline}
          onChange={(deadline) => setFormData({ ...formData, deadline })}
          color="#5eead4"
        />

        <p className="text-[9px] font-bold italic text-ink/40 px-4 text-center">
          The ledger and pace chart will aim at this date.
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
          className="button-playful bg-white text-ink flex-1"
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
        {isSaving ? "Synching..." : isLastStep ? "Let's Write!" : "Next Step"}

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
  const [errorStep, setErrorStep] = useState<number | null>(null);

  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const steps = [
    {
      title: "The Writers",
      description: "Configure your team.",
      icon: <SettingsIcon className="w-8 h-8 text-accent" />
    },
    {
      title: "Project Target",
      description: "What are we aiming for?",
      icon: <Trophy className="w-8 h-8 text-[#facc15]" />
    },
    {
      title: "Timeline",
      description: "When do we want this done?",
      icon: <Calendar className="w-8 h-8 text-[#5eead4]" />
    },
    {
      title: "Security",
      description: "Set your shared passcode.",
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

        <div className="p-6 sm:p-8 pb-0">
          <div className="flex flex-col items-center text-center gap-4 relative">
            <div className="w-16 h-16 bg-white border-4 border-ink rounded-2xl flex items-center justify-center shadow-sticker">
              {steps[currentStep].icon}
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="text-display text-2xl">{steps[currentStep].title}</h2>
              <p className="text-sm font-bold italic text-ink/60">{steps[currentStep].description}</p>
            </div>
          </div>
        </div>

        <div className="px-6 sm:px-8 flex-1">
          {currentStep === 0 && (
            <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4">
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
             <ProjectSettingsStep formData={formData} setFormData={setFormData} />
          )}

          {currentStep === 2 && (
             <DeadlineStep formData={formData} setFormData={setFormData} />
          )}
          
          {currentStep === 3 && (
             <SecurityStep formData={formData} setFormData={setFormData} />
          )}
        </div>

        <div className="p-6 sm:p-8 pt-0 flex flex-col gap-6">
          <div className="flex justify-center gap-2">
            {steps.map((_, i) => (
              <div 
                key={i} 
                className={`h-2 rounded-full transition-all border-2 border-ink ${i === currentStep ? 'w-10 bg-primary' : 'w-2 bg-white'}`} 
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
          
           {settings?.isSetupComplete && (
              <button onClick={onClose} className="text-[10px] font-black uppercase text-ink/20 hover:text-ink transition-colors text-center mt-[-1rem]">
                 Close Settings
              </button>
           )}
        </div>
      </motion.div>
    </motion.div>
  );
}
