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

  return (
    <div
      className="fixed inset-0 z-50 bg-black/55 flex items-end md:items-center justify-center p-4"
      onClick={onDismiss}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === 'Escape' || e.key === ' ') onDismiss()
      }}
      role="button"
      tabIndex={0}
      aria-label="Dismiss tip"
    >
      <div className="w-full max-w-2xl flex flex-col md:flex-row items-center gap-4" onClick={(e) => e.stopPropagation()}>
        <img src={image} alt={character} className="w-44 h-44 object-contain drop-shadow-2xl" />
        <div className="relative bg-white text-slate-800 rounded-2xl px-5 py-4 shadow-2xl max-w-xl min-h-[72px] flex items-center">
          <div className="absolute -left-3 bottom-6 w-0 h-0 border-y-[10px] border-y-transparent border-r-[14px] border-r-white" />
          <p className="text-base md:text-lg font-bold leading-snug">{message}</p>
        </div>
      </div>
      <div className="absolute bottom-2 text-xs text-slate-200">Tap anywhere to continue</div>
    </div>
  )
}
