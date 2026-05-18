import { Entry, Settings } from '../types';
import { differenceInCalendarDays, format, isSameWeek, parseISO, startOfWeek } from 'date-fns';

export interface TrackerStats {
  todayAaron: number;
  todayElectra: number;
  todayTeam: number;
  weekTeam: number;
  activeDays: number;
  totalTeam: number;
  goal: number;
  remainingGoal: number;
  daysLeft: number;
  requiredPerDay: number;
  requiredPerWeek: number;
  expectedCumulativeToday: number;
  deficit: number;
}

export interface ChartDatum {
  date: string;
  Aaron: number;
  Electra: number;
  Team: number;
  Goal: number;
}

export function calculateTrackerStats(rawEntries: Entry[], settings: Settings | null): TrackerStats {
  const entries = Array.isArray(rawEntries) ? rawEntries : [];
  const now = new Date();
  const todayStr = format(now, 'yyyy-MM-dd');
  const goal = settings?.projectGoal || 50000;
  
  let todayAaron = 0;
  let todayElectra = 0;
  let todayTeam = 0;
  let weekTeam = 0;
  let activeDays = 0;
  let totalTeam = 0;

  entries.forEach(entry => {
    const aaron = entry.aaronWords || 0;
    const electra = entry.electraWords || 0;
    const team = aaron + electra;

    totalTeam += team;

    if (team > 0) {
      activeDays++;
    }

    if (entry.date === todayStr) {
      todayAaron += aaron;
      todayElectra += electra;
      todayTeam += team;
    }

    // Weekly stats (Monday start)
    const entryDate = parseISO(entry.date);
    if (isSameWeek(entryDate, now, { weekStartsOn: 1 })) {
      weekTeam += team;
    }
  });

  const sortedEntries = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const startDate = sortedEntries.length > 0 ? parseISO(sortedEntries[0].date) : now;
  const deadlineDate = settings?.deadline ? parseISO(settings.deadline) : now;
  const totalDays = Math.max(1, differenceInCalendarDays(deadlineDate, startDate) + 1);
  const elapsedDays = Math.min(totalDays, Math.max(1, differenceInCalendarDays(now, startDate) + 1));
  const daysLeft = Math.max(1, differenceInCalendarDays(deadlineDate, now) + 1);
  const remainingGoal = Math.max(0, goal - totalTeam);
  const requiredPerDay = remainingGoal / daysLeft;
  const requiredPerWeek = requiredPerDay * 7;
  const expectedCumulativeToday = Math.min(goal, (goal / totalDays) * elapsedDays);
  const deficit = totalTeam - expectedCumulativeToday;

  return {
    todayAaron,
    todayElectra,
    todayTeam,
    weekTeam,
    activeDays,
    totalTeam,
    goal,
    remainingGoal,
    daysLeft,
    requiredPerDay,
    requiredPerWeek,
    expectedCumulativeToday,
    deficit,
  };
}

export function getChartData(rawEntries: Entry[], view: 'daily' | 'weekly' | 'cumulative', settings: Settings | null): ChartDatum[] {
  const entries = Array.isArray(rawEntries) ? rawEntries : [];
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const goal = settings?.projectGoal || 50000;
  const totalTeam = sorted.reduce((sum, entry) => sum + (entry.aaronWords || 0) + (entry.electraWords || 0), 0);
  const now = new Date();
  const startDate = sorted.length > 0 ? parseISO(sorted[0].date) : new Date();
  const deadlineDate = settings?.deadline ? parseISO(settings.deadline) : new Date();
  const totalDays = Math.max(1, differenceInCalendarDays(deadlineDate, startDate) + 1);
  const totalWeeks = Math.max(1, Math.ceil(totalDays / 7));
  const daysLeft = Math.max(1, differenceInCalendarDays(deadlineDate, now) + 1);
  const remainingGoal = Math.max(0, goal - totalTeam);
  const totalPerDay = goal / totalDays;
  const requiredPerDay = remainingGoal / daysLeft;
  const requiredPerWeek = requiredPerDay * 7;
  
  if (view === 'cumulative') {
    let sumAaron = 0;
    let sumElectra = 0;
    let sumTeam = 0;
    return sorted.map(e => {
      const elapsedDays = Math.min(totalDays, Math.max(1, differenceInCalendarDays(parseISO(e.date), startDate) + 1));
      sumAaron += e.aaronWords || 0;
      sumElectra += e.electraWords || 0;
      sumTeam += (e.aaronWords || 0) + (e.electraWords || 0);
      return {
        date: e.date,
        Aaron: sumAaron,
        Electra: sumElectra,
        Team: sumTeam,
        Goal: Math.min(goal, totalPerDay * elapsedDays),
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
      Goal: requiredPerWeek,
    })).sort((a, b) => a.date.localeCompare(b.date));
  }

  // Daily is default
  return sorted.map(e => ({
    date: e.date,
    Aaron: e.aaronWords || 0,
    Electra: e.electraWords || 0,
    Team: (e.aaronWords || 0) + (e.electraWords || 0),
    Goal: requiredPerDay,
  }));
}
