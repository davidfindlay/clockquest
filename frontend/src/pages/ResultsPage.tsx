import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '../components/UI/Button'
import { Card } from '../components/UI/Card'
import { TierBadge } from '../components/Progression/TierBadge'
import { playSound } from '../utils/sounds'
import type { SessionResult } from '../types'
import { CharacterCalloutOverlay } from '../components/UI/CharacterCalloutOverlay'

export function ResultsPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const result = location.state?.result as SessionResult | undefined

  // Play tada sound when results page loads
  useEffect(() => {
    if (result) playSound('tada')
  }, [result])

  if (!result) {
    navigate('/hub')
    return null
  }

  const accuracy = result.session.questions > 0
    ? Math.round((result.session.correct / result.session.questions) * 100)
    : 0

  const callouts = useMemo(() => {
    if (!result || result.session.mode !== 'quest') return [] as { character: 'tick' | 'tock'; message: string }[]

    const msgs: { character: 'tick' | 'tock'; message: string }[] = []
    const perfectNoHints = result.session.correct === result.session.questions && result.session.hints_used === 0
    if (perfectNoHints) {
      msgs.push({ character: 'tock', message: 'Flawless quest run! +5 bonus for perfect with no hints!' })
    }
    msgs.push({
      character: perfectNoHints ? 'tock' : 'tick',
      message: `Quest summary: ${result.session.correct}/${result.session.questions} correct, +${Math.round(result.points_earned)} power.`,
    })
    return msgs
  }, [result])

  const [calloutIndex, setCalloutIndex] = useState(0)

  return (
    <div className="min-h-full p-6 pt-12 flex flex-col items-center">
      {calloutIndex < callouts.length && (
        <CharacterCalloutOverlay
          character={callouts[calloutIndex].character}
          message={callouts[calloutIndex].message}
          onDismiss={() => setCalloutIndex(i => i + 1)}
        />
      )}
      <h1 className="text-4xl font-black mb-6">
        {accuracy >= 80 ? 'Great Job!' : accuracy >= 50 ? 'Good Effort!' : 'Keep Practising!'}
      </h1>

      <Card className="w-full max-w-md mb-6">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-3xl font-bold text-white">
              {result.session.correct}/{result.session.questions}
            </div>
            <div className="text-sm text-slate-400">Correct</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-amber-400">{accuracy}%</div>
            <div className="text-sm text-slate-400">Accuracy</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-green-400">+{Math.round(result.points_earned)}</div>
            <div className="text-sm text-slate-400">Points Earned</div>
          </div>
          <div>
            <div className="text-3xl font-bold font-mono text-amber-400">
              {Math.round(result.new_clock_power)}
            </div>
            <div className="text-sm text-slate-400">Clock Power</div>
          </div>
        </div>
      </Card>

      {result.session.hints_used > 0 && (
        <div className="text-slate-400 mb-2">
          Hints used: {result.session.hints_used}
        </div>
      )}

      {result.session.speedrun_score !== null && (
        <div className="text-xl mb-4">
          Speed Score: <span className="text-amber-400 font-bold">{result.session.speedrun_score}</span>
        </div>
      )}

      <div className="mb-6">
        <TierBadge tier={result.new_tier} size="lg" />
      </div>

      {result.tier_up && (
        <div className="text-2xl font-bold text-green-400 mb-6 animate-bounce">
          Tier Up!
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => navigate('/hub')}>Back to Hub</Button>
        <Button onClick={() => navigate(`/play/${result.session.mode}`)}>Play Again</Button>
      </div>
    </div>
  )
}
