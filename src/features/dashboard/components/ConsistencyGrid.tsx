import React from 'react';
import { Settings } from '../../../types';
import { CalendarHeatMap } from './CalendarHeatMap';

interface ConsistencyGridProps {
  gridView: 'team' | 'personA' | 'personB';
  setGridView: (view: 'team' | 'personA' | 'personB') => void;
  heatmapStats: any;
  settings: Settings | null;
  logDate: string;
  setLogDate: (d: string) => void;
}

export function ConsistencyGrid({ gridView, setGridView, heatmapStats, settings, logDate, setLogDate }: ConsistencyGridProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="sticker-card bg-white p-6 md:p-8 flex flex-col gap-4">
        <div className="flex justify-end items-center">
          <div className="flex bg-bg-paper p-1 border-2 border-ink rounded-lg gap-1">
            {(['team', 'personA', 'personB'] as const).map(v => (
              <button
                key={v}
                onClick={() => setGridView(v)}
                className={`text-[10px] font-black uppercase px-3 py-1 rounded transition-colors ${gridView === v ? 'bg-ink text-white' : 'hover:bg-primary/10'}`}
              >
                {v === 'personA' ? (settings?.personAName || 'Aaron') : v === 'personB' ? (settings?.personBName || 'Electra') : 'Together'}
              </button>
            ))}
          </div>
        </div>
        <CalendarHeatMap 
          stats={heatmapStats} 
          settings={settings}
          activeColor={
            gridView === 'team' ? settings?.teamColor :
            gridView === 'personA' ? settings?.personAColor :
            settings?.personBColor
          }
          onDateClick={(d: string) => { setLogDate(d); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          selectedDateStr={logDate}
        />
      </div>
    </div>
  );
}
