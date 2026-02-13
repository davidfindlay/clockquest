import { timeToAngles } from './clock-utils'

interface AnalogClockProps {
  hours: number
  minutes: number
  size?: number
  showDigital?: boolean
}

export function AnalogClock({ hours, minutes, size = 280, showDigital = false }: AnalogClockProps) {
  const { hourAngle, minuteAngle } = timeToAngles(hours, minutes)
  const cx = 100
  const cy = 100

  return (
    <div className="flex flex-col items-center gap-2">
      <svg
        viewBox="0 0 200 200"
        width={size}
        height={size}
        className="drop-shadow-2xl"
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

        {/* Hour hand */}
        <line
          x1={cx}
          y1={cy}
          x2={cx + 45 * Math.sin((hourAngle * Math.PI) / 180)}
          y2={cy - 45 * Math.cos((hourAngle * Math.PI) / 180)}
          stroke="#f8fafc"
          strokeWidth={5}
          strokeLinecap="round"
          className="transition-all duration-500"
        />

        {/* Minute hand */}
        <line
          x1={cx}
          y1={cy}
          x2={cx + 65 * Math.sin((minuteAngle * Math.PI) / 180)}
          y2={cy - 65 * Math.cos((minuteAngle * Math.PI) / 180)}
          stroke="#f59e0b"
          strokeWidth={3}
          strokeLinecap="round"
          className="transition-all duration-500"
        />

        {/* Center dot */}
        <circle cx={cx} cy={cy} r={4} fill="#f59e0b" />
      </svg>

      {showDigital && (
        <div className="text-2xl font-mono text-slate-400">
          {hours}:{minutes.toString().padStart(2, '0')}
        </div>
      )}
    </div>
  )
}
