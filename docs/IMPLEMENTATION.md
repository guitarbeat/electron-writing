# Clean Writer Implementation Notes

## Recommended Stack

Because the app is already being built in Google AI Studio, use:

- Frontend from the existing AI Studio app
- Server-side API routes/functions
- Firestore or another hosted database
- Shared passcode gate
- Charting library for line chart
- CSS grid/flex for layout
- Calendar heatmap component or custom grid

## Recommended Architecture

```text
User browser
  ↓
Clean Writer frontend
  ↓
API routes / server functions
  ↓
Hosted database
```

The database should not be accessed directly from the browser.

## Build Order

### Phase 1: Static UI

Build:
- passcode screen
- tracker layout
- quick log form
- sample summary cards
- sample chart data
- sample activity grid
- recent entries table
- settings panel

Use mock data first.

### Phase 2: Data Model

Add:
- entry type
- settings type
- validation helpers
- derived chart data helpers
- activity grid helpers

### Phase 3: API Routes

Add:
- session/passcode endpoint
- entries endpoints
- settings endpoints
- export endpoint

### Phase 4: Database

Connect:
- Firestore collection/table
- entries persistence
- settings persistence

### Phase 5: Polish

Add:
- loading states
- error states
- save confirmation
- edit/delete confirmation
- export/import
- mobile refinements
- keyboard accessibility
- reduced motion support

## Suggested File Structure

```text
src/
  app/
    page.tsx
    api/
      session/
        route.ts
      entries/
        route.ts
        [id]/
          route.ts
      settings/
        route.ts
      export/
        route.ts
      import/
        route.ts

  components/
    PasscodeScreen.tsx
    AppHeader.tsx
    QuickLogCard.tsx
    SummaryStats.tsx
    WordsLineChart.tsx
    ActivityGrid.tsx
    RecentEntries.tsx
    SettingsPanel.tsx

  lib/
    db.ts
    auth.ts
    validation.ts
    dates.ts
    chartData.ts
    activityGrid.ts
    exportImport.ts

  styles/
    tokens.css
```

Adjust to match the actual AI Studio project structure.

## Key Helper Functions

### Team words

```ts
export function getTeamWords(entry: WritingEntry) {
  return entry.aaronWords + entry.electraWords;
}
```

### Group by day

```ts
export function toDailyPoints(entries: WritingEntry[]) {
  return entries.map((entry) => ({
    date: entry.date,
    aaron: entry.aaronWords,
    electra: entry.electraWords,
    team: entry.aaronWords + entry.electraWords,
  }));
}
```

### Cumulative points

```ts
export function toCumulativePoints(entries: WritingEntry[]) {
  let aaronTotal = 0;
  let electraTotal = 0;

  return entries.map((entry) => {
    aaronTotal += entry.aaronWords;
    electraTotal += entry.electraWords;

    return {
      date: entry.date,
      aaron: aaronTotal,
      electra: electraTotal,
      team: aaronTotal + electraTotal,
    };
  });
}
```

### Activity intensity

```ts
export function getActivityLevel(words: number, thresholds = [250, 750, 1500]) {
  if (words <= 0) return 0;
  if (words < thresholds[0]) return 1;
  if (words < thresholds[1]) return 2;
  if (words < thresholds[2]) return 3;
  return 4;
}
```

## Form Behavior

### Quick Log

On load:
- Date defaults to today.
- Word fields default to blank or 0.
- Note is blank.

On save:
- Validate fields.
- Save to database.
- Refresh entries.
- Clear word fields and note.
- Keep date as today.
- Show short success message.

Validation:
- Words must be non-negative integers.
- At least one person must have more than 0 words.
- Note length should be reasonable, such as 500 characters.

## Chart Behavior

Views:

### Daily

One point per entry date.

### Weekly

Group entries by week start date.

### Cumulative

Running total across all dates.

Legend:
- Aaron
- Electra
- Team

Tooltip:
- Date or week
- Aaron words
- Electra words
- Team words

## Activity Grid Behavior

Default:
- show the last 12 months or current year
- mode: Team

Modes:
- Team: Aaron + Electra
- Aaron: Aaron only
- Electra: Electra only

Each cell:
- date
- level 0–4
- tooltip with totals

## Settings Behavior

Settings should be editable at any time.

Changing names:
- updates labels everywhere.

Changing colors:
- updates chart lines and grid legend.

Changing goals:
- updates summary cards and progress bars.

Changing thresholds:
- updates activity grid intensity.

## Deployment Notes

Before deploying:
- Set environment variables.
- Confirm database rules are locked down.
- Confirm API routes work without exposing secrets.
- Test passcode gate.
- Test export.
- Test mobile layout.
- Test edit/delete.

## Manual Test Checklist

- [ ] Incorrect passcode is rejected.
- [ ] Correct passcode opens tracker.
- [ ] Entry can be created.
- [ ] Entry can be edited.
- [ ] Entry can be deleted.
- [ ] Same date behavior works as expected.
- [ ] Chart shows Aaron line.
- [ ] Chart shows Electra line.
- [ ] Chart shows Team line.
- [ ] Chart toggles work.
- [ ] Activity grid modes work.
- [ ] Settings update labels/colors/goals.
- [ ] Export downloads usable JSON.
- [ ] Mobile layout is readable.
- [ ] Keyboard navigation works.
- [ ] Reduced motion is respected.
