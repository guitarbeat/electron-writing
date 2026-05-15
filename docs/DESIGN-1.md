# Clean Writer Design Guide

## Product Summary

Clean Writer is a private, simple, two-person writing tracker for Aaron and Electra.

It is not a social product, SaaS dashboard, productivity suite, or collaboration platform. It is a cozy data-entry and visualization tool that helps two writing partners log words, see progress, and stay encouraged.

Core sentence:

> A private two-person writing tracker with quick logging, three-line progress plots, optional goals, and a shared activity calendar.

## Design Principles

### 1. Simple first

The main action should be obvious:

> Log words, save, see progress.

Do not add extra project management features unless they directly support tracking writing activity.

### 2. Private and cozy

This website is only for two people. The tone should feel personal, warm, and lightweight.

Avoid:
- corporate dashboard language
- enterprise analytics patterns
- social/competitive framing
- unnecessary onboarding complexity

Prefer:
- gentle copy
- warm visuals
- quick interactions
- calm data presentation

### 3. Team momentum over competition

The app can show Aaron, Electra, and team progress, but the emotional framing should be collaborative.

Use language like:
- Team momentum
- Writing rhythm
- Shared progress
- This week together
- Aaron’s rhythm
- Electra’s rhythm

Avoid language like:
- Leaderboard
- Winning
- Losing
- Falling behind
- Ranking

### 4. Data should be glanceable

The charts and activity grid are the heart of the product.

At a glance, users should understand:
- Who wrote today
- How many words were logged
- How the week is going
- How the team is progressing toward goals
- Whether writing has been consistent lately

### 5. Playful, but not loud

The original visual direction is Sticker Pop: chunky cards, juicy colors, hand-drawn softness, and tactile interactions.

Keep that flavor, but simplify it. This is a writing tracker, not a full design showcase.

Use playful styling for:
- cards
- buttons
- empty states
- activity highlights
- goal progress

Use calmer styling for:
- forms
- charts
- settings
- recent entries
- dense text

## Visual Identity

### Personality

Clean Writer should feel:

- private
- affectionate
- low-friction
- gently playful
- tactile
- clear
- encouraging

### Color Tokens

```css
:root {
  --color-primary: #ff4d8d;
  --color-primary-hover: #e73878;
  --color-primary-soft: rgba(255, 77, 141, 0.14);

  --color-secondary: #7c3aed;
  --color-accent: #facc15;
  --color-mint: #5eead4;
  --color-peach: #fed7aa;

  --color-bg-paper: #fff1f5;
  --color-bg-surface: #fffafc;
  --color-bg-elevated: #ffffff;
  --color-bg-pop: #ffe4ef;
  --color-bg-grid: rgba(255, 77, 141, 0.08);

  --color-ink: #2b1720;
  --color-ink-muted: #7b5261;
  --color-ink-faint: #b98294;
  --color-inverse: #ffffff;

  --color-border-ink: #2b1720;
  --color-border-soft: rgba(43, 23, 32, 0.10);

  --color-success: #14b8a6;
  --color-warning: #facc15;
  --color-error: #ff4d8d;
  --color-info: #60a5fa;
}
```

### Recommended chart colors

Use only these three core chart lines:

```css
--chart-aaron: #ff4d8d;
--chart-electra: #7c3aed;
--chart-team: #2b1720;
```

The team line should usually be visually strongest or slightly thicker.

### Typography

Preferred fonts:

```css
--font-sans: "Nunito", ui-sans-serif, system-ui, sans-serif;
--font-display: "Fraunces", "Cooper Black", Georgia, serif;
--font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, monospace;
```

Use:
- Fraunces for app title, section headers, and milestone moments.
- Nunito for interface text, forms, labels, buttons, and notes.
- JetBrains Mono for word totals, compact metrics, and technical readouts.

### Type Scale

```css
--text-display-size: clamp(2.5rem, 4vw, 4.5rem);
--text-display-line-height: 0.9;
--text-display-weight: 800;
--text-display-tracking: -0.05em;

--text-heading-size: 1.45rem;
--text-heading-line-height: 1.05;
--text-heading-weight: 750;
--text-heading-tracking: -0.03em;

--text-body-size: 1rem;
--text-body-line-height: 1.65;
--text-body-weight: 500;

--text-data-size: 2.25rem;
--text-data-line-height: 1;
--text-data-weight: 700;
--text-data-tracking: -0.035em;

--text-label-size: 0.72rem;
--text-label-line-height: 1;
--text-label-weight: 900;
--text-label-tracking: 0.12em;
```

## Layout

### Main page structure

The app should have one primary page:

1. Header
2. Quick Log card
3. Summary stats
4. Line chart
5. Activity grid calendar
6. Recent entries
7. Settings access

Suggested layout:

```text
┌───────────────────────────────────────────────┐
│ Clean Writer                                  │
│ Track our writing days, words, and momentum.  │
└───────────────────────────────────────────────┘

┌───────────────────────┐ ┌─────────────────────┐
│ Quick Log             │ │ This Week            │
│ Date                  │ │ Team total           │
│ Aaron words           │ │ Goal progress        │
│ Electra words         │ │ Active days          │
│ Note                  │ │                     │
│ [Save Entry]          │ │                     │
└───────────────────────┘ └─────────────────────┘

┌───────────────────────────────────────────────┐
│ Words Over Time                               │
│ [Daily] [Weekly] [Cumulative]                 │
│ Aaron line / Electra line / Team line         │
└───────────────────────────────────────────────┘

┌───────────────────────────────────────────────┐
│ Activity Grid                                 │
│ [Team] [Aaron] [Electra]                      │
│ GitHub-style calendar heatmap                 │
└───────────────────────────────────────────────┘

┌───────────────────────────────────────────────┐
│ Recent Entries                                │
│ Edit/delete previous logs                     │
└───────────────────────────────────────────────┘
```

### Responsive behavior

Desktop:
- Quick Log and Summary can sit side by side.
- Chart should span full width.
- Activity grid should span full width.
- Recent entries can be below.

Mobile:
- Everything stacks vertically.
- Quick Log appears before charts.
- Activity grid should scroll horizontally if needed.
- Forms should use large tap targets.

## Components

### Passcode Screen

Purpose:
- Keep the site private without full user authentication.

Fields:
- Shared passcode

Behavior:
- On correct passcode, open the tracker.
- Save a local session flag so the user does not re-enter it constantly.
- Do not show user accounts, profiles, or sign-up language.

Copy:

```text
Clean Writer

A tiny private writing tracker for us.

Shared passcode
[••••••••••]

[Open Tracker]
```

Error copy:

```text
That passcode did not work. Try again.
```

### Header

Content:
- App title: Clean Writer
- Subtitle: Track our writing days, words, and momentum.
- Optional settings button

Keep this simple. Avoid big dashboard navigation.

### Quick Log Card

Fields:
- Date
- Aaron words
- Electra words
- Optional note

Important:
- Allow either person to enter 0 words.
- Support both people writing on the same day.
- Make the save action obvious.
- After save, clear word fields but keep date as today.

Suggested copy:

```text
Quick Log
Add today’s words.

Date
Aaron words
Electra words
Note

Save Entry
```

### Summary Stats

Recommended stats:
- Today’s team words
- This week’s team words
- Weekly team goal progress
- Active days this month

Optional:
- Aaron this week
- Electra this week
- Current streak

Keep stats to 3–5 cards maximum.

### Line Chart

Required lines:
- Aaron
- Electra
- Team

Required views:
- Daily
- Weekly
- Cumulative

Default:
- Daily or Weekly, depending on settings.

Behavior:
- Use a clear legend.
- Show tooltips on hover/tap.
- Team line should be visually distinct.
- Empty days should show 0 when appropriate.

Tooltip example:

```text
May 15, 2026
Aaron: 600
Electra: 450
Team: 1,050
```

### Activity Grid Calendar

Purpose:
- Show writing consistency visually.

Modes:
- Team
- Aaron
- Electra

Each square:
- represents one day
- color intensity represents writing amount
- hover/tap shows date and totals

Default thresholds:

```text
0 words = empty
1–249 = light
250–749 = medium
750–1499 = strong
1500+ = intense
```

Tooltip example:

```text
May 15, 2026
Aaron: 600 words
Electra: 450 words
Team: 1,050 words
Note: Drafted opening scene
```

### Recent Entries

Purpose:
- Let users fix mistakes.

Columns:
- Date
- Aaron words
- Electra words
- Team words
- Note
- Edit
- Delete

Keep this compact. It should not become the main experience.

### Settings / Writing Setup

Settings should act as living onboarding.

Fields:
- Aaron display name
- Electra display name
- Aaron color
- Electra color
- Team weekly goal
- Optional individual weekly goals
- Enable/disable goals
- Enable/disable individual goals
- Activity grid thresholds
- Default chart view
- Export data
- Import data

Tone:
- This is not a SaaS settings screen.
- Treat it as a tiny shared configuration panel.

## Motion

Motion should be bouncy and tactile, but not distracting.

Use motion for:
- button press
- card hover
- save confirmation
- activity grid tooltip
- settings drawer

Avoid:
- constant animations
- looping celebrations
- animated charts on every data change if it feels jumpy

Suggested CSS:

```css
.clean-card {
  transition:
    transform 160ms ease,
    box-shadow 160ms ease,
    border-color 160ms ease;
}

.clean-card:hover {
  transform: translate(-2px, -2px);
}

.clean-button:active {
  transform: translate(3px, 3px);
}
```

Respect reduced motion:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.001ms !important;
    transition-duration: 0.001ms !important;
    scroll-behavior: auto !important;
  }
}
```

## Accessibility

Minimum requirements:
- Strong color contrast for text.
- Visible keyboard focus states.
- Form labels must be explicit.
- Buttons must have accessible names.
- Chart data should have text equivalents or summary stats.
- Activity grid should expose date and word totals to screen readers.
- Do not rely on color alone for Aaron/Electra/team distinction.
- Support reduced motion.
- Support mobile tap targets of at least 44px.

## Empty States

No entries yet:

```text
No words logged yet.
Add your first entry and the chart will start drawing your rhythm.
```

No goal set:

```text
No team goal set.
You can track words without goals, or add one in Writing Setup.
```

No activity this week:

```text
A quiet week so far.
Log a few words whenever you’re ready.
```

## Content Voice

Voice should be:
- warm
- direct
- private
- encouraging
- not overly cute

Good:
- “Add today’s words.”
- “Team momentum”
- “Writing rhythm”
- “This week together”
- “Save entry”

Avoid:
- “Crush your goals!”
- “Leaderboard”
- “Productivity domination”
- “You are behind”
- “Failure”

## MVP Design Checklist

- [ ] Passcode screen
- [ ] One-page tracker
- [ ] Quick Log card
- [ ] Summary stat cards
- [ ] Three-line chart: Aaron, Electra, Team
- [ ] Daily / Weekly / Cumulative toggle
- [ ] Activity grid calendar
- [ ] Team / Aaron / Electra grid toggle
- [ ] Recent entries with edit/delete
- [ ] Settings / Writing Setup
- [ ] Export/import data
- [ ] Mobile layout
- [ ] Keyboard-accessible forms
- [ ] Reduced-motion support
