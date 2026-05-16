import { useMemo, useRef, useState } from 'react';
import { eachDayOfInterval, endOfMonth, format, isValid, parseISO, startOfMonth } from 'date-fns';
import { Check, Flag, Minus, NotebookPen, StickyNote, Trash2, X } from 'lucide-react';
import { Entry, Settings } from '../../../types';
import { cn } from '../../../lib/utils';

type WriterKey = 'personA' | 'personB';

interface DailyTimelineLedgerProps {
  entries: Entry[];
  settings: Settings | null;
  saveEntry: (entry: Partial<Entry>) => Promise<boolean>;
  deleteEntry: (date: string) => Promise<boolean>;
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
}

interface EditingTile {
  date: string;
  writer: WriterKey;
}

const INK = '#2b1720';

function getReadableTextColor(hex: string | undefined) {
  if (!hex || !/^#[0-9a-fA-F]{6}$/.test(hex)) return '#ffffff';

  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.68 ? INK : '#ffffff';
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

function buildLedgerDays(entries: Entry[], settings: Settings | null): LedgerDay[] {
  const entriesByDate = new Map(entries.map(entry => [entry.date, entry]));
  const sortedEntries = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const start = sortedEntries.length > 0
    ? startOfMonth(parseISO(sortedEntries[0].date))
    : startOfMonth(new Date());

  const parsedDeadline = settings?.deadline ? parseISO(settings.deadline) : null;
  const deadline = parsedDeadline && isValid(parsedDeadline) ? parsedDeadline : endOfMonth(new Date());
  const end = deadline >= start ? deadline : endOfMonth(start);
  const deadlineStr = format(deadline, 'yyyy-MM-dd');

  return eachDayOfInterval({ start, end }).map((day, index, allDays) => {
    const date = format(day, 'yyyy-MM-dd');
    const entry = entriesByDate.get(date);
    const previousDay = allDays[index - 1];

    return {
      date,
      dayNumber: format(day, 'dd'),
      monthLabel: format(day, 'MMMM yyyy'),
      showMonthLabel: index === 0 || format(previousDay, 'yyyy-MM') !== format(day, 'yyyy-MM'),
      entry,
      personAValue: entry?.aaronWords || 0,
      personBValue: entry?.electraWords || 0,
      isDeadlineDay: date === deadlineStr,
      hasAnyWriting: Boolean((entry?.aaronWords || 0) + (entry?.electraWords || 0)),
    };
  });
}

export function DailyTimelineLedger({ entries, settings, saveEntry, deleteEntry }: DailyTimelineLedgerProps) {
  const [editingTile, setEditingTile] = useState<EditingTile | null>(null);
  const [tileDraft, setTileDraft] = useState('');
  const [editingNoteDate, setEditingNoteDate] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const skipNextTileBlurSave = useRef(false);

  const metric = settings?.metric === 'pages' ? 'pages' : 'words';
  const personAName = settings?.personAName || 'Aaron';
  const personBName = settings?.personBName || 'Electra';
  const personAColor = settings?.personAColor || '#ff4d8d';
  const personBColor = settings?.personBColor || '#7c3aed';

  const days = useMemo(() => buildLedgerDays(entries, settings), [entries, settings]);

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

    setEditingTile(null);
    setTileDraft('');

    if (nextAaron === 0 && nextElectra === 0 && !nextNote.trim()) {
      if (currentEntry) await deleteEntry(editingTile.date);
      return;
    }

    await saveEntry({
      date: editingTile.date,
      aaronWords: nextAaron,
      electraWords: nextElectra,
      note: nextNote,
    });
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

  return (
    <section className="sticker-card bg-white p-4 sm:p-6 md:p-8 flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b-4 border-ink pb-5">
        <div>
          <h2 className="font-display text-3xl md:text-4xl font-black text-ink">Daily Writing Ledger</h2>
          <p className="text-sm md:text-base font-bold text-ink-muted mt-2">
            Track the ink from first log through deadline.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-bg-paper border-4 border-ink px-3 sm:px-4 py-2 sm:py-3 shadow-[4px_4px_0_#2b1720]">
          <LegendSwatch color={personAColor} label={personAName} />
          <div className="w-1 h-8 bg-ink" />
          <LegendSwatch color={personBColor} label={personBName} />
          <div className="w-1 h-8 bg-ink hidden sm:block" />
          <span className="font-mono text-[10px] font-black uppercase tracking-widest text-ink-muted">
            Unit: {metric}
          </span>
        </div>
      </div>

      <div className="max-h-[760px] overflow-y-auto hide-scrollbar pr-1 md:pr-3">
        <div className="relative flex flex-col gap-5 pb-6">
          <div className="absolute left-7 md:left-8 top-12 bottom-0 w-1 bg-ink" />

          {days.map(day => (
            <div key={day.date} className="relative flex flex-col gap-3">
              {day.showMonthLabel && (
                <div className="ml-20 md:ml-24 py-2">
                  <span className="inline-flex bg-bg-paper border-2 border-ink px-3 py-1 font-mono text-[10px] font-black uppercase tracking-widest text-ink-muted">
                    {day.monthLabel}
                  </span>
                </div>
              )}

              <div className={cn('flex items-start gap-4 md:gap-6', day.isDeadlineDay && 'mt-2')}>
                <div
                  className={cn(
                    'w-14 h-14 md:w-16 md:h-16 shrink-0 border-4 border-ink rounded-full flex items-center justify-center shadow-[4px_4px_0_#2b1720] z-10 font-display text-xl md:text-2xl font-black',
                    day.isDeadlineDay ? 'bg-primary text-white shadow-[6px_6px_0_#2b1720]' : day.hasAnyWriting ? 'bg-white text-ink' : 'bg-bg-paper text-ink-muted'
                  )}
                >
                  {day.dayNumber}
                </div>

                <div
                  className={cn(
                    'flex-1 min-w-0 flex flex-col gap-3',
                    day.isDeadlineDay && 'bg-bg-pop border-4 border-ink shadow-[8px_8px_0_#2b1720] p-3 sm:p-4 md:p-6'
                  )}
                >
                  {day.isDeadlineDay && (
                    <div className="flex items-center gap-2 self-start bg-ink text-white px-3 py-2 font-mono text-[10px] font-black uppercase tracking-widest rotate-[-1deg]">
                      <Flag className="w-4 h-4" />
                      Deadline
                    </div>
                  )}

                  <div className="flex flex-row flex-wrap sm:flex-nowrap items-start gap-3 md:gap-4">
                    <WriterTile
                      date={day.date}
                      name={personAName}
                      value={day.personAValue}
                      color={personAColor}
                      metric={metric}
                      isEditing={editingTile?.date === day.date && editingTile.writer === 'personA'}
                      draft={tileDraft}
                      onDraftChange={setTileDraft}
                      onBeginEdit={() => beginTileEdit(day, 'personA')}
                      onCancel={() => cancelTileEdit(true)}
                      onBlur={handleTileBlur}
                    />

                    <WriterTile
                      date={day.date}
                      name={personBName}
                      value={day.personBValue}
                      color={personBColor}
                      metric={metric}
                      isEditing={editingTile?.date === day.date && editingTile.writer === 'personB'}
                      draft={tileDraft}
                      onDraftChange={setTileDraft}
                      onBeginEdit={() => beginTileEdit(day, 'personB')}
                      onCancel={() => cancelTileEdit(true)}
                      onBlur={handleTileBlur}
                    />

                    <div className="flex items-center gap-2 min-h-24 md:min-h-28">
                      <button
                        type="button"
                        onClick={() => beginNoteEdit(day)}
                        title={`Edit note for ${format(parseISO(day.date), 'MMM d')}`}
                        className={cn(
                          'w-11 h-11 border-4 border-ink bg-white shadow-[4px_4px_0_#2b1720] flex items-center justify-center transition-all active:translate-x-1 active:translate-y-1 active:shadow-[1px_1px_0_#2b1720]',
                          day.entry?.note && 'bg-accent'
                        )}
                      >
                        <StickyNote className="w-5 h-5" />
                      </button>

                      {day.entry && (
                        <button
                          type="button"
                          onClick={() => handleDeleteDay(day)}
                          title={`Delete ${format(parseISO(day.date), 'MMM d')} entry`}
                          className="w-11 h-11 border-4 border-red-500 bg-red-100 text-red-600 shadow-[4px_4px_0_#ef4444] flex items-center justify-center transition-all active:translate-x-1 active:translate-y-1 active:shadow-[1px_1px_0_#ef4444]"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {(day.entry?.note || editingNoteDate === day.date) && (
                    <div className="max-w-2xl">
                      {editingNoteDate === day.date ? (
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            autoFocus
                            value={noteDraft}
                            onChange={event => setNoteDraft(event.target.value)}
                            onKeyDown={event => {
                              if (event.key === 'Enter') saveNoteEdit(day);
                              if (event.key === 'Escape') cancelNoteEdit();
                            }}
                            placeholder="What did you work on?"
                            className="input-playful min-w-0 flex-1 rounded-button py-2"
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => saveNoteEdit(day)}
                              className="w-12 h-12 border-4 border-ink bg-primary text-white shadow-[4px_4px_0_#2b1720] flex items-center justify-center"
                              title="Save note"
                            >
                              <Check className="w-5 h-5" />
                            </button>
                            <button
                              type="button"
                              onClick={cancelNoteEdit}
                              className="w-12 h-12 border-4 border-ink bg-white shadow-[4px_4px_0_#2b1720] flex items-center justify-center"
                              title="Cancel note edit"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => beginNoteEdit(day)}
                          className="text-left bg-bg-paper border-2 border-ink px-4 py-3 font-bold text-sm text-ink-muted w-full"
                        >
                          {day.entry?.note}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-5 h-5 border-2 border-ink" style={{ backgroundColor: color }} />
      <span className="font-mono text-[10px] font-black uppercase tracking-widest text-ink">{label}</span>
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
      <div className="w-full sm:w-[calc(50%-0.375rem)] md:w-36 h-20 sm:h-24 md:h-28 bg-white border-4 border-ink shadow-[6px_6px_0_#2b1720] p-3 flex flex-col justify-between">
        <label className="font-mono text-[10px] font-black uppercase tracking-widest text-ink-muted truncate">{name}</label>
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
          className="w-full min-w-0 bg-bg-paper border-2 border-ink px-2 py-1 font-mono text-2xl font-black text-ink outline-none focus:bg-white"
          aria-label={`${name} ${metric} for ${date}`}
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onBeginEdit}
      title={`Edit ${name} ${metric} for ${format(parseISO(date), 'MMM d')}`}
      className={cn(
        'w-full sm:w-[calc(50%-0.375rem)] md:w-36 h-20 sm:h-24 md:h-28 border-4 flex flex-col items-center justify-center gap-2 transition-all text-center',
        'hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[8px_8px_0_#2b1720] active:translate-x-1 active:translate-y-1 active:shadow-[2px_2px_0_#2b1720]',
        hasValue ? 'border-ink shadow-[6px_6px_0_#2b1720]' : 'bg-transparent border-dashed border-ink/25 text-ink-faint'
      )}
      style={hasValue ? { backgroundColor: color, color: textColor } : undefined}
    >
      {hasValue ? (
        <>
          <NotebookPen className="w-6 h-6 shrink-0" />
          <span className="font-mono text-[13px] font-black leading-tight px-2 break-words">
            {formatCount(value, metric)}
          </span>
        </>
      ) : (
        <>
          <Minus className="w-7 h-7 shrink-0" />
          <span className="font-mono text-[10px] font-black uppercase tracking-widest">{name}</span>
        </>
      )}
    </button>
  );
}
