import { useEffect, useState } from 'react'
import { api, HistoryItem } from '../api'

const LEVEL_COLOR: Record<string, string> = {
  'Новичок':    'text-red-600 bg-red-50 border-red-200',
  'Развивается':'text-amber-600 bg-amber-50 border-amber-200',
  'Уверенный':  'text-blue-600 bg-blue-50 border-blue-200',
  'Профи':      'text-emerald-600 bg-emerald-50 border-emerald-200',
}

interface Props {
  onSelect: (id: number) => void
}

export function HistoryList({ onSelect }: Props) {
  const [items, setItems] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.listHistory()
      .then(setItems)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
      + ' ' + d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 bg-white">
        <h1 className="text-xl font-bold text-gray-900">История тренировок</h1>
        <span className="text-xs text-gray-400">{items.length} сессий</span>
      </div>

      <div className="px-8 py-6">
        {loading && (
          <div className="flex items-center gap-3 text-gray-400 py-12 justify-center">
            <div className="w-5 h-5 border-2 border-gray-300 border-t-indigo-500 rounded-full animate-spin" />
            Загрузка...
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-center text-red-600 text-sm">
            {error}
          </div>
        )}
        {!loading && !error && items.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-gray-400">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm">Пока нет завершённых тренировок</p>
          </div>
        )}
        {!loading && !error && items.length > 0 && (
          <div className="space-y-3 max-w-3xl">
            {items.map(item => (
              <button
                key={item.id}
                onClick={() => onSelect(item.id)}
                className="w-full card p-4 flex items-center gap-4 hover:shadow-md transition-shadow text-left"
              >
                {/* Score circle */}
                <div className={`w-14 h-14 rounded-full border-2 flex flex-col items-center justify-center shrink-0 ${
                  item.total_score >= 80 ? 'border-emerald-400' : item.total_score >= 60 ? 'border-blue-400' : item.total_score >= 40 ? 'border-amber-400' : 'border-red-400'
                }`}>
                  <span className={`text-lg font-bold leading-none ${
                    item.total_score >= 80 ? 'text-emerald-600' : item.total_score >= 60 ? 'text-blue-600' : item.total_score >= 40 ? 'text-amber-600' : 'text-red-500'
                  }`}>{item.total_score}</span>
                  <span className="text-[10px] text-gray-400">/ 100</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900">{item.patient_name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${LEVEL_COLOR[item.level] ?? LEVEL_COLOR['Развивается']}`}>
                      {item.level}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{item.scenario_title}</p>
                </div>

                {/* Date + arrow */}
                <div className="text-right shrink-0">
                  <p className="text-xs text-gray-400">{formatDate(item.created_at)}</p>
                  <svg className="w-4 h-4 text-gray-300 mt-1 ml-auto" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
