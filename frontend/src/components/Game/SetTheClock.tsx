import { useState, useCallback } from 'react'
import { InteractiveClock } from '../Clock/InteractiveClock'
import { Button } from '../UI/Button'
import { generateTime } from './question-gen'
import { formatTime, formatTimeWords } from '../Clock/clock-utils'
import type { Difficulty, SessionCreate } from '../../types'

interface SetTheClockProps {
  playerId: number
  difficulty: Difficulty
  totalQuestions?: number
  onComplete: (result: Omit<SessionCreate, 'player_id'>) => void
}

export function SetTheClock({ difficulty, totalQuestions = 10, onComplete }: SetTheClockProps) {
  const [questionIndex, setQuestionIndex] = useState(0)
  const [target, setTarget] = useState(() => generateTime(difficulty))
  const [playerHours, setPlayerHours] = useState(12)
  const [playerMinutes, setPlayerMinutes] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [correct, setCorrect] = useState(0)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [responseTimes, setResponseTimes] = useState<number[]>([])
  const [questionStart, setQuestionStart] = useState(Date.now())
  const [showHint, setShowHint] = useState(false)

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
      setCorrect(c => c + 1)
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
        avg_response_ms: avgMs,
      })
      return
    }

    setQuestionIndex(nextIdx)
    setTarget(generateTime(difficulty))
    setPlayerHours(12)
    setPlayerMinutes(0)
    setSubmitted(false)
    setShowHint(false)
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
        <div className="text-4xl font-mono text-amber-400 font-bold">
          {formatTime(target.hours, target.minutes)}
        </div>
        <div className="text-slate-400 text-lg">{formatTimeWords(target.hours, target.minutes)}</div>
      </div>

      {/* Hint */}
      {showHint && (
        <div className="text-amber-400 text-lg">
          The minute hand should point to {target.minutes === 0 ? '12' : Math.floor(target.minutes / 5)}
        </div>
      )}

      {/* Interactive clock */}
      <InteractiveClock
        hours={playerHours}
        minutes={playerMinutes}
        onTimeChange={handleTimeChange}
        difficulty={difficulty}
        size={280}
      />

      {/* Feedback */}
      {submitted && (
        <div className={`text-xl font-bold ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
          {isCorrect ? 'Correct!' : `Not quite! The answer was ${formatTime(target.hours, target.minutes)}`}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {!submitted && (
          <>
            <Button variant="ghost" size="sm" onClick={() => { setShowHint(true); setHintsUsed(h => h + 1) }} disabled={showHint}>
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
