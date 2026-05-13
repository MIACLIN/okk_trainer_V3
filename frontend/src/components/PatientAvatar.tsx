type Status = 'idle' | 'listening' | 'thinking' | 'speaking'

interface Props {
  name: string
  status: Status
}

const STATUS_LABEL: Record<Status, string> = {
  idle: 'Ожидает',
  listening: 'Слушает вас...',
  thinking: 'Думает...',
  speaking: 'Говорит...',
}

const STATUS_COLOR: Record<Status, string> = {
  idle: 'bg-navy-600',
  listening: 'bg-blue-500',
  thinking: 'bg-amber-500',
  speaking: 'bg-emerald-500',
}

export function PatientAvatar({ name, status }: Props) {
  const isSpeaking = status === 'speaking'
  const isListening = status === 'listening'

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Avatar ring */}
      <div className="relative">
        {(isSpeaking || isListening) && (
          <div
            className={`absolute inset-0 rounded-full ${STATUS_COLOR[status]} opacity-30 animate-pulse_ring`}
            style={{ margin: '-8px' }}
          />
        )}
        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl
          bg-navy-800 border-2 ${isSpeaking ? 'border-emerald-500' : isListening ? 'border-blue-500' : 'border-navy-600'} transition-colors duration-300`}>
          👤
        </div>
      </div>

      {/* Name + status */}
      <div className="text-center">
        <p className="text-sm font-semibold text-white">{name}</p>
        <div className="flex items-center justify-center gap-1.5 mt-0.5">
          <span className={`w-1.5 h-1.5 rounded-full ${STATUS_COLOR[status]} transition-colors duration-300`} />
          <span className="text-xs text-navy-400">{STATUS_LABEL[status]}</span>
        </div>
      </div>

      {/* Waveform bars when speaking */}
      {isSpeaking && (
        <div className="flex items-end gap-0.5 h-5">
          {[1, 2, 3, 4, 5].map(i => (
            <div
              key={i}
              className="wave-bar w-1 bg-emerald-400 rounded-full animate-wave"
              style={{ height: `${12 + (i % 3) * 6}px` }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
