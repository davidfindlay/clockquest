import { apiFetch, apiPost } from './client'
import type { TierTrialConfig, TierTrialSubmit, TierTrialResult } from '../types'

export function getTrialConfig(tier: number): Promise<TierTrialConfig> {
  return apiFetch(`/trials/config/${tier}`)
}

export function submitTrial(data: TierTrialSubmit): Promise<TierTrialResult> {
  return apiPost('/trials', data)
}
