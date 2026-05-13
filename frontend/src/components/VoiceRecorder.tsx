import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { audioBufferToBase64 } from '../api'

export interface VoiceRecorderRef {
  startAutoRecording: () => void
}

interface Props {
  onRecordingComplete: (audioBase64: string) => void
  onRecordingStart?: () => void
  disabled: boolean
}

export const VoiceRecorder = forwardRef<VoiceRecorderRef, Props>(
  ({ onRecordingComplete, onRecordingStart, disabled }, ref) => {
    const [isRecording, setIsRecording] = useState(false)
    const mrRef      = useRef<MediaRecorder | null>(null)
    const chunksRef  = useRef<Blob[]>([])
    const streamRef  = useRef<MediaStream | null>(null)
    const audioCtxRef = useRef<AudioContext | null>(null)
    const rafRef     = useRef<number>(0)

    const stopMic = useCallback(() => {
      cancelAnimationFrame(rafRef.current)
      if (mrRef.current?.state === 'recording') mrRef.current.stop()
      audioCtxRef.current?.close().catch(() => {})
      audioCtxRef.current = null
      setIsRecording(false)
    }, [])

    const startMic = useCallback(async (useVAD: boolean) => {
      if (disabled) return
      if (mrRef.current?.state === 'recording') return
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        streamRef.current = stream
        const mr = new MediaRecorder(stream)
        mrRef.current = mr
        chunksRef.current = []

        mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
        mr.onstop = async () => {
          const blob = new Blob(chunksRef.current, { type: mr.mimeType || 'audio/webm' })
          stream.getTracks().forEach(t => t.stop())
          streamRef.current = null
          const b64 = await audioBufferToBase64(blob)
          onRecordingComplete(b64)
        }

        mr.start()
        setIsRecording(true)
        onRecordingStart?.()

        if (useVAD) {
          const audioCtx = new AudioContext()
          audioCtxRef.current = audioCtx
          const analyser = audioCtx.createAnalyser()
          analyser.fftSize = 512
          audioCtx.createMediaStreamSource(stream).connect(analyser)
          const data = new Uint8Array(analyser.frequencyBinCount)

          let spokenMs = 0
          let silenceMs = 0
          let last = Date.now()

          const tick = () => {
            const now = Date.now()
            const dt = now - last; last = now
            analyser.getByteFrequencyData(data)
            const rms = Math.sqrt(data.reduce((s, v) => s + v * v, 0) / data.length)

            if (rms > 10) { spokenMs += dt; silenceMs = 0 }
            else if (spokenMs > 400) { silenceMs += dt }

            if ((spokenMs > 400 && silenceMs > 1800) || spokenMs > 30000) {
              if (mrRef.current?.state === 'recording') mrRef.current.stop()
              audioCtx.close().catch(() => {})
              audioCtxRef.current = null
              setIsRecording(false)
              return
            }
            rafRef.current = requestAnimationFrame(tick)
          }
          setTimeout(() => { rafRef.current = requestAnimationFrame(tick) }, 300)
        }
      } catch {
        alert('Не удалось получить доступ к микрофону. Проверьте разрешения браузера.')
      }
    }, [disabled, onRecordingComplete, onRecordingStart])

    useImperativeHandle(ref, () => ({
      startAutoRecording: () => startMic(true),
    }), [startMic])

    // Spacebar push-to-talk (fallback)
    useEffect(() => {
      const down = (e: KeyboardEvent) => {
        if (e.code === 'Space' && !e.repeat && !disabled && mrRef.current?.state !== 'recording') {
          e.preventDefault(); startMic(false)
        }
      }
      const up = (e: KeyboardEvent) => {
        if (e.code === 'Space') { e.preventDefault(); stopMic() }
      }
      window.addEventListener('keydown', down)
      window.addEventListener('keyup', up)
      return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
    }, [disabled, startMic, stopMic])

    useEffect(() => () => {
      cancelAnimationFrame(rafRef.current)
      streamRef.current?.getTracks().forEach(t => t.stop())
      audioCtxRef.current?.close().catch(() => {})
    }, [])

    return (
      <button
        onMouseDown={() => startMic(false)}
        onMouseUp={stopMic}
        onTouchStart={e => { e.preventDefault(); startMic(false) }}
        onTouchEnd={e => { e.preventDefault(); stopMic() }}
        disabled={disabled}
        className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 select-none focus:outline-none
          ${disabled
            ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
            : isRecording
              ? 'bg-red-500 text-white scale-110 shadow-lg shadow-red-200'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-pointer'
          }`}
      >
        {isRecording
          ? <span className="w-3 h-3 rounded-sm bg-white" />
          : <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 1a4 4 0 0 1 4 4v7a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" strokeWidth={2} stroke="currentColor" fill="none" strokeLinecap="round"/>
              <line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" strokeWidth={2} strokeLinecap="round"/>
              <line x1="8"  y1="23" x2="16" y2="23" stroke="currentColor" strokeWidth={2} strokeLinecap="round"/>
            </svg>
        }
        {isRecording && <span className="absolute inset-0 rounded-full bg-red-400 opacity-30 animate-ping" />}
      </button>
    )
  }
)
