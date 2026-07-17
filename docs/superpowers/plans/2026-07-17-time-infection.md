# Time Infection System Implementation Plan

**Feature:** Visualize how unplanned activities "infect" time-blocked periods using random pixel spots on the clock, configured per block signature.

**Architecture:** Store-level data (infections array), new Infections tab, clock canvas rendering change. No Tauri plugin changes needed.

**Persistence:** Store v4 migration adds `infections: []`.

---

### Task 1: Data model & store operations

**Files:**
- `src/types.ts`
- `src/lib/store.ts`

**Changes:**

1. **types.ts** — Add `Infection` interface:
```ts
export interface Infection {
  id: string
  activityId: string  // the infecting/distraction activity
  blockActivityId: string | null    // match block.activityId
  blockStartHour: number            // match block.startHour
  blockEndHour: number              // match block.endHour
  blockCustomLabel: string | null   // match block.customLabel
  percentage: number                // 0–100
}
```

Add `infections: Infection[]` to the `Store` interface.

2. **store.ts** — Bump to v4, add defaults and CRUD:
```ts
// In createDefaultStore, add: infections: []
// In migrateStore, add v3→v4: infections: []

export function addInfection(store: Store, infection: Omit<Infection, 'id'>): Store {
  return { ...store, infections: [...store.infections, { id: newId(), ...infection }] }
}

export function removeInfection(store: Store, id: string): Store {
  return { ...store, infections: store.infections.filter((i) => i.id !== id) }
}

export function updateInfection(store: Store, id: string, updates: Partial<Infection>): Store {
  return { ...store, infections: store.infections.map((i) => (i.id === id ? { ...i, ...updates } : i)) }
}
```

---

### Task 2: useStore hook

**Files:**
- `src/hooks/useStore.ts`

**Changes:** Add `handleAddInfection`, `handleUpdateInfection`, `handleRemoveInfection` callbacks (wrapping store functions with toast). Export them in return object.

---

### Task 3: InfectionsTab component

**File:** `src/components/InfectionsTab.tsx` (create)

**Props:**
```ts
interface Props {
  blocks: Block[]
  activities: Activity[]
  infections: Infection[]
  onAddInfection: (infection: Omit<Infection, 'id'>) => void
  onUpdateInfection: (id: string, updates: Partial<Infection>) => void
  onRemoveInfection: (id: string) => void
}
```

**Behavior:**
- Compute unique block signatures from `blocks`: group by (activityId, startHour, endHour, customLabel). Each signature gets a display label like "Work (10–12)".
- List all existing infections, each row shows:
  - Block signature label (read-only)
  - Activity dropdown (pick the distracting activity)
  - Percentage slider (0–100)
  - Remove button (×)
- "Add Infection" section at top:
  - Dropdown to pick block signature
  - Dropdown to pick infecting activity
  - Slider for percentage (default 30)
  - "Add" button
- Empty state: "No infections configured."

Pixel styling consistent with existing tabs (font-pixel, bg/border colors).

---

### Task 4: Wire into ActivityPanel

**Files:**
- `src/components/ActivityPanel.tsx`

**Changes:**
- Add `InfectionsTab` import
- Add icon for infections tab (use Pixelarticons `bug` icon if available, or `alert`/`virus` — check node_modules/pixelarticons/svg/)
- Add tab index 4, pass `infections` and handlers

**App.tsx:** Destructure and pass `infections`, `onAddInfection`, `onUpdateInfection`, `onRemoveInfection`.

---

### Task 5: Clock canvas infection spots

**Files:**
- `src/components/ClockCanvas.tsx`

**Changes:** In the block rendering loop (inside `useEffect`, where `drawPixelArc` is called for each block):

After drawing each block's base color slice, overlay random spots:

```ts
// Seeded pseudo-random for deterministic spots
function seededRandom(seed: number): () => number {
  let s = seed
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

// For each block with matching infection(s):
const blockInfections = infections.filter(
  (inf) =>
    inf.blockActivityId === block.activityId &&
    inf.blockStartHour === block.startHour &&
    inf.blockEndHour === block.endHour &&
    inf.blockCustomLabel === block.customLabel
)

for (const bf of blockInfections) {
  const infActivity = getActivity(bf.activityId)
  if (!infActivity) continue
  const rng = seededRandom(hashCode(block.id + bf.id))
  const pixelCount = Math.floor((sliceArea / (PS * PS)) * (bf.percentage / 100))
  
  // Try pixelCount random positions within the slice arc
  for (let p = 0; p < pixelCount * 3; p++) { // 3x tries to fill quota
    const r = sliceInnerR + rng() * (outerR - sliceInnerR)
    const angle = Math.min(block.startHour, block.endHour) + rng() * Math.abs(block.endHour - block.startHour)
    // ...convert to pixel position, check if inside arc bounds, draw
    // Approach: iterate over a bounding box of the slice area, use rng to decide which pixels to fill
  }
}
```

**Simpler approach** (ponytail-friendly): precompute candidate pixel positions within the slice, shuffle with seeded RNG, draw first N pixels where N = percentage.

Actually simplest: iterate all pixels in the slice area (same scanning loop as `drawPixelArc`), for each pixel compute a seeded random value from `(block.id + infection.id + x + y)`, if value < percentage/100 then draw in infection color. This is deterministic, no precomputation, and naturally distributes spots.

```ts
for (const bf of blockInfections) {
  const infActivity = getActivity(bf.activityId)
  if (!infActivity) continue
  for (let x = minX; x <= maxX; x += PS) {
    for (let y = minY; y <= maxY; y += PS) {
      const dx = x + PS / 2 - cx
      const dy = y + PS / 2 - cy
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < sliceInnerR || dist > outerR) continue
      const angle = Math.atan2(dy, dx) * (180 / Math.PI)
      const a = ((angle + 90 + 720) % 360)
      const s = ((startAngle + 90 + 720) % 360)
      const e = ((endAngle + 90 + 720) % 360)
      let inside = false
      if (s <= e) { inside = a >= s && a <= e } else { inside = a >= s || a <= e }
      if (!inside) continue
      
      // Deterministic: same pixels always infected for this block+infection combo
      const seed = hashCode(block.id + bf.id + String(x) + String(y))
      if ((seed % 100) < bf.percentage) {
        ctx.fillStyle = infActivity.color
        ctx.fillRect(x, y, PS, PS)
      }
    }
  }
}
```

Inside the `dayBlocks` loop, after drawing each block's base fill. This keeps the base block visible underneath — the infection spots just color over specific pixels. Since both loops scan the same area, the base fill happens first, then infection spots overwrite.

Add `infections` to the effect dependency array.

---

### Task 6: Globbing all together

Commit all files, push.
