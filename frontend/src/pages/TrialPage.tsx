import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AnalogClock } from '../components/Clock/AnalogClock'
import { MultipleChoice } from '../components/UI/MultipleChoice'
import { Button } from '../components/UI/Button'
import { Card } from '../components/UI/Card'
import { TierBadge } from '../components/Progression/TierBadge'
import { useGame } from '../stores/gameStore'
import { getTrialConfig, submitTrial } from '../api/trials'
import { generateTime, generateChoices } from '../components/Game/question-gen'
import { formatTime } from '../components/Clock/clock-utils'
import type { TierTrialConfig, TierTrialResult, Difficulty } from '../types'

export function TrialPage() {
  const { tier: tierStr } = useParams<{ tier: string }>()
  const tier = parseInt(tierStr || '1', 10)
  const navigate = useNavigate()
  const { player, setPlayer } = useGame()

  const [config, setConfig] = useState<TierTrialConfig | null>(null)
  const [phase, setPhase] = useState<'intro' | 'playing' | 'result'>('intro')
  const [questionIndex, setQuestionIndex] = useState(0)
  const [question, setQuestion] = useState<{ hours: number; minutes: number; choices: string[] } | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [correct, setCorrect] = useState(0)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [startTime, setStartTime] = useState(0)
  const [result, setResult] = useState<TierTrialResult | null>(null)

  useEffect(() => {
    if (!player) { navigate('/'); return }
    getTrialConfig(tier).then(setConfig).catch(() => navigate('/hub'))
  }, [tier, player, navigate])

  const startTrial = useCallback(() => {
    if (!config) return
    setPhase('playing')
    setStartTime(Date.now())
    const diff = (config.difficulty === 'mixed' ? 'one_min' : config.difficulty) as Difficulty
    const t = generateTime(diff)
    setQuestion({ ...t, choices: generateChoices(t, diff) })
  }, [config])

  const handleSelect = useCallback((option: string) => {
    if (selected || !question) return
    setSelected(option)
    const correctAnswer = formatTime(question.hours, question.minutes)
    if (option === correctAnswer) {
      setCorrect(c => c + 1)
    }
  }, [selected, question])

  const handleNext = useCallback(async () => {
    if (!config || !player) return
    const nextIdx = questionIndex + 1

    if (nextIdx >= config.questions) {
      // Submit trial
      const totalTime = Date.now() - startTime
      const trialResult = await submitTrial({
        player_id: player.id,
        tier,
        questions: config.questions,
        correct,
        hints_used: hintsUsed,
        time_ms: totalTime,
      })
      setResult(trialResult)
      setPlayer(trialResult.player)
      setPhase('result')
      return
    }

    setQuestionIndex(nextIdx)
    const diff = (config.difficulty === 'mixed' ? 'one_min' : config.difficulty) as Difficulty
    const t = generateTime(diff)
    setQuestion({ ...t, choices: generateChoices(t, diff) })
    setSelected(null)
  }, [config, player, questionIndex, startTime, correct, hintsUsed, tier, setPlayer])

  if (!config || !player) return null

  // Intro
  if (phase === 'intro') {
    return (
      <div className="min-h-full p-6 pt-12 flex flex-col items-center">
        <TierBadge tier={tier} size="lg" />
        <h1 className="text-3xl font-bold mt-4 mb-2">{config.tier_name} Trial</h1>
        <Card className="w-full max-w-md mt-4">
          <div className="space-y-3 text-center">
            <div><span className="text-slate-400">Questions:</span> <span className="font-bold">{config.questions}</span></div>
            <div><span className="text-slate-400">Need correct:</span> <span className="font-bold text-green-400">{config.min_correct}</span></div>
            <div><span className="text-slate-400">Max hints:</span> <span className="font-bold">{config.max_hints}</span></div>
            {config.speed_gate && <div className="text-amber-400 font-bold">Speed gate active!</div>}
          </div>
        </Card>
        <div className="flex gap-3 mt-6">
          <Button variant="ghost" onClick={() => navigate('/hub')}>Not Yet</Button>
          <Button onClick={startTrial} size="lg">Begin Trial</Button>
        </div>
      </div>
    )
  }

  // Playing
  if (phase === 'playing' && question) {
    const correctAnswer = formatTime(question.hours, question.minutes)
    return (
      <div className="min-h-full p-6 pt-8 flex flex-col items-center gap-4">
        <div className="text-slate-400 font-bold">
          {config.tier_name} Trial — {questionIndex + 1}/{config.questions}
        </div>
        <div className="text-sm text-slate-500">
          Correct: {correct} | Hints: {hintsUsed}/{config.max_hints}
        </div>

        <AnalogClock hours={question.hours} minutes={question.minutes} size={250} />

        <h2 className="text-2xl font-bold">What time is it?</h2>

        <MultipleChoice
          options={question.choices}
          onSelect={handleSelect}
          selected={selected}
          correctAnswer={selected ? correctAnswer : null}
        />

        <div className="flex gap-3">
          {!selected && hintsUsed < config.max_hints && (
            <Button variant="ghost" size="sm" onClick={() => setHintsUsed(h => h + 1)}>
              Hint ({config.max_hints - hintsUsed} left)
            </Button>
          )}
          {selected && (
            <Button onClick={handleNext}>
              {questionIndex + 1 >= config.questions ? 'Submit Trial' : 'Next'}
            </Button>
          )}
        </div>
      </div>
    )
  }

  // Result
  if (phase === 'result' && result) {
    return (
      <div className="min-h-full p-6 pt-12 flex flex-col items-center">
        <div className={`text-5xl mb-4 ${result.passed ? '' : ''}`}>
          {result.passed ? '🏆' : '💪'}
        </div>
        <h1 className={`text-3xl font-bold mb-4 ${result.passed ? 'text-green-400' : 'text-amber-400'}`}>
          {result.passed ? 'Trial Passed!' : 'Not Quite!'}
        </h1>
        <TierBadge tier={result.passed ? tier : tier - 1} size="lg" />
        <p className="text-slate-400 mt-4 text-center max-w-sm">{result.message}</p>

        <Card className="w-full max-w-sm mt-6">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{correct}/{config.questions}</div>
              <div className="text-sm text-slate-400">Correct</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{hintsUsed}</div>
              <div className="text-sm text-slate-400">Hints Used</div>
            </div>
          </div>
        </Card>

        <Button className="mt-6" onClick={() => navigate('/hub')}>Back to Hub</Button>
      </div>
    )
  }

  return null
}
