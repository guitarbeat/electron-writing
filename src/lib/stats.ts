import { Entry, Settings } from '../types';
import { differenceInCalendarDays, format, isSameWeek, parseISO, startOfWeek, addDays, eachDayOfInterval } from 'date-fns';

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
  currentStreak: number;
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

  const sortedEntries = [...entries].sort((a, b) => b.date.localeCompare(a.date)); // Sort descending for streak
  
  let currentStreak = 0;
  const yesterday = addDays(now, -1);
  const yesterdayStr = format(yesterday, 'yyyy-MM-dd');
  
  let checkingDateStr = todayStr;
  
  // If today has 0 words, start checking from yesterday
  const todayEntry = sortedEntries.find(e => e.date === todayStr);
  if (!todayEntry || ((todayEntry.aaronWords || 0) + (todayEntry.electraWords || 0)) === 0) {
    checkingDateStr = yesterdayStr;
  }

  for (let i = 0; i < sortedEntries.length; i++) {
    // skip dates in the future
    if (sortedEntries[i].date > todayStr) continue;
    
    // We only care about consecutive days backward
    if (sortedEntries[i].date === checkingDateStr) {
      if (((sortedEntries[i].aaronWords || 0) + (sortedEntries[i].electraWords || 0)) > 0) {
        currentStreak++;
        checkingDateStr = format(addDays(parseISO(checkingDateStr), -1), 'yyyy-MM-dd');
      } else {
        break; // Streak broken
      }
    } else if (sortedEntries[i].date < checkingDateStr) {
      break; // Gap in days, streak broken
    }
  }

  const ascendingEntries = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const startDate = ascendingEntries.length > 0 ? parseISO(ascendingEntries[0].date) : now;
  const deadlineDate = settings?.deadline ? parseISO(settings.deadline) : addDays(now, 10);
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
    currentStreak,
  };
}

export function getChartData(rawEntries: Entry[], view: 'daily' | 'weekly' | 'cumulative', settings: Settings | null): ChartDatum[] {
  const entries = Array.isArray(rawEntries) ? rawEntries : [];
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const goal = settings?.projectGoal || 50000;
  const totalTeam = sorted.reduce((sum, entry) => sum + (entry.aaronWords || 0) + (entry.electraWords || 0), 0);
  const now = new Date();
  const startDate = sorted.length > 0 ? parseISO(sorted[0].date) : new Date();
  const deadlineDate = settings?.deadline ? parseISO(settings.deadline) : addDays(now, 10);
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
    
    // Create a map of existing entries
    const entriesByDate = new Map(sorted.map(e => [e.date, e]));
    
    // Generate every day from start to deadline
    const allDays = eachDayOfInterval({ start: startDate, end: deadlineDate });
    
    return allDays.map((dateObj, index) => {
      const dateStr = format(dateObj, 'yyyy-MM-dd');
      const e = entriesByDate.get(dateStr);
      
      if (e) {
        sumAaron += e.aaronWords || 0;
        sumElectra += e.electraWords || 0;
        sumTeam += (e.aaronWords || 0) + (e.electraWords || 0);
      }
      
      const elapsedDays = index + 1;
      
      // Determine if this date is in the future
      const isFuture = dateObj > now && dateStr !== format(now, 'yyyy-MM-dd');
      
      return {
        date: dateStr,
        // For future dates, we don't plot the progress bar (or we can return null if types allow, but undefined works)
        Aaron: isFuture ? undefined : sumAaron,
        Electra: isFuture ? undefined : sumElectra,
        Team: isFuture ? undefined : sumTeam,
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

