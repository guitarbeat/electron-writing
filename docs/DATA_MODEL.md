# Smeemo Data Model

Smeemo stores two tables in Neon PostgreSQL: `entries` and `settings`. The schema lives in `server/db/schema.ts` and is managed with Drizzle Kit.

## Entries

One row represents one date.

```ts
export const entries = pgTable("entries", {
  id: text("id").primaryKey(),
  date: text("date").notNull(),
  aaronWords: integer("aaron_words").notNull().default(0),
  electraWords: integer("electra_words").notNull().default(0),
  aaronTime: integer("aaron_time").notNull().default(0), // minutes
  electraTime: integer("electra_time").notNull().default(0), // minutes
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

App type:

```ts
export interface Entry {
  id: string;
  date: string;
  aaronWords: number;
  electraWords: number;
  aaronTime: number;
  electraTime: number;
  note?: string;
  createdAt: any;
  updatedAt: any;
}
```

Rules:

- `id` and `date` use the same `YYYY-MM-DD` string.
- Word values and time values are clamped to non-negative integers.
- A save requires a date plus at least one metric (words or time) or a note.
- Saving an existing date updates that date.

## Settings

There is one settings row with `id = "global"`.

```ts
export const settings = pgTable("settings", {
  id: text("id").primaryKey().default(DEFAULT_SETTINGS.id),
  personAName: text("person_a_name").notNull().default(DEFAULT_SETTINGS.personAName),
  personBName: text("person_b_name").notNull().default(DEFAULT_SETTINGS.personBName),
  personAColor: text("person_a_color").notNull().default(DEFAULT_SETTINGS.personAColor),
  personBColor: text("person_b_color").notNull().default(DEFAULT_SETTINGS.personBColor),
  teamColor: text("team_color").notNull().default(DEFAULT_SETTINGS.teamColor),
  goalsEnabled: boolean("goals_enabled").notNull().default(DEFAULT_SETTINGS.goalsEnabled),
  individualGoalsEnabled: boolean("individual_goals_enabled").notNull().default(DEFAULT_SETTINGS.individualGoalsEnabled),
  personAWeeklyGoal: integer("person_a_weekly_goal").notNull().default(DEFAULT_SETTINGS.personAWeeklyGoal),
  personBWeeklyGoal: integer("person_b_weekly_goal").notNull().default(DEFAULT_SETTINGS.personBWeeklyGoal),
  activityThresholds: jsonb("activity_thresholds").notNull().$type<number[]>().default(DEFAULT_SETTINGS.activityThresholds),
  defaultChartView: text("default_chart_view").notNull().default(DEFAULT_SETTINGS.defaultChartView),
  defaultGridView: text("default_grid_view").notNull().default(DEFAULT_SETTINGS.defaultGridView),
  isSetupComplete: boolean("is_setup_complete").notNull().default(DEFAULT_SETTINGS.isSetupComplete),
  projectTitle: text("project_title").notNull().default(DEFAULT_SETTINGS.projectTitle),
  metric: text("metric").notNull().default(DEFAULT_SETTINGS.metric),
  projectGoal: integer("project_goal").notNull().default(DEFAULT_SETTINGS.projectGoal),
  deadline: text("deadline").notNull().default(DEFAULT_SETTINGS.deadline),
  startDate: text("start_date").notNull().default(DEFAULT_SETTINGS.startDate),
  setupUpdateCount: integer("setup_update_count").notNull().default(DEFAULT_SETTINGS.setupUpdateCount),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastModifiedBy: text("last_modified_by").notNull().default(DEFAULT_SETTINGS.lastModifiedBy),
});
```

Settings control names, colors, chart defaults, grid defaults, goal configuration, setup/onboarding state, metric label, project goal, and deadline.

Derived statistics are calculated in `client/lib/stats.ts` to support the Camp NaNoWriMo tracking logic:

- **Totals**: `teamWords = aaronWords + electraWords`, `teamTime = aaronTime + electraTime`.
- **Targeting**:
    - `totalDays`: Calculated from settings `deadline` and first entry date (or project start).
    - `daysOver`: Days passed since the start.
    - `daysLeft`: `totalDays - daysOver`.
    - `dailyTarget`: `projectGoal / totalDays`.
- **Progress**:
    - `cumulativeWords`: Running sum of `teamWords`.
    - `cumulativeTime`: Running sum of `teamTime`.
    - `completionPercent`: `(cumulativeWords / projectGoal) * 100`.
- **Velocity**:
    - `wpm`: `cumulativeWords / cumulativeTime` (if time > 0).
    - `avgWordsPerDay`: `cumulativeWords / daysOver`.
- **Status & Health**:
    - `expectedCumulative`: `dailyTarget * daysOver`.
    - `deficit`: `cumulativeWords - expectedCumulative`. (Positive = Green/Success, Negative = Red/Danger).
    - `perDayGoal`: `(projectGoal - cumulativeWords) / daysLeft`.
    - `achievedDays`: Count of entries where `teamWords >= dailyTarget`.
    - `missedDays`: Count of entries where `teamWords < dailyTarget`.

## Import and Export

Export produces:

```json
{
  "version": 1,
  "exportedAt": "2026-05-15T20:30:00.000Z",
  "settings": {},
  "entries": []
}
```

Import supports `merge` and `replace`. Entries are upserted by date.
