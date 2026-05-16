import { pgTable, text, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";

export const entries = pgTable("entries", {
  id: text("id").primaryKey(), // date string
  date: text("date").notNull(), 
  aaronWords: integer("aaron_words").notNull().default(0),
  electraWords: integer("electra_words").notNull().default(0),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const DEFAULT_SETTINGS = {
  id: "global",
  personAName: "Aaron",
  personBName: "Electra",
  personAColor: "#ff4d8d",
  personBColor: "#7c3aed",
  teamColor: "#2b1720",
  goalsEnabled: true,
  individualGoalsEnabled: false,
  personAWeeklyGoal: 3500,
  personBWeeklyGoal: 3500,
  activityThresholds: [250, 750, 1500] as number[],
  defaultChartView: "daily" as const,
  defaultGridView: "team" as const,
  isSetupComplete: false,
  metric: "words" as const,
  projectGoal: 50000,
  deadline: "2026-12-31",
  setupUpdateCount: 0,
  lastModifiedBy: "System",
};

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
  metric: text("metric").notNull().default(DEFAULT_SETTINGS.metric),
  projectGoal: integer("project_goal").notNull().default(DEFAULT_SETTINGS.projectGoal),
  deadline: text("deadline").notNull().default(DEFAULT_SETTINGS.deadline),
  setupUpdateCount: integer("setup_update_count").notNull().default(DEFAULT_SETTINGS.setupUpdateCount),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastModifiedBy: text("last_modified_by").notNull().default(DEFAULT_SETTINGS.lastModifiedBy),
});
