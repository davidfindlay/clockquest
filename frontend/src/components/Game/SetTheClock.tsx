import { useState, useCallback } from 'react'
import { InteractiveClock } from '../Clock/InteractiveClock'
import { Button } from '../UI/Button'
import { generateTime, generateStartTime, generateHint } from './question-gen'
import { formatTimeAs, pickTimeFormat } from '../Clock/clock-utils'
import { playSound } from '../../utils/sounds'
import type { TimeFormat } from '../Clock/clock-utils'
import type { Difficulty, SessionCreate } from '../../types'

interface SetTheClockProps {
  playerId: number
  difficulty: Difficulty
  timeFormatMix?: Record<string, number>
  minuteSnapDegrees?: number
  totalQuestions?: number
  onComplete: (result: Omit<SessionCreate, 'player_id'>) => void
}

interface SetQuestionState {
  hours: number
  minutes: number
  format: TimeFormat
  ampm: 'AM' | 'PM'
  display: string
}

function initState(difficulty: Difficulty, mix: Record<string, number>) {
  const target = generateTime(difficulty)
  const start = generateStartTime(difficulty, target)
  const { format, ampm } = pickTimeFormat(mix)
  const display = formatTimeAs(target.hours, target.minutes, format, ampm)
  return {
    target: { hours: target.hours, minutes: target.minutes, format, ampm, display },
    startHours: start.hours,
    startMinutes: start.minutes,
  }
}

export function SetTheClock({ difficulty, timeFormatMix, minuteSnapDegrees = 6, totalQuestions = 10, onComplete }: SetTheClockProps) {
  const mix = timeFormatMix ?? { digital: 1 }

  const [questionIndex, setQuestionIndex] = useState(0)
  const [init] = useState(() => initState(difficulty, mix))
  const [target, setTarget] = useState<SetQuestionState>(init.target)
  const [playerHours, setPlayerHours] = useState(init.startHours)
  const [playerMinutes, setPlayerMinutes] = useState(init.startMinutes)
  const [submitted, setSubmitted] = useState(false)
  const [correct, setCorrect] = useState(0)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [_currentStreak, setCurrentStreak] = useState(0)
  const [maxStreak, setMaxStreak] = useState(0)
  const [responseTimes, setResponseTimes] = useState<number[]>([])
  const [questionStart, setQuestionStart] = useState(Date.now())
  const [showHint, setShowHint] = useState(false)
  const [hintText, setHintText] = useState('')

  const isCorrect = playerHours === target.hours && Math.abs(playerMinutes - target.minutes) <= 2

  const handleTimeChange = useCallback((h: number, m: number) => {
    if (!submitted) {
      setPlayerHours(h)
      setPlayerMinutes(m)
    }
  }, [submitted])

  const handleSubmit = useCallback(() => {
    setSubmitted(true)
    const elapsed = Date.now() - questionStart
    setResponseTimes(prev => [...prev, elapsed])
    if (isCorrect) {
      playSound('correct')
      setCorrect(c => c + 1)
      setCurrentStreak(s => {
        const next = s + 1
        setMaxStreak(m => Math.max(m, next))
        return next
      })
    } else {
      playSound('incorrect')
      setCurrentStreak(0)
    }
  }, [questionStart, isCorrect])

  const handleNext = useCallback(() => {
    const nextIdx = questionIndex + 1
    if (nextIdx >= totalQuestions) {
      const avgMs = responseTimes.length > 0
        ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
        : 0
      onComplete({
        mode: 'set',
        difficulty,
        questions: totalQuestions,
        correct,
        hints_used: hintsUsed,
        max_streak: maxStreak,
        avg_response_ms: avgMs,
      })
      return
    }

    setQuestionIndex(nextIdx)
    setTarget(prev => {
      const next = generateTime(difficulty, prev)
      const start = generateStartTime(difficulty, next)
      const { format, ampm } = pickTimeFormat(mix)
      const display = formatTimeAs(next.hours, next.minutes, format, ampm)
      setPlayerHours(start.hours)
      setPlayerMinutes(start.minutes)
      return { hours: next.hours, minutes: next.minutes, format, ampm, display }
    })
    setSubmitted(false)
    setShowHint(false)
    setHintText('')
    setQuestionStart(Date.now())
  }, [questionIndex, totalQuestions, difficulty, correct, hintsUsed, responseTimes, onComplete])

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Progress */}
      <div className="flex items-center gap-3 text-slate-400">
        <span className="text-lg font-bold">Question {questionIndex + 1} / {totalQuestions}</span>
        <span className="text-green-400">{correct} correct</span>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-md h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-500 transition-all duration-300"
          style={{ width: `${((questionIndex + (submitted ? 1 : 0)) / totalQuestions) * 100}%` }}
        />
      </div>

      {/* Target time */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-1">Set the clock to:</h2>
        <div className="text-4xl text-amber-400 font-bold">
          {target.display}
        </div>
      </div>

      {/* Hint */}
      {showHint && (
        <div className="text-amber-400 text-lg">{hintText}</div>
      )}

      {/* Interactive clock */}
      <InteractiveClock
        hours={playerHours}
        minutes={playerMinutes}
        onTimeChange={handleTimeChange}
        minuteSnapDegrees={minuteSnapDegrees}
        size={280}
      />

      {/* Feedback */}
      {submitted && (
        <div className={`text-xl font-bold ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
          {isCorrect ? 'Correct!' : `Not quite! The answer was ${target.display}`}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {!submitted && (
          <>
            <Button variant="ghost" size="sm" onClick={() => { setShowHint(true); setHintText(generateHint(target.hours, target.minutes)); setHintsUsed(h => h + 1) }} disabled={showHint}>
              Hint
            </Button>
            <Button onClick={handleSubmit}>Check</Button>
          </>
        )}
        {submitted && (
          <Button onClick={handleNext}>
            {questionIndex + 1 >= totalQuestions ? 'See Results' : 'Next'}
          </Button>
        )}
      </div>
    </div>
  )
}
