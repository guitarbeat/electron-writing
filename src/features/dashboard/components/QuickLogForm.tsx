import React, { useState, useEffect } from 'react';
import { PenLine, Trash2 } from 'lucide-react';
import { Entry, Settings } from '../../../types';

interface QuickLogFormProps {
  logDate: string;
  setLogDate: (date: string) => void;
  entries: Entry[];
  settings: Settings | null;
  saveEntry: (entry: Partial<Entry>) => Promise<boolean>;
  deleteEntry: (date: string) => Promise<boolean>;
}

export function QuickLogForm({
  logDate,
  setLogDate,
  entries,
  settings,
  saveEntry,
  deleteEntry
}: QuickLogFormProps) {
  const [aaronInput, setAaronInput] = useState<string>('');
  const [electraInput, setElectraInput] = useState<string>('');
  const [noteInput, setNoteInput] = useState<string>('');

  const [currentLogDateInForm, setCurrentLogDateInForm] = useState(logDate);

  useEffect(() => {
    const isNewDate = currentLogDateInForm !== logDate;
    if (isNewDate) {
      setCurrentLogDateInForm(logDate);
    }
    
    const existing = entries.find(e => e.date === logDate);
    if (existing) {
      if (isNewDate) {
        setAaronInput(existing.aaronWords > 0 ? existing.aaronWords.toString() : '');
        setElectraInput(existing.electraWords > 0 ? existing.electraWords.toString() : '');
        setNoteInput(existing.note || '');
      } else {
        setAaronInput(prev => (prev === '' && existing.aaronWords > 0) ? existing.aaronWords.toString() : prev);
        setElectraInput(prev => (prev === '' && existing.electraWords > 0) ? existing.electraWords.toString() : prev);
        setNoteInput(prev => (prev === '' && existing.note) ? existing.note : prev);
      }
    } else {
      if (isNewDate) {
        setAaronInput('');
        setElectraInput('');
        setNoteInput('');
      }
    }
  }, [logDate, entries, currentLogDateInForm]);

  const handleSaveLog = async (e: React.FormEvent) => {
    e.preventDefault();
    const aaronW = parseInt(aaronInput) || 0;
    const electraW = parseInt(electraInput) || 0;
    
    if (aaronW === 0 && electraW === 0 && !noteInput) return;

    await saveEntry({
      date: logDate,
      aaronWords: aaronW,
      electraWords: electraW,
      note: noteInput
    });
  };

  const handleDeleteLog = async () => {
    if (window.confirm('Delete entry for this date?')) {
      await deleteEntry(logDate);
      setAaronInput('');
      setElectraInput('');
      setNoteInput('');
    }
  };

  const currentEntry = entries.find(e => e.date === logDate);
  const metricLabel = settings?.metric === 'pages' ? 'Pages' : 'Words';

  return (
    <div className="sticker-card p-6 bg-white flex flex-col gap-6">
      <form onSubmit={handleSaveLog} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Date</label>
          <input 
            type="date"
            required
            value={logDate}
            onChange={e => setLogDate(e.target.value)}
            className="w-full bg-bg-paper px-4 py-2 rounded-xl border-2 border-ink font-mono focus:bg-white transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase tracking-widest opacity-60" style={{ color: settings?.personAColor }}>{settings?.personAName || 'Aaron'} {metricLabel}</label>
            <input 
              type="number"
              min="0"
              value={aaronInput}
              onChange={e => setAaronInput(e.target.value)}
              placeholder="0"
              className="w-full bg-bg-paper px-4 py-2 rounded-xl border-2 border-ink font-mono focus:bg-white transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase tracking-widest opacity-60" style={{ color: settings?.personBColor }}>{settings?.personBName || 'Electra'} {metricLabel}</label>
            <input 
              type="number"
              min="0"
              value={electraInput}
              onChange={e => setElectraInput(e.target.value)}
              placeholder="0"
              className="w-full bg-bg-paper px-4 py-2 rounded-xl border-2 border-ink font-mono focus:bg-white transition-colors"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Note (Optional)</label>
          <input 
            type="text"
            value={noteInput}
            onChange={e => setNoteInput(e.target.value)}
            placeholder="What did you work on?"
            className="w-full bg-bg-paper px-4 py-2 rounded-xl border-2 border-ink font-sans focus:bg-white transition-colors"
          />
        </div>

        <div className="flex gap-2 mt-2">
          <button type="submit" className="button-playful bg-primary text-ink flex-1 py-3">
            Save Entry
          </button>
          {currentEntry && (
            <button type="button" onClick={handleDeleteLog} className="button-playful bg-red-100 text-red-600 border-red-500 hover:bg-red-200 px-4">
              <Trash2 className="w-5 h-5 mx-auto" />
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
