import { useEffect, useState } from 'react'
import { api, HistoryDetail as HistoryDetailType } from '../api'
import { EvaluationView } from './EvaluationView'

interface Props {
  id: number
  onBack: () => void
}

export function HistoryDetail({ id, onBack }: Props) {
  const [data, setData]     = useState<HistoryDetailType | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getHistory(id)
      .then(setData)
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <div className="w-6 h-6 border-2 border-gray-200 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    )
  }
  if (!data) return null

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return (
      d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) +
      ', ' +
      d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-3 border-b border-gray-100 bg-white shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Мои тренировки
        </button>
        <span className="text-gray-300 text-xs">/</span>
        <span className="text-xs font-medium text-gray-700 truncate">{data.patient_name}</span>
      </div>

      <EvaluationView
        evaluation={data.evaluation}
        patientName={data.patient_name}
        scenarioTitle={data.scenario_title}
        createdAt={formatDate(data.created_at)}
        transcript={data.transcript}
      />
    </div>
  )
}
