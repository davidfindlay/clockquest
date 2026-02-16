import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '../components/UI/Button'
import { playSound } from '../utils/sounds'
import { getTierByIndex } from '../utils/tier-config'
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
  const tierInfo = getTierByIndex(result.new_tier)
  const tierName = tierInfo.name
  const hintsUsed = result.session.hints_used

  return (
    <div className="min-h-full p-6 pt-10 flex flex-col items-center">
      <h1 className="text-4xl font-black mb-6 text-center">
        {accuracy >= 80 ? 'Great Job!' : accuracy >= 50 ? 'Good Effort!' : 'Keep Practising!'}
      </h1>

      <div className="w-full max-w-4xl flex flex-col md:flex-row md:items-end items-center gap-4 md:gap-6 mb-6">
        {/* Narrow screens: callout first, then character. Wide screens: character then callout */}
        <div className="order-1 md:order-2 relative bg-white text-slate-800 rounded-2xl px-6 py-5 shadow-2xl w-full min-h-[220px] flex flex-col justify-between">
          <div className="hidden md:block absolute -left-3 bottom-8 w-0 h-0 border-y-[12px] border-y-transparent border-r-[16px] border-r-white" />
          <div className="md:hidden absolute left-12 -bottom-3 w-0 h-0 border-x-[12px] border-x-transparent border-t-[14px] border-t-white" />

          <div>
            <h2 className="text-2xl font-black mb-4">Results</h2>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-slate-100 p-3">
                <div className="text-xs uppercase tracking-wider text-slate-500 font-bold">Correct</div>
                <div className="text-xl font-black">{result.session.correct}/{result.session.questions}</div>
              </div>
              <div className="rounded-xl bg-slate-100 p-3">
                <div className="text-xs uppercase tracking-wider text-slate-500 font-bold">Accuracy</div>
                <div className="text-xl font-black">{accuracy}%</div>
              </div>
              <div className="rounded-xl bg-slate-100 p-3">
                <div className="text-xs uppercase tracking-wider text-slate-500 font-bold">Power Gained</div>
                <div className="text-xl font-black text-green-700">+{Math.round(result.points_earned)}</div>
              </div>
              <div className="rounded-xl bg-slate-100 p-3">
                <div className="text-xs uppercase tracking-wider text-slate-500 font-bold">Clock Power</div>
                <div className="text-xl font-black">{Math.round(result.new_clock_power)}</div>
              </div>
              <div className="rounded-xl bg-slate-100 p-3">
                <div className="text-xs uppercase tracking-wider text-slate-500 font-bold">Hints</div>
                <div className={`text-xl font-black ${hintsUsed === 0 ? 'text-slate-900' : 'text-rose-700'}`}>{hintsUsed}</div>
              </div>
              <div className="rounded-xl bg-slate-100 p-3">
                <div className="text-xs uppercase tracking-wider text-slate-500 font-bold">Tier</div>
                <div className="text-xl font-black inline-flex items-center justify-center gap-2">
                  <img src={tierInfo.icon} alt={tierName} className="w-7 h-7" />
                  <span>{tierName}</span>
                </div>
              </div>
            </div>

            {perfectNoHints && result.session.mode === 'quest' && (
              <div className="mt-3 text-sm font-semibold text-green-700">Perfect quest bonus achieved!</div>
            )}
          </div>

          <div className="mt-4 flex items-center justify-end gap-3">
            {result.tier_up && (
              <div className="text-lg font-black text-green-600">Tier Up! 🚀</div>
            )}
          </div>
        </div>

        <img src={characterImage} alt={character} className="order-2 md:order-1 w-48 h-48 md:w-56 md:h-56 object-contain drop-shadow-2xl" />
      </div>

      {result.session.speedrun_score !== null && (
        <div className="text-xl mb-4">
          Speed Score: <span className="text-amber-400 font-bold">{result.session.speedrun_score}</span>
        </div>
      )}

      <div className="flex gap-3">
        <Button onClick={() => navigate('/hub')}>Back to Hub</Button>
      </div>
    </div>
  )
}
