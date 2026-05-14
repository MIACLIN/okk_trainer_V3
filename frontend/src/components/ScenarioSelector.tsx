import { useEffect, useState } from 'react'
import { api, DISC_META, patientPhotoUrl, ScenarioInfo } from '../api'
import { NewPatientModal } from './NewPatientModal'

interface Props {
  onSelect: (scenario: ScenarioInfo) => void
}

export function ScenarioSelector({ onSelect }: Props) {
  const [scenarios, setScenarios] = useState<ScenarioInfo[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [showNew, setShowNew]     = useState(false)
  const [customAvatars, setCustomAvatars] = useState<Record<string, string>>({})

  const load = () => {
    api.listScenarios()
      .then(setScenarios)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleCreated = (scenarioId: string, avatarUrl: string, _name: string, _discType: string) => {
    setShowNew(false)
    setCustomAvatars(prev => ({ ...prev, [scenarioId]: avatarUrl }))
    setLoading(true)
    load()
  }

  const handleDelete = async (scenarioId: string) => {
    try {
      await api.deletePatient(scenarioId)
      setScenarios(prev => prev.filter(s => s.id !== scenarioId))
      setCustomAvatars(prev => { const n = { ...prev }; delete n[scenarioId]; return n })
    } catch (e) {
      alert((e as Error).message)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 bg-white">
        <h1 className="text-xl font-bold text-gray-900">Тренажер</h1>
        <div className="flex items-center gap-5">
          <button onClick={() => setShowNew(true)} className="btn-primary text-sm gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Пациент
          </button>
          <div className="flex text-sm gap-4">
            <span className="font-medium text-gray-900 border-b-2 border-indigo-600 pb-0.5 cursor-default">Рекомендованные</span>
            <span className="text-gray-400">Все</span>
          </div>
        </div>
      </div>

      <div className="px-8 py-6">
        {loading && (
          <div className="flex items-center gap-3 text-gray-400 py-12 justify-center">
            <div className="w-5 h-5 border-2 border-gray-300 border-t-indigo-500 rounded-full animate-spin" />
            Загрузка...
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-center max-w-sm mx-auto">
            <p className="text-red-600 font-medium mb-1">Не удалось загрузить</p>
            <p className="text-red-400 text-xs">{error}</p>
            <p className="text-gray-400 text-xs mt-1">Убедитесь, что бэкенд запущен на порту 8000</p>
          </div>
        )}
        {!loading && !error && (
          <>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Рекомендованные</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {scenarios.map(s => (
                <PatientCard
                  key={s.id}
                  scenario={s}
                  customAvatar={customAvatars[s.id]}
                  onSelect={onSelect}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {showNew && (
        <NewPatientModal
          onCreated={handleCreated}
          onClose={() => setShowNew(false)}
        />
      )}
    </div>
  )
}

function PatientCard({
  scenario: s,
  customAvatar,
  onSelect,
  onDelete,
}: {
  scenario: ScenarioInfo
  customAvatar?: string
  onSelect: (s: ScenarioInfo) => void
  onDelete: (id: string) => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const disc = DISC_META[s.patient_disc_type] ?? DISC_META['S']
  const photoSrc = customAvatar || (s.patient_photo_id > 0 ? patientPhotoUrl(s.patient_photo_id) : null)

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirmDelete) {
      onDelete(s.id)
    } else {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 3000)
    }
  }

  return (
    <div className="card overflow-hidden flex flex-col">
      {/* Photo — object-contain so nothing is cropped */}
      <div className="relative h-56 bg-gray-100 flex items-center justify-center overflow-hidden">
        {photoSrc ? (
          <img
            src={photoSrc}
            alt={s.patient_name}
            className="h-full w-full object-contain"
          />
        ) : (
          <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold border-4 ${disc.bg}`}>
            {s.patient_name.charAt(0)}
          </div>
        )}

        {/* Delete button */}
        {confirmDelete ? (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-white rounded-lg shadow-md px-2 py-1">
            <span className="text-xs text-gray-600 font-medium">Удалить?</span>
            <button
              onClick={handleDelete}
              className="text-xs text-red-600 font-semibold hover:text-red-700 px-1"
            >
              Да
            </button>
            <button
              onClick={e => { e.stopPropagation(); setConfirmDelete(false) }}
              className="text-xs text-gray-400 hover:text-gray-600 px-1"
            >
              Нет
            </button>
          </div>
        ) : (
          <button
            onClick={handleDelete}
            className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-white/80 backdrop-blur shadow-sm flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-white transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1 gap-2.5">
        <div>
          <p className="font-semibold text-gray-900 leading-tight">
            {s.patient_name}{s.patient_age ? `, ${s.patient_age} лет` : ''}{s.patient_profession ? `. ${s.patient_profession}` : ''}
          </p>
          <p className="text-gray-500 text-xs mt-1 leading-relaxed">{s.description}</p>
        </div>

        <span className={`inline-flex items-center gap-1 text-xs font-medium w-fit ${disc.color}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          {s.patient_disc_type}
        </span>

        <span className="self-start text-xs px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 font-medium">
          {s.skill_focus}
        </span>

        <button onClick={() => onSelect(s)} className="btn-primary w-full mt-auto text-sm">
          Запустить
        </button>
      </div>
    </div>
  )
}
