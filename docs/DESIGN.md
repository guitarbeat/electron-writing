---
author: "Aaron Woods"
description: "A collaborative, expressive writing interface built for partners. Features juicy color, hand-drawn softness, bold contrast, and tactile tools designed for duo progress tracking and project-level synthesis."

colors:
  brand:
    primary: "#ff4d8d" # Juicy pink
    primaryHover: "#e73878"
    primarySoft: "rgba(255, 77, 141, 0.14)"
    secondary: "#7c3aed" # Grape purple
    accent: "#facc15" # Sticker yellow
    mint: "#5eead4"
    peach: "#fed7aa"

  background:
    paper: "#fff1f5" # Blush paper (Main background)
    surface: "#fffafc" # Card background
    elevated: "#ffffff" # High priority card
    pop: "#ffe4ef" # Highlight
    grid: "rgba(255, 77, 141, 0.08)"

  text:
    ink: "#2b1720" # Darkest berry
    inkMuted: "#7b5261"
    inkFaint: "#b98294"
    inverse: "#ffffff"

  border:
    ink: "#2b1720" # The main graphic outline
    soft: "rgba(43, 23, 32, 0.10)"

  status:
    success: "#14b8a6"
    warning: "#facc15"
    error: "#ff4d8d"
    info: "#60a5fa"

typography:
  fonts:
    sans: "Inter, ui-sans-serif, system-ui, sans-serif"
    display: "Space Grotesk, system-ui, sans-serif"
    mono: "JetBrains Mono, ui-monospace, SFMono-Regular, monospace"

  scales:
    display:
      family: "{typography.fonts.display}"
      weight: "800"
      size: "calc(2.5rem + 2vw)"
      lineHeight: "0.9"
      tracking: "-0.05em"

    heading:
      family: "{typography.fonts.display}"
      weight: "750"
      size: "1.45rem"
      lineHeight: "1.05"
      tracking: "-0.03em"

    body:
      family: "{typography.fonts.sans}"
      weight: "500"
      size: "1rem"
      lineHeight: "1.65"

    data:
      family: "{typography.fonts.mono}"
      weight: "700"
      size: "2.25rem"
      lineHeight: "1"
      tracking: "-0.035em"

    label:
      family: "{typography.fonts.sans}"
      weight: "900"
      size: "0.72rem"
      lineHeight: "1"
      tracking: "0.12em"
      transform: "uppercase"

shadows:
  sticker: "6px 6px 0 #2b1720"
  stickerHover: "10px 10px 0 #2b1720"
  stickerActive: "2px 2px 0 #2b1720"
  softPop: "0 18px 40px rgba(255, 77, 141, 0.18)"
  glow: "0 0 0 6px rgba(255, 77, 141, 0.12)"

radii:
  card: "32px"
  panel: "24px"
  button: "16px"
  input: "18px"
  blob: "42% 58% 48% 52% / 56% 38% 62% 44%"
  pill: "9999px"

motion:
  spring: 
    type: "spring"
    stiffness: 300
    damping: 20
  pop:
    scale: [0.95, 1.05, 1]
    transition: { duration: 0.3 }
---

# Smeemo: The Collaborative Writing Persona

## Concept: "The Shared Desk"
Smeemo is not a dashboard. It's a **Shared Writing Suite**. It is where writing partners (Aaron & Electra) analyze their rough ideas, track individual and collective progress with high-precision (tactile) tools, and celebrate consistency with juicy visual rewards.

The aesthetic remains **"Sticker Pop"** — a collision of high-end editorial typography and high-gravity graphic elements, now shifted to support duo-author data visualization.

## Design Recipes

### 1. The Collaborative Header
Titles emphasize the partnership.
- **Project Title**: Oversized `Space Grotesk` heading.
- **Status Indicator**: "Collaborative Project: Aaron & Electra" subtitle using the `Sans` scale with italic contrast.
- **Author Avatars**: Circular, high-contrast avatars with thick `ink` borders and hard shadows.

### 2. Duo-Author Data
Visualizing two sets of data simultaneously.
- **Split Progress**: Area charts show stacked or overlapping individual contributions using `var(--color-primary)` and `var(--color-secondary)`.
- **Team Velocity**: A unified "Activity Race" where both authors are represented as moving avatars on a shared timeline.
- **Writing Ledger**: A high-density spreadsheet view (`StatsGrid`) that treats logging as a dedicated writing task.

### 3. The "Perfect Sticker" Card
Every card should feel like it was slapped onto the blush paper background.
- **Background**: `bg-bg-surface`
- **Border**: `border-4 border-ink` (Chunky outlines)
- **Shadow**: `shadow-sticker` (Hard, offset shadow)
- **Radius**: `rounded-card`
- **Hover**: `-translate-x-1 -translate-y-1 shadow-sticker-hover`
- **Active**: `translate-x-[4px] translate-y-[4px] shadow-sticker-active`

### 4. Interactive "Juice"
- **Buttons**: Should "click" down physically (hard shadow shift).
- **Inputs**: Should have a "thick" focus ring that feels like a marker outline.
- **Charts**: Use `var(--color-primary)` and `var(--color-secondary)` exclusively. No generic blues.

## Implementation Guidelines

### Typography Pairings
- **Space Grotesk** (Display): Use for project titles, major milestones, and collaborative status.
- **Inter** (UI): Primary interface font for labels, readability, and partner interaction.
- **JetBrains Mono** (Data): Technical readouts, spreadsheet cells, and writing metrics.

### Layout Logic
- Use **Asymmetry** and **Bento-Grid** structures. Let cards for Aaron and Electra have distinct characters while remaining unified by the shared aesthetic.
- Background should have a **Grid Pattern** (`bg-grid`) to reinforce the "paper/draft" feeling.

### Animation Character
Animation should be **Bouncy and Snappy**. Use springs for everything.
- **Dynamic Duo**: Avatars in the "Activity Race" use bouncy animations to signify momentum.
- **Success Loops**: Celebrations trigger when the combined team goal is reached.
- **Tactile Inputs**: Logging feels physical — spreadsheet cells and quick-log inputs have immediate, springy visual responses.
