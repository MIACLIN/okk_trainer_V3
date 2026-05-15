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

function scoreCol(n: number) {
  if (n >= 7) return { text: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-200',  bar: 'bg-green-500'  }
  if (n >= 5) return { text: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-200',  bar: 'bg-amber-400'  }
  return           { text: 'text-red-500',    bg: 'bg-red-50',    border: 'border-red-200',    bar: 'bg-red-400'    }
}

function totalCol(t: number) {
  if (t >= 70) return scoreCol(7)
  if (t >= 50) return scoreCol(5)
  return scoreCol(0)
}

function ScoreBar({ score }: { score: number }) {
  const c = scoreCol(score)
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${c.bar}`} style={{ width: `${score * 10}%` }} />
      </div>
      <span className={`text-xs font-bold w-4 text-right ${c.text}`}>{score}</span>
    </div>
  )
}

export function EvaluationView({
  evaluation, patientName, scenarioTitle, createdAt, onRetry, transcript,
}: Props) {
  const [selectedIdx, setSelectedIdx]   = useState(0)
  const [showTranscript, setShowTranscript] = useState(false)

  const displayScore = (evaluation.total_score / 10).toFixed(1)
  const mc      = totalCol(evaluation.total_score)
  const selected = evaluation.criteria[selectedIdx]
  const sc       = scoreCol(selected?.score ?? 0)

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#f7f7f8]">

      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-100 px-8 py-6 shrink-0">
        <div className="flex items-start gap-5">

          {/* Score */}
          <div className={`w-[72px] h-[72px] rounded-2xl ${mc.bg} border ${mc.border} flex items-center justify-center shrink-0`}>
            <span className={`text-3xl font-black leading-none ${mc.text}`}>{displayScore}</span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 pt-0.5">
            {createdAt && <p className="text-xs text-gray-400 mb-1 font-medium">{createdAt}</p>}
            <h1 className="text-2xl font-bold text-gray-900 leading-tight truncate">
              {patientName ?? 'Тренировка'}
            </h1>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {scenarioTitle && (
                <span className="text-xs text-gray-500 font-medium">{scenarioTitle}</span>
              )}
              <span className="text-xs bg-gray-100 text-gray-600 font-semibold px-2.5 py-0.5 rounded-full">
                {evaluation.level}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0 pt-0.5">
            {transcript && transcript.length > 0 && (
              <button
                onClick={() => setShowTranscript(v => !v)}
                className={`text-sm px-4 py-2 rounded-full border font-medium transition-colors ${
                  showTranscript
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'border-gray-200 text-gray-600 hover:border-gray-400 hover:text-gray-900'
                }`}
              >
                {showTranscript ? 'Аналитика' : 'Диалог'}
              </button>
            )}
            {onRetry && (
              <button
                onClick={onRetry}
                className="text-sm px-4 py-2 rounded-full bg-gray-900 text-white font-semibold hover:bg-gray-800 transition-colors"
              >
                Тренироваться снова
              </button>
            )}
          </div>
        </div>

        {/* Recommendation */}
        {evaluation.strengths && (
          <div className="mt-5 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 flex gap-3">
            <span className="text-gray-400 shrink-0 mt-0.5 text-sm">✦</span>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Общая рекомендация
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">{evaluation.strengths}</p>
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
                <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-gray-900 text-white rounded-br-md'
                    : 'bg-white border border-gray-200 text-gray-700 rounded-bl-md'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">

          {/* ── Left: skills list ── */}
          <div className="w-60 xl:w-64 shrink-0 border-r border-gray-100 bg-white overflow-y-auto">
            <p className="px-5 pt-5 pb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
              Навыки
            </p>

            {evaluation.criteria.map((c, i) => {
              const cs     = scoreCol(c.score)
              const active = selectedIdx === i
              return (
                <button
                  key={i}
                  onClick={() => setSelectedIdx(i)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all border-l-2 ${
                    active
                      ? 'bg-gray-50 border-gray-900'
                      : 'border-transparent hover:bg-gray-50 hover:border-gray-200'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg ${cs.bg} border ${cs.border} flex items-center justify-center shrink-0`}>
                    <span className={`text-xs font-black ${cs.text}`}>{c.score}</span>
                  </div>
                  <p className={`flex-1 text-xs leading-snug ${
                    active ? 'text-gray-900 font-semibold' : 'text-gray-600 font-medium'
                  }`}>
                    {c.name}
                  </p>
                </button>
              )
            })}
          </div>

          {/* ── Right: detail ── */}
          <div className="flex-1 overflow-y-auto px-8 py-7">
            {selected && (
              <div className="max-w-2xl space-y-6">

                {/* Criterion header */}
                <div>
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h2 className="text-xl font-bold text-gray-900 leading-tight">{selected.name}</h2>
                    <div className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${sc.bg} border ${sc.border}`}>
                      <span className={`text-lg font-black ${sc.text}`}>{selected.score}</span>
                      <span className={`text-xs font-medium ${sc.text} opacity-60`}>/10</span>
                    </div>
                  </div>
                  <ScoreBar score={selected.score} />
                </div>

                {/* Comment */}
                <div className="bg-white border border-gray-200 rounded-xl px-5 py-4">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Комментарий
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed">{selected.comment}</p>
                </div>

                {/* Top errors */}
                {evaluation.top_errors?.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
                      Главные ошибки сессии
                    </p>
                    <div className="space-y-3">
                      {evaluation.top_errors.map((err, i) => (
                        <div key={i} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                          <div className="flex">
                            <div className="w-1 bg-red-400 shrink-0 rounded-l-xl" />
                            <div className="flex-1 px-5 py-4 space-y-3">
                              <div className="flex items-start gap-2">
                                <span className="w-5 h-5 rounded-full bg-red-100 text-red-600 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                  {i + 1}
                                </span>
                                <p className="text-sm font-semibold text-gray-900 leading-snug">{err.title}</p>
                              </div>

                              <p className="text-sm text-gray-500 leading-relaxed pl-7">{err.what}</p>

                              <div className="ml-7 bg-green-50 border border-green-100 rounded-lg px-4 py-3">
                                <p className="text-[11px] font-semibold text-green-700 uppercase tracking-wider mb-1.5">
                                  Как улучшить
                                </p>
                                <p className="text-sm text-green-800 leading-relaxed">{err.how}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Priority */}
                {evaluation.priority && (
                  <div className="bg-gray-900 rounded-xl px-5 py-4">
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                      Приоритет на следующую сессию
                    </p>
                    <p className="text-sm text-white leading-relaxed">{evaluation.priority}</p>
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
