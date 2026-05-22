import { useMemo, useRef, useState } from 'react';
import { differenceInCalendarDays, eachDayOfInterval, format, isValid, parseISO, addDays } from 'date-fns';
import { Check, ChevronDown, ChevronUp, Flag, History, Minus, NotebookPen, StickyNote, Trash2, X, Plus } from 'lucide-react';
import { Entry, Settings } from '../../../types';
import { cn } from '../../../lib/utils';

type WriterKey = 'personA' | 'personB';

interface DailyTimelineLedgerProps {
  entries: Entry[];
  settings: Settings | null;
  saveEntry: (entry: Partial<Entry>) => Promise<boolean>;
  deleteEntry: (date: string) => Promise<boolean>;
  visibleWriters: ('personA' | 'personB')[];
}

interface LedgerDay {
  date: string;
  dayNumber: string;
  monthLabel: string;
  showMonthLabel: boolean;
  entry?: Entry;
  personAValue: number;
  personBValue: number;
  isDeadlineDay: boolean;
  hasAnyWriting: boolean;
  hasNote: boolean;
}

interface EditingTile {
  date: string;
  writer: WriterKey;
}

const INK_HEX = '#2b1720';

function getReadableTextColor(hex: string | undefined) {
  if (!hex || !/^#[0-9a-fA-F]{6}$/.test(hex)) return '#ffffff';

  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.68 ? INK_HEX : '#ffffff';
}

function formatCount(value: number, metric: string) {
  const unit = value === 1 ? metric.replace(/s$/, '') : metric;

  if (value >= 1000) {
    const compact = (value / 1000).toFixed(value >= 10000 ? 0 : 1).replace(/\.0$/, '');
    return `${compact}k ${unit}`;
  }

  return `${value.toLocaleString()} ${unit}`;
}

function parseNonNegativeInteger(value: string) {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function toLedgerDay(entry: Entry | undefined, date: string, deadlineStr: string, showMonthLabel: boolean): LedgerDay {
  return {
    date,
    dayNumber: format(parseISO(date), 'dd'),
    monthLabel: format(parseISO(date), 'MMMM yyyy'),
    showMonthLabel,
    entry,
    personAValue: entry?.aaronWords || 0,
    personBValue: entry?.electraWords || 0,
    isDeadlineDay: date === deadlineStr,
    hasAnyWriting: Boolean((entry?.aaronWords || 0) + (entry?.electraWords || 0)),
    hasNote: Boolean(entry?.note?.trim()),
  };
}

function buildFutureLedgerDays(entries: Entry[], settings: Settings | null): LedgerDay[] {
  const entriesByDate = new Map(entries.map(entry => [entry.date, entry]));
  const start = new Date();

  const parsedDeadline = settings?.deadline ? parseISO(settings.deadline) : null;
  const deadline = parsedDeadline && isValid(parsedDeadline) ? parsedDeadline : addDays(start, 10);
  const end = deadline >= start ? deadline : start;
  const deadlineStr = format(deadline, 'yyyy-MM-dd');

  return eachDayOfInterval({ start, end }).map((day, index, allDays) => {
    const date = format(day, 'yyyy-MM-dd');
    const entry = entriesByDate.get(date);
    const previousDay = allDays[index - 1];
    return toLedgerDay(entry, date, deadlineStr, index === 0 || format(previousDay, 'yyyy-MM') !== format(day, 'yyyy-MM'));
  });
}

function buildPastLedgerDays(entries: Entry[], settings: Settings | null): LedgerDay[] {
  const today = new Date();
  const yesterday = addDays(today, -1);
  const todayStr = format(today, 'yyyy-MM-dd');
  const parsedDeadline = settings?.deadline ? parseISO(settings.deadline) : null;
  const deadlineDate = parsedDeadline && isValid(parsedDeadline) ? parsedDeadline : today;
  const deadlineStr = format(deadlineDate, 'yyyy-MM-dd');

  // Find the earliest date to show
  let startDate = addDays(today, -14); // default: 14 days back
  if (entries.length > 0) {
    const oldestEntryDate = parseISO(
      entries.map(e => e.date).reduce((a, b) => (a < b ? a : b))
    );
    if (oldestEntryDate < startDate) {
      startDate = oldestEntryDate;
    }
  }

  // Ensure start date doesn't exceed yesterday
  if (startDate > yesterday) {
    startDate = yesterday;
  }

  const entriesByDate = new Map(entries.map(entry => [entry.date, entry]));

  return eachDayOfInterval({ start: startDate, end: yesterday })
    .map(day => {
      const date = format(day, 'yyyy-MM-dd');
      const entry = entriesByDate.get(date);
      return toLedgerDay(entry, date, deadlineStr, false); // fix month label later
    })
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((day, index, allDays) => {
      const previousDay = allDays[index - 1];
      day.showMonthLabel = index === 0 || previousDay.date.slice(0, 7) !== day.date.slice(0, 7);
      return day;
    });
}

export function DailyTimelineLedger({ entries, settings, saveEntry, deleteEntry, visibleWriters }: DailyTimelineLedgerProps) {
  const [editingTile, setEditingTile] = useState<EditingTile | null>(null);
  const [tileDraft, setTileDraft] = useState('');
  const [editingNoteDate, setEditingNoteDate] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [showPastEntries, setShowPastEntries] = useState(false);
  const [showAllFutureDays, setShowAllFutureDays] = useState(false);
  const [extraDays, setExtraDays] = useState(0);
  const skipNextTileBlurSave = useRef(false);

  const metric = settings?.metric === 'pages' ? 'pages' : 'words';
  const metricLabel = settings?.metric === 'pages' ? 'Pages' : 'Words';
  const personAName = settings?.personAName || 'Aaron';
  const personBName = settings?.personBName || 'Electra';
  const personAColor = settings?.personAColor || '#ff4d8d';
  const personBColor = settings?.personBColor || '#7c3aed';
  const today = new Date();
  const deadlineDate = settings?.deadline && isValid(parseISO(settings.deadline)) ? parseISO(settings.deadline) : addDays(today, 10);
  const daysLeft = Math.max(0, differenceInCalendarDays(deadlineDate, today) + 1);

  const days = useMemo(() => {
    const entriesByDate = new Map(entries.map(entry => [entry.date, entry]));
    const start = new Date(today);
    start.setHours(0, 0, 0, 0);

    const deadline = new Date(deadlineDate);
    deadline.setHours(0, 0, 0, 0);
    
    // We want to generate days from `start` up to the furthest of:
    // 1. The deadline
    // 2. start + 14 days + extraDays
    // 3. Or maybe just strictly: `deadline` + `extraDays` 
    // Wait; `days` array should be large enough to hold all possible future days.
    
    let end = deadline >= start ? deadline : start;
    end = addDays(end, extraDays);

    const deadlineStr = format(deadlineDate, 'yyyy-MM-dd');

    return eachDayOfInterval({ start, end }).map((day, index, allDays) => {
      const date = format(day, 'yyyy-MM-dd');
      const entry = entriesByDate.get(date);
      const previousDay = allDays[index - 1];
      const isFirstOfNewMonth = index === 0 || format(previousDay, 'yyyy-MM') !== format(day, 'yyyy-MM');
      
      return {
        date,
        dayNumber: format(parseISO(date), 'dd'),
        monthLabel: format(parseISO(date), 'MMMM yyyy'),
        showMonthLabel: isFirstOfNewMonth,
        entry,
        personAValue: entry?.aaronWords || 0,
        personBValue: entry?.electraWords || 0,
        isDeadlineDay: date === deadlineStr,
        hasAnyWriting: Boolean((entry?.aaronWords || 0) + (entry?.electraWords || 0)),
        hasNote: Boolean(entry?.note?.trim()),
      };
    });
  }, [entries, settings, extraDays, deadlineDate]);

  const pastDays = useMemo(() => buildPastLedgerDays(entries, settings), [entries, settings]);
  
  const displayedDays = useMemo(() => {
    return showAllFutureDays || extraDays > 0 ? days : days.slice(0, 14);
  }, [days, showAllFutureDays, extraDays]);

  const getEntryForDate = (date: string) => entries.find(entry => entry.date === date);

  const beginTileEdit = (day: LedgerDay, writer: WriterKey) => {
    const value = writer === 'personA' ? day.personAValue : day.personBValue;
    setEditingNoteDate(null);
    setEditingTile({ date: day.date, writer });
    setTileDraft(value > 0 ? value.toString() : '');
  };

  const cancelTileEdit = (skipBlurSave = false) => {
    skipNextTileBlurSave.current = skipBlurSave;
    setEditingTile(null);
    setTileDraft('');
  };

  const saveTileEdit = async () => {
    if (!editingTile) return;

    const currentEntry = getEntryForDate(editingTile.date);
    const nextValue = parseNonNegativeInteger(tileDraft);
    const nextAaron = editingTile.writer === 'personA' ? nextValue : currentEntry?.aaronWords || 0;
    const nextElectra = editingTile.writer === 'personB' ? nextValue : currentEntry?.electraWords || 0;
    const nextNote = currentEntry?.note || '';

    const capturedDate = editingTile.date;

    setEditingTile(null);
    setTileDraft('');

    if (nextAaron === 0 && nextElectra === 0 && !nextNote.trim()) {
      if (currentEntry) await deleteEntry(capturedDate);
      return;
    }

    await saveEntry({
      date: capturedDate,
      aaronWords: nextAaron,
      electraWords: nextElectra,
      note: nextNote,
    });

    if (nextValue > 0 && !nextNote.trim()) {
      setEditingNoteDate(capturedDate);
      setNoteDraft('');
    }
  };

  const handleTileBlur = () => {
    if (skipNextTileBlurSave.current) {
      skipNextTileBlurSave.current = false;
      return;
    }

    saveTileEdit();
  };

  const beginNoteEdit = (day: LedgerDay) => {
    setEditingTile(null);
    setEditingNoteDate(day.date);
    setNoteDraft(day.entry?.note || '');
  };

  const cancelNoteEdit = () => {
    setEditingNoteDate(null);
    setNoteDraft('');
  };

  const saveNoteEdit = async (day: LedgerDay) => {
    const nextNote = noteDraft.trim();
    const nextAaron = day.entry?.aaronWords || 0;
    const nextElectra = day.entry?.electraWords || 0;

    setEditingNoteDate(null);
    setNoteDraft('');

    if (nextAaron === 0 && nextElectra === 0 && !nextNote) {
      if (day.entry) await deleteEntry(day.date);
      return;
    }

    await saveEntry({
      date: day.date,
      aaronWords: nextAaron,
      electraWords: nextElectra,
      note: nextNote,
    });
  };

  const handleDeleteDay = async (day: LedgerDay) => {
    if (!day.entry) return;
    if (window.confirm(`Delete entry for ${format(parseISO(day.date), 'MMMM d, yyyy')}?`)) {
      await deleteEntry(day.date);
      if (editingNoteDate === day.date) cancelNoteEdit();
      if (editingTile?.date === day.date) cancelTileEdit();
    }
  };

  const gridColsClass = 'grid-cols-[4.25rem_minmax(0,1fr)_minmax(0,1fr)_3.5rem] sm:grid-cols-[5rem_minmax(0,1fr)_minmax(0,1fr)_4rem]';

  return (
    <section className="flex flex-col gap-6">
      {pastDays.length > 0 && (
        <button
          type="button"
          onClick={() => setShowPastEntries(value => !value)}
          className="flex items-center justify-between gap-3 border-4 border-ink bg-bg-paper px-4 py-3 shadow-sticker text-left active:translate-x-1 active:translate-y-1 active:shadow-sticker-active rounded-2xl"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 border-4 border-ink bg-white flex items-center justify-center shrink-0 rounded-xl">
              <History className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-label text-[10px] text-ink-muted">Past Entries</div>
              <div className="text-sm font-black text-ink">{pastDays.length} logged days before today</div>
            </div>
          </div>
          <ChevronDown className={cn("w-5 h-5 shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)]", showPastEntries && "rotate-180")} />
        </button>
      )}

      {showPastEntries && pastDays.length > 0 && (
        <div className="border-4 border-ink bg-white p-4 sm:p-5 shadow-sticker flex flex-col gap-4 rounded-3xl">
          <div className="flex flex-col gap-5 pl-3 sm:pl-4">
            {pastDays.map(day => (
              <LedgerDayRow
                key={day.date}
                day={day}
                personAName={personAName}
                personBName={personBName}
                personAColor={personAColor}
                personBColor={personBColor}
                metric={metric}
                editingTile={editingTile}
                tileDraft={tileDraft}
                editingNoteDate={editingNoteDate}
                noteDraft={noteDraft}
                onTileDraftChange={setTileDraft}
                onNoteDraftChange={setNoteDraft}
                onBeginTileEdit={beginTileEdit}
                onCancelTileEdit={cancelTileEdit}
                onTileBlur={handleTileBlur}
                onBeginNoteEdit={beginNoteEdit}
                onCancelNoteEdit={cancelNoteEdit}
                onSaveNoteEdit={saveNoteEdit}
                onDeleteDay={handleDeleteDay}
                visibleWriters={visibleWriters}
              />
            ))}
          </div>
        </div>
      )}



      <div className="pl-10 sm:pl-14 lg:pl-16 pr-1 md:pr-3">
        <div className="relative flex flex-col gap-5 pb-6">
          <div className="absolute left-6 sm:left-7 md:left-8 top-12 bottom-0 w-1 bg-ink" />

          {displayedDays.map(day => (
            <LedgerDayRow
              key={day.date}
              day={day}
              personAName={personAName}
              personBName={personBName}
              personAColor={personAColor}
              personBColor={personBColor}
              metric={metric}
              editingTile={editingTile}
              tileDraft={tileDraft}
              editingNoteDate={editingNoteDate}
              noteDraft={noteDraft}
              onTileDraftChange={setTileDraft}
              onNoteDraftChange={setNoteDraft}
              onBeginTileEdit={beginTileEdit}
              onCancelTileEdit={cancelTileEdit}
              onTileBlur={handleTileBlur}
              onBeginNoteEdit={beginNoteEdit}
              onCancelNoteEdit={cancelNoteEdit}
              onSaveNoteEdit={saveNoteEdit}
              onDeleteDay={handleDeleteDay}
              visibleWriters={visibleWriters}
            />
          ))}

          {!showAllFutureDays && days.length > 14 && extraDays === 0 ? (
            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-4 mt-6 mb-2">
              <button
                onClick={() => setShowAllFutureDays(true)}
                className="button-playful bg-primary text-white border-4 border-ink shadow-sticker px-6 py-3 font-black tracking-widest text-sm w-full sm:w-auto uppercase active:shadow-sticker-active active:translate-x-1 active:translate-y-1"
              >
                Load All to Deadline ({days.length - 14} more)
              </button>
              <button
                onClick={() => {
                  setShowAllFutureDays(true);
                  setExtraDays(prev => prev + 14);
                }}
                className="button-playful bg-white text-ink border-4 border-ink shadow-sticker px-6 py-3 font-black tracking-widest text-sm w-full sm:w-auto uppercase active:shadow-sticker-active active:translate-x-1 active:translate-y-1"
              >
                Go Past Deadline
              </button>
            </div>
          ) : (
            <div className="relative z-10 flex justify-center mt-6 mb-2">
              <button
                onClick={() => {
                  setShowAllFutureDays(true);
                  setExtraDays(prev => prev + 14);
                }}
                className="button-playful bg-white text-ink border-4 border-ink shadow-sticker px-6 py-3 gap-2 flex items-center font-black tracking-widest text-sm uppercase active:shadow-sticker-active active:translate-x-1 active:translate-y-1"
              >
                <Plus className="w-5 h-5 shrink-0" />
                Load 14 More Days
              </button>
            </div>
          )}
        </div>
      </div>
    </section>

  );
}

function HeaderPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 border-2 border-ink bg-white px-3 py-1">
      <span className="text-label text-[9px] text-ink-muted">{label}</span>
      <span className="text-label text-[10px] text-ink">{value}</span>
    </div>
  );
}

function ColumnHeader({ color, label }: { color: string; label: string }) {
  return (
    <div className="bg-bg-paper border-4 border-ink shadow-sticker px-3 py-2 flex items-center gap-2 min-w-0">
      <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-ink shrink-0" style={{ backgroundColor: color }} />
      <span className="text-label text-[9px] sm:text-[10px] text-ink truncate">{label}</span>
    </div>
  );
}

function WriterTile({
  date,
  name,
  value,
  color,
  metric,
  isEditing,
  draft,
  onDraftChange,
  onBeginEdit,
  onCancel,
  onBlur,
}: {
  date: string;
  name: string;
  value: number;
  color: string;
  metric: string;
  isEditing: boolean;
  draft: string;
  onDraftChange: (value: string) => void;
  onBeginEdit: () => void;
  onCancel: () => void;
  onBlur: () => void;
}) {
  const hasValue = value > 0;
  const textColor = getReadableTextColor(color);

  if (isEditing) {
    return (
      <div className="relative w-full aspect-square z-50">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] min-w-[7rem] bg-white border-4 border-ink shadow-sticker-hover p-3 flex flex-col gap-2 origin-center">
          <label className="text-label text-[10px] text-ink-muted text-center leading-tight truncate">{name}</label>
          <input
            autoFocus
            value={draft}
            onChange={event => onDraftChange(event.target.value)}
            onFocus={event => event.target.select()}
            onBlur={onBlur}
            onKeyDown={event => {
              if (event.key === 'Enter') {
                event.preventDefault();
                event.currentTarget.blur();
              }
              if (event.key === 'Escape') {
                event.preventDefault();
                onCancel();
              }
            }}
            inputMode="numeric"
            min="0"
            type="number"
            className="w-full appearance-none rounded-none shadow-none bg-bg-paper border-2 border-ink px-2 py-2 text-center font-mono text-xl sm:text-2xl font-black text-ink outline-none focus:bg-white hide-spin-button"
            aria-label={`${name} ${metric} for ${date}`}
          />
          <span className="text-label text-[10px] text-ink-muted text-center leading-tight uppercase font-black">{metric}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-square">
      <button
        type="button"
        onClick={onBeginEdit}
        title={`Edit ${name} ${metric} for ${format(parseISO(date), 'MMM d')}`}
        className={cn(
          'absolute inset-0 w-full h-full border-4 flex flex-col items-center justify-center gap-2 transition-all text-center group p-3 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary focus-visible:border-transparent',
          'hover:-translate-y-1 hover:shadow-sticker-hover active:translate-y-0 active:shadow-sticker-active',
          hasValue ? 'border-ink shadow-sticker' : 'bg-transparent border-dashed'
        )}
        style={hasValue ? { backgroundColor: color, color: textColor } : { borderColor: color, color: color, opacity: 0.6 }}
      >
        {hasValue ? (
          <>
            <NotebookPen className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
            <span className="font-mono text-sm sm:text-base font-black leading-tight px-1 break-words">
              {formatCount(value, metric)}
            </span>
          </>
        ) : (
          <Plus className="w-6 h-6 sm:w-8 sm:h-8 shrink-0 opacity-50 relative top-[1px]" />
        )}
      </button>
    </div>
  );
}

function LedgerDayRow({
  day,
  personAName,
  personBName,
  personAColor,
  personBColor,
  metric,
  editingTile,
  tileDraft,
  editingNoteDate,
  noteDraft,
  onTileDraftChange,
  onNoteDraftChange,
  onBeginTileEdit,
  onCancelTileEdit,
  onTileBlur,
  onBeginNoteEdit,
  onCancelNoteEdit,
  onSaveNoteEdit,
  onDeleteDay,
  visibleWriters,
}: {
  day: LedgerDay;
  personAName: string;
  personBName: string;
  personAColor: string;
  personBColor: string;
  metric: string;
  editingTile: EditingTile | null;
  tileDraft: string;
  editingNoteDate: string | null;
  noteDraft: string;
  onTileDraftChange: (value: string) => void;
  onNoteDraftChange: (value: string) => void;
  onBeginTileEdit: (day: LedgerDay, writer: WriterKey) => void;
  onCancelTileEdit: (skipBlurSave?: boolean) => void;
  onTileBlur: () => void;
  onBeginNoteEdit: (day: LedgerDay) => void;
  onCancelNoteEdit: () => void;
  onSaveNoteEdit: (day: LedgerDay) => void;
  onDeleteDay: (day: LedgerDay) => void;
  visibleWriters: ('personA' | 'personB')[];
}) {
  const visibleCount = visibleWriters.length;
  const gridColsClass = visibleCount === 2 
    ? 'grid-cols-[minmax(0,1fr)_minmax(0,1fr)_3.5rem] sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_4rem]' 
    : visibleCount === 1 
      ? 'grid-cols-[minmax(0,1fr)_3.5rem] sm:grid-cols-[minmax(0,1fr)_4rem]'
      : 'grid-cols-[3.5rem] sm:grid-cols-[4rem]';

  return (
    <div className="relative flex flex-col gap-3">
      <div className={cn('flex items-start gap-3 sm:gap-4 md:gap-6', day.isDeadlineDay && 'mt-2')}>
        <div
          className={cn(
            'w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 shrink-0 border-4 border-ink rounded-full flex items-center justify-center shadow-sticker z-10 font-display text-lg sm:text-xl md:text-2xl font-black relative',
            day.isDeadlineDay ? 'bg-primary text-white shadow-[6px_6px_0_var(--color-ink)] sm:shadow-[8px_8px_0_var(--color-ink)]' : day.hasAnyWriting || day.hasNote ? 'bg-white text-ink' : 'bg-bg-paper text-ink-muted'
          )}
        >
          {day.dayNumber}
          {day.showMonthLabel && (
            <div className="absolute right-[100%] mr-2 sm:mr-3 top-0 md:top-2 flex flex-col items-center opacity-40 text-ink">
              {format(parseISO(day.date), 'MMM').toUpperCase().split('').map((char, i) => (
                <span key={i} className="text-[9px] sm:text-[10px] md:text-xs font-black leading-[1.1]">{char}</span>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col gap-3">
          <div className={`grid ${gridColsClass} gap-3 md:gap-4 items-start`}>
              {visibleWriters.includes('personA') && (
                <WriterTile
                  date={day.date}
                  name={personAName}
                  value={day.personAValue}
                  color={personAColor}
                  metric={metric}
                  isEditing={editingTile?.date === day.date && editingTile.writer === 'personA'}
                  draft={tileDraft}
                  onDraftChange={onTileDraftChange}
                  onBeginEdit={() => onBeginTileEdit(day, 'personA')}
                  onCancel={() => onCancelTileEdit(true)}
                  onBlur={onTileBlur}
                />
              )}

              {visibleWriters.includes('personB') && (
                <WriterTile
                  date={day.date}
                  name={personBName}
                  value={day.personBValue}
                  color={personBColor}
                  metric={metric}
                  isEditing={editingTile?.date === day.date && editingTile.writer === 'personB'}
                  draft={tileDraft}
                  onDraftChange={onTileDraftChange}
                  onBeginEdit={() => onBeginTileEdit(day, 'personB')}
                  onCancel={() => onCancelTileEdit(true)}
                  onBlur={onTileBlur}
                />
              )}

            <div className="flex flex-col items-center justify-start gap-2">
              {day.entry && (
                <button
                  type="button"
                  onClick={() => onDeleteDay(day)}
                  title={`Delete ${format(parseISO(day.date), 'MMM d')} entry`}
                  className="w-11 h-11 sm:w-12 sm:h-12 border-4 border-red-500 bg-red-100 text-red-600 shadow-[4px_4px_0_#ef4444] flex items-center justify-center transition-all active:translate-x-1 active:translate-y-1 active:shadow-[1px_1px_0_#ef4444]"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {(day.entry?.note || editingNoteDate === day.date) && (
            <div className="max-w-3xl">
              {editingNoteDate === day.date ? (
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    autoFocus
                    value={noteDraft}
                    onChange={event => onNoteDraftChange(event.target.value)}
                    onKeyDown={event => {
                      if (event.key === 'Enter') onSaveNoteEdit(day);
                      if (event.key === 'Escape') onCancelNoteEdit();
                    }}
                    placeholder="What did you work on?"
                    className="input-playful min-w-0 flex-1 py-2 appearance-none shadow-none rounded-none"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => onSaveNoteEdit(day)}
                      className="w-12 h-12 border-4 border-ink bg-primary text-white shadow-sticker flex items-center justify-center active:shadow-sticker-active active:translate-x-1 active:translate-y-1"
                      title="Save note"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={onCancelNoteEdit}
                      className="w-12 h-12 border-4 border-ink bg-white shadow-sticker flex items-center justify-center active:shadow-sticker-active active:translate-x-1 active:translate-y-1"
                      title="Cancel note edit"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onBeginNoteEdit(day)}
                  className="text-left bg-bg-paper border-2 border-ink px-4 py-3 text-body text-sm text-ink-muted w-full font-bold"
                >
                  {day.entry?.note}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
