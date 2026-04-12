import { useCallback, useEffect, useRef, useState } from "react"
import { ChevronDown, ChevronRight, Settings, Timer, X } from "lucide-react"

import { useTimers } from "~/hooks/useTimers"
import { useTodos } from "~/hooks/useTodos"
import type { FlatTodo } from "~/hooks/useTodos"

import "./style.css"

// ── TimerArea ─────────────────────────────────────────────────────────────────
// Right-side controls for a single task row. Rendered in three modes:
//   idle      – faint clock icon, visible on row hover/select
//   running   – "Xm ×" countdown with cancel
//   expired   – yellow "Ignore / +min" controls (or the add-time input)

interface TimerAreaProps {
  timerInfo: { expired: boolean; minsLeft: number } | null
  isSelected: boolean
  showSetInput: boolean
  showAddInput: boolean
  inputValue: string
  onSetTimerClick: (e: React.MouseEvent) => void
  onInputChange: (v: string) => void
  onInputKeyDown: (e: React.KeyboardEvent) => void
  onCancel: (e: React.MouseEvent) => void
  onIgnore: (e: React.MouseEvent) => void
  onAddTimeClick: (e: React.MouseEvent) => void
}

function TimerArea({
  timerInfo,
  isSelected,
  showSetInput,
  showAddInput,
  inputValue,
  onSetTimerClick,
  onInputChange,
  onInputKeyDown,
  onCancel,
  onIgnore,
  onAddTimeClick,
}: TimerAreaProps) {
  const isRunning = timerInfo !== null && !timerInfo.expired
  const isExpired = timerInfo?.expired ?? false

  return (
    <div className="flex items-center gap-1 shrink-0">
      {/* ── Expired: Ignore / +min buttons ── */}
      {isExpired && !showAddInput && (
        <>
          <button
            onClick={onIgnore}
            className="text-[10px] leading-none px-1 py-0.5 rounded border border-yellow-300 text-yellow-700 hover:border-yellow-500 hover:text-yellow-900"
          >
            Ignore
          </button>
          <button
            onClick={onAddTimeClick}
            className="text-[10px] leading-none px-1 py-0.5 rounded border border-yellow-300 text-yellow-700 hover:border-yellow-500 hover:text-yellow-900"
          >
            +min
          </button>
        </>
      )}

      {/* ── Expired: add-time input ── */}
      {showAddInput && (
        <div
          className="flex items-center gap-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="number"
            min="1"
            max="999"
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={onInputKeyDown}
            autoFocus
            placeholder="—"
            className="w-10 text-xs border border-yellow-400 rounded px-1 py-0.5 bg-white text-yellow-900 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <span className="text-[10px] text-yellow-600">min</span>
        </div>
      )}

      {/* ── Running: countdown + cancel ── */}
      {isRunning && !showSetInput && (
        <div className="flex items-center gap-0.5">
          <span className="text-[11px] font-medium tabular-nums text-indigo-600">
            {timerInfo!.minsLeft}m
          </span>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X size={9} />
          </button>
        </div>
      )}

      {/* ── Set-timer input ── */}
      {!isExpired && showSetInput && (
        <div
          className="flex items-center gap-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="number"
            min="1"
            max="999"
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={onInputKeyDown}
            autoFocus
            placeholder="—"
            className="w-10 text-xs border border-gray-300 rounded px-1 py-0.5 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <span className="text-[10px] text-gray-400">min</span>
        </div>
      )}

      {/* ── Idle clock icon (shown on hover / when row is selected) ── */}
      {!isExpired && !isRunning && !showSetInput && (
        <button
          onClick={onSetTimerClick}
          className={[
            "text-gray-400 hover:text-gray-600 transition-opacity duration-100",
            isSelected
              ? "opacity-100"
              : "opacity-0 group-hover:opacity-100",
          ].join(" ")}
          aria-label="Set timer"
        >
          <Timer size={11} />
        </button>
      )}
    </div>
  )
}

// ── TaskRow ───────────────────────────────────────────────────────────────────

interface TaskRowProps {
  todo: FlatTodo
  isSelected: boolean
  timerInfo: { expired: boolean; minsLeft: number } | null
  showSetInput: boolean
  showAddInput: boolean
  timerInputValue: string
  onRowFocus: () => void
  onRowKeyDown: (e: React.KeyboardEvent) => void
  onComplete: (e: React.MouseEvent) => void
  onToggleCollapse: (e: React.MouseEvent) => void
  onSetTimerClick: (e: React.MouseEvent) => void
  onTimerInputChange: (v: string) => void
  onTimerInputKeyDown: (e: React.KeyboardEvent) => void
  onTimerCancel: (e: React.MouseEvent) => void
  onTimerIgnore: (e: React.MouseEvent) => void
  onAddTimeClick: (e: React.MouseEvent) => void
}

function TaskRow({
  todo,
  isSelected,
  timerInfo,
  showSetInput,
  showAddInput,
  timerInputValue,
  onRowFocus,
  onRowKeyDown,
  onComplete,
  onToggleCollapse,
  onSetTimerClick,
  onTimerInputChange,
  onTimerInputKeyDown,
  onTimerCancel,
  onTimerIgnore,
  onAddTimeClick,
}: TaskRowProps) {
  const isExpired = timerInfo?.expired ?? false

  return (
    <div
      tabIndex={0}
      onFocus={onRowFocus}
      onKeyDown={onRowKeyDown}
      className={[
        "group flex items-center gap-1.5 px-2 py-2 border-b border-gray-100 min-h-[38px] outline-none",
        "transition-colors duration-150",
        todo.completing ? "opacity-0 duration-300" : "opacity-100",
        isExpired
          ? "bg-yellow-50"
          : isSelected
          ? "bg-blue-50"
          : "hover:bg-gray-50",
      ].join(" ")}
    >
      {/* Indent spacer */}
      {todo.depth > 0 && (
        <div className="shrink-0" style={{ width: todo.depth * 16 }} />
      )}

      {/* Complete / delete button */}
      <button
        onClick={onComplete}
        className={[
          "w-3.5 h-3.5 rounded-full border shrink-0 transition-colors duration-150",
          isExpired
            ? "border-yellow-400 hover:bg-yellow-100"
            : "border-gray-400 hover:border-gray-600 hover:bg-gray-100",
        ].join(" ")}
        aria-label="Complete task"
      />

      {/* Title */}
      <span
        className={[
          "text-sm flex-1 truncate select-none",
          todo.completing
            ? "line-through text-gray-400"
            : isExpired
            ? "text-yellow-800"
            : "text-gray-800",
        ].join(" ")}
      >
        {todo.title}
      </span>

      {/* Timer controls */}
      <TimerArea
        timerInfo={timerInfo}
        isSelected={isSelected}
        showSetInput={showSetInput}
        showAddInput={showAddInput}
        inputValue={timerInputValue}
        onSetTimerClick={onSetTimerClick}
        onInputChange={onTimerInputChange}
        onInputKeyDown={onTimerInputKeyDown}
        onCancel={onTimerCancel}
        onIgnore={onTimerIgnore}
        onAddTimeClick={onAddTimeClick}
      />

      {/* Collapse / expand toggle — only shown for parent tasks */}
      {todo.hasChildren && (
        <button
          onClick={onToggleCollapse}
          className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label={todo.collapsed ? "Expand subtasks" : "Collapse subtasks"}
        >
          {todo.collapsed ? (
            <ChevronRight size={12} />
          ) : (
            <ChevronDown size={12} />
          )}
        </button>
      )}
    </div>
  )
}

// ── NewTaskRow ────────────────────────────────────────────────────────────────

interface NewTaskRowProps {
  value: string
  onChange: (v: string) => void
  onCommit: () => void
  inputRef: React.RefObject<HTMLInputElement>
}

function NewTaskRow({ value, onChange, onCommit, inputRef }: NewTaskRowProps) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-2 min-h-[38px]">
      <div className="w-3.5 h-3.5 rounded-full border border-dashed border-gray-300 shrink-0" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && value.trim()) onCommit()
        }}
        placeholder="New task"
        className="flex-1 text-sm bg-transparent outline-none placeholder:text-gray-300 text-gray-800"
      />
    </div>
  )
}

// ── IndexPopup ────────────────────────────────────────────────────────────────

type TimerMode = { type: "set" | "add"; taskId: string } | null

export default function IndexPopup() {
  const {
    todos,
    loading,
    error,
    addTodo,
    completeTodo,
    toggleCollapse,
    indentTodo,
    unindentTodo,
  } = useTodos()

  const { setTimer, clearTimer, addTime, getTimerInfo } = useTimers()

  const [draftTitle, setDraftTitle] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [timerMode, setTimerMode] = useState<TimerMode>(null)
  const [timerInputValue, setTimerInputValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!loading) inputRef.current?.focus()
  }, [loading])

  const handleCommit = async () => {
    const title = draftTitle.trim()
    if (!title) return
    setDraftTitle("")
    await addTodo({ title })
  }

  // Tab / Shift+Tab on a focused task row indent / unindent it.
  const handleRowKeyDown = useCallback(
    (e: React.KeyboardEvent, todoId: string) => {
      if (e.key === "Tab") {
        e.preventDefault()
        if (e.shiftKey) {
          unindentTodo(todoId)
        } else {
          indentTodo(todoId)
        }
      }
    },
    [indentTodo, unindentTodo]
  )

  // Commit the currently-open timer input (Enter key).
  const commitTimerInput = useCallback(() => {
    if (!timerMode) return
    const mins = parseInt(timerInputValue, 10)
    if (!isNaN(mins) && mins >= 1) {
      if (timerMode.type === "set") {
        setTimer(timerMode.taskId, mins)
      } else {
        addTime(timerMode.taskId, mins)
      }
    }
    setTimerMode(null)
    setTimerInputValue("")
  }, [timerMode, timerInputValue, setTimer, addTime])

  const cancelTimerInput = useCallback(() => {
    setTimerMode(null)
    setTimerInputValue("")
  }, [])

  const handleTimerInputKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Prevent Tab/indent logic from firing while typing in the timer input.
      e.stopPropagation()
      if (e.key === "Enter") commitTimerInput()
      if (e.key === "Escape") cancelTimerInput()
    },
    [commitTimerInput, cancelTimerInput]
  )

  if (loading) {
    return (
      <section className="popup w-[420px] h-[560px] flex items-center justify-center">
        <span className="text-sm text-gray-400">Loading…</span>
      </section>
    )
  }

  if (error) {
    return (
      <section className="popup w-[420px] h-[560px] flex items-center justify-center">
        <span className="text-sm text-red-400">{error}</span>
      </section>
    )
  }

  return (
    <section className="popup w-[420px] h-[560px] flex flex-col">
      {/* Header */}
      <section className="header h-10 shrink-0 flex items-center justify-end px-3">
        <button className="p-1 rounded hover:opacity-70">
          <Settings size={16} />
        </button>
      </section>

      {/* Task list — scrollable, no hard cap on task count */}
      <section className="content flex-1 flex flex-col overflow-y-auto">
        {todos.map((todo) => {
          const timerInfo = getTimerInfo(todo.id)
          const showSetInput =
            timerMode?.type === "set" && timerMode.taskId === todo.id
          const showAddInput =
            timerMode?.type === "add" && timerMode.taskId === todo.id

          return (
            <TaskRow
              key={todo.id}
              todo={todo}
              isSelected={selectedId === todo.id}
              timerInfo={timerInfo}
              showSetInput={showSetInput}
              showAddInput={showAddInput}
              timerInputValue={showSetInput || showAddInput ? timerInputValue : ""}
              onRowFocus={() => {
                setSelectedId(todo.id)
                // Close any timer input that belongs to a different task.
                if (timerMode && timerMode.taskId !== todo.id) {
                  cancelTimerInput()
                }
              }}
              onRowKeyDown={(e) => handleRowKeyDown(e, todo.id)}
              onComplete={(e) => {
                e.stopPropagation()
                clearTimer(todo.id)
                completeTodo(todo.id)
              }}
              onToggleCollapse={(e) => {
                e.stopPropagation()
                toggleCollapse(todo.id)
              }}
              onSetTimerClick={(e) => {
                e.stopPropagation()
                setTimerMode({ type: "set", taskId: todo.id })
                setTimerInputValue("")
              }}
              onTimerInputChange={setTimerInputValue}
              onTimerInputKeyDown={handleTimerInputKeyDown}
              onTimerCancel={(e) => {
                e.stopPropagation()
                clearTimer(todo.id)
              }}
              onTimerIgnore={(e) => {
                e.stopPropagation()
                clearTimer(todo.id)
              }}
              onAddTimeClick={(e) => {
                e.stopPropagation()
                setTimerMode({ type: "add", taskId: todo.id })
                setTimerInputValue("")
              }}
            />
          )
        })}

        {/* New-task input row (always visible at the bottom) */}
        <NewTaskRow
          value={draftTitle}
          onChange={setDraftTitle}
          onCommit={handleCommit}
          inputRef={inputRef}
        />
      </section>
    </section>
  )
}
