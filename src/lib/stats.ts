import { Entry, Settings } from '../types';
import { isSameDay, isSameWeek, parseISO, startOfWeek, format, eachDayOfInterval, startOfMonth, endOfMonth } from 'date-fns';

export interface TrackerStats {
  todayAaron: number;
  todayElectra: number;
  todayTeam: number;
  weekTeam: number;
  activeDays: number;
  totalTeam: number;
}

export function calculateTrackerStats(entries: Entry[], settings: Settings | null): TrackerStats {
  const today = new Date();
  
  let todayAaron = 0;
  let todayElectra = 0;
  let todayTeam = 0;
  let weekTeam = 0;
  let activeDays = 0;
  let totalTeam = 0;

  entries.forEach(entry => {
    const entryDate = parseISO(entry.date);
    const aaron = entry.aaronWords || 0;
    const electra = entry.electraWords || 0;
    const team = aaron + electra;

    totalTeam += team;

    if (team > 0) {
      activeDays++;
    }

    if (isSameDay(entryDate, today)) {
      todayAaron += aaron;
      todayElectra += electra;
      todayTeam += team;
    }

    if (isSameWeek(entryDate, today, { weekStartsOn: 1 })) { // Monday start
      weekTeam += team;
    }
  });

  return {
    todayAaron,
    todayElectra,
    todayTeam,
    weekTeam,
    activeDays,
    totalTeam,
  };
}

export function getChartData(entries: Entry[], view: 'daily' | 'weekly' | 'cumulative') {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  
  if (view === 'cumulative') {
    let sumAaron = 0;
    let sumElectra = 0;
    let sumTeam = 0;
    return sorted.map(e => {
      sumAaron += e.aaronWords || 0;
      sumElectra += e.electraWords || 0;
      sumTeam += (e.aaronWords || 0) + (e.electraWords || 0);
      return {
        date: e.date,
        Aaron: sumAaron,
        Electra: sumElectra,
        Team: sumTeam,
      };
    });
  }

  if (view === 'weekly') {
    const weeks: Record<string, { aaron: number, electra: number, team: number }> = {};
    sorted.forEach(e => {
      const weekDate = startOfWeek(parseISO(e.date), { weekStartsOn: 1 });
      const weekStr = format(weekDate, 'yyyy-MM-dd');
      if (!weeks[weekStr]) weeks[weekStr] = { aaron: 0, electra: 0, team: 0 };
      weeks[weekStr].aaron += e.aaronWords || 0;
      weeks[weekStr].electra += e.electraWords || 0;
      weeks[weekStr].team += (e.aaronWords || 0) + (e.electraWords || 0);
    });

    return Object.entries(weeks).map(([date, counts]) => ({
      date,
      Aaron: counts.aaron,
      Electra: counts.electra,
      Team: counts.team,
    })).sort((a, b) => a.date.localeCompare(b.date));
  }

  // Daily is default
  return sorted.map(e => ({
    date: e.date,
    Aaron: e.aaronWords || 0,
    Electra: e.electraWords || 0,
    Team: (e.aaronWords || 0) + (e.electraWords || 0),
  }));
}

export function getHeatmapStats(entries: Entry[], settings: Settings | null, gridView: 'team' | 'personA' | 'personB') {
  if (entries.length === 0) return { rows: [], dynamicBaseline: 0 };
  
  const sortedEntries = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const start = parseISO(sortedEntries[0].date);
  const end = new Date();
  const interval = eachDayOfInterval({ start: startOfMonth(start), end: endOfMonth(end) });

  const rows = interval.map(day => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const entry = entries.find(e => e.date === dateStr);
    let words = 0;
    let target = 0;

    if (gridView === 'team') {
      words = entry ? entry.aaronWords + entry.electraWords : 0;
      target = (settings?.projectGoal || 50000) / 100; // placeholder divided daily goal
    } else if (gridView === 'personA') {
      words = entry ? entry.aaronWords : 0;
      target = (settings?.personAWeeklyGoal || 3500) / 7;
    } else {
      words = entry ? entry.electraWords : 0;
      target = (settings?.personBWeeklyGoal || 3500) / 7;
    }

    return {
      dateStr,
      dateObj: day,
      wordsWritten: words,
      target: target || 500,
      status: entry ? 'Logged' : 'Pending',
      note: entry?.note
    };
  });

  return { 
    rows, 
    dynamicBaseline: (settings?.projectGoal || 50000) / 100
  };
}
