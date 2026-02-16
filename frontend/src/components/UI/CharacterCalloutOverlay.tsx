import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { CalloutPosition } from '../../utils/character-visual-config'

interface CharacterCalloutOverlayProps {
  character: 'tick' | 'tock'
  message: string
  onDismiss: () => void
  imageSrc: string
  calloutPosition?: CalloutPosition
}

export function CharacterCalloutOverlay({
  character,
  message,
  onDismiss,
  imageSrc,
  calloutPosition = 'right',
}: CharacterCalloutOverlayProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === 'Escape' || e.key === ' ') onDismiss()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onDismiss])

  // calloutPosition defines bubble placement relative to character on desktop.
  // left => bubble left / character right, right => bubble right / character left
  const desktopRowClass = calloutPosition === 'left' ? 'md:flex-row' : 'md:flex-row-reverse'
  const desktopTail = calloutPosition === 'left'
    ? <div className="hidden md:block absolute -right-3 bottom-6 w-0 h-0 border-y-[10px] border-y-transparent border-l-[14px] border-l-white" />
    : <div className="hidden md:block absolute -left-3 bottom-6 w-0 h-0 border-y-[10px] border-y-transparent border-r-[14px] border-r-white" />

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-black/55 flex items-end md:items-center justify-center p-4"
      onPointerDown={onDismiss}
      onTouchStart={onDismiss}
      aria-label="Dismiss tip"
    >
      <div className={`w-full max-w-2xl flex flex-col items-center gap-4 ${desktopRowClass}`}>
        {/* Mobile always shows callout above image */}
        <div className="order-1 md:order-none relative bg-white text-slate-800 rounded-2xl px-5 py-4 shadow-2xl max-w-xl min-h-[90px] flex flex-col justify-between">
          {desktopTail}
          <div className="md:hidden absolute left-12 -bottom-3 w-0 h-0 border-x-[12px] border-x-transparent border-t-[14px] border-t-white" />
          <p className="text-base md:text-lg font-bold leading-snug">{message}</p>
          <div className="mt-2 text-[11px] font-medium text-slate-500">Tap anywhere to continue</div>
        </div>

        <img src={imageSrc} alt={character} className="order-2 md:order-none w-44 h-44 object-contain drop-shadow-2xl" />
      </div>
    </div>,
    document.body,
  )
}
