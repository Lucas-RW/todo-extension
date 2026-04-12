// Plasmo background service worker.
// Keeps the extension badge updated with minutes remaining on the nearest active timer.

const STORAGE_KEY = "todo_timers"
const ALARM_NAME = "timer-badge-refresh"

async function refreshBadge(): Promise<void> {
  const result = await chrome.storage.local.get(STORAGE_KEY)
  const timers: Record<string, { endsAt: number }> = result[STORAGE_KEY] ?? {}

  const now = Date.now()
  const remaining = Object.values(timers)
    .map((t) => t.endsAt - now)
    .filter((r) => r > 0)

  if (remaining.length === 0) {
    chrome.action.setBadgeText({ text: "" })
    return
  }

  const earliest = Math.min(...remaining)
  const minsLeft = Math.ceil(earliest / 60_000)
  chrome.action.setBadgeText({ text: `${minsLeft}m` })
  chrome.action.setBadgeBackgroundColor({ color: "#6366f1" })
}

// Create the recurring alarm once on install / update.
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create(ALARM_NAME, { periodInMinutes: 1 })
})

// Refresh badge every minute (catches expirations while popup is closed).
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) refreshBadge()
})

// Also refresh immediately whenever the popup writes new timer data.
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && STORAGE_KEY in changes) {
    refreshBadge()
  }
})

export {}
