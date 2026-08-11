export interface Entry {
  id: string;
  date: string;
  aaronWords: number;
  electraWords: number;
  note?: string;
  createdAt: any;
  updatedAt: any;
}

export interface Settings {
  personAName: string;
  personBName: string;
  personAColor: string;
  personBColor: string;
  teamColor: string;
  goalsEnabled: boolean;
  individualGoalsEnabled: boolean;
  personAWeeklyGoal: number;
  personBWeeklyGoal: number;
  activityThresholds: number[];
  defaultChartView: 'daily' | 'weekly' | 'cumulative';
  defaultGridView: 'team' | 'personA' | 'personB';
  isSetupComplete: boolean;
  metric: 'words' | 'pages';
  projectGoal: number;
  deadline: string;
  setupUpdateCount: number;
  updatedAt: any;
  lastModifiedBy?: string;
  passcode?: string;
  theme?: 'light' | 'dark';
}

