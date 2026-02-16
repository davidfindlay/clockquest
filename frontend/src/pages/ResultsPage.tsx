import { useEffect, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '../components/UI/Button'
import { TierBadge } from '../components/Progression/TierBadge'
import { playSound } from '../utils/sounds'
import tickTeach from '../assets/characters/tick_teach.png'
import tockCelebrate from '../assets/characters/tock_celebrate.png'
import type { SessionResult } from '../types'

export function ResultsPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const result = location.state?.result as SessionResult | undefined

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

  const perfectNoHints = result.session.correct === result.session.questions && result.session.hints_used === 0
  const character = perfectNoHints ? 'tock' : 'tick'
  const characterImage = character === 'tock' ? tockCelebrate : tickTeach

  const summaryLines = useMemo(() => {
    const lines = [
      `Results: ${result.session.correct}/${result.session.questions} correct (${accuracy}%).`,
      `Clock Power gained: +${Math.round(result.points_earned)}.`,
      `Current Clock Power: ${Math.round(result.new_clock_power)}.`,
    ]

    if (result.session.hints_used > 0) {
      lines.push(`Hints used: ${result.session.hints_used}.`)
    } else {
      lines.push('No hints used.')
    }

    if (perfectNoHints && result.session.mode === 'quest') {
      lines.push('Perfect quest run with no hints — bonus achieved!')
    }

    return lines
  }, [result, accuracy, perfectNoHints])

  return (
    <div className="min-h-full p-6 pt-10 flex flex-col items-center">
      <h1 className="text-4xl font-black mb-6 text-center">
        {accuracy >= 80 ? 'Great Job!' : accuracy >= 50 ? 'Good Effort!' : 'Keep Practising!'}
      </h1>

      <div className="w-full max-w-4xl flex flex-col md:flex-row items-center md:items-end gap-4 md:gap-6 mb-6">
        <img src={characterImage} alt={character} className="w-48 h-48 md:w-56 md:h-56 object-contain drop-shadow-2xl" />

        <div className="relative bg-white text-slate-800 rounded-2xl px-6 py-5 shadow-2xl w-full min-h-[220px] flex flex-col justify-between">
          <div className="absolute -left-3 bottom-8 w-0 h-0 border-y-[12px] border-y-transparent border-r-[16px] border-r-white" />

          <div>
            <h2 className="text-2xl font-black mb-3">{character === 'tock' ? 'Legendary run!' : 'Quest summary'}</h2>
            <div className="space-y-2 text-base md:text-lg font-semibold leading-snug">
              {summaryLines.map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <TierBadge tier={result.new_tier} size="md" />
            {result.tier_up && (
              <div className="text-lg font-black text-green-600">Tier Up! 🚀</div>
            )}
          </div>
        </div>
      </div>

      {result.session.speedrun_score !== null && (
        <div className="text-xl mb-4">
          Speed Score: <span className="text-amber-400 font-bold">{result.session.speedrun_score}</span>
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => navigate('/hub')}>Back to Hub</Button>
        <Button onClick={() => navigate(`/play/${result.session.mode}`)}>Play Again</Button>
      </div>
    </div>
  )
}
