import { useEffect, useRef, useState } from "react"
import { Settings } from "lucide-react"

import { useTodos } from "~/hooks/useTodos"
import type { PopupTodo } from "~/hooks/useTodos"

import "./style.css"

interface TaskRowProps {
  todo: PopupTodo
  onComplete: (id: string) => void
}

function TaskRow({ todo, onComplete }: TaskRowProps) {
  return (
    <div
      className={[
        "h-[calc(360px/11)] flex items-center px-3 gap-2 border-b border-gray-100",
        "transition-opacity duration-300",
        todo.completing ? "opacity-0" : "opacity-100"
      ].join(" ")}>
      <button
        onClick={() => onComplete(todo.id)}
        className="w-3.5 h-3.5 rounded-full border border-gray-400 shrink-0 hover:border-gray-600 hover:bg-gray-100 transition-colors duration-150"
        aria-label="Complete task"
      />
      <span
        className={[
          "text-sm flex-1 truncate transition-all duration-300",
          todo.completing ? "line-through text-gray-400" : "text-gray-800"
        ].join(" ")}>
        {todo.title}
      </span>
    </div>
  )
}

interface NewTaskRowProps {
  value: string
  onChange: (v: string) => void
  onCommit: () => void
  inputRef: React.RefObject<HTMLInputElement>
}

function NewTaskRow({ value, onChange, onCommit, inputRef }: NewTaskRowProps) {
  return (
    <div className="h-[calc(360px/11)] flex items-center px-3 gap-2">
      <div className="w-3.5 h-3.5 rounded-full border border-dashed border-gray-300 shrink-0" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => {
          if (e.key === "Enter" && value.trim()) onCommit()
        }}
        placeholder="New task"
        className="flex-1 text-sm bg-transparent outline-none placeholder:text-gray-300 text-gray-800"
      />
    </div>
  )
}

export default function IndexPopup() {
  const { todos, loading, error, addTodo, completeTodo } = useTodos()
  const [draftTitle, setDraftTitle] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [loading])

  const handleCommit = async () => {
    const title = draftTitle.trim()
    if (!title || todos.length >= 10) return
    setDraftTitle("")
    await addTodo({ title })
  }

  if (loading) {
    return (
      <section className="popup w-[360px] h-[360px] flex items-center justify-center">
        <span className="text-sm text-gray-400">Loading…</span>
      </section>
    )
  }

  if (error) {
    return (
      <section className="popup w-[360px] h-[360px] flex items-center justify-center">
        <span className="text-sm text-red-400">{error}</span>
      </section>
    )
  }

  return (
    <section className="popup w-[360px] h-[360px] flex flex-col">
      <section className="header h-[calc(100%/11)] shrink-0 flex items-center justify-end">
        <div className="px-3">
          <button className="p-1 rounded hover:opacity-70">
            <Settings size={16} />
          </button>
        </div>
      </section>
      <section className="content flex-1 flex flex-col overflow-hidden">
        {todos.map(todo => (
          <TaskRow key={todo.id} todo={todo} onComplete={completeTodo} />
        ))}
        {todos.length < 10 && (
          <NewTaskRow
            value={draftTitle}
            onChange={setDraftTitle}
            onCommit={handleCommit}
            inputRef={inputRef}
          />
        )}
      </section>
    </section>
  )
}
