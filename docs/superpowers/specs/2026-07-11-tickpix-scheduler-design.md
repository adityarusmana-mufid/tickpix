# TickPix — Time-Blocking Day Scheduler

## Overview
A local desktop app for scheduling a day using the time-blocking method. Features a 24-hour analog clock as the primary interface, with pixel art styling inspired by Aseprite's GUI.

## Tech Stack
- **Desktop wrapper:** Tauri v2 (native window, custom title bar)
- **UI framework:** React + TypeScript
- **Styling:** Tailwind CSS + shadcn/ui + Pixelact UI
- **Build tool:** Vite
- **Persistence:** localStorage
- **Clock rendering:** HTML Canvas API

## Window
- Custom title bar with pixel-styled close/minimize/maximize buttons
- Frameless window (`decorations: false` in Tauri)
- Drag-to-move via the custom title bar
- Dark pixel-art theme matching Aseprite's aesthetic

## Layout (Aseprite 3-panel)

```
┌──────────────────────────────────────────────┐
│ [×][−][□]  TickPix                    (title bar)
├──────────┬───────────────────────────────────┤
│          │                                   │
│  Tabs:   │      24-hour Analog Clock          │
│          │      (HTML Canvas)                 │
│  [Acts]  │                                   │
│  [Edit]  │     Ring with 24 hour markers      │
│  [List]  │     Colored arcs for blocks        │
│          │     Labels on arcs                 │
│          │                                   │
│          │                                   │
├──────────┴───────────────────────────────────┤
│  [Mon] [Tue] [Wed] [Thu] [Fri] [Sat] [Sun]   │
│  (toggle multi-select)                       │
└──────────────────────────────────────────────┘
```

## Two Modes

### View Mode (default)
- Clock fills the window (below title bar)
- Day selector at bottom
- Schedule arcs visible on the clock
- Small edit button to open the panel

### Edit Mode
- Left panel slides in (tabbed)
- Clock shrinks to accommodate
- Panel tabs:
  1. **Activities** — manage predefined activities (name + color picker + delete)
  2. **Block Editor** — edit selected block's label, activity, time range
  3. **Schedule List** — text list of all blocks for the day

## Clock (Canvas)
- 24-hour analog ring (each hour = 15°)
- 24 tick marks around the perimeter
- Hour labels (0–23)
- Drag on the ring: start → end creates a block
- Existing blocks shown as colored arcs with the activity name
- Click an arc to select it (shows in block editor tab)
- Right-click arc → delete

## Day Selector
- 7 toggle buttons (Mon–Sun)
- Multiple days can be selected at once
- Creating a block applies it to all selected days
- Switching a selected day toggles it off/on

## Data Model

```ts
interface Activity {
  id: string
  name: string
  color: string       // hex color
}

interface Block {
  id: string
  dayOfWeek: number   // 0=Mon, 6=Sun
  startHour: number   // 0-24 (float for sub-hour precision)
  endHour: number     // 0-24 (float)
  activityId?: string // FK to Activity, null if custom
  customLabel?: string // freeform text when not using an activity
}

interface Store {
  activities: Activity[]
  blocks: Block[]
}
```

## Persistence
- All state saved to `localStorage` on every change
- No manual save button
- On load, restore from localStorage

## Key User Flows

### Create a block
1. Select one or more days in the bottom bar
2. Either: pick an activity from the Activities tab OR type custom text
3. Click + drag on the clock ring from start time to end time
4. Block appears as a colored arc on all selected days

### Edit a block
1. Click an arc on the clock
2. It opens in the Block Editor tab
3. Change activity, label, or drag the arc endpoints to resize

### Multi-assign
1. Select Mon, Wed, Fri in the day selector
2. Create a "Gym 7-8am" block
3. Block is copied to all three days

### Delete a block
1. Right-click an arc → delete confirmation
2. Or select it and delete from Block Editor

## Testing
- Basic smoke test: app opens, clock renders, can create/delete blocks
- Manual testing only (no CI for a desktop app)
