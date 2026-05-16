import { Entry, Settings } from '../types';
import { isSameDay, isSameWeek, parseISO, startOfWeek, format } from 'date-fns';

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
