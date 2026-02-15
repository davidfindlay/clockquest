import { useState, useCallback, useEffect, useRef } from 'react'
import { AnalogClock } from '../Clock/AnalogClock'
import { MultipleChoice } from '../UI/MultipleChoice'
import { generateTime, generateChoices } from './question-gen'
import { formatTimeAs, pickTimeFormat } from '../Clock/clock-utils'
import { playSound } from '../../utils/sounds'
import type { TimeFormat } from '../Clock/clock-utils'
import type { Difficulty, SessionCreate } from '../../types'

interface BeatTheClockProps {
  playerId: number
  difficulty: Difficulty
  timeFormatMix?: Record<string, number>
  durationSeconds?: number
  onComplete: (result: Omit<SessionCreate, 'player_id'>) => void
}

interface SpeedQuestion {
  hours: number
  minutes: number
  format: TimeFormat
  ampm: 'AM' | 'PM'
  correctAnswer: string
  choices: string[]
}

function newSpeedQuestion(difficulty: Difficulty, mix: Record<string, number>): SpeedQuestion {
  const t = generateTime(difficulty)
  const { format, ampm } = pickTimeFormat(mix)
  const correctAnswer = formatTimeAs(t.hours, t.minutes, format, ampm)
  const choices = generateChoices(t, difficulty, 4, format, ampm)
  return { ...t, format, ampm, correctAnswer, choices }
}

export function BeatTheClock({ difficulty, timeFormatMix, durationSeconds = 60, onComplete }: BeatTheClockProps) {
  const mix = timeFormatMix ?? { digital: 1 }

  const [timeLeft, setTimeLeft] = useState(durationSeconds)
  const [question, setQuestion] = useState<SpeedQuestion>(() => newSpeedQuestion(difficulty, mix))
  const [selected, setSelected] = useState<string | null>(null)
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [_currentStreak, setCurrentStreak] = useState(0)
  const [maxStreak, setMaxStreak] = useState(0)
  const [responseTimes, setResponseTimes] = useState<number[]>([])
  const [questionStart, setQuestionStart] = useState(Date.now())
  const [gameOver, setGameOver] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined)

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          setGameOver(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [])

  // Auto-complete when game over
  useEffect(() => {
    if (gameOver) {
      const avgMs = responseTimes.length > 0
        ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
        : 0
      onComplete({
        mode: 'speedrun',
        difficulty,
        questions: totalQuestions,
        correct,
        hints_used: 0,
        max_streak: maxStreak,
        avg_response_ms: avgMs,
        speedrun_score: correct,
      })
    }
  }, [gameOver, difficulty, totalQuestions, correct, responseTimes, onComplete])

  const handleSelect = useCallback((option: string) => {
    if (selected || gameOver) return
    setSelected(option)
    const elapsed = Date.now() - questionStart
    setResponseTimes(prev => [...prev, elapsed])
    setTotalQuestions(q => q + 1)

    if (option === question.correctAnswer) {
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

    // Auto advance after brief delay
    setTimeout(() => {
      setQuestion(newSpeedQuestion(difficulty, mix))
      setSelected(null)
      setQuestionStart(Date.now())
    }, 400)
  }, [selected, gameOver, questionStart, question.correctAnswer, difficulty, mix])

  const timerColor = timeLeft <= 10 ? 'text-red-400' : timeLeft <= 30 ? 'text-amber-400' : 'text-green-400'

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Timer */}
      <div className={`text-5xl font-mono font-bold ${timerColor}`}>
        {timeLeft}s
      </div>

      {/* Score */}
      <div className="text-xl text-slate-300">
        Score: <span className="text-amber-400 font-bold">{correct}</span>
      </div>

      {/* Timer bar */}
      <div className="w-full max-w-md h-3 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ${timeLeft <= 10 ? 'bg-red-500' : 'bg-amber-500'}`}
          style={{ width: `${(timeLeft / durationSeconds) * 100}%` }}
        />
      </div>

      {/* Clock */}
      <AnalogClock hours={question.hours} minutes={question.minutes} size={240} />

      {/* Choices */}
      <MultipleChoice
        options={question.choices}
        onSelect={handleSelect}
        selected={selected}
        correctAnswer={selected ? question.correctAnswer : null}
        disabled={gameOver}
      />
    </div>
  )
}
