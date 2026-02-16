import { apiFetch } from '../api/client'

import tick1 from '../assets/characters/tick/tick_pose_01.png'
import tick2 from '../assets/characters/tick/tick_pose_02.png'
import tick3 from '../assets/characters/tick/tick_pose_03.png'
import tick4 from '../assets/characters/tick/tick_pose_04.png'
import tick5 from '../assets/characters/tick/tick_pose_05.png'
import tock1 from '../assets/characters/tock/tock_pose_01.png'
import tock2 from '../assets/characters/tock/tock_pose_02.png'
import tock3 from '../assets/characters/tock/tock_pose_03.png'
import tock4 from '../assets/characters/tock/tock_pose_04.png'
import tock5 from '../assets/characters/tock/tock_pose_05.png'

export type CalloutPosition = 'left' | 'right' | 'top' | 'bottom'

interface VisualConfigItem {
  filename: string
  character: 'tick' | 'tock'
  use_types: string[]
  default_callout_position: CalloutPosition
}

interface VisualConfigApi {
  mobile_fallback_callout_position: 'top'
  images: VisualConfigItem[]
}

const IMAGE_BY_FILENAME: Record<string, string> = {
  'tick_pose_01.png': tick1,
  'tick_pose_02.png': tick2,
  'tick_pose_03.png': tick3,
  'tick_pose_04.png': tick4,
  'tick_pose_05.png': tick5,
  'tock_pose_01.png': tock1,
  'tock_pose_02.png': tock2,
  'tock_pose_03.png': tock3,
  'tock_pose_04.png': tock4,
  'tock_pose_05.png': tock5,
}

let visualConfig: VisualConfigApi = {
  mobile_fallback_callout_position: 'top',
  images: [],
}

export async function loadCharacterVisualConfig(): Promise<void> {
  try {
    const data = await apiFetch('/character-visual-config') as VisualConfigApi
    if (data?.images) visualConfig = data
  } catch {
    // fall back to defaults
  }
}

export function pickCharacterVisual(character: 'tick' | 'tock', useType: 'tips' | 'results' | 'celebration') {
  const pool = visualConfig.images.filter(i => i.character === character && i.use_types.includes(useType))
  const chosen = pool.length > 0
    ? pool[Math.floor(Math.random() * pool.length)]
    : undefined

  const filename = chosen?.filename ?? (character === 'tock' ? 'tock_pose_02.png' : 'tick_pose_03.png')
  const src = IMAGE_BY_FILENAME[filename] ?? IMAGE_BY_FILENAME['tick_pose_03.png']
  const calloutPosition = chosen?.default_callout_position ?? 'right'
  return { filename, src, calloutPosition, mobileFallback: visualConfig.mobile_fallback_callout_position }
}
