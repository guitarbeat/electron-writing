import { pgTable, text, integer, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";

export const entries = pgTable("entries", {
  id: text("id").primaryKey(),
  date: text("date").notNull(),
  aaronWords: integer("aaron_words").notNull().default(0),
  electraWords: integer("electra_words").notNull().default(0),
  aaronTime: integer("aaron_time").notNull().default(0),
  electraTime: integer("electra_time").notNull().default(0),
  note: text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const settings = pgTable("settings", {
  id: text("id").primaryKey().default("global"),
  personAName: text("person_a_name").notNull().default("Aaron"),
  personBName: text("person_b_name").notNull().default("Electra"),
  personAColor: text("person_a_color").notNull().default("#ff4d8d"),
  personBColor: text("person_b_color").notNull().default("#7c3aed"),
  teamColor: text("team_color").notNull().default("#2b1720"),
  goalsEnabled: boolean("goals_enabled").notNull().default(true),
  individualGoalsEnabled: boolean("individual_goals_enabled").notNull().default(false),
  personAWeeklyGoal: integer("person_a_weekly_goal").notNull().default(3500),
  personBWeeklyGoal: integer("person_b_weekly_goal").notNull().default(3500),
  activityThresholds: jsonb("activity_thresholds").notNull().default([250, 750, 1500]),
  defaultChartView: text("default_chart_view").notNull().default("daily"),
  defaultGridView: text("default_grid_view").notNull().default("team"),
  isSetupComplete: boolean("is_setup_complete").notNull().default(false),
  projectTitle: text("project_title").notNull().default("My Novel"),
  metric: text("metric").notNull().default("words"),
  projectGoal: integer("project_goal").notNull().default(50000),
  deadline: text("deadline").notNull().default("2026-12-31"),
  startDate: text("start_date").notNull().default("2026-01-01"),
  setupUpdateCount: integer("setup_update_count").notNull().default(0),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  lastModifiedBy: text("last_modified_by").notNull().default("System"),
  passcode: text("passcode").notNull().default(""),
});

export type Entry = typeof entries.$inferSelect;
export type Settings = typeof settings.$inferSelect;

export const DEFAULT_SETTINGS: Omit<Settings, "updatedAt"> = {
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
  activityThresholds: [250, 750, 1500],
  defaultChartView: "daily",
  defaultGridView: "team",
  isSetupComplete: false,
  projectTitle: "My Novel",
  metric: "words",
  projectGoal: 50000,
  deadline: "2026-12-31",
  startDate: "2026-01-01",
  setupUpdateCount: 0,
  lastModifiedBy: "System",
  passcode: "",
};
