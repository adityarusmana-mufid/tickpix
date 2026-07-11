# TickPix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A local desktop time-blocking scheduler with a 24-hour analog clock and Aseprite-style pixel art GUI.

**Architecture:** Tauri v2 desktop shell wrapping a React + Vite app. A 24-hour clock canvas renders schedule blocks as colored arcs. Tabbed left panel manages activities and block editing. All state persisted to localStorage.

**Tech Stack:** Tauri v2, React 19, TypeScript, Tailwind, shadcn/ui, Pixelact UI, Vite

---

### File Structure

```
tickpix/
├── src/
│   ├── App.tsx                        # Root layout, mode toggle
│   ├── main.tsx                       # Entry point
│   ├── index.css                      # Tailwind + pixel theme vars
│   ├── types.ts                       # Activity, Block, Store
│   ├── lib/
│   │   └── store.ts                   # Pure store CRUD + localStorage
│   ├── components/
│   │   ├── TitleBar.tsx               # Custom pixel title bar
│   │   ├── ClockCanvas.tsx            # 24-hour analog clock
│   │   ├── DaySelector.tsx            # Mon-Sun multi-toggle
│   │   ├── ActivityPanel.tsx          # Tabbed panel container
│   │   ├── ActivityList.tsx           # Tab: manage activities
│   │   ├── BlockEditor.tsx            # Tab: edit selected block
│   │   └── ScheduleList.tsx           # Tab: all blocks list
│   └── hooks/
│       └── useStore.ts                # React state hook + localStorage sync
├── src-tauri/
│   ├── src/lib.rs                     # Tauri commands (window controls)
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   └── capabilities/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── tailwind.config.ts
├── postcss.config.js
└── components.json                    # shadcn/ui config
```

---

### Task 1: Project Scaffolding

**Files:**
- Create: `index.html`, `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `tailwind.config.ts`, `postcss.config.js`, `components.json`
- Create: `src/main.tsx`, `src/index.css`
- Create: `src-tauri/Cargo.toml`, `src-tauri/tauri.conf.json`, `src-tauri/src/lib.rs`, `src-tauri/capabilities/default.json`
- Modify: none yet

- [ ] **Step 1: Initialize Tauri + React project**

```bash
cd /home/aditya/projects/tickpix
npm create tauri-app@latest tickpix -- --template react-ts --manager npm
```

If that prompts for interactive input, manually scaffold instead:

```bash
# Vite + React + TS
npm create vite@latest tickpix -- --template react-ts
cd tickpix
npm install
npm install @tauri-apps/api @tauri-apps/cli
```

- [ ] **Step 2: Install Tailwind CSS**

```bash
npm install -D tailwindcss @tailwindcss/vite
```

Edit `vite.config.ts`:
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  clearScreen: false,
  server: { port: 1420, strictPort: true },
  envPrefix: ['VITE_', 'TAURI_'],
})
```

Replace `src/index.css` content with:
```css
@import "tailwindcss";
```

- [ ] **Step 3: Initialize shadcn/ui**

```bash
npx shadcn@latest init -d
```

This creates `components.json` and sets up CSS variables. Answer defaults.

- [ ] **Step 4: Install Pixelact UI components**

```bash
npx shadcn@latest add https://pixelactui.com/r/button.json
npx shadcn@latest add https://pixelactui.com/r/input.json
npx shadcn@latest add https://pixelactui.com/r/dialog.json
npx shadcn@latest add https://pixelactui.com/r/select.json
npx shadcn@latest add https://pixelactui.com/r/popover.json
```

Also install shadcn/ui Tabs (Pixelact doesn't have tabs):
```bash
npx shadcn@latest add tabs
```

These get placed in `src/components/ui/pixelact-ui/` (Pixelact) and `src/components/ui/` (shadcn).

- [ ] **Step 5: Configure Tauri for custom title bar**

Edit `src-tauri/tauri.conf.json`:
```json
{
  "$schema": "https://raw.githubusercontent.com/tauri-apps/tauri/dev/crates/tauri-config-schema/schema.json",
  "productName": "TickPix",
  "version": "0.1.0",
  "identifier": "com.tickpix.app",
  "build": {
    "frontendDist": "../dist",
    "devUrl": "http://localhost:1420",
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build"
  },
  "app": {
    "withGlobalTauri": true,
    "windows": [
      {
        "label": "main",
        "title": "TickPix",
        "width": 960,
        "height": 720,
        "decorations": false,
        "center": true
      }
    ]
  }
}
```

Edit `src-tauri/src/lib.rs`:
```rust
use tauri::Manager;

#[tauri::command]
fn toggle_maximize(window: tauri::Window) {
    if let Ok(true) = window.is_maximized() {
        let _ = window.unmaximize();
    } else {
        let _ = window.maximize();
    }
}

#[tauri::command]
fn minimize_window(window: tauri::Window) {
    let _ = window.minimize();
}

#[tauri::command]
fn close_window(window: tauri::Window) {
    let _ = window.close();
}

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![toggle_maximize, minimize_window, close_window])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

- [ ] **Step 6: Clean up scaffolded files and verify**

```bash
rm -f src/App.css src/assets/react.svg
```

Update `src/main.tsx`:
```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

Create minimal `src/App.tsx`:
```tsx
export default function App() {
  return <div className="h-screen w-screen bg-[#1a1a2e] text-white">TickPix</div>
}
```

```bash
npm run tauri dev
```

Verify: Tauri window opens showing "TickPix" on dark background without OS chrome.

---

### Task 2: Types and Pure Store Logic

**Files:**
- Create: `src/types.ts`
- Create: `src/lib/store.ts`

- [ ] **Step 1: Write types**

`src/types.ts`:
```ts
export interface Activity {
  id: string
  name: string
  color: string
}

export interface Block {
  id: string
  dayOfWeek: number
  startHour: number
  endHour: number
  activityId: string | null
  customLabel: string | null
}

export interface Store {
  activities: Activity[]
  blocks: Block[]
  selectedDayIndex: number
  selectedDayIndexes: number[]
  selectedBlockId: string | null
  viewMode: 'view' | 'edit'
}
```

- [ ] **Step 2: Write store CRUD with localStorage**

`src/lib/store.ts`:
```ts
import type { Store, Activity, Block } from '../types'

const STORAGE_KEY = 'tickpix-store'

const defaultActivities: Activity[] = [
  { id: 'sleep', name: 'Sleep', color: '#6b5b95' },
  { id: 'work', name: 'Work', color: '#feb236' },
  { id: 'eat', name: 'Eat', color: '#d64161' },
  { id: 'exercise', name: 'Exercise', color: '#6b5b95' },
  { id: 'leisure', name: 'Leisure', color: '#3fb0ac' },
]

const defaultBlocks: Block[] = []

function newId(): string {
  return crypto.randomUUID()
}

export function createDefaultStore(): Store {
  return {
    activities: [...defaultActivities],
    blocks: [],
    selectedDayIndex: 0,
    selectedDayIndexes: [0],
    selectedBlockId: null,
    viewMode: 'view',
  }
}

export function saveStore(store: Store): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export function loadStore(): Store | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as Store
  } catch {
    return null
  }
}

export function addActivity(store: Store, name: string, color: string): Store {
  return {
    ...store,
    activities: [...store.activities, { id: newId(), name, color }],
  }
}

export function removeActivity(store: Store, id: string): Store {
  return {
    ...store,
    activities: store.activities.filter((a) => a.id !== id),
    blocks: store.blocks.map((b) =>
      b.activityId === id ? { ...b, activityId: null } : b
    ),
  }
}

export function addBlock(
  store: Store,
  dayOfWeek: number,
  startHour: number,
  endHour: number,
  activityId: string | null,
  customLabel: string | null
): Store {
  return {
    ...store,
    blocks: [
      ...store.blocks,
      { id: newId(), dayOfWeek, startHour, endHour, activityId, customLabel },
    ],
  }
}

export function addBlockToDays(
  store: Store,
  days: number[],
  startHour: number,
  endHour: number,
  activityId: string | null,
  customLabel: string | null
): Store {
  let s = store
  for (const day of days) {
    s = addBlock(s, day, startHour, endHour, activityId, customLabel)
  }
  return s
}

export function updateBlock(store: Store, id: string, updates: Partial<Block>): Store {
  return {
    ...store,
    blocks: store.blocks.map((b) => (b.id === id ? { ...b, ...updates } : b)),
  }
}

export function removeBlock(store: Store, id: string): Store {
  return {
    ...store,
    blocks: store.blocks.filter((b) => b.id !== id),
    selectedBlockId: store.selectedBlockId === id ? null : store.selectedBlockId,
  }
}

export function getBlocksForDay(store: Store, dayOfWeek: number): Block[] {
  return store.blocks.filter((b) => b.dayOfWeek === dayOfWeek)
}
```

---

### Task 3: React Store Hook

**Files:**
- Create: `src/hooks/useStore.ts`

- [ ] **Step 1: Write the store hook**

`src/hooks/useStore.ts`:
```ts
import { useState, useCallback, useEffect } from 'react'
import type { Store, Block } from '../types'
import {
  createDefaultStore,
  saveStore,
  loadStore,
  addActivity,
  removeActivity,
  addBlockToDays,
  updateBlock,
  removeBlock,
} from '../lib/store'

export function useStore() {
  const [store, setStore] = useState<Store>(() => {
    return loadStore() ?? createDefaultStore()
  })

  useEffect(() => {
    saveStore(store)
  }, [store])

  const setViewMode = useCallback((mode: 'view' | 'edit') => {
    setStore((s) => ({ ...s, viewMode: mode }))
  }, [])

  const setSelectedDayIndexes = useCallback((indexes: number[]) => {
    setStore((s) => ({ ...s, selectedDayIndexes: indexes }))
  }, [])

  const toggleDay = useCallback((index: number) => {
    setStore((s) => {
      const has = s.selectedDayIndexes.includes(index)
      const next = has
        ? s.selectedDayIndexes.filter((i) => i !== index)
        : [...s.selectedDayIndexes, index]
      return { ...s, selectedDayIndexes: next.length ? next : s.selectedDayIndexes }
    })
  }, [])

  const handleAddActivity = useCallback((name: string, color: string) => {
    setStore((s) => addActivity(s, name, color))
  }, [])

  const handleRemoveActivity = useCallback((id: string) => {
    setStore((s) => removeActivity(s, id))
  }, [])

  const handleAddBlockToDays = useCallback(
    (days: number[], startHour: number, endHour: number, activityId: string | null, customLabel: string | null) => {
      setStore((s) => addBlockToDays(s, days, startHour, endHour, activityId, customLabel))
    },
    []
  )

  const handleUpdateBlock = useCallback((id: string, updates: Partial<Block>) => {
    setStore((s) => updateBlock(s, id, updates))
  }, [])

  const handleRemoveBlock = useCallback((id: string) => {
    setStore((s) => removeBlock(s, id))
  }, [])

  const selectBlock = useCallback((id: string | null) => {
    setStore((s) => ({ ...s, selectedBlockId: id }))
  }, [])

  return {
    store,
    setViewMode,
    setSelectedDayIndexes,
    toggleDay,
    addActivity: handleAddActivity,
    removeActivity: handleRemoveActivity,
    addBlockToDays: handleAddBlockToDays,
    updateBlock: handleUpdateBlock,
    removeBlock: handleRemoveBlock,
    selectBlock,
  }
}
```

---

### Task 4: Custom Title Bar

**Files:**
- Create: `src/components/TitleBar.tsx`

- [ ] **Step 1: Write TitleBar component**

`src/components/TitleBar.tsx`:
```tsx
export default function TitleBar() {
  return (
    <div
      data-tauri-drag-region
      className="flex h-10 items-center justify-between bg-[#0f0f1a] border-b-2 border-[#2a2a3e] select-none"
    >
      <span className="ml-3 font-pixel text-sm tracking-wider text-[#c0c0d0]">
        TickPix
      </span>
      <div className="flex">
        <button
          className="px-3 h-10 text-sm text-[#c0c0d0] hover:bg-[#2a2a3e] border-l-2 border-[#2a2a3e] font-pixel"
          onClick={() => window.__TAURI__?.invoke('minimize_window')}
        >
          −
        </button>
        <button
          className="px-3 h-10 text-sm text-[#c0c0d0] hover:bg-[#2a2a3e] border-l-2 border-[#2a2a3e] font-pixel"
          onClick={() => window.__TAURI__?.invoke('toggle_maximize')}
        >
          □
        </button>
        <button
          className="px-3 h-10 text-sm text-[#c0c0d0] hover:bg-[#2a2a3e] hover:text-red-400 border-l-2 border-[#2a2a3e] font-pixel"
          onClick={() => window.__TAURI__?.invoke('close_window')}
        >
          ×
        </button>
      </div>
    </div>
  )
}
```

---

### Task 5: Day Selector

**Files:**
- Create: `src/components/DaySelector.tsx`

- [ ] **Step 1: Write DaySelector component**

`src/components/DaySelector.tsx`:
```tsx
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

interface Props {
  selected: number[]
  onToggle: (index: number) => void
}

export default function DaySelector({ selected, onToggle }: Props) {
  return (
    <div className="flex gap-1 p-2 bg-[#0f0f1a] border-t-2 border-[#2a2a3e] justify-center">
      {DAYS.map((day, i) => {
        const active = selected.includes(i)
        return (
          <button
            key={day}
            onClick={() => onToggle(i)}
            className={`px-4 py-1.5 text-xs font-pixel border-2 transition-colors ${
              active
                ? 'bg-[#3a3a5e] border-[#6b6b9e] text-white'
                : 'bg-[#1a1a2e] border-[#2a2a3e] text-[#808090] hover:bg-[#2a2a3e]'
            }`}
          >
            {day}
          </button>
        )
      })}
    </div>
  )
}
```

---

### Task 6: Clock Canvas

**Files:**
- Create: `src/components/ClockCanvas.tsx`

- [ ] **Step 1: Write the 24-hour clock canvas component**

`src/components/ClockCanvas.tsx`:
```tsx
import { useRef, useEffect, useCallback, useState } from 'react'
import type { Block, Activity } from '../types'
import { getBlocksForDay } from '../lib/store'

interface Props {
  blocks: Block[]
  activities: Activity[]
  selectedDay: number
  selectedBlockId: string | null
  onSelectBlock: (id: string | null) => void
  onCreateBlock: (startHour: number, endHour: number) => void
}

const HOURS = 24
const DEG_PER_HOUR = 360 / HOURS // 15

function toAngle(hour: number): number {
  return (hour / HOURS) * 360 - 90
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

function angleFromPoint(cx: number, cy: number, x: number, y: number): number {
  return Math.atan2(y - cy, x - cx) * (180 / Math.PI)
}

function hourFromAngle(deg: number): number {
  // Normalize to 0-360
  const normalized = ((deg + 90 + 360) % 360)
  return (normalized / 360) * HOURS
}

export default function ClockCanvas({
  blocks,
  activities,
  selectedDay,
  selectedBlockId,
  onSelectBlock,
  onCreateBlock,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState<number | null>(null)
  const [dragCurrent, setDragCurrent] = useState<number | null>(null)
  const [editMode, setEditMode] = useState(false)

  const dayBlocks = blocks.filter((b) => b.dayOfWeek === selectedDay)

  const getActivity = useCallback(
    (activityId: string | null) => activities.find((a) => a.id === activityId),
    [activities]
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const w = rect.width
    const h = rect.height
    const cx = w / 2
    const cy = h / 2
    const outerR = Math.min(w, h) / 2 - 20
    const innerR = outerR - 20
    const tickOuterR = outerR + 4
    const tickInnerR = outerR - 4

    ctx.clearRect(0, 0, w, h)

    // Draw ring background
    ctx.beginPath()
    ctx.arc(cx, cy, outerR, 0, Math.PI * 2)
    ctx.arc(cx, cy, innerR, Math.PI * 2, 0, true)
    ctx.closePath()
    ctx.fillStyle = '#1a1a2e'
    ctx.fill()
    ctx.strokeStyle = '#2a2a3e'
    ctx.lineWidth = 2
    ctx.stroke()

    // Draw hour ticks and labels
    for (let i = 0; i < HOURS; i++) {
      const angle = toRad(toAngle(i))
      const x1 = cx + tickInnerR * Math.cos(angle)
      const y1 = cy + tickInnerR * Math.sin(angle)
      const x2 = cx + tickOuterR * Math.cos(angle)
      const y2 = cy + tickOuterR * Math.sin(angle)

      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.strokeStyle = i % 3 === 0 ? '#6b6b9e' : '#3a3a5e'
      ctx.lineWidth = i % 3 === 0 ? 2 : 1
      ctx.stroke()

      // Hour label
      if (i % 3 === 0) {
        const labelR = innerR - 16
        const lx = cx + labelR * Math.cos(angle)
        const ly = cy + labelR * Math.sin(angle)
        ctx.fillStyle = '#808090'
        ctx.font = '10px monospace'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(String(i), lx, ly)
      }
    }

    // Draw drag preview arc
    if (dragging && dragStart !== null && dragCurrent !== null) {
      const s = toRad(toAngle(dragStart))
      const e = toRad(toAngle(dragCurrent))
      ctx.beginPath()
      ctx.arc(cx, cy, innerR + 10, s, e, false)
      ctx.arc(cx, cy, innerR - 4, e, s, true)
      ctx.closePath()
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)'
      ctx.fill()
    }

    // Draw blocks as arcs
    for (const block of dayBlocks) {
      const activity = getActivity(block.activityId)
      const color = activity?.color ?? '#808080'
      const s = toRad(toAngle(block.startHour))
      const e = toRad(toAngle(block.endHour))
      const isSelected = block.id === selectedBlockId

      ctx.beginPath()
      ctx.arc(cx, cy, innerR + 8, s, e, false)
      ctx.arc(cx, cy, innerR, e, s, true)
      ctx.closePath()
      ctx.fillStyle = color + (isSelected ? 'cc' : '99')
      ctx.fill()
      ctx.strokeStyle = isSelected ? '#ffffff' : color
      ctx.lineWidth = isSelected ? 2 : 1
      ctx.stroke()

      // Label
      const midAngle = toRad(toAngle((block.startHour + block.endHour) / 2))
      const labelR = innerR + 4
      const lx = cx + labelR * Math.cos(midAngle)
      const ly = cy + labelR * Math.sin(midAngle)
      ctx.fillStyle = '#ffffff'
      ctx.font = '9px monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const label = activity?.name ?? block.customLabel ?? ''
      if (label) ctx.fillText(label, lx, ly)
    }
  }, [dayBlocks, selectedBlockId, getActivity, dragging, dragStart, dragCurrent])

  const getHourFromEvent = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>): number | null => {
      const canvas = canvasRef.current
      if (!canvas) return null
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const cx = rect.width / 2
      const cy = rect.height / 2
      const dx = x - cx
      const dy = y - cy
      const dist = Math.sqrt(dx * dx + dy * dy)
      const outerR = Math.min(rect.width, rect.height) / 2 - 20
      const innerR = outerR - 20

      // Only respond if click is near the ring band
      if (dist < innerR - 10 || dist > outerR + 10) return null

      const angle = angleFromPoint(cx, cy, x, y)
      return hourFromAngle(angle)
    },
    []
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const hour = getHourFromEvent(e)
      if (hour === null) return
      // Check if clicking on an existing block
      const clicked = dayBlocks.find((b) => hour >= b.startHour && hour <= b.endHour)
      if (clicked) {
        onSelectBlock(clicked.id)
        return
      }
      onSelectBlock(null)
      setDragging(true)
      setDragStart(hour)
      setDragCurrent(hour)
    },
    [getHourFromEvent, dayBlocks, onSelectBlock]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!dragging) return
      const hour = getHourFromEvent(e)
      if (hour !== null) setDragCurrent(hour)
    },
    [dragging, getHourFromEvent]
  )

  const handleMouseUp = useCallback(() => {
    if (dragging && dragStart !== null && dragCurrent !== null) {
      const start = Math.min(dragStart, dragCurrent)
      const end = Math.max(dragStart, dragCurrent)
      if (end - start > 0.1) {
        onCreateBlock(start, end)
      }
    }
    setDragging(false)
    setDragStart(null)
    setDragCurrent(null)
  }, [dragging, dragStart, dragCurrent, onCreateBlock])

  const handleRightClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      e.preventDefault()
      const hour = getHourFromEvent(e)
      if (hour === null) return
      const clicked = dayBlocks.find((b) => hour >= b.startHour && hour <= b.endHour)
      if (clicked) {
        onSelectBlock(clicked.id)
      }
    },
    [getHourFromEvent, dayBlocks, onSelectBlock]
  )

  return (
    <div className="relative flex-1 flex items-center justify-center bg-[#0f0f1a]">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onContextMenu={handleRightClick}
      />
    </div>
  )
}
```

---

### Task 7: Activity Panel Tabs

**Files:**
- Create: `src/components/ActivityPanel.tsx`
- Create: `src/components/ActivityList.tsx`
- Create: `src/components/BlockEditor.tsx`
- Create: `src/components/ScheduleList.tsx`

- [ ] **Step 1: Activities tab**

`src/components/ActivityList.tsx`:
```tsx
import { useState } from 'react'
import type { Activity } from '../types'

const PRESET_COLORS = ['#feb236', '#d64161', '#6b5b95', '#3fb0ac', '#7ebd7e', '#c0c0c0', '#ff6b6b', '#4ecdc4']

interface Props {
  activities: Activity[]
  onAdd: (name: string, color: string) => void
  onRemove: (id: string) => void
}

export default function ActivityList({ activities, onAdd, onRemove }: Props) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(PRESET_COLORS[0])

  const handleAdd = () => {
    if (!name.trim()) return
    onAdd(name.trim(), color)
    setName('')
  }

  return (
    <div className="p-3 space-y-3">
      <div className="space-y-2">
        {activities.map((a) => (
          <div key={a.id} className="flex items-center justify-between px-2 py-1.5 bg-[#1a1a2e] border border-[#2a2a3e]">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border border-[#2a2a3e]" style={{ backgroundColor: a.color }} />
              <span className="text-xs text-[#c0c0d0] font-pixel">{a.name}</span>
            </div>
            <button
              onClick={() => onRemove(a.id)}
              className="text-xs text-[#808090] hover:text-red-400 font-pixel"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 px-2 py-1 text-xs bg-[#1a1a2e] border border-[#2a2a3e] text-[#c0c0d0] font-pixel outline-none focus:border-[#6b6b9e]"
          placeholder="New activity..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <div className="flex gap-1">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-5 h-5 border ${color === c ? 'border-white' : 'border-[#2a2a3e]'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
      <button
        onClick={handleAdd}
        className="w-full py-1 text-xs bg-[#2a2a3e] border border-[#3a3a5e] text-[#c0c0d0] hover:bg-[#3a3a5e] font-pixel"
      >
        + ADD
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Block editor tab**

`src/components/BlockEditor.tsx`:
```tsx
import { useState, useEffect } from 'react'
import type { Block, Activity, Store } from '../types'

interface Props {
  block: Block | null
  activities: Activity[]
  onUpdate: (id: string, updates: Partial<Block>) => void
  onRemove: (id: string) => void
  onClose: () => void
}

export default function BlockEditor({ block, activities, onUpdate, onRemove, onClose }: Props) {
  const [customText, setCustomText] = useState('')

  useEffect(() => {
    if (block) setCustomText(block.customLabel ?? '')
  }, [block])

  if (!block) {
    return (
      <div className="p-3 text-xs text-[#808090] font-pixel text-center">
        Click a block on the clock to edit
      </div>
    )
  }

  const formatHour = (h: number) => {
    const hh = Math.floor(h)
    const mm = Math.round((h - hh) * 60)
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
  }

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-pixel text-[#c0c0d0]">
          {formatHour(block.startHour)} – {formatHour(block.endHour)}
        </span>
        <button onClick={onClose} className="text-xs text-[#808090] hover:text-white font-pixel">×</button>
      </div>

      <select
        className="w-full px-2 py-1 text-xs bg-[#1a1a2e] border border-[#2a2a3e] text-[#c0c0d0] font-pixel outline-none"
        value={block.activityId ?? ''}
        onChange={(e) => {
          const val = e.target.value
          onUpdate(block.id, { activityId: val || null, customLabel: val ? null : customText || null })
        }}
      >
        <option value="">Custom...</option>
        {activities.map((a) => (
          <option key={a.id} value={a.id}>{a.name}</option>
        ))}
      </select>

      {!block.activityId && (
        <input
          className="w-full px-2 py-1 text-xs bg-[#1a1a2e] border border-[#2a2a3e] text-[#c0c0d0] font-pixel outline-none"
          placeholder="Custom label..."
          value={customText}
          onChange={(e) => {
            setCustomText(e.target.value)
            onUpdate(block.id, { customLabel: e.target.value || null })
          }}
        />
      )}

      <button
        onClick={() => {
          onRemove(block.id)
          onClose()
        }}
        className="w-full py-1 text-xs bg-[#3a1a1a] border border-[#5a2a2a] text-red-300 hover:bg-[#5a2a2a] font-pixel"
      >
        DELETE BLOCK
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Schedule list tab**

`src/components/ScheduleList.tsx`:
```tsx
import type { Block, Activity } from '../types'

interface Props {
  blocks: Block[]
  activities: Activity[]
  onSelect: (id: string) => void
  selectedId: string | null
}

function formatHour(h: number) {
  const hh = Math.floor(h)
  const mm = Math.round((h - hh) * 60)
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

export default function ScheduleList({ blocks, activities, onSelect, selectedId }: Props) {
  const sorted = [...blocks].sort((a, b) => a.startHour - b.startHour)

  return (
    <div className="p-3 space-y-1">
      {sorted.length === 0 && (
        <div className="text-xs text-[#808090] font-pixel text-center">No blocks for this day</div>
      )}
      {sorted.map((b) => {
        const activity = activities.find((a) => a.id === b.activityId)
        const label = activity?.name ?? b.customLabel ?? 'Untitled'
        const isSelected = b.id === selectedId
        return (
          <button
            key={b.id}
            onClick={() => onSelect(b.id)}
            className={`w-full flex items-center gap-2 px-2 py-1.5 text-left border text-xs font-pixel ${
              isSelected
                ? 'bg-[#3a3a5e] border-[#6b6b9e] text-white'
                : 'bg-[#1a1a2e] border-[#2a2a3e] text-[#c0c0d0] hover:bg-[#2a2a3e]'
            }`}
          >
            <div className="w-2 h-2 border border-[#2a2a3e]" style={{ backgroundColor: activity?.color ?? '#808080' }} />
            <span className="flex-1">{label}</span>
            <span className="text-[#808090]">{formatHour(b.startHour)}–{formatHour(b.endHour)}</span>
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 4: Activity panel container**

`src/components/ActivityPanel.tsx`:
```tsx
import { useState } from 'react'
import type { Block, Activity } from '../types'
import ActivityList from './ActivityList'
import BlockEditor from './BlockEditor'
import ScheduleList from './ScheduleList'

const TABS = ['Activities', 'Block Editor', 'Schedule']

interface Props {
  activities: Activity[]
  blocks: Block[]
  selectedDay: number
  selectedBlockId: string | null
  onAddActivity: (name: string, color: string) => void
  onRemoveActivity: (id: string) => void
  onUpdateBlock: (id: string, updates: Partial<Block>) => void
  onRemoveBlock: (id: string) => void
  onSelectBlock: (id: string | null) => void
  onClose: () => void
}

export default function ActivityPanel({
  activities,
  blocks,
  selectedDay,
  selectedBlockId,
  onAddActivity,
  onRemoveActivity,
  onUpdateBlock,
  onRemoveBlock,
  onSelectBlock,
  onClose,
}: Props) {
  const [tab, setTab] = useState(0)

  const selectedBlock = selectedBlockId
    ? blocks.find((b) => b.id === selectedBlockId) ?? null
    : null

  return (
    <div className="w-64 bg-[#0f0f1a] border-r-2 border-[#2a2a3e] flex flex-col">
      <div className="flex border-b-2 border-[#2a2a3e]">
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className={`flex-1 py-2 text-[10px] font-pixel border-r last:border-r-0 border-[#2a2a3e] transition-colors ${
              tab === i
                ? 'bg-[#2a2a3e] text-white'
                : 'bg-[#0f0f1a] text-[#808090] hover:bg-[#1a1a2e]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto">
        {tab === 0 && (
          <ActivityList activities={activities} onAdd={onAddActivity} onRemove={onRemoveActivity} />
        )}
        {tab === 1 && (
          <BlockEditor
            block={selectedBlock}
            activities={activities}
            onUpdate={onUpdateBlock}
            onRemove={onRemoveBlock}
            onClose={() => onSelectBlock(null)}
          />
        )}
        {tab === 2 && (
          <ScheduleList
            blocks={blocks.filter((b) => b.dayOfWeek === selectedDay)}
            activities={activities}
            onSelect={onSelectBlock}
            selectedId={selectedBlockId}
          />
        )}
      </div>
    </div>
  )
}
```

---

### Task 8: App Shell — Wire Everything Together

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Write the root App component**

`src/App.tsx`:
```tsx
import { useStore } from './hooks/useStore'
import TitleBar from './components/TitleBar'
import ClockCanvas from './components/ClockCanvas'
import DaySelector from './components/DaySelector'
import ActivityPanel from './components/ActivityPanel'
import { getBlocksForDay } from './lib/store'

export default function App() {
  const {
    store,
    setViewMode,
    toggleDay,
    addActivity,
    removeActivity,
    addBlockToDays,
    updateBlock,
    removeBlock,
    selectBlock,
  } = useStore()

  const selectedDay = store.selectedDayIndexes[0] ?? 0
  const dayBlocks = getBlocksForDay(store, selectedDay)

  const handleCreateBlock = (startHour: number, endHour: number) => {
    // Use the first activity if available, otherwise null for custom
    const activityId = store.activities.length > 0 ? store.activities[0].id : null
    addBlockToDays(store.selectedDayIndexes, startHour, endHour, activityId, null)
  }

  const handleSelectBlock = (id: string | null) => {
    selectBlock(id)
    if (id && store.viewMode === 'view') {
      setViewMode('edit')
    }
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0f0f1a] overflow-hidden select-none">
      <TitleBar />

      <div className="flex-1 flex overflow-hidden">
        {store.viewMode === 'edit' && (
          <ActivityPanel
            activities={store.activities}
            blocks={store.blocks}
            selectedDay={selectedDay}
            selectedBlockId={store.selectedBlockId}
            onAddActivity={addActivity}
            onRemoveActivity={removeActivity}
            onUpdateBlock={updateBlock}
            onRemoveBlock={removeBlock}
            onSelectBlock={selectBlock}
            onClose={() => setViewMode('view')}
          />
        )}

        <div className="flex-1 flex flex-col">
          <ClockCanvas
            blocks={store.blocks}
            activities={store.activities}
            selectedDay={selectedDay}
            selectedBlockId={store.selectedBlockId}
            onSelectBlock={handleSelectBlock}
            onCreateBlock={handleCreateBlock}
          />

          <div className="flex items-center justify-center gap-2 p-1 bg-[#0f0f1a] border-t border-[#2a2a3e]">
            <button
              onClick={() => setViewMode(store.viewMode === 'edit' ? 'view' : 'edit')}
              className="px-3 py-1 text-[10px] bg-[#2a2a3e] border border-[#3a3a5e] text-[#c0c0d0] hover:bg-[#3a3a5e] font-pixel"
            >
              {store.viewMode === 'edit' ? '← CLOSE PANEL' : 'EDIT'}
            </button>
          </div>

          <DaySelector
            selected={store.selectedDayIndexes}
            onToggle={toggleDay}
          />
        </div>
      </div>
    </div>
  )
}
```

---

### Task 9: Build and Verify

**Files:** none

- [ ] **Step 1: Build and test**

```bash
cd /home/aditya/projects/tickpix
npm run tauri dev
```

Expected: Tauri window opens with dark pixel-themed UI, custom title bar (no OS chrome), 24-hour clock ring in center, day selector at bottom, "EDIT" button in the middle bar. Clicking "EDIT" slides in the left panel with 3 tabs.

- [ ] **Step 2: Install a pixel font**

Edit `index.html` to add Press Start 2P from Google Fonts:
```html
<link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">
```

Add font class to `src/index.css`:
```css
.font-pixel {
  font-family: 'Press Start 2P', monospace;
}
```

This was used as `font-pixel` in all components above. The font is in a shared class.
