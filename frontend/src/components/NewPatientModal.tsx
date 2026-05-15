import { useRef, useState } from 'react'
import { api, DISC_META } from '../api'

interface Props {
  onCreated: (scenarioId: string, avatarUrl: string, name: string, discType: string) => void
  onClose: () => void
}

const DISC_OPTIONS = [
  { value: 'D', label: 'D — Доминирующий' },
  { value: 'I', label: 'I — Влияющий' },
  { value: 'S', label: 'S — Стабильный' },
  { value: 'C', label: 'C — Добросовестный' },
]

export function NewPatientModal({ onCreated, onClose }: Props) {
  const [name, setName]           = useState('')
  const [gender, setGender]       = useState('female')
  const [discType, setDiscType]   = useState('D')
  const [reason, setReason]       = useState('')
  const [hiddenNeed, setHidden]   = useState('')
  const [opening, setOpening]     = useState('')
  const [avatarUrl, setAvatar]    = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setAvatar(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSubmit = async () => {
    if (!name.trim() || !reason.trim() || !hiddenNeed.trim() || !opening.trim()) {
      setError('Заполните все обязательные поля')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await api.createPatient({ name, gender, disc_type: discType, reason, hidden_need: hiddenNeed, opening_line: opening })
      onCreated(res.scenario_id, avatarUrl, name, discType)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const disc = DISC_META[discType]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-modal w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Новый пациент</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Пациент</p>

          {/* Avatar */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Аватар</p>
            <div
              className="flex items-center gap-4 cursor-pointer"
              onClick={() => fileRef.current?.click()}
            >
              <div className="w-14 h-14 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden shrink-0 hover:border-indigo-400 transition-colors">
                {avatarUrl
                  ? <img src={avatarUrl} className="w-full h-full object-cover" alt="avatar" />
                  : <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                    </svg>
                }
              </div>
              <div>
                <span className="text-sm text-indigo-600 font-medium">Выбрать файл</span>
                <p className="text-xs text-gray-400 mt-0.5">JPG, PNG, до 5 МБ</p>
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Название <span className="text-red-400">*</span></label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Имя и фамилия пациента"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent"
            />
          </div>

          {/* Gender + DISC */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Пол</label>
              <select
                value={gender}
                onChange={e => setGender(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
              >
                <option value="female">Женский</option>
                <option value="male">Мужской</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Тип характера</label>
              <select
                value={discType}
                onChange={e => setDiscType(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
              >
                {DISC_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-xs font-medium text-gray-600">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
            {disc.label}
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Причина обращения <span className="text-red-400">*</span>
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Что привело пациента в клинику (показывается пользователю)"
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
            />
          </div>

          {/* Hidden need */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Скрытая потребность <span className="text-red-400">*</span>
            </label>
            <textarea
              value={hiddenNeed}
              onChange={e => setHidden(e.target.value)}
              placeholder="Настоящая потребность пациента (не показывается пользователю)"
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
            />
          </div>

          {/* Opening line */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Первая реплика <span className="text-red-400">*</span>
            </label>
            <textarea
              value={opening}
              onChange={e => setOpening(e.target.value)}
              placeholder="Что скажет пациент при начале разговора"
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
            />
          </div>

          {error && <p className="text-red-500 text-xs">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="btn flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 py-2.5">
            Отмена
          </button>
          <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1 py-2.5">
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : 'Создать'}
          </button>
        </div>
      </div>
    </div>
  )
}
