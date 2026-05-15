import { useEffect, useState } from 'react'
import { api, HistoryItem } from '../api'

interface Props {
  onSelect: (id: number) => void
}

function scoreCol(t: number) {
  if (t >= 70) return { text: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' }
  if (t >= 50) return { text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' }
  return { text: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100' }
}

function groupByDate(items: HistoryItem[]): { label: string; items: HistoryItem[] }[] {
  const now = new Date()
  const today = now.toDateString()
  const yesterday = new Date(now.getTime() - 86_400_000).toDateString()
  const map = new Map<string, HistoryItem[]>()

  for (const item of items) {
    const d = new Date(item.created_at)
    const ds = d.toDateString()
    const label =
      ds === today     ? 'Сегодня' :
      ds === yesterday ? 'Вчера'   :
      d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
    if (!map.has(label)) map.set(label, [])
    map.get(label)!.push(item)
  }

  return Array.from(map.entries()).map(([label, items]) => ({ label, items }))
}

export function HistoryList({ onSelect }: Props) {
  const [items, setItems]   = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState<string | null>(null)

  useEffect(() => {
    api.listHistory()
      .then(setItems)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const groups = groupByDate(items)

  const fmt = (iso: string) =>
    new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="flex items-center justify-between px-4 sm:px-8 py-4 sm:py-5 border-b border-gray-100 bg-white">
        <h1 className="text-xl font-bold text-gray-900">Мои тренировки</h1>
        <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full font-medium">
          {items.length}
        </span>
      </div>

      <div className="px-4 sm:px-8 py-6 sm:py-8 max-w-3xl mx-auto w-full">
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
          <div className="flex flex-col items-center gap-3 py-20 text-gray-400">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm">Пока нет завершённых тренировок</p>
            <p className="text-xs text-gray-300">Завершите первую сессию и она появится здесь</p>
          </div>
        )}

        {!loading && !error && groups.map(group => (
          <div key={group.label} className="mb-8">
            <h2 className="text-base font-bold text-gray-900 mb-3">{group.label}</h2>
            <div className="space-y-2">
              {group.items.map(item => {
                const sc = scoreCol(item.total_score)
                const display = (item.total_score / 10).toFixed(1)
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelect(item.id)}
                    className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3.5 flex items-center gap-4 hover:border-gray-200 hover:shadow-sm transition-all text-left"
                  >
                    <div
                      className={`w-12 h-12 rounded-xl ${sc.bg} border ${sc.border} flex items-center justify-center shrink-0`}
                    >
                      <span className={`text-base font-black ${sc.text}`}>{display}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">{item.patient_name}</p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{item.scenario_title}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-xs text-gray-400">{fmt(item.created_at)}</p>
                      <span className={`text-xs font-medium ${sc.text}`}>{item.level}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
