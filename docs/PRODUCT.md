# Smeemo Product Requirements

## Overview

Smeemo is a private writing tracker and a **spiritual successor to Camp NaNoWriMo tracking**. It is designed for two writing partners to log daily word counts, track time spent, and monitor progress toward ambitious goals through high-density metrics and expressive visualizations.

The app should stay intentionally small but feature-rich in its data tracking.

## Product Goals

1. Make logging writing activity and time fast.
2. Show individual and team writing progress using NaNoWriMo-style metrics.
3. Support aggressive goal tracking (e.g., 50k words in 30 days).
4. Make consistency visible through a daily writing ledger and "Achieved/Missed" day tracking.
5. Provide high-precision speed and deficit analysis.
6. Avoid login complexity while keeping the site private.
7. Allow settings/onboarding information to be updated over time.

## Non-Goals

Smeemo is not:
- a social app
- a public portfolio
- a full project management app
- a document editor
- a publishing platform
- a habit app for many users
- a SaaS product
- a login/account management system

Do not add:
- comments
- followers
- complex roles
- public sharing
- achievements marketplace
- notifications unless explicitly requested
- AI writing assistance unless explicitly requested

## Primary Users

### Aaron

Needs:
- quickly log writing words and time spent
- see personal writing line and speed (WPM)
- see team progress and deficit
- adjust goals/settings as needed

### Electra

Needs:
- quickly log writing words and time spent
- see personal writing line and speed (WPM)
- see team progress and deficit
- use the app without friction

## Core User Stories

### Logging

As a user, I want to enter today’s word counts and time spent so the tracker updates.

Acceptance criteria:
- I can choose a date.
- I can enter Aaron words and minutes spent.
- I can enter Electra words and minutes spent.
- I can leave any value at 0.
- I can add an optional note.
- I can save the entry.
- I can edit/delete an existing entry.

### Charts

As a user, I want to see writing progress and velocity over time.

Acceptance criteria:
- I can see a line for Aaron.
- I can see a line for Electra.
- I can see a line for team total.
- I can switch between daily, weekly, and cumulative views.
- Tooltips show date/period, word counts, and writing speed (WPM).

### Daily Writing Ledger

As a user, I want to log writing and see consistency in one daily timeline.

Acceptance criteria:
- Each row represents a date.
- Each date shows Aaron and Electra side by side.
- Empty days remain visible without overwhelming logged days.
- Tap/click lets me edit the daily values quickly.
- Notes and delete actions are available from the same date row.

### Goals

As a user, I want detailed goal metrics so we can track momentum and manage backlogs.

Acceptance criteria:
- Team goal and deadline are configurable.
- Individual goals can be enabled/disabled.
- The app calculates "Overall Health" (Danger/Success) based on the deficit.
- I can see "Days Left" and "Per Day Goal" for the remaining period.
- I can see "Achieved Days" vs "Missed Days" relative to the daily target.
- Progress is shown in a way that highlights the "Deficit" (Green for ahead, Red for behind).

## Core Metrics

To support the Camp NaNoWriMo workflow, Smeemo must track or derive:

| Metric | Description |
| :--- | :--- |
| **Overall Health** | A status indicator (Danger/Success) based on current progress vs. target. |
| **Deficit** | The backlog of words needed to reach the target. Green = ahead, Red = behind. |
| **Speed (WPM)** | Calculated as `Words Written / Time Spent (min)`. |
| **Per Day Goal** | `(Total Goal - Cumulative Words) / Days Left`. |
| **Achieved Days** | Count of days where the daily target was met. |
| **Missed Days** | Count of days where the daily target was missed. |
| **Cumulative Words** | Total words written across the entire project/season. |
| **Completion %** | `(Cumulative Words / Total Goal) * 100`. |
| **Days Over/Left** | Tracking against the start date and deadline. |

### Settings

As a user, I want to update setup details over time.

Acceptance criteria:
- Names can be changed.
- Colors can be changed.
- Goals can be changed.
- Activity thresholds can be changed.
- Default chart view can be changed.
- Data can be exported/imported.

### Privacy

As a user, I want a simple private door without full accounts.

Acceptance criteria:
- A shared passcode is required before opening tracker.
- No sign-up flow exists.
- No user authentication UI exists.
- Database secrets are not exposed in frontend code.

## Information Architecture

### Screens

1. Passcode
2. Tracker
3. Settings / Writing Setup

### Tracker Sections

1. Header
2. Daily Writing Ledger
3. Summary Stats
4. Line Chart
5. Recent Entries

## MVP Scope

### Must Have

- Shared passcode gate
- Hosted database persistence (PostgreSQL)
- Daily writing ledger with inline editing
- Edit/delete entries
- Line chart with Aaron, Electra, Team
- Daily / Weekly / Cumulative chart modes
- Settings panel
- Goals settings
- Export data

### Should Have

- Import data
- Mobile-friendly layout
- Keyboard accessibility
- Reduced motion support
- Helpful empty states

### Could Have Later

- Project filtering
- Notes search
- Monthly goals
- Writing streaks
- Gentle reminders
- Multiple projects
- CSV export
- Backup snapshots

## Data Entry Rules

- Date is required.
- Aaron words must be a non-negative integer.
- Electra words must be a non-negative integer.
- At least one of Aaron words or Electra words should be greater than 0.
- Note is optional.
- If an entry already exists for the selected date, either:
  - update the existing entry, or
  - ask whether to merge/replace.

Recommended MVP behavior:
- One entry per date.
- Saving on an existing date updates that date.

## Goal Rules

Default:
- Goals enabled: true
- Team weekly goal: configurable
- Individual goals enabled: false

Goal progress:
- Weekly progress resets based on calendar week.
- Show team goal first.
- Individual goals should be secondary.

## Success Metrics

Because this is a private tool, success is practical:

- Can both people log words without confusion?
- Does the chart update immediately?
- Does the daily ledger feel motivating?
- Can settings be changed without developer work?
- Is the site fast enough to use daily?
- Is the data easy to export?

## Risks

### Risk: Too much dashboard complexity

Mitigation:
- Keep one main page.
- Keep chart modes simple.
- Hide advanced settings.

### Risk: Competitive tension

Mitigation:
- Emphasize team progress.
- Avoid leaderboard language.
- Keep individual goals optional.

### Risk: Data exposure

Mitigation:
- Use server-side API routes.
- Keep database secrets server-side.
- Use passcode gate.
- Do not expose public write access to the database.

### Risk: Data loss

Mitigation:
- Use hosted database.
- Add export button.
- Consider periodic backups later.
