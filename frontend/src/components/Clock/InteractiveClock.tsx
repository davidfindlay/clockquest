import { useRef, useState, useCallback } from 'react'
import { timeToAngles, pointerToAngle, snapAngle, anglesToTime, getSnapDegrees, formatTime } from './clock-utils'
import { playSound } from '../../utils/sounds'

interface InteractiveClockProps {
  hours: number
  minutes: number
  onTimeChange: (hours: number, minutes: number) => void
  difficulty?: string
  size?: number
  showDigitalReadout?: boolean
}

export function InteractiveClock({
  hours,
  minutes,
  onTimeChange,
  difficulty = 'one_min',
  size = 280,
  showDigitalReadout = true,
}: InteractiveClockProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [dragging, setDragging] = useState<'hour' | 'minute' | null>(null)
  const prevMinuteAngleRef = useRef<number | null>(null)
  const prevHourAngleRef = useRef<number | null>(null)
  const { hourAngle, minuteAngle } = timeToAngles(hours, minutes)
  const cx = 100
  const cy = 100
  const snapDeg = getSnapDegrees(difficulty)

  const getSVGPoint = useCallback((e: React.PointerEvent) => {
    const svg = svgRef.current!
    const rect = svg.getBoundingClientRect()
    const scaleX = 200 / rect.width
    const scaleY = 200 / rect.height
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }, [])

  const handlePointerDown = useCallback((hand: 'hour' | 'minute') => (e: React.PointerEvent) => {
    e.preventDefault()
    ;(e.target as Element).setPointerCapture(e.pointerId)
    setDragging(hand)
    // Seed the previous angle refs so the first move can detect a notch change
    if (hand === 'minute') {
      prevMinuteAngleRef.current = snapAngle(minuteAngle, snapDeg)
    } else {
      prevHourAngleRef.current = snapAngle(hourAngle, 30)
    }
  }, [minuteAngle, hourAngle, snapDeg])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return
    const pt = getSVGPoint(e)
    let angle = pointerToAngle(cx, cy, pt.x, pt.y)

    if (dragging === 'minute') {
      angle = snapAngle(angle, snapDeg)
      // Play tick if we moved to a different notch
      if (prevMinuteAngleRef.current !== null && angle !== prevMinuteAngleRef.current) {
        playSound('tick')
      }
      const prevAngle = prevMinuteAngleRef.current
      prevMinuteAngleRef.current = angle
      const newTime = anglesToTime(hourAngle, angle)

      // Detect when minute hand crosses 12 (0°/360° boundary) and adjust hour
      let newHours = hours
      if (prevAngle !== null) {
        const delta = angle - prevAngle
        // Crossed 12 clockwise: e.g. 354 → 6 (delta ≈ -348)
        if (delta < -180) {
          newHours = hours === 12 ? 1 : hours + 1
        }
        // Crossed 12 counter-clockwise: e.g. 6 → 354 (delta ≈ +348)
        else if (delta > 180) {
          newHours = hours === 1 ? 12 : hours - 1
        }
      }
      onTimeChange(newHours, newTime.minutes)
    } else {
      // Hour hand: snap to 30 degrees
      angle = snapAngle(angle, 30)
      // Play tock if we moved to a different notch
      if (prevHourAngleRef.current !== null && angle !== prevHourAngleRef.current) {
        playSound('tock')
      }
      prevHourAngleRef.current = angle
      const newTime = anglesToTime(angle, minuteAngle)
      onTimeChange(newTime.hours, minutes)
    }
  }, [dragging, getSVGPoint, snapDeg, hourAngle, minuteAngle, hours, minutes, onTimeChange])

  const handlePointerUp = useCallback(() => {
    setDragging(null)
    prevMinuteAngleRef.current = null
    prevHourAngleRef.current = null
  }, [])

  const hourHandEnd = {
    x: cx + 45 * Math.sin((hourAngle * Math.PI) / 180),
    y: cy - 45 * Math.cos((hourAngle * Math.PI) / 180),
  }

  const minuteHandEnd = {
    x: cx + 65 * Math.sin((minuteAngle * Math.PI) / 180),
    y: cy - 65 * Math.cos((minuteAngle * Math.PI) / 180),
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <svg
        ref={svgRef}
        viewBox="0 0 200 200"
        width={size}
        height={size}
        className="drop-shadow-2xl cursor-pointer touch-none"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* Clock face */}
        <circle cx={cx} cy={cy} r={95} fill="#1e293b" stroke="#475569" strokeWidth={3} />
        <circle cx={cx} cy={cy} r={90} fill="none" stroke="#334155" strokeWidth={1} />

        {/* Minute ticks */}
        {Array.from({ length: 60 }, (_, i) => {
          const angle = (i * 6 * Math.PI) / 180
          const isHour = i % 5 === 0
          const r1 = isHour ? 78 : 83
          const r2 = 88
          return (
            <line
              key={i}
              x1={cx + r1 * Math.sin(angle)}
              y1={cy - r1 * Math.cos(angle)}
              x2={cx + r2 * Math.sin(angle)}
              y2={cy - r2 * Math.cos(angle)}
              stroke={isHour ? '#e2e8f0' : '#64748b'}
              strokeWidth={isHour ? 2.5 : 1}
              strokeLinecap="round"
            />
          )
        })}

        {/* Hour numbers */}
        {Array.from({ length: 12 }, (_, i) => {
          const num = i + 1
          const angle = (num * 30 * Math.PI) / 180
          const r = 70
          return (
            <text
              key={num}
              x={cx + r * Math.sin(angle)}
              y={cy - r * Math.cos(angle)}
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-slate-200 font-bold select-none"
              fontSize="14"
            >
              {num}
            </text>
          )
        })}

        {/* Hour hand (draggable) */}
        <line
          x1={cx}
          y1={cy}
          x2={hourHandEnd.x}
          y2={hourHandEnd.y}
          stroke={dragging === 'hour' ? '#60a5fa' : '#f8fafc'}
          strokeWidth={6}
          strokeLinecap="round"
        />
        {/* Hour hand touch target (invisible wider area) */}
        <line
          x1={cx}
          y1={cy}
          x2={hourHandEnd.x}
          y2={hourHandEnd.y}
          stroke="transparent"
          strokeWidth={20}
          strokeLinecap="round"
          style={{ cursor: 'grab' }}
          onPointerDown={handlePointerDown('hour')}
        />

        {/* Minute hand (draggable) */}
        <line
          x1={cx}
          y1={cy}
          x2={minuteHandEnd.x}
          y2={minuteHandEnd.y}
          stroke={dragging === 'minute' ? '#60a5fa' : '#f59e0b'}
          strokeWidth={3.5}
          strokeLinecap="round"
        />
        {/* Minute hand touch target */}
        <line
          x1={cx}
          y1={cy}
          x2={minuteHandEnd.x}
          y2={minuteHandEnd.y}
          stroke="transparent"
          strokeWidth={20}
          strokeLinecap="round"
          style={{ cursor: 'grab' }}
          onPointerDown={handlePointerDown('minute')}
        />

        {/* Center dot */}
        <circle cx={cx} cy={cy} r={5} fill={dragging ? '#60a5fa' : '#f59e0b'} />
      </svg>

      {showDigitalReadout && (
        <div className="text-3xl font-mono text-amber-400 font-bold">
          {formatTime(hours, minutes)}
        </div>
      )}
      <div className="text-sm text-slate-500">Drag the hands to set the time</div>
    </div>
  )
}
