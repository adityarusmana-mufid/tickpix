import { Button } from '@/components/ui/pixelact-ui/button'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

interface Props {
  selected: number[]
  onToggle: (index: number) => void
}

export default function DaySelector({ selected, onToggle }: Props) {
  return (
    <div className="flex gap-2 p-2 bg-[#0f0f1a] border-t-2 border-[#2a2a3e] justify-center shrink-0">
      {DAYS.map((day, i) => {
        const active = selected.includes(i)
        return (
          <Button
            key={day}
            variant={active ? 'default' : 'secondary'}
            size="sm"
            onClick={() => onToggle(i)}
            className={active ? '!bg-white !text-black' : ''}
          >
            {day}
          </Button>
        )
      })}
    </div>
  )
}
