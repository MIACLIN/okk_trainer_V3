interface Props {
  checklist: string[]
  isEvaluating: boolean
}

export function AnalyticsPanel({ checklist, isEvaluating }: Props) {
  return (
    <div className="w-64 shrink-0 border-l border-gray-100 bg-white flex flex-col">
      <div className="px-5 py-4 border-b border-gray-100 shrink-0">
        <h3 className="font-semibold text-gray-800 text-sm">Критерии оценки</h3>
        <p className="text-xs text-gray-400 mt-0.5">Оценка появится после завершения</p>
      </div>

      {isEvaluating ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-xs font-medium text-gray-600">Анализируем разговор...</p>
          <p className="text-[11px] text-gray-400 text-center px-4 leading-relaxed">
            Это займёт около 10–15 секунд
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="space-y-0.5">
            {checklist.map((item, i) => (
              <div key={i} className="flex items-center gap-3 py-2">
                <div className="w-6 h-6 rounded-full border-2 border-gray-200 flex items-center justify-center shrink-0">
                  <span className="text-[10px] text-gray-400 font-semibold">{i + 1}</span>
                </div>
                <span className="text-xs text-gray-500 leading-snug">{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
