import { useRef, useEffect, useCallback, useState } from 'react'
import type { Block, Activity } from '../types'
import { Badge } from '@/components/ui/pixelact-ui/badge'

interface Props {
  blocks: Block[]
  activities: Activity[]
  selectedDayIndexes: number[]
  selectedBlockId: string | null
  onSelectBlock: (id: string | null) => void
  onCreateBlock: (startHour: number, endHour: number) => void
}

const HOURS = 24
const PS = 6 // pixel size
const FULL_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

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

function blockContains(block: Block, hour: number): boolean {
  if (block.startHour <= block.endHour) {
    return hour >= block.startHour && hour <= block.endHour
  }
  return hour >= block.startHour || hour <= block.endHour
}

function blockMidHour(block: Block): number {
  if (block.startHour <= block.endHour) {
    return (block.startHour + block.endHour) / 2
  }
  return ((block.startHour + 24 + block.endHour) / 2) % 24
}

function drawPixelHand(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  angleDeg: number,
  length: number,
  thickness: number,
  color: string
) {
  const angleRad = (angleDeg * Math.PI) / 180
  const endX = snap(cx + length * Math.cos(angleRad))
  const endY = snap(cy + length * Math.sin(angleRad))
  const startX = snap(cx)
  const startY = snap(cy)
  const dx = endX - startX
  const dy = endY - startY
  const dist = Math.sqrt(dx * dx + dy * dy)
  const steps = Math.max(1, Math.ceil(dist / PS))
  ctx.fillStyle = color
  const halfW = Math.floor(thickness / 2) * PS
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const x = snap(startX + dx * t)
    const y = snap(startY + dy * t)
    for (let wx = -halfW; wx <= halfW; wx += PS) {
      for (let wy = -halfW; wy <= halfW; wy += PS) {
        ctx.fillRect(x + wx, y + wy, PS, PS)
      }
    }
  }
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
  selectedDayIndexes,
  selectedBlockId,
  onSelectBlock,
  onCreateBlock,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState<number | null>(null)
  const [dragCurrent, setDragCurrent] = useState<number | null>(null)
  const [now, setNow] = useState(new Date())
  const [tooltip, setTooltip] = useState<{ label: string; x: number; y: number } | null>(null)

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const dayBlocks = blocks.filter((b) => selectedDayIndexes.includes(b.dayOfWeek))

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

    const label = selectedDayIndexes.length === 1
      ? FULL_DAYS[selectedDayIndexes[0]]
      : selectedDayIndexes.map(i => SHORT_DAYS[i]).join(', ')
    ctx.fillStyle = '#3a3028'
    ctx.font = '10px "Press Start 2P", monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillText(label, cx, PS * 2)

    // Draw pixel ring (background track)
    drawPixelRing(ctx, cx, cy, outerR, outerR + PS * 2, '#835a4d')
    drawPixelRing(ctx, cx, cy, innerR, outerR, '#c5996c')
    drawPixelRing(ctx, cx, cy, PS * 3, outerR, '#835a4d33')

    // Draw block pizza slices (from near-center to outer edge)
    const sliceInnerR = PS * 3
    for (const block of dayBlocks) {
      const activity = getActivity(block.activityId)
      const color = activity?.color ?? '#835a4d'
      const sAng = toAngle(block.startHour)
      const eAng = toAngle(block.endHour)
      const isSelected = block.id === selectedBlockId

      drawPixelArc(
        ctx, cx, cy, sliceInnerR, outerR, sAng, eAng,
        color + (isSelected ? 'cc' : '99')
      )
    }

    // Draw drag preview (pizza slice)
    if (dragging && dragStart !== null && dragCurrent !== null) {
      const sAng = toAngle(dragStart)
      const eAng = toAngle(dragCurrent)
      drawPixelArc(ctx, cx, cy, sliceInnerR, outerR, sAng, eAng, '#835a4d44')
    }

    // Draw hour ticks and labels (pixel text, no badge)
    for (let i = 0; i < HOURS; i++) {
      const angleDeg = toAngle(i)
      const angleRad = (angleDeg * Math.PI) / 180
      const isMajor = i % 3 === 0
      const tickLen = isMajor ? PS * 2 : PS

      for (let t = 0; t < tickLen; t += PS) {
        const r = outerR - t
        const tx = snap(cx + r * Math.cos(angleRad))
        const ty = snap(cy + r * Math.sin(angleRad))
        ctx.fillStyle = '#835a4d'
        ctx.fillRect(tx, ty, PS, PS)
      }

      const lr = innerR - PS * 4
      const lx = cx + lr * Math.cos(angleRad)
      const ly = cy + lr * Math.sin(angleRad)
      ctx.font = '8px "Press Start 2P", monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = '#3a3028'
      ctx.fillText(String(i), lx, ly)
    }

    // Draw clock hands
    const hours = now.getHours()
    const minutes = now.getMinutes()
    const seconds = now.getSeconds()
    const hourAngle = ((hours + minutes / 60 + seconds / 3600) / 24) * 360 - 90

    const handR = innerR
    drawPixelHand(ctx, cx, cy, hourAngle, handR * 0.5, 3, '#3a3028')

    // Center cap
    ctx.fillStyle = '#3a3028'
    ctx.fillRect(cx - PS, cy - PS, PS * 2, PS * 2)
  }, [dayBlocks, selectedBlockId, getActivity, dragging, dragStart, dragCurrent, now])

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

      if (dist < PS * 3 || dist > outerR + PS * 2) return null

      const angle = angleFromPoint(cx, cy, x, y)
      return hourFromAngle(angle)
    },
    []
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const hour = getHourFromEvent(e)
      if (hour === null) return
      const clicked = dayBlocks.find((b) => blockContains(b, hour))
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
      if (dragging) {
        const hour = getHourFromEvent(e)
        if (hour !== null) setDragCurrent(hour)
        return
      }
      const hour = getHourFromEvent(e)
      const rect = e.currentTarget.getBoundingClientRect()
      if (hour === null) {
        setTooltip(null)
        return
      }
      const hovered = dayBlocks.find((b) => blockContains(b, hour))
      if (hovered) {
        const activity = getActivity(hovered.activityId)
        const label = activity?.name ?? hovered.customLabel ?? ''
        setTooltip(label ? { label, x: e.clientX - rect.left, y: e.clientY - rect.top - 20 } : null)
      } else {
        setTooltip(null)
      }
    },
    [dragging, getHourFromEvent, dayBlocks, getActivity]
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
      const clicked = dayBlocks.find((b) => blockContains(b, hour))
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
        onMouseLeave={(e) => { handleMouseUp(); setTooltip(null) }}
        onContextMenu={handleRightClick}
      />
      {tooltip && (
        <div
          className="absolute pointer-events-none z-10"
          style={{ left: tooltip.x, top: tooltip.y, transform: 'translate(-50%, -100%)' }}
        >
          <Badge variant="default">{tooltip.label}</Badge>
        </div>
      )}
    </div>
  )
}
