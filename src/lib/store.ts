import type { Store, Activity, Block, Goal } from '../types'

const STORAGE_KEY = 'tickpix-store'

const defaultActivities: Activity[] = [
  { id: 'sleep', name: 'Sleep', color: '#6b5b95' },
  { id: 'work', name: 'Work', color: '#feb236' },
  { id: 'eat', name: 'Eat', color: '#d64161' },
  { id: 'exercise', name: 'Exercise', color: '#7ebd7e' },
  { id: 'leisure', name: 'Leisure', color: '#3fb0ac' },
]

function newId(): string {
  return crypto.randomUUID()
}

export function createDefaultStore(): Store {
  return {
    version: 3,
    activities: [...defaultActivities],
    goals: [],
    mission: '',
    blocks: [],
    selectedDayIndexes: [1],
    selectedBlockId: null,
    viewMode: 'view',
  }
}

function migrateStore(s: Store): Store {
  let v = s.version ?? 1
  let store = s
  if (v < 2) {
    store = {
      ...store,
      version: 2,
      blocks: store.blocks.map((b) => ({ ...b, dayOfWeek: (b.dayOfWeek + 1) % 7 })),
      selectedDayIndexes: store.selectedDayIndexes.map((i) => (i + 1) % 7),
    }
    v = 2
  }
  if (v < 3) {
    store = {
      ...store,
      version: 3,
      goals: [],
      mission: '',
    }
  }
  return store
}

export function saveStore(store: Store): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export function loadStore(): Store | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    const s = JSON.parse(raw) as Store
    return migrateStore(s)
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
    s = {
      ...s,
      blocks: [
        ...s.blocks,
        { id: newId(), dayOfWeek: day, startHour, endHour, activityId, customLabel },
      ],
    }
  }
  return s
}

export function updateBlock(store: Store, id: string, updates: Partial<Block>): Store {
  return {
    ...store,
    blocks: store.blocks.map((b) => (b.id === id ? { ...b, ...updates } : b)),
  }
}

export function updateBlockInDays(store: Store, id: string, dayIndexes: number[], updates: Partial<Block>): Store {
  const block = store.blocks.find((b) => b.id === id)
  if (!block) return store
  return {
    ...store,
    blocks: store.blocks.map((b) =>
      b.id === id || (dayIndexes.includes(b.dayOfWeek) && b.startHour === block.startHour && b.endHour === block.endHour)
        ? { ...b, ...updates }
        : b
    ),
  }
}

export function removeBlock(store: Store, id: string): Store {
  return {
    ...store,
    blocks: store.blocks.filter((b) => b.id !== id),
    selectedBlockId: store.selectedBlockId === id ? null : store.selectedBlockId,
  }
}

export function removeBlockInDays(store: Store, id: string, dayIndexes: number[]): Store {
  const block = store.blocks.find((b) => b.id === id)
  if (!block) return store
  return {
    ...store,
    blocks: store.blocks.filter((b) => {
      if (b.id === id) return false
      if (dayIndexes.includes(b.dayOfWeek) && b.startHour === block.startHour && b.endHour === block.endHour) return false
      return true
    }),
    selectedBlockId: store.selectedBlockId === id ? null : store.selectedBlockId,
  }
}

export function getBlocksForDay(store: Store, dayOfWeek: number): Block[] {
  return store.blocks.filter((b) => b.dayOfWeek === dayOfWeek)
}

export function updateMission(store: Store, mission: string): Store {
  return { ...store, mission }
}

export function addGoal(store: Store, title: string): Store {
  return { ...store, goals: [...store.goals, { id: newId(), title }] }
}

export function removeGoal(store: Store, id: string): Store {
  return { ...store, goals: store.goals.filter((g) => g.id !== id) }
}

export function replaceStore(raw: unknown): Store {
  if (!raw || typeof raw !== 'object') throw new Error('Invalid store data')
  const obj = raw as Record<string, unknown>
  if (!Array.isArray(obj.activities) || !Array.isArray(obj.blocks)) throw new Error('Invalid store data')
  return migrateStore(raw as Store)
}
