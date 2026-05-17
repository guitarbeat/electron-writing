import { Entry, Settings } from '../types';
import { isSameDay, isSameWeek, parseISO, startOfWeek, format } from 'date-fns';

export interface TrackerStats {
  todayAaron: number;
  todayElectra: number;
  todayTeam: number;
  weekTeam: number;
  activeDays: number;
  totalTeam: number;
  totalTime: number;
  wpm: number;
}

export function calculateTrackerStats(entries: Entry[], settings: Settings | null): TrackerStats {
  const now = new Date();
  const todayStr = format(now, 'yyyy-MM-dd');
  
  let todayAaron = 0;
  let todayElectra = 0;
  let todayTeam = 0;
  let weekTeam = 0;
  let activeDays = 0;
  let totalTeam = 0;
  let totalTime = 0;

  entries.forEach(entry => {
    const aaron = entry.aaronWords || 0;
    const electra = entry.electraWords || 0;
    const aaronTime = entry.aaronTime || 0;
    const electraTime = entry.electraTime || 0;
    const team = aaron + electra;
    const teamTime = aaronTime + electraTime;

    totalTeam += team;
    totalTime += teamTime;

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

  const wpm = totalTime > 0 ? Math.round(totalTeam / totalTime) : 0;

  return {
    todayAaron,
    todayElectra,
    todayTeam,
    weekTeam,
    activeDays,
    totalTeam,
    totalTime,
    wpm,
  };
}

export function getChartData(entries: Entry[], view: 'daily' | 'weekly' | 'cumulative') {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  
  if (view === 'cumulative') {
    let sumAaron = 0;
    let sumElectra = 0;
    let sumTeam = 0;
    let sumAaronTime = 0;
    let sumElectraTime = 0;
    let sumTeamTime = 0;

    return sorted.map(e => {
      sumAaron += e.aaronWords || 0;
      sumElectra += e.electraWords || 0;
      sumTeam += (e.aaronWords || 0) + (e.electraWords || 0);
      sumAaronTime += e.aaronTime || 0;
      sumElectraTime += e.electraTime || 0;
      sumTeamTime += (e.aaronTime || 0) + (e.electraTime || 0);
      return {
        date: e.date,
        Aaron: sumAaron,
        Electra: sumElectra,
        Team: sumTeam,
        AaronTime: sumAaronTime,
        ElectraTime: sumElectraTime,
        TeamTime: sumTeamTime,
      };
    });
  }

  if (view === 'weekly') {
    const weeks: Record<string, { aaron: number, electra: number, team: number, aaronTime: number, electraTime: number, teamTime: number }> = {};
    sorted.forEach(e => {
      const weekDate = startOfWeek(parseISO(e.date), { weekStartsOn: 1 });
      const weekStr = format(weekDate, 'yyyy-MM-dd');
      if (!weeks[weekStr]) weeks[weekStr] = { aaron: 0, electra: 0, team: 0, aaronTime: 0, electraTime: 0, teamTime: 0 };
      weeks[weekStr].aaron += e.aaronWords || 0;
      weeks[weekStr].electra += e.electraWords || 0;
      weeks[weekStr].team += (e.aaronWords || 0) + (e.electraWords || 0);
      weeks[weekStr].aaronTime += e.aaronTime || 0;
      weeks[weekStr].electraTime += e.electraTime || 0;
      weeks[weekStr].teamTime += (e.aaronTime || 0) + (e.electraTime || 0);
    });

    return Object.entries(weeks).map(([date, counts]) => ({
      date,
      Aaron: counts.aaron,
      Electra: counts.electra,
      Team: counts.team,
      AaronTime: counts.aaronTime,
      ElectraTime: counts.electraTime,
      TeamTime: counts.teamTime,
    })).sort((a, b) => a.date.localeCompare(b.date));
  }

  // Daily is default
  return sorted.map(e => ({
    date: e.date,
    Aaron: e.aaronWords || 0,
    Electra: e.electraWords || 0,
    Team: (e.aaronWords || 0) + (e.electraWords || 0),
    AaronTime: e.aaronTime || 0,
    ElectraTime: e.electraTime || 0,
    TeamTime: (e.aaronTime || 0) + (e.electraTime || 0),
  }));
}
