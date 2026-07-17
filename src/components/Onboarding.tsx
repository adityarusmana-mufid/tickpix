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
  { title: 'Edit & Manage', text: 'Click a block to select it, then edit or delete it in the Editor tab.' },
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
