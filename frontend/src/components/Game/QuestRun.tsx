import { useState, useCallback } from 'react'
import { AnalogClock } from '../Clock/AnalogClock'
import { InteractiveClock } from '../Clock/InteractiveClock'
import { MultipleChoice } from '../UI/MultipleChoice'
import { Button } from '../UI/Button'
import { generateTime, generateStartTime, generateChoices, generateHint } from './question-gen'
import { formatTimeAs, pickTimeFormat } from '../Clock/clock-utils'
import { playSound } from '../../utils/sounds'
import { SoundToggle } from '../UI/SoundToggle'
import exitIcon from '../../assets/exit_quest.svg'
import type { TimeFormat } from '../Clock/clock-utils'
import type { Difficulty, SessionCreate } from '../../types'
import type { TierInfo } from '../../utils/tier-config'

interface QuestRunProps {
  tierInfo: TierInfo
  totalQuestions?: number
  advancedSetHintMode?: boolean
  advancedSetHintPenalty?: number
  onComplete: (result: Omit<SessionCreate, 'player_id'>) => void
  onExit: () => void
}

type QuestionMode = 'read' | 'set'

interface QuestQuestion {
  mode: QuestionMode
  difficulty: Difficulty
  hours: number
  minutes: number
  format: TimeFormat
  ampm: 'AM' | 'PM'
  display: string   // formatted correct answer
  choices: string[] // only used for 'read' mode
  startHours: number // starting clock position for 'set' mode
  startMinutes: number
}

/**
 * Allocate question counts from the questRunMix proportions.
 * Uses largest-remainder method so counts sum exactly to total.
 */
function allocateCounts(mix: Record<string, number>, total: number): { difficulty: Difficulty; count: number }[] {
  const entries = Object.entries(mix) as [Difficulty, number][]
  const rawCounts = entries.map(([diff, proportion]) => ({
    difficulty: diff,
    raw: proportion * total,
    floored: Math.floor(proportion * total),
  }))

  let allocated = rawCounts.reduce((sum, r) => sum + r.floored, 0)
  // Sort by largest fractional remainder to distribute remaining spots
  const byRemainder = [...rawCounts].sort((a, b) => (b.raw - b.floored) - (a.raw - a.floored))
  for (const r of byRemainder) {
    if (allocated >= total) break
    r.floored += 1
    allocated += 1
  }

  return rawCounts
    .filter(r => r.floored > 0)
    .map(r => ({ difficulty: r.difficulty, count: r.floored }))
}

/**
 * Fisher-Yates shuffle (in-place).
 */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/**
 * Build the full question plan for a quest run.
 * Ensures no two consecutive questions have the exact same time.
 */
function buildQuestionPlan(mix: Record<string, number>, total: number, timeFormatMix: Record<string, number>): QuestQuestion[] {
  const counts = allocateCounts(mix, total)

  // Create questions with allocated difficulties
  const questions: QuestQuestion[] = []
  for (const { difficulty, count } of counts) {
    for (let i = 0; i < count; i++) {
      const mode: QuestionMode = Math.random() < 0.5 ? 'read' : 'set'
      const time = generateTime(difficulty)
      const start = generateStartTime(difficulty, time)
      const { format, ampm } = pickTimeFormat(timeFormatMix)
      const display = formatTimeAs(time.hours, time.minutes, format, ampm)
      questions.push({
        mode,
        difficulty,
        hours: time.hours,
        minutes: time.minutes,
        format,
        ampm,
        display,
        choices: mode === 'read' ? generateChoices(time, difficulty, 4, format, ampm) : [],
        startHours: start.hours,
        startMinutes: start.minutes,
      })
    }
  }

  // Ensure at least one 'read' and one 'set' if total >= 2
  if (total >= 2) {
    const hasRead = questions.some(q => q.mode === 'read')
    const hasSet = questions.some(q => q.mode === 'set')
    if (!hasRead) {
      const q = questions[0]
      q.mode = 'read'
      q.choices = generateChoices(
        { hours: q.hours, minutes: q.minutes },
        q.difficulty, 4, q.format, q.ampm,
      )
    }
    if (!hasSet) {
      questions[questions.length - 1].mode = 'set'
      questions[questions.length - 1].choices = []
    }
  }

  shuffle(questions)

  // Fix any consecutive duplicate times by re-generating
  for (let i = 1; i < questions.length; i++) {
    if (questions[i].hours === questions[i - 1].hours && questions[i].minutes === questions[i - 1].minutes) {
      const time = generateTime(questions[i].difficulty, questions[i - 1])
      const q = questions[i]
      q.hours = time.hours
      q.minutes = time.minutes
      q.display = formatTimeAs(time.hours, time.minutes, q.format, q.ampm)
      const start = generateStartTime(q.difficulty, time)
      q.startHours = start.hours
      q.startMinutes = start.minutes
      if (q.mode === 'read') {
        q.choices = generateChoices(time, q.difficulty, 4, q.format, q.ampm)
      }
    }
  }

  return questions
}

/**
 * Get the primary (highest-weight) difficulty from a mix for session reporting.
 */
function getPrimaryDifficulty(mix: Record<string, number>): Difficulty {
  let best: Difficulty = 'hour'
  let bestWeight = 0
  for (const [diff, weight] of Object.entries(mix)) {
    if (weight > bestWeight) {
      bestWeight = weight
      best = diff as Difficulty
    }
  }
  return best
}

export function QuestRun({ tierInfo, totalQuestions = 10, advancedSetHintMode = false, advancedSetHintPenalty = 2, onComplete, onExit }: QuestRunProps) {
  const [questions] = useState<QuestQuestion[]>(() => buildQuestionPlan(tierInfo.questRunMix, totalQuestions, tierInfo.timeFormatMix))
  const [showExitModal, setShowExitModal] = useState(false)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [_currentStreak, setCurrentStreak] = useState(0)
  const [maxStreak, setMaxStreak] = useState(0)
  const [responseTimes, setResponseTimes] = useState<number[]>([])
  const [questionStart, setQuestionStart] = useState(Date.now())

  // Read mode state
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null)

  // Set mode state — start position from pre-generated plan
  const [playerHours, setPlayerHours] = useState(questions[0].startHours)
  const [playerMinutes, setPlayerMinutes] = useState(questions[0].startMinutes)
  const [submitted, setSubmitted] = useState(false)

  const [showHint, setShowHint] = useState(false)
  const [hintText, setHintText] = useState('')
  const [hintPenalty, setHintPenalty] = useState(0)

  const q = questions[questionIndex]
  const correctAnswer = q.display
  const isSetCorrect = playerHours === q.hours && Math.abs(playerMinutes - q.minutes) <= 2

  const answered = q.mode === 'read' ? selectedChoice !== null : submitted
  const effectiveCorrect = Math.max(0, correct - hintPenalty)

  const handleReadSelect = useCallback((option: string) => {
    if (selectedChoice) return
    setSelectedChoice(option)
    const elapsed = Date.now() - questionStart
    setResponseTimes(prev => [...prev, elapsed])
    if (option === correctAnswer) {
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
  }, [selectedChoice, questionStart, correctAnswer])

  const handleSetSubmit = useCallback(() => {
    setSubmitted(true)
    const elapsed = Date.now() - questionStart
    setResponseTimes(prev => [...prev, elapsed])
    if (isSetCorrect) {
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
  }, [questionStart, isSetCorrect])

  const handleTimeChange = useCallback((h: number, m: number) => {
    if (!submitted) {
      setPlayerHours(h)
      setPlayerMinutes(m)
      if (advancedSetHintMode && q.mode === 'set' && showHint) {
        setShowHint(false)
      }
    }
  }, [submitted, advancedSetHintMode, q.mode, showHint])

  const handleNext = useCallback(() => {
    const nextIdx = questionIndex + 1
    if (nextIdx >= totalQuestions) {
      const avgMs = responseTimes.length > 0
        ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
        : 0

      onComplete({
        mode: 'quest',
        difficulty: getPrimaryDifficulty(tierInfo.questRunMix),
        questions: totalQuestions,
        correct: effectiveCorrect,
        hints_used: hintsUsed,
        max_streak: maxStreak,
        avg_response_ms: avgMs,
      })
      return
    }

    const nextQ = questions[nextIdx]
    setQuestionIndex(nextIdx)
    setSelectedChoice(null)
    setPlayerHours(nextQ.startHours)
    setPlayerMinutes(nextQ.startMinutes)
    setSubmitted(false)
    setShowHint(false)
    setHintText('')
    setQuestionStart(Date.now())
  }, [questionIndex, totalQuestions, effectiveCorrect, hintsUsed, responseTimes, onComplete, tierInfo.questRunMix, questions])

  const handleHint = useCallback(() => {
    setShowHint(true)
    if (q.mode === 'set' && advancedSetHintMode) {
      setHintText(q.display)
      setHintPenalty(p => p + advancedSetHintPenalty)
    } else {
      setHintText(generateHint(q.hours, q.minutes))
    }
    setHintsUsed(h => h + 1)
  }, [q.mode, q.display, q.hours, q.minutes, advancedSetHintMode, advancedSetHintPenalty])

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      {/* Top bar: exit + sound toggle */}
      <div className="flex w-full justify-between items-center">
        <button
          onClick={() => setShowExitModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white font-bold text-sm transition-all active:scale-95"
        >
          <img src={exitIcon} alt="" className="w-5 h-5" />
          Exit Quest
        </button>
        <SoundToggle />
      </div>

      {/* Exit confirmation modal */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-slate-800 border border-slate-600 rounded-2xl p-6 max-w-sm w-full mx-4 text-center shadow-xl">
            <h3 className="text-xl font-bold mb-2">Exit Quest?</h3>
            <p className="text-slate-400 mb-6">Your progress on this quest run will be lost.</p>
            <div className="flex gap-3 justify-center">
              <Button variant="secondary" size="md" onClick={() => setShowExitModal(false)}>No, Keep Going</Button>
              <Button variant="primary" size="md" onClick={onExit}>Yes, Exit</Button>
            </div>
          </div>
        </div>
      )}

      {/* Progress */}
      <div className="flex items-center gap-3 text-slate-400">
        <span className="text-lg font-bold">Question {questionIndex + 1} / {totalQuestions}</span>
        <span className="text-green-400">{effectiveCorrect} score</span>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-md h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-500 transition-all duration-300"
          style={{ width: `${((questionIndex + (answered ? 1 : 0)) / totalQuestions) * 100}%` }}
        />
      </div>

      {/* Mode indicator */}
      <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
        q.mode === 'read'
          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
          : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
      }`}>
        {q.mode === 'read' ? 'Read the Clock' : 'Set the Clock'}
      </span>

      {/* READ mode */}
      {q.mode === 'read' && (
        <>
          <h2 className="text-2xl font-bold">What time is it?</h2>
          <AnalogClock hours={q.hours} minutes={q.minutes} size={260} />

          {showHint && (
            <div className="text-amber-400 text-lg">{hintText}</div>
          )}

          <MultipleChoice
            options={q.choices}
            onSelect={handleReadSelect}
            selected={selectedChoice}
            correctAnswer={selectedChoice ? correctAnswer : null}
          />

          {selectedChoice && (
            <div className={`text-xl font-bold ${selectedChoice === correctAnswer ? 'text-green-400' : 'text-red-400'}`}>
              {selectedChoice === correctAnswer ? 'Correct!' : `Not quite! The answer was ${correctAnswer}`}
            </div>
          )}
        </>
      )}

      {/* SET mode */}
      {q.mode === 'set' && (
        <>
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-1">Set the clock to:</h2>
            <div className="text-4xl text-amber-400 font-bold">
              {q.display}
            </div>
          </div>

          <InteractiveClock
            hours={playerHours}
            minutes={playerMinutes}
            onTimeChange={handleTimeChange}
            minuteSnapDegrees={tierInfo.minuteSnapDegrees}
            size={280}
            showDigitalReadout={showHint}
          />


          {submitted && (
            <div className={`text-xl font-bold ${isSetCorrect ? 'text-green-400' : 'text-red-400'}`}>
              {isSetCorrect ? 'Correct!' : `Not quite! The answer was ${correctAnswer}`}
            </div>
          )}
        </>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {!answered && (
          <>
            <Button variant="ghost" size="sm" onClick={handleHint} disabled={showHint}>
              Hint
            </Button>
            {q.mode === 'set' && (
              <Button onClick={handleSetSubmit}>Check</Button>
            )}
          </>
        )}
        {answered && (
          <Button onClick={handleNext}>
            {questionIndex + 1 >= totalQuestions ? 'See Results' : 'Next'}
          </Button>
        )}
      </div>
    </div>
  )
}
