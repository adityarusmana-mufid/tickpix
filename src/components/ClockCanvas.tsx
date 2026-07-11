import { useRef, useEffect, useCallback, useState } from 'react'
import type { Block, Activity } from '../types'

interface Props {
  blocks: Block[]
  activities: Activity[]
  selectedDay: number
  selectedBlockId: string | null
  onSelectBlock: (id: string | null) => void
  onCreateBlock: (startHour: number, endHour: number) => void
}

const HOURS = 24
const PS = 6 // pixel size

function snap(n: number) {
  return Math.round(n / PS) * PS
}

function toAngle(hour: number): number {
  return ((hour % HOURS) / HOURS) * 360 - 90
}

function angleFromPoint(cx: number, cy: number, x: number, y: number): number {
  return Math.atan2(y - cy, x - cx) * (180 / Math.PI)
}

function hourFromAngle(deg: number): number {
  return (((deg + 90) % 360 + 360) % 360) / 360 * HOURS
}

// Draw a filled circle ring using pixel blocks (no per-pixel outlines)
function drawPixelRing(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  innerR: number, outerR: number,
  fillColor: string
) {
  const minX = snap(cx - outerR - PS)
  const maxX = snap(cx + outerR + PS)
  const minY = snap(cy - outerR - PS)
  const maxY = snap(cy + outerR + PS)

  ctx.fillStyle = fillColor
  for (let x = minX; x <= maxX; x += PS) {
    for (let y = minY; y <= maxY; y += PS) {
      const dx = x + PS / 2 - cx
      const dy = y + PS / 2 - cy
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist >= innerR && dist <= outerR) {
        ctx.fillRect(x, y, PS, PS)
      }
    }
  }
}

// Draw a filled arc on the ring using pixel blocks (no per-pixel outlines)
function drawPixelArc(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  innerR: number, outerR: number,
  startAngle: number, endAngle: number,
  fillColor: string
) {
  const minX = snap(cx - outerR - PS)
  const maxX = snap(cx + outerR + PS)
  const minY = snap(cy - outerR - PS)
  const maxY = snap(cy + outerR + PS)

  ctx.fillStyle = fillColor
  for (let x = minX; x <= maxX; x += PS) {
    for (let y = minY; y <= maxY; y += PS) {
      const dx = x + PS / 2 - cx
      const dy = y + PS / 2 - cy
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < innerR || dist > outerR) continue

      const angle = Math.atan2(dy, dx) * (180 / Math.PI)
      const a = ((angle + 90 + 720) % 360)
      const s = ((startAngle + 90 + 720) % 360)
      const e = ((endAngle + 90 + 720) % 360)
      let inside = false
      if (s <= e) {
        inside = a >= s && a <= e
      } else {
        inside = a >= s || a <= e
      }
      if (!inside) continue

      ctx.fillRect(x, y, PS, PS)
    }
  }
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
    const cx = Math.round(w / 2 / PS) * PS
    const cy = Math.round(h / 2 / PS) * PS
    const outerR = Math.floor(Math.min(w, h) / 2 / PS) * PS - PS * 4
    const innerR = outerR - PS * 4
    const midR = (innerR + outerR) / 2

    ctx.clearRect(0, 0, w, h)

    // Draw pixel ring
    drawPixelRing(ctx, cx, cy, innerR, outerR, '#2a2a3e')

    // Draw block arcs
    for (const block of dayBlocks) {
      const activity = getActivity(block.activityId)
      const color = activity?.color ?? '#808080'
      const sAng = toAngle(block.startHour)
      const eAng = toAngle(block.endHour)
      const isSelected = block.id === selectedBlockId

      drawPixelArc(
        ctx, cx, cy, innerR, outerR, sAng, eAng,
        color + (isSelected ? 'cc' : '99')
      )
    }

    // Draw drag preview
    if (dragging && dragStart !== null && dragCurrent !== null) {
      const sAng = toAngle(dragStart)
      const eAng = toAngle(dragCurrent)
      drawPixelArc(ctx, cx, cy, innerR, outerR, sAng, eAng, 'rgba(255,255,255,0.12)')
    }

    // Draw hour ticks and labels (pixel aligned)
    for (let i = 0; i < HOURS; i++) {
      const angleDeg = toAngle(i)
      const angleRad = (angleDeg * Math.PI) / 180
      const isMajor = i % 3 === 0
      const tickLen = isMajor ? PS * 2 : PS
      const tickStartR = isMajor ? innerR - PS : innerR

      for (let t = 0; t < tickLen; t += PS) {
        const r = outerR - t
        const tx = snap(cx + r * Math.cos(angleRad))
        const ty = snap(cy + r * Math.sin(angleRad))
        ctx.fillStyle = isMajor ? '#6b6b9e' : '#3a3a5e'
        ctx.fillRect(tx, ty, PS, PS)
      }

      // Hour labels in pixel font
      if (isMajor) {
        const lr = innerR - PS * 4
        const lx = snap(cx + lr * Math.cos(angleRad))
        const ly = snap(cy + lr * Math.sin(angleRad))
        ctx.fillStyle = '#808090'
        ctx.font = '10px "Press Start 2P", monospace'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(String(i), lx, ly)
      }
    }

    // Draw block labels
    ctx.font = '8px "Press Start 2P", monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    for (const block of dayBlocks) {
      const activity = getActivity(block.activityId)
      const label = activity?.name ?? block.customLabel ?? ''
      if (!label) continue
      const midH = (block.startHour + block.endHour) / 2
      const midAng = toAngle(midH) * (Math.PI / 180)
      const lx = cx + midR * Math.cos(midAng)
      const ly = cy + midR * Math.sin(midAng)
      ctx.fillStyle = '#ffffff'
      ctx.fillText(label, lx, ly)
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
      const outerR = Math.floor(Math.min(rect.width, rect.height) / 2) - PS * 4
      const innerR = outerR - PS * 4

      if (dist < innerR - PS * 2 || dist > outerR + PS * 2) return null

      const angle = angleFromPoint(cx, cy, x, y)
      return hourFromAngle(angle)
    },
    []
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const hour = getHourFromEvent(e)
      if (hour === null) return
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
      if (clicked) onSelectBlock(clicked.id)
    },
    [getHourFromEvent, dayBlocks, onSelectBlock]
  )

  return (
    <div className="flex-1 relative min-h-0">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onContextMenu={handleRightClick}
      />
    </div>
  )
}
