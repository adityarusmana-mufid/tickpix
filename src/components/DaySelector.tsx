import { Button } from '@/components/ui/pixelact-ui/button'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface Props {
  selected: number[]
  onToggle: (index: number) => void
}

export default function DaySelector({ selected, onToggle }: Props) {
  return (
    <div className="flex gap-2 p-2 bg-[#a4c263] border-t-2 border-[#835a4d] justify-center shrink-0">
      {DAYS.map((day, i) => {
        const active = selected.includes(i)
        return (
          <Button
            key={day}
            variant={active ? 'default' : 'secondary'}
            size="sm"
            onClick={() => onToggle(i)}
            className={active ? '!bg-[#ddb88b] !text-[#3a3028]' : ''}
          >
            {day}
          </Button>
        )
      })}
    </div>
  )
}
