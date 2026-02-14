import { useState, useCallback } from 'react'
import { AnalogClock } from '../Clock/AnalogClock'
import { MultipleChoice } from '../UI/MultipleChoice'
import { Button } from '../UI/Button'
import { generateTime, generateChoices, generateHint } from './question-gen'
import type { ClockQuestion } from './question-gen'
import { formatTimeAs, pickTimeFormat } from '../Clock/clock-utils'
import type { TimeFormat } from '../Clock/clock-utils'
import type { Difficulty, SessionCreate } from '../../types'

interface ReadTheClockProps {
  playerId: number
  difficulty: Difficulty
  timeFormatMix?: Record<string, number>
  totalQuestions?: number
  onComplete: (result: Omit<SessionCreate, 'player_id'>) => void
}

interface QuestionState {
  hours: number
  minutes: number
  choices: string[]
  format: TimeFormat
  ampm: 'AM' | 'PM'
  correctAnswer: string
}

export function ReadTheClock({ difficulty, timeFormatMix, totalQuestions = 10, onComplete }: ReadTheClockProps) {
  const mix = timeFormatMix ?? { digital: 1 }

  const [questionIndex, setQuestionIndex] = useState(0)
  const [question, setQuestion] = useState<QuestionState>(() => newQuestion(difficulty))
  const [selected, setSelected] = useState<string | null>(null)
  const [correct, setCorrect] = useState(0)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [responseTimes, setResponseTimes] = useState<number[]>([])
  const [questionStart, setQuestionStart] = useState(Date.now())
  const [showHint, setShowHint] = useState(false)
  const [hintText, setHintText] = useState('')

  function newQuestion(diff: Difficulty, prev?: ClockQuestion): QuestionState {
    const time = generateTime(diff, prev)
    const { format, ampm } = pickTimeFormat(mix)
    const choices = generateChoices(time, diff, 4, format, ampm)
    const correctAnswer = formatTimeAs(time.hours, time.minutes, format, ampm)
    return { ...time, choices, format, ampm, correctAnswer }
  }

  const handleSelect = useCallback((option: string) => {
    if (selected) return
    setSelected(option)
    const elapsed = Date.now() - questionStart
    setResponseTimes(prev => [...prev, elapsed])

    if (option === question.correctAnswer) {
      setCorrect(c => c + 1)
    }
  }, [selected, questionStart, question.correctAnswer])

  const handleNext = useCallback(() => {
    const nextIdx = questionIndex + 1
    if (nextIdx >= totalQuestions) {
      const avgMs = responseTimes.length > 0
        ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
        : 0

      onComplete({
        mode: 'read',
        difficulty,
        questions: totalQuestions,
        correct,
        hints_used: hintsUsed,
        avg_response_ms: avgMs,
      })
      return
    }

    setQuestionIndex(nextIdx)
    setQuestion(prev => newQuestion(difficulty, prev))
    setSelected(null)
    setShowHint(false)
    setHintText('')
    setQuestionStart(Date.now())
  }, [questionIndex, totalQuestions, difficulty, correct, hintsUsed, responseTimes, onComplete])

  const handleHint = useCallback(() => {
    setShowHint(true)
    setHintText(generateHint(question.hours, question.minutes))
    setHintsUsed(h => h + 1)
  }, [question.hours, question.minutes])

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
          style={{ width: `${((questionIndex + (selected ? 1 : 0)) / totalQuestions) * 100}%` }}
        />
      </div>

      {/* Clock */}
      <AnalogClock hours={question.hours} minutes={question.minutes} size={260} />

      {/* Question */}
      <h2 className="text-2xl font-bold">What time is it?</h2>

      {/* Hint */}
      {showHint && (
        <div className="text-amber-400 text-lg">{hintText}</div>
      )}

      {/* Choices */}
      <MultipleChoice
        options={question.choices}
        onSelect={handleSelect}
        selected={selected}
        correctAnswer={selected ? question.correctAnswer : null}
      />

      {/* Feedback */}
      {selected && (
        <div className={`text-xl font-bold ${selected === question.correctAnswer ? 'text-green-400' : 'text-red-400'}`}>
          {selected === question.correctAnswer ? 'Correct!' : `Not quite! The answer was ${question.correctAnswer}`}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {!selected && (
          <Button variant="ghost" size="sm" onClick={handleHint} disabled={showHint}>
            Hint
          </Button>
        )}
        {selected && (
          <Button onClick={handleNext}>
            {questionIndex + 1 >= totalQuestions ? 'See Results' : 'Next'}
          </Button>
        )}
      </div>
    </div>
  )
}
