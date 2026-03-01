import { useCallback, useEffect, useState } from "react"

import type { CreateTodoInput } from "@repo/types"

import * as todosLib from "~/lib/todos"

export interface PopupTodo {
  id: string
  title: string
  completing: boolean
}

export function useTodos() {
  const [todos, setTodos] = useState<PopupTodo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    todosLib
      .getTodos()
      .then((items) => {
        if (cancelled) return
        setTodos(
          items.map((t) => ({ id: t.id, title: t.title, completing: false }))
        )
      })
      .catch((err: Error) => {
        if (cancelled) return
        setError(err.message ?? "Failed to load todos")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const addTodo = useCallback(async (input: CreateTodoInput) => {
    const created = await todosLib.createTodo(input)
    setTodos((prev) => [
      ...prev,
      { id: created.id, title: created.title, completing: false }
    ])
  }, [])

  const completeTodo = useCallback(async (id: string) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completing: true } : t))
    )
    await todosLib.deleteTodo(id)
    setTimeout(() => {
      setTodos((prev) => prev.filter((t) => t.id !== id))
    }, 300)
  }, [])

  return { todos, loading, error, addTodo, completeTodo }
}
