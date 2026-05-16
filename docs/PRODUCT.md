# Smeemo Product Requirements

## Overview

Smeemo is a private website used by two writing partners to log daily writing activity, save it to a hosted database, and visualize progress through charts and an activity grid.

The app should stay intentionally small.

## Product Goals

1. Make logging writing activity fast.
2. Show individual and team writing progress.
3. Support optional team and individual goals.
4. Make consistency visible through an activity grid.
5. Avoid login complexity while keeping the site private.
6. Allow settings/onboarding information to be updated over time.

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
- quickly log writing words
- see personal writing line
- see team progress
- adjust goals/settings as needed

### Electra

Needs:
- quickly log writing words
- see personal writing line
- see team progress
- use the app without friction

## Core User Stories

### Logging

As a user, I want to enter today’s word counts so the tracker updates.

Acceptance criteria:
- I can choose a date.
- I can enter Aaron words.
- I can enter Electra words.
- I can leave either value at 0.
- I can add an optional note.
- I can save the entry.
- I can edit/delete an existing entry.

### Charts

As a user, I want to see writing progress over time.

Acceptance criteria:
- I can see a line for Aaron.
- I can see a line for Electra.
- I can see a line for team total.
- I can switch between daily, weekly, and cumulative views.
- Tooltips show date/period and word counts.

### Activity Grid

As a user, I want to see writing consistency.

Acceptance criteria:
- Each square represents a date.
- The grid can show Team, Aaron, or Electra.
- Intensity changes based on word count.
- Hover/tap reveals date and word totals.

### Goals

As a user, I want optional goals so we can track momentum without pressure.

Acceptance criteria:
- Team goal can be enabled/disabled.
- Individual goals can be enabled/disabled.
- Weekly goals are supported.
- Progress is shown in a calm, non-competitive way.

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
2. Quick Log
3. Summary Stats
4. Line Chart
5. Activity Grid
6. Recent Entries

## MVP Scope

### Must Have

- Shared passcode gate
- Hosted database persistence (PostgreSQL)
- Quick log form
- Edit/delete entries
- Line chart with Aaron, Electra, Team
- Daily / Weekly / Cumulative chart modes
- Activity grid calendar
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
- Does the activity grid feel motivating?
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
