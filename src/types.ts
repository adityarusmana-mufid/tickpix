export interface Activity {
  id: string
  name: string
  color: string
}

export interface Bleed {
  id: string
  activityId: string | null
  customName: string | null
  blockActivityId: string | null
  blockStartHour: number
  blockEndHour: number
  blockCustomLabel: string | null
  percentage: number
}

export interface Goal {
  id: string
  title: string
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
  version?: number
  activities: Activity[]
  bleeds: Bleed[]
  goals: Goal[]
  mission: string
  blocks: Block[]
  selectedDayIndexes: number[]
  selectedBlockId: string | null
  viewMode: 'view' | 'edit'
}
