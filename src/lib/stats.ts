import { Entry, Settings } from '../types';
import { isSameDay, isSameWeek, parseISO, startOfWeek, format } from 'date-fns';

export interface TrackerStats {
  todayAaron: number;
  todayElectra: number;
  todayTeam: number;
  weekAaron: number;
  weekElectra: number;
  weekTeam: number;
  activeDays: number;
  aaronTotal: number;
  electraTotal: number;
  teamTotal: number;
}

export function calculateTrackerStats(entries: Entry[], settings: Settings | null): TrackerStats {
  const today = new Date();
  
  let todayAaron = 0;
  let todayElectra = 0;
  let weekAaron = 0;
  let weekElectra = 0;
  let activeDays = 0;
  let aaronTotal = 0;
  let electraTotal = 0;

  entries.forEach(entry => {
    const entryDate = parseISO(entry.date);
    const aaron = entry.aaronWords || 0;
    const electra = entry.electraWords || 0;

    aaronTotal += aaron;
    electraTotal += electra;

    if (aaron > 0 || electra > 0) {
      activeDays++;
    }

    if (isSameDay(entryDate, today)) {
      todayAaron += aaron;
      todayElectra += electra;
    }

    if (isSameWeek(entryDate, today, { weekStartsOn: 1 })) { // Monday start
      weekAaron += aaron;
      weekElectra += electra;
    }
  });

  return {
    todayAaron,
    todayElectra,
    todayTeam: todayAaron + todayElectra,
    weekAaron,
    weekElectra,
    weekTeam: weekAaron + weekElectra,
    activeDays,
    aaronTotal,
    electraTotal,
    teamTotal: aaronTotal + electraTotal,
  };
}

export function getChartData(entries: Entry[], view: 'daily' | 'weekly' | 'cumulative') {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  
  if (view === 'cumulative') {
    let aSum = 0;
    let eSum = 0;
    return sorted.map(e => {
      aSum += e.aaronWords;
      eSum += e.electraWords;
      return {
        date: e.date,
        Aaron: aSum,
        Electra: eSum,
        Team: aSum + eSum
      };
    });
  }

  if (view === 'weekly') {
    const weeks: Record<string, { a: number, e: number }> = {};
    sorted.forEach(e => {
      const weekDate = startOfWeek(parseISO(e.date), { weekStartsOn: 1 });
      const weekStr = format(weekDate, 'yyyy-MM-dd');
      if (!weeks[weekStr]) weeks[weekStr] = { a: 0, e: 0 };
      weeks[weekStr].a += e.aaronWords;
      weeks[weekStr].e += e.electraWords;
    });

    return Object.entries(weeks).map(([date, counts]) => ({
      date,
      Aaron: counts.a,
      Electra: counts.e,
      Team: counts.a + counts.e
    })).sort((a, b) => a.date.localeCompare(b.date));
  }

  // Daily is default
  return sorted.map(e => ({
    date: e.date,
    Aaron: e.aaronWords,
    Electra: e.electraWords,
    Team: e.aaronWords + e.electraWords
  }));
}

export function getActivityLevel(words: number, thresholds = [250, 750, 1500]) {
  if (words <= 0) return 0;
  if (words < thresholds[0]) return 1;
  if (words < thresholds[1]) return 2;
  if (words < thresholds[2]) return 3;
  return 4;
}
