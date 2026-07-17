# Public Release Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Take TickPix from a personal prototype to something shareable with others by addressing all rough edges.

**Architecture:** 8 independent tasks — each adds a self-contained feature or polish. Tasks can be executed in any order. All changes are frontend-only except Tauri plugin configs for dialog/fs.

**Tech Stack:** Tauri v2 plugins (`@tauri-apps/plugin-dialog`, `@tauri-apps/plugin-fs`), React 19, Tailwind v4, Pixelact UI, sonner toasts.

---

### Task 0: Gitignore cleanup

**Files:**
- Modify: `.gitignore`

- [ ] **Add export JSON files to .gitignore**

Add a line to `.gitignore` before the `# Tauri` section:

```
# Export files
tickpix-schedule*.json
```

- [ ] **Remove exported files from working tree**

```bash
rm -f src-tauri/tickpix-schedule*.json
```

- [ ] **Commit**

```bash
git add .gitignore
git commit -m "chore: gitignore export files"
```

---

### Task 1: Tauri export save dialog

**Files:**
- Create: (plugin install)
- Modify: `src-tauri/Cargo.toml`
- Modify: `src-tauri/capabilities/default.json`
- Modify: `src-tauri/tauri.conf.json`
- Modify: `src/App.tsx`

**Background:** Current export creates a blob download link. Tauri apps need a native save dialog. We use `@tauri-apps/plugin-dialog` for the file picker and `@tauri-apps/plugin-fs` to write the file.

- [ ] **Install Tauri plugins**

```bash
cd src-tauri && cargo add tauri-plugin-dialog tauri-plugin-fs && cd ..
npm install @tauri-apps/plugin-dialog @tauri-apps/plugin-fs
```

Add the plugins to the Tauri builder in `src-tauri/src/lib.rs`:
```rust
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

- [ ] **Add capabilities for dialog + fs**

In `src-tauri/capabilities/default.json`, add after `core:window:allow-start-resize-dragging`:
```json
    "dialog:default",
    "dialog:allow-save",
    "fs:default",
    "fs:allow-write-text-file"
```

- [ ] **Replace export button handler in App.tsx**

Import at top:
```tsx
import { save } from '@tauri-apps/plugin-dialog'
import { writeTextFile } from '@tauri-apps/plugin-fs'
```

Replace the EXPORT JSON button's `onClick`:
```tsx
onClick={async () => {
  try {
    const path = await save({
      filters: [{ name: 'JSON', extensions: ['json'] }],
      defaultPath: 'tickpix-schedule.json',
    })
    if (!path) return
    await writeTextFile(path, JSON.stringify(store, null, 2))
    toast('Schedule exported')
    setExported(true)
    setTimeout(() => setExported(false), 1500)
  } catch {
    toast('Export cancelled or failed')
  }
}}
```

- [ ] **Commit**

```bash
git add src-tauri/Cargo.toml src-tauri/src/lib.rs src-tauri/capabilities/default.json src/App.tsx package.json
git commit -m "feat: native save dialog for export"
```

---

### Task 2: Import schedule from file

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/lib/store.ts`

- [ ] **Add importStore function to store.ts**

In `src/lib/store.ts`:
```ts
export function replaceStore(store: Store): Store {
  return migrateStore(store)
}
```

The existing `migrateStore` already handles version migration, so imported files from older versions will be upgraded automatically.

- [ ] **Add import button to App.tsx**

Import:
```tsx
import { open } from '@tauri-apps/plugin-dialog'
import { readTextFile } from '@tauri-apps/plugin-fs'
```

Add state:
```tsx
const [confirmImport, setConfirmImport] = useState(false)
const [importData, setImportData] = useState<string | null>(null)
```

Add dialog and button next to EXPORT JSON button:
```tsx
<Dialog open={confirmImport} onOpenChange={setConfirmImport}>
  <Button
    variant="secondary"
    size="sm"
    onClick={async () => {
      try {
        const path = await open({
          filters: [{ name: 'JSON', extensions: ['json'] }],
          multiple: false,
        })
        if (!path) return
        const content = await readTextFile(path)
        const parsed = JSON.parse(content)
        setImportData(parsed)
        setConfirmImport(true)
      } catch {
        toast('Import failed: invalid file')
      }
    }}
  >
    IMPORT JSON
  </Button>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Import schedule?</DialogTitle>
      <DialogDescription>
        This will replace your current schedule with the imported one. This cannot be undone.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="secondary" size="sm" onClick={() => setConfirmImport(false)}>
        Cancel
      </Button>
      <Button variant="destructive" size="sm" onClick={() => {
        if (importData) {
          setStore(replaceStore(importData))
          toast('Schedule imported')
        }
        setConfirmImport(false)
        setImportData(null)
      }}>
        Import
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

Expose `setStore` from `useStore` hook. In `src/hooks/useStore.ts`, add to the return object:
```tsx
setStore,
```

- [ ] **Add fs read capability**

In `src-tauri/capabilities/default.json`:
```json
    "fs:allow-read-text-file"
```

- [ ] **Commit**

```bash
git add src/App.tsx src/hooks/useStore.ts src/lib/store.ts src-tauri/capabilities/default.json
git commit -m "feat: import schedule from JSON file"
```

---

### Task 3: Keyboard shortcuts

**Files:**
- Modify: `src/App.tsx`

- [ ] **Add global keyboard handler**

In `src/App.tsx`, add a `useEffect` that listens for keydown:

```tsx
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (store.selectedBlockId) {
        selectBlock(null)
        setViewMode('view')
      }
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
      e.preventDefault()
      setViewMode(store.viewMode === 'edit' ? 'view' : 'edit')
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault()
      // trigger export
      const btn = document.querySelector('[data-export-btn]') as HTMLButtonElement
      btn?.click()
    }
  }
  window.addEventListener('keydown', handler)
  return () => window.removeEventListener('keydown', handler)
}, [store.selectedBlockId, store.viewMode, setViewMode, selectBlock])
```

Add `data-export-btn` attribute to the export button.

- [ ] **Commit**

```bash
git add src/App.tsx
git commit -m "feat: keyboard shortcuts (Esc close, Ctrl+E toggle edit, Ctrl+S export)"
```

---

### Task 4: View mode polish

**Files:**
- Modify: `src/App.tsx`

**Background:** Currently view mode just hides the left panel. Make it clear that view mode is read-only — disable drag-on-clock and right-click interaction.

- [ ] **Pass view mode to ClockCanvas**

In `src/App.tsx`, add `viewMode` prop to `<ClockCanvas>`:
```tsx
viewMode={store.viewMode}
```

Add to `Props` in `ClockCanvas.tsx`:
```tsx
viewMode: 'view' | 'edit'
```

In `ClockCanvas.tsx`, skip drag handlers and right-click when `viewMode === 'view'`:
```tsx
const handleMouseDown = useCallback(
  (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (viewMode === 'view') return
    // ... rest of existing handler
  },
  [viewMode, getHourFromEvent, dayBlocks, onSelectBlock]
)

const handleRightClick = useCallback(
  (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (viewMode === 'view') return
    // ... rest of existing handler
  },
  [viewMode, getHourFromEvent, dayBlocks, onSelectBlock]
)
```

Also change cursor to `cursor-default` in view mode:
```tsx
className={`absolute inset-0 w-full h-full ${viewMode === 'edit' ? 'cursor-crosshair' : 'cursor-default'}`}
```

- [ ] **Commit**

```bash
git add src/App.tsx src/components/ClockCanvas.tsx
git commit -m "feat: view mode disables clock interaction"
```

---

### Task 5: Dark mode

**Files:**
- Modify: `src/index.css`
- Modify: `src/App.tsx`

**Background:** Add a CSS class toggle for dark mode. Since Pixelact UI already supports `.dark` class, we add dark variants of all CSS vars and a toggle button in the title bar.

- [ ] **Add dark CSS vars**

In `src/index.css`, after the existing `:root` block, add:
```css
.dark {
  --color-secondary: #3a3028;
  --color-secondary-foreground: #e8cfa7;
  --color-primary: #5c4f3e;
  --color-primary-foreground: #e8cfa7;
  --destructive: #6b2020;
  --destructive-foreground: #ffffff;
  --ring: #5c4f3e;
  --foreground: #e8cfa7;
  --background: #1a1816;
  --popover: #2a2520;
  --popover-foreground: #e8cfa7;
  --muted: #3a3028;
  --muted-foreground: #c5996c;
  --border: #5c4f3e;
  --input: #3a3028;
  --success: #4a7a4a;
  --success-foreground: #ffffff;
  --link: #c5996c;
  --warning: #8a7a30;
  --warning-foreground: #ffffff;
  --default-inner-border-color: #5c4f3e;
}
```

- [ ] **Add dark mode toggle to TitleBar**

In `src/components/TitleBar.tsx`, add a state and button:
```tsx
const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))

const toggleDark = () => {
  const next = !dark
  document.documentElement.classList.toggle('dark', next)
  setDark(next)
}
```

Add button next to minimize:
```tsx
<button
  className="px-3 h-10 text-sm text-[#e8cfa7] hover:bg-[#c5996c] border-l-2 border-[#835a4d] font-pixel"
  onClick={toggleDark}
>
  {dark ? '☀' : '☾'}
</button>
```

- [ ] **Commit**

```bash
git add src/index.css src/components/TitleBar.tsx
git commit -m "feat: dark mode toggle"
```

---

### Task 6: First-run onboarding

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/Onboarding.tsx` (create)

- [ ] **Create Onboarding component**

New file `src/components/Onboarding.tsx`:
```tsx
import { useState } from 'react'
import { Button } from '@/components/ui/pixelact-ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/pixelact-ui/dialog'

const STEPS = [
  { title: 'Welcome to TickPix', text: 'A pixel-art time blocking scheduler for your week.' },
  { title: 'Add Activities', text: 'Create activities with colors in the left panel (press EDIT).' },
  { title: 'Schedule Blocks', text: 'Drag on the clock to create time blocks for an activity.' },
  { title: 'Edit & Manage', text: 'Click or right-click a block to edit its time, day, or label.' },
  { title: 'Export & Save', text: 'Your schedule saves automatically. Use Export to back it up.' },
]

interface Props {
  open: boolean
  onClose: () => void
}

export default function Onboarding({ open, onClose }: Props) {
  const [step, setStep] = useState(0)
  const s = STEPS[step]

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { onClose(); setStep(0) } }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{s.title}</DialogTitle>
          <DialogDescription>{s.text}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <div className="flex items-center gap-1">
            {STEPS.map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full ${i === step ? 'bg-[#835a4d]' : 'bg-[#c5996c]'}`} />
            ))}
          </div>
          {step < STEPS.length - 1 ? (
            <Button variant="default" size="sm" onClick={() => setStep(step + 1)}>Next</Button>
          ) : (
            <Button variant="default" size="sm" onClick={() => { onClose(); setStep(0) }}>Get Started</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Wire onboarding into App.tsx**

Add import and state:
```tsx
import Onboarding from './components/Onboarding'
```
```tsx
const [showOnboarding, setShowOnboarding] = useState(() => {
  return !localStorage.getItem('tickpix-onboarding-done')
})
```

On first close, mark as done:
```tsx
const handleOnboardingClose = () => {
  setShowOnboarding(false)
  localStorage.setItem('tickpix-onboarding-done', 'true')
}
```

Add component before closing `</div>`:
```tsx
<Onboarding open={showOnboarding} onClose={handleOnboardingClose} />
```

- [ ] **Commit**

```bash
git add src/components/Onboarding.tsx src/App.tsx
git commit -m "feat: first-run onboarding tutorial"
```

---

### Task 7: Bundle review & final polish

**Files:**
- Modify: `src-tauri/tauri.conf.json`

- [ ] **Review Tauri bundle config**

In `src-tauri/tauri.conf.json`, under `bundle`, add:
```json
    "active": true,
    "targets": "all",
    "windows": {
      "wix": null,
      "nsis": null
    },
    "linux": {
      "deb": {
        "depends": []
      },
      "appimage": null
    },
    "macOS": {
      "minimumSystemVersion": "10.15"
    }
```

- [ ] **Final build test**

Run both:
```bash
npx tsc -b && npx vite build
```

- [ ] **Commit**

```bash
git add src-tauri/tauri.conf.json
git commit -m "chore: bundle config for packaging"
```
