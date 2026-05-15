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
  if (n >= 7) return { text: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', bar: 'bg-green-500' }
  if (n >= 5) return { text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', bar: 'bg-amber-400' }
  return       { text: 'text-red-500',   bg: 'bg-red-50',   border: 'border-red-200',   bar: 'bg-red-400'   }
}

function totalCol(t: number) {
  if (t >= 70) return scoreCol(7)
  if (t >= 50) return scoreCol(5)
  return scoreCol(0)
}

function ScoreBar({ score }: { score: number }) {
  const c = scoreCol(score)
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${c.bar}`} style={{ width: `${score * 10}%` }} />
      </div>
      <span className={`text-xs font-bold w-8 text-right tabular-nums ${c.text}`}>{score}/10</span>
    </div>
  )
}

export function EvaluationView({
  evaluation, patientName, scenarioTitle, createdAt, onRetry, transcript,
}: Props) {
  const [selectedIdx, setSelectedIdx]     = useState(0)
  const [showTranscript, setShowTranscript] = useState(false)

  const displayScore = (evaluation.total_score / 10).toFixed(1)
  const mc       = totalCol(evaluation.total_score)
  const selected = evaluation.criteria[selectedIdx]
  const sc       = scoreCol(selected?.score ?? 0)

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">

      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-100 shrink-0">
        <div className="max-w-[1400px] mx-auto px-8 py-6">
          <div className="flex items-start gap-5">

            <div className={`w-[68px] h-[68px] rounded-2xl ${mc.bg} border ${mc.border} flex items-center justify-center shrink-0`}>
              <span className={`text-[28px] font-black leading-none ${mc.text}`}>{displayScore}</span>
            </div>

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

          {evaluation.strengths && (
            <div className="mt-5 bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 flex gap-3">
              <span className="text-gray-300 shrink-0 mt-0.5 text-sm">✦</span>
              <div>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Общая рекомендация
                </p>
                <p className="text-sm text-gray-700 leading-relaxed">{evaluation.strengths}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      {showTranscript ? (
        <div className="flex-1 overflow-y-auto py-8">
          <div className="max-w-2xl mx-auto px-6 space-y-3">
            {transcript?.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-gray-900 text-white rounded-br-md'
                    : 'bg-gray-50 border border-gray-200 text-gray-700 rounded-bl-md'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden max-w-[1400px] mx-auto w-full">

          {/* ── Col 1: Skills list ── */}
          <div className="w-64 shrink-0 border-r border-gray-100 overflow-y-auto bg-gray-50/40">
            <p className="px-6 pt-6 pb-3 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
              Навыки
            </p>
            {evaluation.criteria.map((c, i) => {
              const cs     = scoreCol(c.score)
              const active = selectedIdx === i
              return (
                <button
                  key={i}
                  onClick={() => setSelectedIdx(i)}
                  className={`w-full flex items-center gap-3.5 px-5 py-4 text-left transition-all border-l-2 ${
                    active
                      ? 'bg-white border-gray-900'
                      : 'border-transparent hover:bg-white/80 hover:border-gray-200'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-2xl ${cs.bg} border ${cs.border} flex items-center justify-center shrink-0`}>
                    <span className={`text-sm font-black ${cs.text}`}>{c.score}</span>
                  </div>
                  <p className={`flex-1 text-xs leading-snug ${
                    active ? 'text-gray-900 font-semibold' : 'text-gray-500 font-medium'
                  }`}>
                    {c.name}
                  </p>
                </button>
              )
            })}
          </div>

          {/* ── Col 2: Criterion detail ── */}
          <div className="flex-1 overflow-y-auto px-10 py-8 min-w-0 bg-white">
            {selected && (
              <div className="max-w-lg space-y-4">

                {/* Score */}
                <div className="bg-white border border-gray-200 rounded-2xl px-6 py-6">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-base font-bold text-gray-900 leading-snug pr-4">{selected.name}</h2>
                    <div className={`shrink-0 flex items-center gap-1 px-4 py-2 rounded-xl ${sc.bg} border ${sc.border}`}>
                      <span className={`text-2xl font-black tabular-nums ${sc.text}`}>{selected.score}</span>
                      <span className={`text-sm ${sc.text} opacity-50`}>/10</span>
                    </div>
                  </div>
                  <ScoreBar score={selected.score} />
                </div>

                {/* Comment */}
                <div className="bg-white border border-gray-200 rounded-2xl px-6 py-5">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Комментарий
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed">{selected.comment}</p>
                </div>

                {/* Recommendation */}
                {evaluation.priority && (
                  <div className="bg-gray-900 rounded-2xl px-6 py-5">
                    <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider mb-3">
                      Рекомендация
                    </p>
                    <p className="text-sm text-white leading-relaxed">{evaluation.priority}</p>
                  </div>
                )}

              </div>
            )}
          </div>

          {/* ── Col 3: Top errors (fixed right) ── */}
          <div className="w-72 shrink-0 border-l border-gray-100 overflow-y-auto px-6 py-6 bg-white">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-5">
              Главные ошибки сессии
            </p>

            {evaluation.top_errors?.length > 0 ? (
              <div className="space-y-4">
                {evaluation.top_errors.map((err, i) => (
                  <div key={i} className="rounded-2xl border border-gray-100 bg-gray-50 overflow-hidden">
                    <div className="flex">
                      <div className="w-1 bg-red-400 shrink-0 rounded-l-2xl" />
                      <div className="flex-1 px-4 py-4 space-y-3">

                        <div className="flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-red-100 text-red-500 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <p className="text-xs font-bold text-gray-900 leading-snug">{err.title}</p>
                        </div>

                        <p className="text-xs text-gray-500 leading-relaxed pl-7">{err.what}</p>

                        <div className="ml-7 bg-green-50 border border-green-100 rounded-xl px-3 py-2.5">
                          <p className="text-[10px] font-semibold text-green-700 uppercase tracking-wider mb-1">
                            Как улучшить
                          </p>
                          <p className="text-xs text-green-800 leading-relaxed">{err.how}</p>
                        </div>

                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400">Ошибки не выявлены</p>
            )}
          </div>

        </div>
      )}
    </div>
  )
}
