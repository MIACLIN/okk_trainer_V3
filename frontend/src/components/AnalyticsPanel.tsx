import { useState } from 'react'
import { EvaluationResult } from '../api'

interface Props {
  checklist: string[]
  evaluation: EvaluationResult | null
  isEvaluating: boolean
}

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

export function AnalyticsPanel({ checklist, evaluation, isEvaluating }: Props) {
  const [openError, setOpenError] = useState<number | null>(null)

  return (
    <div className="w-72 shrink-0 border-l border-gray-100 bg-white flex flex-col">
      <div className="px-5 py-4 border-b border-gray-100 shrink-0">
        <h3 className="font-semibold text-gray-900 text-sm">Аналитика разговора</h3>
        {!evaluation && (
          <p className="text-xs text-gray-400 mt-0.5">Оценка навыков обновится после завершения</p>
        )}
      </div>

      {/* Loading */}
      {isEvaluating && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-400">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-xs">Анализируем разговор...</p>
        </div>
      )}

      {/* Empty state */}
      {!evaluation && !isEvaluating && (
        <div className="flex-1 flex flex-col px-5 py-4 gap-3 overflow-y-auto">
          <div className="flex flex-col items-center gap-2 py-4 text-gray-300">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
            <p className="text-xs text-center text-gray-400">Начните диалог с пациентом — оценка появится после завершения</p>
          </div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Критерии оценки</p>
          <div className="space-y-2">
            {checklist.map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-gray-200 shrink-0 flex items-center justify-center text-[9px] text-gray-400">{i + 1}</span>
                <span className="text-xs text-gray-400 leading-tight">{c}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-3 text-xs text-gray-400 border-t border-gray-100 pt-3 justify-center">
            <span className="font-medium text-gray-600">Общий балл</span>
            <span>Навык</span>
            <span>Рекомендации</span>
          </div>
        </div>
      )}

      {/* Results */}
      {evaluation && !isEvaluating && (
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
          {/* Score header */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <div className="text-center">
              <p className={`text-3xl font-bold ${
                evaluation.total_score >= 80 ? 'text-emerald-600'
                : evaluation.total_score >= 60 ? 'text-blue-600'
                : evaluation.total_score >= 40 ? 'text-amber-600'
                : 'text-red-500'
              }`}>{evaluation.total_score}</p>
              <p className="text-xs text-gray-400">из 100</p>
            </div>
            <div className="flex-1">
              <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full border ${LEVEL_COLOR[evaluation.level] ?? LEVEL_COLOR['Развивается']}`}>
                {evaluation.level}
              </span>
              <div className="mt-1.5 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    evaluation.total_score >= 80 ? 'bg-emerald-400'
                    : evaluation.total_score >= 60 ? 'bg-blue-400'
                    : evaluation.total_score >= 40 ? 'bg-amber-400'
                    : 'bg-red-400'
                  }`}
                  style={{ width: `${evaluation.total_score}%` }}
                />
              </div>
            </div>
          </div>

          {/* Criteria */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Критерии</p>
            <div className="space-y-2">
              {evaluation.criteria.map((c, i) => (
                <div key={i} className="group">
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

          {/* Top-3 errors */}
          {evaluation.top_errors?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Топ-3 ошибки</p>
              <div className="space-y-2">
                {evaluation.top_errors.map((err, i) => (
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

          {/* Strengths */}
          {evaluation.strengths && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
              <p className="text-xs font-semibold text-emerald-700 mb-1">Что получилось хорошо</p>
              <p className="text-xs text-emerald-600 leading-relaxed">{evaluation.strengths}</p>
            </div>
          )}

          {/* Priority */}
          {evaluation.priority && (
            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
              <p className="text-xs font-semibold text-indigo-700 mb-1">Приоритет на следующую сессию</p>
              <p className="text-xs text-indigo-600 leading-relaxed">{evaluation.priority}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
