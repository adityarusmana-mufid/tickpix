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
  selectedDayIndexes: number[]
  selectedBlockId: string | null
  viewMode: 'view' | 'edit'
}
