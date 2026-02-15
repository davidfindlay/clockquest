import { useState } from 'react'
import { isSoundEnabled, setSoundEnabled } from '../../utils/sounds'
import soundOnIcon from '../../assets/sound-on.svg'
import soundOffIcon from '../../assets/sound-off.svg'

export function SoundToggle() {
  const [enabled, setEnabled] = useState(isSoundEnabled)

  const toggle = () => {
    const next = !enabled
    setEnabled(next)
    setSoundEnabled(next)
  }

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white font-bold text-sm transition-all active:scale-95"
    >
      <img src={enabled ? soundOnIcon : soundOffIcon} alt="" className="w-5 h-5" />
      {enabled ? 'Sounds On' : 'Sounds Off'}
    </button>
  )
}
