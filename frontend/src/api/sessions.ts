import { apiPost } from './client'
import type { SessionCreate, SessionResult } from '../types'

export function submitSession(data: SessionCreate): Promise<SessionResult> {
  return apiPost('/sessions', data)
}
