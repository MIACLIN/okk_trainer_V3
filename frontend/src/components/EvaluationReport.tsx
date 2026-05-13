import { EvaluationResult } from '../api'

interface Props {
  result: EvaluationResult
  scenarioTitle: string
  onRestart: () => void
}

function ScoreBadge({ score, max }: { score: number; max: number }) {
  const pct = max > 0 ? Math.round((score / max) * 100) : 0
  const color = pct >= 80 ? 'text-emerald-400' : pct >= 50 ? 'text-amber-400' : 'text-red-400'
  const ring = pct >= 80 ? 'border-emerald-500' : pct >= 50 ? 'border-amber-500' : 'border-red-500'

  return (
    <div className={`w-28 h-28 rounded-full border-4 ${ring} flex flex-col items-center justify-center`}>
      <span className={`text-3xl font-bold ${color}`}>{score}</span>
      <span className="text-navy-400 text-xs">из {max}</span>
      <span className={`text-sm font-medium ${color}`}>{pct}%</span>
    </div>
  )
}

export function EvaluationReport({ result, scenarioTitle, onRestart }: Props) {
  const { total_score, max_score, criteria, overall_feedback } = result

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-navy-800 border border-navy-600 rounded-full px-4 py-1.5 mb-4">
            <span className="text-xs font-medium text-navy-200 tracking-widest uppercase">OKK.PRO</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">Результат тренировки</h2>
          <p className="text-navy-400 text-sm">{scenarioTitle}</p>
        </div>

        {/* Score + feedback */}
        <div className="card p-6 mb-5 flex flex-col sm:flex-row items-center gap-6">
          <ScoreBadge score={total_score} max={max_score} />
          <div className="flex-1">
            <h3 className="text-white font-semibold mb-2">Общая оценка</h3>
            <p className="text-navy-300 text-sm leading-relaxed">{overall_feedback}</p>
          </div>
        </div>

        {/* Checklist breakdown */}
        <div className="card p-5 mb-6">
          <h3 className="text-white font-semibold mb-4">Критерии оценки</h3>
          <div className="space-y-3">
            {criteria.map((c, i) => (
              <div key={i} className={`flex gap-3 p-3 rounded-xl border ${
                c.passed
                  ? 'bg-emerald-950/30 border-emerald-800/50'
                  : 'bg-red-950/30 border-red-900/50'
              }`}>
                <span className="text-lg shrink-0 mt-0.5">{c.passed ? '✅' : '❌'}</span>
                <div>
                  <p className={`text-sm font-medium ${c.passed ? 'text-emerald-300' : 'text-red-300'}`}>
                    {c.name}
                  </p>
                  <p className="text-xs text-navy-400 mt-0.5">{c.comment}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          <button onClick={onRestart} className="btn-primary px-8">
            Выбрать сценарий
          </button>
        </div>
      </div>
    </div>
  )
}
