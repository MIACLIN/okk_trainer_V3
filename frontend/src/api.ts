const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export interface ScenarioInfo {
  id: string
  title: string
  description: string
  context: string
  tips: string[]
  skill_focus: string
  patient_name: string
  patient_age: number
  patient_profession: string
  patient_disc_type: string
  patient_photo_id: number
  patient_photo_url?: string
  checklist: string[]
  opening_line: string
}

export interface ActiveScenario {
  id: string
  title: string
  patient_name: string
  patient_disc_type: string
  patient_photo_id: number
  patient_photo_url?: string
  context: string
  checklist: string[]
}

export interface StartSessionResponse {
  session_id: string
  patient_greeting_text: string
  patient_greeting_audio_base64: string
  scenario: ActiveScenario
}

export interface MessageResponse {
  user_transcript: string
  patient_response_text: string
  patient_response_audio_base64: string
  session_ended: boolean
  end_reason: string  // "записался" | "ушёл" | ""
}

export interface CriterionResult {
  name: string
  score: number   // 0–10
  comment: string
}

export interface TopError {
  title: string
  what: string
  why: string
  how: string
}

export interface EvaluationResult {
  total_score: number
  max_score: number
  level: string
  criteria: CriterionResult[]
  top_errors: TopError[]
  strengths: string
  priority: string
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail ?? 'Request failed')
  }
  return res.json()
}

export interface CreatePatientRequest {
  name: string
  gender: string
  disc_type: string
  reason: string
  hidden_need: string
  opening_line: string
}

export const api = {
  listScenarios: (): Promise<ScenarioInfo[]> => request('/scenarios'),

  startSession: (scenario_id: string): Promise<StartSessionResponse> =>
    request('/session/start', { method: 'POST', body: JSON.stringify({ scenario_id }) }),

  sendMessage: (session_id: string, audio_base64: string): Promise<MessageResponse> =>
    request('/session/message', { method: 'POST', body: JSON.stringify({ session_id, audio_base64 }) }),

  evaluate: (session_id: string): Promise<EvaluationResult> =>
    request('/session/evaluate', { method: 'POST', body: JSON.stringify({ session_id }) }),

  createPatient: (data: CreatePatientRequest): Promise<{ scenario_id: string }> =>
    request('/patient/create', { method: 'POST', body: JSON.stringify(data) }),

  deletePatient: (scenario_id: string): Promise<{ ok: boolean }> =>
    request(`/patient/${scenario_id}`, { method: 'DELETE' }),

  listHistory: (): Promise<HistoryItem[]> => request('/history'),
  getHistory: (id: number): Promise<HistoryDetail> => request(`/history/${id}`),
}

export interface HistoryItem {
  id: number
  scenario_title: string
  patient_name: string
  created_at: string
  total_score: number
  level: string
}

export interface HistoryDetail {
  id: number
  scenario_title: string
  patient_name: string
  created_at: string
  transcript: { role: string; content: string }[]
  evaluation: EvaluationResult
}

export function audioBufferToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export function playAudioBase64(b64: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const audio = new Audio(`data:audio/mp3;base64,${b64}`)
    audio.onended = () => resolve()
    audio.onerror = reject
    audio.play().catch(reject)
  })
}

export const DISC_META: Record<string, { label: string; color: string; bg: string }> = {
  D: { label: 'Доминирующий',    color: 'text-red-600',    bg: 'bg-red-50 text-red-600 border-red-200' },
  I: { label: 'Влияющий',        color: 'text-amber-600',  bg: 'bg-amber-50 text-amber-600 border-amber-200' },
  S: { label: 'Стабильный',      color: 'text-emerald-600',bg: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  C: { label: 'Добросовестный',  color: 'text-blue-600',   bg: 'bg-blue-50 text-blue-600 border-blue-200' },
}

export function patientPhotoUrl(photoId: number) {
  return `https://i.pravatar.cc/300?img=${photoId}`
}
