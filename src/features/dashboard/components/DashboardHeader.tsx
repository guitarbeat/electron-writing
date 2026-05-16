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
    <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6 mb-2 sm:mb-4">
      <div className="flex flex-col gap-1 w-full md:w-auto">
        <div className="flex items-center justify-between md:justify-start gap-3">
          <h1 className="text-display text-4xl sm:text-5xl md:text-6xl">Smeemo</h1>
          
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setShowGuide(true)}
              className="w-10 h-10 rounded-button border-4 border-ink bg-white flex items-center justify-center shadow-sticker active:shadow-sticker-active active:translate-x-1 active:translate-y-1 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              title="Settings"
              aria-label="Open writing setup"
            >
              <SettingsIcon className="w-5 h-5" />
            </button>
            <button
              onClick={logout}
              className="w-10 h-10 rounded-button border-4 border-red-500 bg-red-100 text-red-600 flex items-center justify-center shadow-[4px_4px_0_#ef4444] active:shadow-[1px_1px_0_#ef4444] active:translate-x-1 active:translate-y-1 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none"
              title="Logout"
              aria-label="Log out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
        <p className="text-xs sm:text-sm font-bold italic opacity-60">
          {settings?.personAName || 'Aaron'} & {settings?.personBName || 'Electra'}'s Writing Sanctuary
        </p>
      </div>

      <div className="hidden md:flex items-center gap-4">
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
          className="button-playful bg-red-100 text-red-600 shadow-[4px_4px_0_#ef4444] border-red-500 hover:bg-red-200 p-3 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none"
          aria-label="Log out"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
      
      {settings?.updatedAt && (
        <div className="md:hidden text-[8px] font-black uppercase text-ink/40 tracking-widest">
          LAST MODIFIED {new Date(settings.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      )}
    </header>
  );
}
