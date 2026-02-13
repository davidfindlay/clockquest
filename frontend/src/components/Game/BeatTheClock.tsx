import { useState, useCallback, useEffect, useRef } from 'react'
import { AnalogClock } from '../Clock/AnalogClock'
import { MultipleChoice } from '../UI/MultipleChoice'
import { generateTime, generateChoices } from './question-gen'
import { formatTime } from '../Clock/clock-utils'
import type { Difficulty, SessionCreate } from '../../types'

interface BeatTheClockProps {
  playerId: number
  difficulty: Difficulty
  durationSeconds?: number
  onComplete: (result: Omit<SessionCreate, 'player_id'>) => void
}

export function BeatTheClock({ difficulty, durationSeconds = 60, onComplete }: BeatTheClockProps) {
  const [timeLeft, setTimeLeft] = useState(durationSeconds)
  const [question, setQuestion] = useState(() => {
    const t = generateTime(difficulty)
    return { ...t, choices: generateChoices(t, difficulty) }
  })
  const [selected, setSelected] = useState<string | null>(null)
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [correct, setCorrect] = useState(0)
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
        avg_response_ms: avgMs,
        speedrun_score: correct,
      })
    }
  }, [gameOver, difficulty, totalQuestions, correct, responseTimes, onComplete])

  const correctAnswer = formatTime(question.hours, question.minutes)

  const handleSelect = useCallback((option: string) => {
    if (selected || gameOver) return
    setSelected(option)
    const elapsed = Date.now() - questionStart
    setResponseTimes(prev => [...prev, elapsed])
    setTotalQuestions(q => q + 1)

    if (option === correctAnswer) {
      setCorrect(c => c + 1)
    }

    // Auto advance after brief delay
    setTimeout(() => {
      const t = generateTime(difficulty)
      setQuestion({ ...t, choices: generateChoices(t, difficulty) })
      setSelected(null)
      setQuestionStart(Date.now())
    }, 400)
  }, [selected, gameOver, questionStart, correctAnswer, difficulty])

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
        correctAnswer={selected ? correctAnswer : null}
        disabled={gameOver}
      />
    </div>
  )
}
