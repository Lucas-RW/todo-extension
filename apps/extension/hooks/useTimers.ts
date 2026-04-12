import { useCallback, useEffect, useState } from "react"

const STORAGE_KEY = "todo_timers"

interface TimerEntry {
  endsAt: number // epoch ms
}

type TimerStore = Record<string, TimerEntry>

function readTimers(): Promise<TimerStore> {
  return new Promise((resolve) => {
    chrome.storage.local.get(STORAGE_KEY, (result) => {
      resolve((result[STORAGE_KEY] as TimerStore) ?? {})
    })
  })
}

function writeTimers(timers: TimerStore): void {
  chrome.storage.local.set({ [STORAGE_KEY]: timers })
}

export function useTimers() {
  const [timers, setTimers] = useState<TimerStore>({})
  const [now, setNow] = useState(() => Date.now())

  // Load persisted timers on mount.
  useEffect(() => {
    readTimers().then(setTimers)
  }, [])

  // Tick every second so countdown displays stay current.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const setTimer = useCallback((taskId: string, minutes: number) => {
    const endsAt = Date.now() + minutes * 60_000
    setTimers((prev) => {
      const next = { ...prev, [taskId]: { endsAt } }
      writeTimers(next)
      return next
    })
  }, [])

  const clearTimer = useCallback((taskId: string) => {
    setTimers((prev) => {
      const next = { ...prev }
      delete next[taskId]
      writeTimers(next)
      return next
    })
  }, [])

  // Extend an existing timer (or restart it if already expired).
  const addTime = useCallback((taskId: string, minutes: number) => {
    setTimers((prev) => {
      const existing = prev[taskId]
      const base =
        existing && existing.endsAt > Date.now() ? existing.endsAt : Date.now()
      const endsAt = base + minutes * 60_000
      const next = { ...prev, [taskId]: { endsAt } }
      writeTimers(next)
      return next
    })
  }, [])

  const getTimerInfo = useCallback(
    (taskId: string): { expired: boolean; minsLeft: number } | null => {
      const entry = timers[taskId]
      if (!entry) return null
      const msLeft = entry.endsAt - now
      const expired = msLeft <= 0
      return { expired, minsLeft: expired ? 0 : Math.ceil(msLeft / 60_000) }
    },
    [timers, now]
  )

  return { setTimer, clearTimer, addTime, getTimerInfo }
}
