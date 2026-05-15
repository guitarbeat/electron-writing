# Clean Writer Data Model

## Overview

The data model should stay simple. The app only needs entries and settings.

Recommended collections/tables:

1. `entries`
2. `settings`

Optional later:

3. `backups`
4. `projects`

## Entry Model

Use one entry per date.

```ts
type WritingEntry = {
  id: string;
  date: string; // YYYY-MM-DD
  aaronWords: number;
  electraWords: number;
  note?: string;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
};
```

Example:

```json
{
  "id": "2026-05-15",
  "date": "2026-05-15",
  "aaronWords": 600,
  "electraWords": 450,
  "note": "Drafted opening scene",
  "createdAt": "2026-05-15T20:30:00.000Z",
  "updatedAt": "2026-05-15T20:30:00.000Z"
}
```

## Settings Model

```ts
type CleanWriterSettings = {
  personAName: string;
  personBName: string;

  personAColor: string;
  personBColor: string;
  teamColor: string;

  goalsEnabled: boolean;
  individualGoalsEnabled: boolean;

  teamWeeklyGoal?: number;
  personAWeeklyGoal?: number;
  personBWeeklyGoal?: number;

  activityThresholds: number[];

  defaultChartView: "daily" | "weekly" | "cumulative";
  defaultGridView: "team" | "personA" | "personB";

  updatedAt: string;
};
```

Example:

```json
{
  "personAName": "Aaron",
  "personBName": "Electra",
  "personAColor": "#ff4d8d",
  "personBColor": "#7c3aed",
  "teamColor": "#2b1720",
  "goalsEnabled": true,
  "individualGoalsEnabled": false,
  "teamWeeklyGoal": 7000,
  "personAWeeklyGoal": 3500,
  "personBWeeklyGoal": 3500,
  "activityThresholds": [250, 750, 1500],
  "defaultChartView": "daily",
  "defaultGridView": "team",
  "updatedAt": "2026-05-15T20:30:00.000Z"
}
```

## Database Stack

- **Database:** PostgreSQL (Neon)
- **ORM:** Drizzle ORM
- **Migration Tool:** Drizzle Kit

## Entry Model (SQL)

```ts
// src/db/schema.ts
export const entries = pgTable("entries", {
  id: text("id").primaryKey(), // date string: YYYY-MM-DD
  date: text("date").notNull(), 
  words: integer("words").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

## Settings Model (SQL)

```ts
// src/db/schema.ts
export const settings = pgTable("settings", {
  id: text("id").primaryKey(), // "global"
  name: text("name").notNull().default("Writer"),
  color: text("color").notNull().default("#facc15"),
  goalsEnabled: boolean("goals_enabled").notNull().default(true),
  metric: text("metric").notNull().default("words"),
  projectGoal: integer("project_goal").notNull().default(50000),
  deadline: text("deadline").notNull().default("2026-12-31"),
  activityThresholds: jsonb("activity_thresholds").notNull().$type<number[]>().default([250, 750, 1500]),
  defaultChartView: text("default_chart_view").notNull().default("daily"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

## Storage Architecture

We use a SQL database (PostgreSQL) hosted on Neon. The schema is managed via Drizzle ORM.

## Derived Values

These do not need to be stored.

### Team Words

```ts
const teamWords = entry.aaronWords + entry.electraWords;
```

### Daily Chart Points

For each date:

```ts
{
  date: "2026-05-15",
  aaron: 600,
  electra: 450,
  team: 1050
}
```

### Weekly Chart Points

Group entries by week:

```ts
{
  weekStart: "2026-05-11",
  aaron: 3200,
  electra: 2800,
  team: 6000
}
```

### Cumulative Chart Points

Running total over time:

```ts
{
  date: "2026-05-15",
  aaron: 12600,
  electra: 11200,
  team: 23800
}
```

## Validation Rules

### Entry

- `date` is required.
- `date` must be YYYY-MM-DD.
- `aaronWords` must be a non-negative integer.
- `electraWords` must be a non-negative integer.
- `note` is optional.
- `note` should be trimmed.
- At least one word count should be greater than 0.

### Settings

- Names should not be empty.
- Colors should be valid hex values.
- Goals should be positive integers if enabled.
- Activity thresholds should be ascending positive integers.
- Default chart view must be one of: daily, weekly, cumulative.
- Default grid view must be one of: team, personA, personB.

## Export Format

Export should produce JSON:

```json
{
  "version": 1,
  "exportedAt": "2026-05-15T20:30:00.000Z",
  "settings": {},
  "entries": []
}
```

## Import Behavior

Recommended behavior:
- Validate imported data.
- Show a preview count.
- Ask whether to merge or replace.
- For MVP, use replace-only or merge-by-date.

Merge rule:
- Same date replaces existing entry.
- New dates are added.
