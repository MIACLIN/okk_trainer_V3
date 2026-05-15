interface Props {
  screen: string
  onHome: () => void
  onHistory: () => void
  inSession: boolean
}

export function TopNav({ screen, onHome, onHistory, inSession }: Props) {
  const isTraining = screen === 'select' || screen === 'session'
  const isHistory  = screen === 'history' || screen === 'history-detail'

  return (
    <nav className="h-14 bg-white border-b border-gray-100 flex items-center px-6 shrink-0">
      <div className="flex items-center gap-1 flex-1">
        <button
          onClick={onHome}
          disabled={inSession}
          className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full transition-colors ${
            isTraining
              ? 'bg-gray-900 text-white'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
          } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
          </svg>
          Потренироваться
        </button>

        <button
          onClick={onHistory}
          disabled={inSession}
          className={`text-sm px-4 py-2 rounded-full transition-colors ${
            isHistory
              ? 'font-semibold text-gray-900'
              : 'font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100'
          } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          Мои тренировки
        </button>
      </div>

      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center text-white text-xs font-bold shrink-0">
          D
        </div>
        <span className="text-sm font-medium text-gray-700 hidden sm:block">Demo</span>
      </div>
    </nav>
  )
}
