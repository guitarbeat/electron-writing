import React from 'react';
import { Settings as SettingsIcon, LogOut } from 'lucide-react';
import { Settings } from '../../../types';

interface DashboardHeaderProps {
  settings: Settings | null;
  setShowGuide: (show: boolean) => void;
  logout: () => void;
}

export function DashboardHeader({ settings, setShowGuide, logout }: DashboardHeaderProps) {
  return (
    <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-4">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <h1 className="text-display">Smeemo</h1>
        </div>
        <p className="text-sm font-bold opacity-60">
          {settings?.personAName || 'Aaron'} & {settings?.personBName || 'Electra'}'s Tracker
        </p>
      </div>

      <div className="flex items-center gap-4">
        {settings?.updatedAt && (
          <div className="text-[10px] font-black uppercase text-ink/40 tracking-widest text-right">
            LAST MODIFIED {settings.lastModifiedBy && settings.lastModifiedBy !== 'System' ? `BY ${settings.lastModifiedBy.toUpperCase()}` : ''}:<br/>
            {new Date(settings.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
        <button
          onClick={() => setShowGuide(true)}
          className="button-playful bg-white text-ink text-xs px-5 py-3 flex items-center gap-2"
        >
          <SettingsIcon className="w-4 h-4" />
          Writing Setup
        </button>
        <button
          onClick={logout}
          className="button-playful bg-red-100 text-red-600 shadow-[4px_4px_0_#ef4444] border-red-500 hover:bg-red-200 p-3"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
