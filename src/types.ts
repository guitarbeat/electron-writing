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
  updatedAt: any;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}
