import { patientPhotoUrl, ScenarioInfo } from '../api'

interface Props {
  scenario: ScenarioInfo
  onStart: () => void
  onClose: () => void
  loading: boolean
}

export function PatientDetailModal({ scenario: s, onStart, onClose, loading }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-modal w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900 pr-4">
            {s.patient_name}, {s.patient_age} лет. {s.patient_profession}
          </h2>
          <button onClick={onClose} className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5">
          {/* Patient row */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Пациент</p>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <img
                src={s.patient_photo_url || patientPhotoUrl(s.patient_photo_id)}
                alt={s.patient_name}
                className="w-10 h-10 rounded-full object-contain shrink-0 bg-gray-100"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
              <div>
                <p className="font-medium text-gray-900 text-sm">{s.patient_name}, {s.patient_age} лет. {s.patient_profession}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.description}</p>
              </div>
            </div>
          </div>

          {/* Context */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Контекст</p>
            <p className="text-gray-700 text-sm leading-relaxed">{s.context}</p>
          </div>

          {/* Tips */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Советы к прохождению</p>
            <ol className="space-y-2">
              {s.tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 text-xs flex items-center justify-center font-semibold mt-0.5">
                    {i + 1}
                  </span>
                  {tip}
                </li>
              ))}
            </ol>
          </div>

          {/* How it works */}
          <div>
            <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wider mb-3">Как проходит тренировка</p>
            <div className="flex items-center gap-2 justify-center">
              {['Вы говорите', 'ИИ думает', 'Пациент отвечает'].map((step, i, arr) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
                    <span className="text-base">{i === 0 ? '🎤' : i === 1 ? '✨' : '💬'}</span>
                    <span className="text-xs text-gray-600 font-medium">{step}</span>
                  </div>
                  {i < arr.length - 1 && (
                    <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* DISC */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm font-medium text-gray-700">
            <span className="w-2 h-2 rounded-full bg-gray-400" />
            DISC: {s.patient_disc_type}
          </div>

          {/* Opening line */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Первая реплика пациента</p>
            <p className="text-gray-600 text-sm italic leading-relaxed bg-gray-50 rounded-xl px-4 py-3">
              «{s.opening_line}»
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100">
          <button
            onClick={onStart}
            disabled={loading}
            className="btn-primary w-full text-sm py-3"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Подключение...
              </>
            ) : 'Начать выполнение'}
          </button>
        </div>
      </div>
    </div>
  )
}
