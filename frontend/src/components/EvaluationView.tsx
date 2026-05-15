import { useState } from 'react'
import { EvaluationResult } from '../api'

interface Props {
  evaluation: EvaluationResult
  patientName?: string
  scenarioTitle?: string
  createdAt?: string
  onRetry?: () => void
  transcript?: { role: string; content: string }[]
}

const SKILL_ICONS = ['👋', '🔍', '📋', '😰', '🛡️', '👥', '💡', '💰', '📅', '❤️']

function scoreCol(n: number) {
  if (n >= 7) return { text: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' }
  if (n >= 5) return { text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' }
  return { text: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200' }
}

function totalCol(t: number) {
  if (t >= 70) return { text: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' }
  if (t >= 50) return { text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' }
  return { text: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200' }
}

export function EvaluationView({
  evaluation,
  patientName,
  scenarioTitle,
  createdAt,
  onRetry,
  transcript,
}: Props) {
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [showTranscript, setShowTranscript] = useState(false)

  const displayScore = (evaluation.total_score / 10).toFixed(1)
  const mc = totalCol(evaluation.total_score)
  const selected = evaluation.criteria[selectedIdx]

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">

      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-100 px-8 py-5 shrink-0">
        <div className="flex items-center gap-4">
          <div
            className={`w-16 h-16 rounded-2xl ${mc.bg} border-2 ${mc.border} flex items-center justify-center shrink-0`}
          >
            <span className={`text-2xl font-black ${mc.text}`}>{displayScore}</span>
          </div>

          <div className="flex-1 min-w-0">
            {createdAt && <p className="text-xs text-gray-400 mb-0.5">{createdAt}</p>}
            <h1 className="text-xl font-bold text-gray-900 leading-tight truncate">
              {patientName ?? 'Тренировка'}
            </h1>
            {scenarioTitle && <p className="text-sm text-gray-500">{scenarioTitle}</p>}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {transcript && transcript.length > 0 && (
              <button
                onClick={() => setShowTranscript(v => !v)}
                className={`text-sm px-4 py-2 rounded-full border font-medium transition-colors ${
                  showTranscript
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'border-gray-200 text-gray-600 hover:border-gray-400'
                }`}
              >
                {showTranscript ? 'Аналитика' : 'Диалог'}
              </button>
            )}
            {onRetry && (
              <button
                onClick={onRetry}
                className="text-sm px-4 py-2 rounded-full bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors"
              >
                Тренироваться снова
              </button>
            )}
          </div>
        </div>

        {evaluation.strengths && (
          <div className="mt-4 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 flex gap-3">
            <span className="text-indigo-400 text-base shrink-0 mt-0.5">✦</span>
            <div>
              <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wide mb-0.5">
                Общая рекомендация
              </p>
              <p className="text-sm text-indigo-800 leading-relaxed">{evaluation.strengths}</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Body ── */}
      {showTranscript ? (
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="max-w-2xl mx-auto space-y-3">
            {transcript?.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-sm'
                      : 'bg-white border border-gray-200 text-gray-700 rounded-bl-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">

          {/* Skills list */}
          <div className="w-64 xl:w-72 shrink-0 border-r border-gray-100 bg-white overflow-y-auto py-2">
            {evaluation.criteria.map((c, i) => {
              const sc = scoreCol(c.score)
              const active = selectedIdx === i
              return (
                <button
                  key={i}
                  onClick={() => setSelectedIdx(i)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    active ? 'bg-indigo-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl ${sc.bg} border ${sc.border} flex items-center justify-center text-lg shrink-0`}
                  >
                    {SKILL_ICONS[i] ?? '⭐'}
                  </div>
                  <p
                    className={`flex-1 text-xs font-medium leading-snug ${
                      active ? 'text-indigo-700' : 'text-gray-700'
                    }`}
                  >
                    {c.name}
                  </p>
                  <span className={`text-sm font-bold shrink-0 ${sc.text}`}>{c.score}</span>
                </button>
              )
            })}
          </div>

          {/* Detail panel */}
          <div className="flex-1 overflow-y-auto px-8 py-6">
            {selected && (
              <div className="max-w-2xl">

                <div className="flex items-start justify-between gap-4 mb-5">
                  <h2 className="text-xl font-bold text-gray-900">{selected.name}</h2>
                  <div
                    className={`shrink-0 w-12 h-12 rounded-xl border-2 ${scoreCol(selected.score).bg} ${scoreCol(selected.score).border} flex items-center justify-center`}
                  >
                    <span className={`text-base font-bold ${scoreCol(selected.score).text}`}>
                      {selected.score}
                    </span>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl px-4 py-4 mb-6">
                  <p className="text-sm text-gray-700 leading-relaxed">{selected.comment}</p>
                </div>

                {evaluation.top_errors?.length > 0 && (
                  <>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                      Топ ошибки сессии
                    </p>
                    <div className="space-y-3 mb-6">
                      {evaluation.top_errors.map((err, i) => (
                        <div key={i} className="bg-white rounded-xl overflow-hidden flex">
                          <div className="w-1 bg-red-400 shrink-0" />
                          <div className="flex-1 px-4 py-4">
                            <p className="text-sm font-semibold text-red-600 mb-1.5">{err.title}</p>
                            <p className="text-sm text-gray-500 mb-3 leading-relaxed">{err.what}</p>
                            <div className="bg-green-50 border border-green-100 rounded-lg px-3 py-2.5">
                              <p className="text-xs font-semibold text-green-700 mb-1">Как улучшить</p>
                              <p className="text-sm text-green-800 leading-relaxed">{err.how}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {evaluation.priority && (
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">
                    <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wide mb-1">
                      Приоритет на следующую сессию
                    </p>
                    <p className="text-sm text-indigo-800">{evaluation.priority}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
