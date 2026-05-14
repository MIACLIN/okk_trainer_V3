import { useEffect, useState } from 'react'
import { api, HistoryDetail as HistoryDetailType } from '../api'
import { ConversationView, Message } from './ConversationView'

const LEVEL_COLOR: Record<string, string> = {
  'Новичок':    'text-red-600 bg-red-50 border-red-200',
  'Развивается':'text-amber-600 bg-amber-50 border-amber-200',
  'Уверенный':  'text-blue-600 bg-blue-50 border-blue-200',
  'Профи':      'text-emerald-600 bg-emerald-50 border-emerald-200',
}

function ScoreBar({ score }: { score: number }) {
  const pct = score * 10
  const color = score >= 8 ? 'bg-emerald-400' : score >= 5 ? 'bg-amber-400' : 'bg-red-400'
  return (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-semibold w-7 text-right shrink-0 ${
        score >= 8 ? 'text-emerald-600' : score >= 5 ? 'text-amber-600' : 'text-red-500'
      }`}>{score}/10</span>
    </div>
  )
}

interface Props {
  id: number
  onBack: () => void
}

export function HistoryDetail({ id, onBack }: Props) {
  const [data, setData] = useState<HistoryDetailType | null>(null)
  const [loading, setLoading] = useState(true)
  const [openError, setOpenError] = useState<number | null>(null)

  useEffect(() => {
    api.getHistory(id)
      .then(setData)
      .finally(() => setLoading(false))
  }, [id])

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
      + ' ' + d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <div className="w-6 h-6 border-2 border-gray-200 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    )
  }
  if (!data) return null

  const messages: Message[] = data.transcript.map(m => ({
    role: m.role === 'user' ? 'user' : 'patient',
    text: m.content,
    patientName: m.role === 'assistant' ? data.patient_name : undefined,
  }))

  const ev = data.evaluation

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-gray-100 bg-white shrink-0">
        <button onClick={onBack} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          История
        </button>
        <span className="text-gray-300">/</span>
        <span className="font-medium text-gray-800 text-sm">{data.patient_name}</span>
        <span className="text-gray-300">·</span>
        <span className="text-xs text-gray-400">{formatDate(data.created_at)}</span>
        <span className={`ml-auto text-xs px-2 py-0.5 rounded-full border font-medium ${LEVEL_COLOR[ev.level] ?? LEVEL_COLOR['Развивается']}`}>
          {ev.level}
        </span>
        <span className={`text-2xl font-bold ${
          ev.total_score >= 80 ? 'text-emerald-600' : ev.total_score >= 60 ? 'text-blue-600' : ev.total_score >= 40 ? 'text-amber-600' : 'text-red-500'
        }`}>{ev.total_score}<span className="text-sm font-normal text-gray-400">/100</span></span>
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: transcript */}
        <div className="flex-1 flex flex-col overflow-hidden mx-5 my-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 shrink-0">Транскрипт</p>
          <div className="card flex-1 flex flex-col overflow-hidden">
            <ConversationView messages={messages} isThinking={false} />
          </div>
        </div>

        {/* Right: analytics */}
        <div className="w-96 shrink-0 border-l border-gray-100 overflow-y-auto px-4 py-4 space-y-4">
          {/* Criteria */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Критерии</p>
            <div className="space-y-2">
              {ev.criteria.map((c, i) => (
                <div key={i}>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-gray-400 w-4 shrink-0">{i + 1}</span>
                    <span className="text-xs text-gray-600 flex-1 leading-tight truncate" title={c.name}>{c.name}</span>
                    <ScoreBar score={c.score} />
                  </div>
                  {c.comment && (
                    <p className="text-[11px] text-gray-400 mt-0.5 pl-5 leading-tight">{c.comment}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Top errors */}
          {ev.top_errors?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Топ-3 ошибки</p>
              <div className="space-y-2">
                {ev.top_errors.map((err, i) => (
                  <div key={i} className="border border-red-100 bg-red-50 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setOpenError(openError === i ? null : i)}
                      className="w-full flex items-center justify-between px-3 py-2 text-left"
                    >
                      <span className="text-xs font-medium text-red-700 flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-red-200 text-red-700 text-[9px] flex items-center justify-center font-bold shrink-0">{i + 1}</span>
                        {err.title}
                      </span>
                      <svg className={`w-3 h-3 text-red-400 transition-transform ${openError === i ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {openError === i && (
                      <div className="px-3 pb-3 space-y-1.5 text-[11px] leading-relaxed">
                        <p><span className="font-semibold text-red-600">Что:</span> <span className="text-red-700">{err.what}</span></p>
                        <p><span className="font-semibold text-red-600">Почему важно:</span> <span className="text-red-700">{err.why}</span></p>
                        <p><span className="font-semibold text-red-600">Как исправить:</span> <span className="text-red-700">{err.how}</span></p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {ev.strengths && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
              <p className="text-xs font-semibold text-emerald-700 mb-1">Что получилось хорошо</p>
              <p className="text-xs text-emerald-600 leading-relaxed">{ev.strengths}</p>
            </div>
          )}

          {ev.priority && (
            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
              <p className="text-xs font-semibold text-indigo-700 mb-1">Приоритет на следующую сессию</p>
              <p className="text-xs text-indigo-600 leading-relaxed">{ev.priority}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
