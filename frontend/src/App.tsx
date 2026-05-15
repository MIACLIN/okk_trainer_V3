import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActiveScenario, api, DISC_META, EvaluationResult,
  patientPhotoUrl, playAudioBase64, ScenarioInfo,
} from './api'
import { AnalyticsPanel } from './components/AnalyticsPanel'
import { ConversationView, Message } from './components/ConversationView'
import { EvaluationView } from './components/EvaluationView'
import { HistoryDetail } from './components/HistoryDetail'
import { HistoryList } from './components/HistoryList'
import { PatientDetailModal } from './components/PatientDetailModal'
import { ScenarioSelector } from './components/ScenarioSelector'
import { TopNav } from './components/TopNav'
import { VoiceRecorder, VoiceRecorderRef } from './components/VoiceRecorder'

type Screen = 'select' | 'session' | 'history' | 'history-detail'
type PatientStatus = 'connecting' | 'idle' | 'recording' | 'processing' | 'speaking'

const STATUS_LABEL: Record<PatientStatus, string> = {
  connecting: 'Устанавливаем связь...',
  idle:       '',
  recording:  'Идёт запись...',
  processing: 'Обработка...',
  speaking:   'Пациент отвечает...',
}

function useTimer(running: boolean) {
  const [seconds, setSeconds] = useState(0)
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setSeconds(s => s + 1), 1000)
    return () => clearInterval(id)
  }, [running])
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')
  return `${mm}:${ss}`
}

export default function App() {
  const [screen, setScreen]             = useState<Screen>('select')
  const [selectedScenario, setSelected] = useState<ScenarioInfo | null>(null)
  const [showModal, setShowModal]       = useState(false)
  const [activeScenario, setActive]     = useState<ActiveScenario | null>(null)
  const [sessionId, setSessionId]       = useState<string | null>(null)
  const [messages, setMessages]         = useState<Message[]>([])
  const [status, setStatus]             = useState<PatientStatus>('connecting')
  const [error, setError]               = useState<string | null>(null)
  const [evaluation, setEvaluation]     = useState<EvaluationResult | null>(null)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [historyId, setHistoryId]       = useState<number | null>(null)

  const timerRunning = screen === 'session' && status !== 'connecting' && !evaluation
  const timer        = useTimer(timerRunning)
  const processingRef = useRef(false)
  const recorderRef   = useRef<VoiceRecorderRef>(null)

  const isProcessing = status === 'processing' || status === 'speaking' || status === 'connecting'

  const handleCardClick = useCallback((s: ScenarioInfo) => {
    setSelected(s)
    setShowModal(true)
  }, [])

  const handleStart = useCallback(async () => {
    if (!selectedScenario) return
    setStatus('connecting')
    setError(null)
    setMessages([])
    setEvaluation(null)
    setScreen('session')
    setShowModal(false)

    try {
      const res = await api.startSession(selectedScenario.id)
      setSessionId(res.session_id)
      setActive(res.scenario)
      setMessages([{
        role: 'patient',
        text: res.patient_greeting_text,
        patientName: res.scenario.patient_name,
      }])
      setStatus('speaking')
      await playAudioBase64(res.patient_greeting_audio_base64)
      setStatus('idle')
      setTimeout(() => recorderRef.current?.startAutoRecording(), 400)
    } catch (e) {
      setError((e as Error).message)
      setStatus('idle')
    }
  }, [selectedScenario])

  const handleEvaluate = useCallback(async () => {
    if (!sessionId) return
    setIsEvaluating(true)
    setError(null)
    try {
      const result = await api.evaluate(sessionId)
      setEvaluation(result)
      setSessionId(null)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setIsEvaluating(false)
    }
  }, [sessionId])

  const handleRecording = useCallback(async (b64: string) => {
    if (!sessionId || processingRef.current) return
    processingRef.current = true
    setStatus('processing')
    setError(null)

    try {
      const res = await api.sendMessage(sessionId, b64)
      setMessages(prev => [...prev, { role: 'user', text: res.user_transcript }])
      setMessages(prev => [...prev, {
        role: 'patient',
        text: res.patient_response_text,
        patientName: activeScenario?.patient_name,
      }])
      setStatus('speaking')
      await playAudioBase64(res.patient_response_audio_base64)
      setStatus('idle')

      if (res.session_ended) {
        setTimeout(() => handleEvaluate(), 800)
      } else {
        setTimeout(() => recorderRef.current?.startAutoRecording(), 400)
      }
    } catch (e) {
      setError((e as Error).message)
      setStatus('idle')
    } finally {
      processingRef.current = false
    }
  }, [sessionId, activeScenario, handleEvaluate])

  const handleHome = useCallback(() => {
    setScreen('select')
    setSelected(null)
    setActive(null)
    setSessionId(null)
    setMessages([])
    setEvaluation(null)
    setError(null)
    setStatus('connecting')
    processingRef.current = false
  }, [])

  const handleHistory = useCallback(() => {
    if (screen === 'session' && !evaluation) return
    setScreen('history')
  }, [screen, evaluation])

  const handleHistoryDetail = useCallback((id: number) => {
    setHistoryId(id)
    setScreen('history-detail')
  }, [])

  const disc      = activeScenario ? DISC_META[activeScenario.patient_disc_type] : null
  const inSession = screen === 'session' && !evaluation

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      <TopNav
        screen={screen}
        onHome={handleHome}
        onHistory={handleHistory}
        inSession={inSession}
      />

      <div className="flex-1 flex overflow-hidden">

        {/* ── SELECT ── */}
        {screen === 'select' && (
          <ScenarioSelector onSelect={handleCardClick} />
        )}

        {/* ── HISTORY LIST ── */}
        {screen === 'history' && (
          <HistoryList onSelect={handleHistoryDetail} />
        )}

        {/* ── HISTORY DETAIL ── */}
        {screen === 'history-detail' && historyId !== null && (
          <HistoryDetail id={historyId} onBack={() => setScreen('history')} />
        )}

        {/* ── SESSION: active call ── */}
        {screen === 'session' && !evaluation && (
          <>
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Breadcrumb */}
              <div className="flex items-center gap-1.5 px-6 py-3 border-b border-gray-100 bg-white text-xs text-gray-500 shrink-0">
                <button onClick={handleHome} className="hover:text-gray-700 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  Тренажер
                </button>
                <span className="text-gray-300">/</span>
                <span className="text-gray-700 font-medium truncate">{activeScenario?.patient_name}</span>
              </div>

              {/* Patient card */}
              {activeScenario && (
                <div className="mx-5 mt-4 mb-2 card p-4 shrink-0">
                  <div className="flex items-start gap-3">
                    <img
                      src={activeScenario.patient_photo_url || patientPhotoUrl(activeScenario.patient_photo_id)}
                      alt={activeScenario.patient_name}
                      className="w-10 h-10 rounded-full object-cover object-top shrink-0 bg-gray-200"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900">{activeScenario.patient_name}</span>
                        {disc && (
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${disc.bg}`}>
                            {activeScenario.patient_disc_type} — {disc.label}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        <span className="text-indigo-500 font-medium">Контекст</span>{' '}
                        {activeScenario.context}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Conversation */}
              <div className="flex-1 flex flex-col overflow-hidden mx-5 mb-0">
                <div className="card flex-1 flex flex-col overflow-hidden">
                  <ConversationView messages={messages} isThinking={status === 'processing'} />
                </div>
              </div>

              {error && (
                <div className="mx-5 mt-2 px-4 py-2 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs">
                  {error}
                </div>
              )}

              {/* Bottom bar */}
              <div className="shrink-0 border-t border-gray-100 bg-white px-5 py-3 flex items-center gap-4">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${
                    status === 'connecting' ? 'bg-gray-400 animate-pulse'
                    : status === 'recording'  ? 'bg-red-500 animate-pulse'
                    : status === 'speaking'   ? 'bg-emerald-500 animate-pulse'
                    : status === 'processing' ? 'bg-amber-500 animate-pulse'
                    : 'bg-gray-300'
                  }`} />
                  <span className="text-xs text-gray-500 truncate">{STATUS_LABEL[status]}</span>
                </div>

                <VoiceRecorder
                  ref={recorderRef}
                  onRecordingComplete={handleRecording}
                  onRecordingStart={() => setStatus('recording')}
                  disabled={isProcessing || isEvaluating}
                />

                <span className="text-sm font-mono text-gray-600 w-12 text-center shrink-0">{timer}</span>

                <button
                  onClick={handleEvaluate}
                  disabled={isProcessing || isEvaluating || messages.length < 2}
                  className="btn-danger text-sm shrink-0 gap-2"
                >
                  {isEvaluating ? (
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                    </svg>
                  )}
                  Завершить звонок
                </button>
              </div>
            </div>

            <AnalyticsPanel
              checklist={activeScenario?.checklist ?? []}
              isEvaluating={isEvaluating}
            />
          </>
        )}

        {/* ── SESSION: evaluation done ── */}
        {screen === 'session' && evaluation && (
          <EvaluationView
            evaluation={evaluation}
            patientName={activeScenario?.patient_name}
            scenarioTitle={activeScenario?.title}
            onRetry={handleHome}
          />
        )}
      </div>

      {showModal && selectedScenario && (
        <PatientDetailModal
          scenario={selectedScenario}
          onStart={handleStart}
          onClose={() => setShowModal(false)}
          loading={screen === 'session' && status === 'connecting'}
        />
      )}
    </div>
  )
}
