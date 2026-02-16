import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import tickTeach from '../../assets/characters/tick_teach.png'
import tickIdle from '../../assets/characters/tick_idle.png'
import tockCelebrate from '../../assets/characters/tock_celebrate.png'

interface CharacterCalloutOverlayProps {
  character: 'tick' | 'tock'
  message: string
  onDismiss: () => void
}

const CHARACTER_IMG = {
  tick: tickTeach,
  tock: tockCelebrate,
}

export function CharacterCalloutOverlay({ character, message, onDismiss }: CharacterCalloutOverlayProps) {
  const image = CHARACTER_IMG[character] ?? tickIdle

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === 'Escape' || e.key === ' ') onDismiss()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onDismiss])

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-black/55 flex items-end md:items-center justify-center p-4"
      onPointerDown={onDismiss}
      onTouchStart={onDismiss}
      aria-label="Dismiss tip"
    >
      <div className="w-full max-w-2xl flex flex-col md:flex-row items-center gap-4">
        <img src={image} alt={character} className="w-44 h-44 object-contain drop-shadow-2xl" />
        <div className="relative bg-white text-slate-800 rounded-2xl px-5 py-4 shadow-2xl max-w-xl min-h-[90px] flex flex-col justify-between">
          <div className="absolute -left-3 bottom-6 w-0 h-0 border-y-[10px] border-y-transparent border-r-[14px] border-r-white" />
          <p className="text-base md:text-lg font-bold leading-snug">{message}</p>
          <div className="mt-2 text-[11px] font-medium text-slate-500">Tap anywhere to continue</div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
