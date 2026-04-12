import { useCallback, useEffect, useMemo, useState } from "react"

import type { CreateTodoInput, TodoItem } from "@repo/types"

import * as todosLib from "~/lib/todos"

// FlatTodo is a TodoItem annotated with tree-rendering metadata and optimistic UI state.
export type FlatTodo = TodoItem & {
  depth: number
  hasChildren: boolean
  completing: boolean
}

type RawTodo = TodoItem & { completing: boolean }

/**
 * Converts a flat array of todos into a DFS-ordered list with depth and
 * hasChildren metadata. When respectCollapse is true, collapsed subtrees are
 * omitted from the result (used for rendering). When false, the full tree is
 * traversed (used for indentation logic).
 */
function buildFlatList(items: RawTodo[], respectCollapse: boolean): FlatTodo[] {
  const idSet = new Set(items.map((t) => t.id))

  // Treat orphaned tasks (deleted parent) as root-level items.
  const normalized = items.map((t) => ({
    ...t,
    parentId: t.parentId && idSet.has(t.parentId) ? t.parentId : undefined,
  }))

  const childrenMap = new Map<string | undefined, RawTodo[]>()
  for (const item of normalized) {
    const key = item.parentId // undefined = root
    if (!childrenMap.has(key)) childrenMap.set(key, [])
    childrenMap.get(key)!.push(item)
  }
  for (const arr of childrenMap.values()) {
    arr.sort((a, b) => a.order - b.order)
  }

  const result: FlatTodo[] = []

  function dfs(parentId: string | undefined, depth: number) {
    const children = childrenMap.get(parentId) ?? []
    for (const item of children) {
      const hasChildren = (childrenMap.get(item.id) ?? []).length > 0
      result.push({ ...item, depth, hasChildren })
      if (!respectCollapse || !item.collapsed) {
        dfs(item.id, depth + 1)
      }
    }
  }

  dfs(undefined, 0)
  return result
}

export function useTodos() {
  const [rawTodos, setRawTodos] = useState<RawTodo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    todosLib
      .getTodos()
      .then((items) => {
        if (cancelled) return
        setRawTodos(items.map((t) => ({ ...t, completing: false })))
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

  // The visible list respects collapsed state.
  const todos = useMemo(() => buildFlatList(rawTodos, true), [rawTodos])

  const patchLocal = useCallback((id: string, patch: Partial<RawTodo>) => {
    setRawTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...patch } : t))
    )
  }, [])

  const addTodo = useCallback(async (input: CreateTodoInput) => {
    const created = await todosLib.createTodo(input)
    setRawTodos((prev) => [...prev, { ...created, completing: false }])
  }, [])

  const completeTodo = useCallback(
    async (id: string) => {
      patchLocal(id, { completing: true })
      await todosLib.deleteTodo(id)
      setTimeout(() => {
        setRawTodos((prev) => prev.filter((t) => t.id !== id))
      }, 300)
    },
    [patchLocal]
  )

  const toggleCollapse = useCallback(
    async (id: string) => {
      const todo = rawTodos.find((t) => t.id === id)
      if (!todo) return
      const collapsed = !todo.collapsed
      patchLocal(id, { collapsed })
      await todosLib.updateTodo(id, { collapsed })
    },
    [rawTodos, patchLocal]
  )

  // Tab: make the task a child of the task directly above it in the visible list.
  // Max depth is 2 (three nesting tiers: 0, 1, 2).
  const indentTodo = useCallback(
    async (id: string) => {
      const ordered = buildFlatList(rawTodos, true) // visible order
      const idx = ordered.findIndex((t) => t.id === id)
      if (idx <= 0) return // nothing above, or not found
      const above = ordered[idx - 1]
      if (above.depth >= 2) return // would exceed max depth
      patchLocal(id, { parentId: above.id })
      await todosLib.updateTodo(id, { parentId: above.id })
    },
    [rawTodos, patchLocal]
  )

  // Shift+Tab: move the task up one level (parent becomes its parent's parent).
  const unindentTodo = useCallback(
    async (id: string) => {
      const todo = rawTodos.find((t) => t.id === id)
      if (!todo || !todo.parentId) return // already at root
      const parent = rawTodos.find((t) => t.id === todo.parentId)
      // null = move to root; DB and local state handle differently
      const newParentId = parent?.parentId ?? null
      patchLocal(id, { parentId: newParentId ?? undefined })
      await todosLib.updateTodo(id, { parentId: newParentId })
    },
    [rawTodos, patchLocal]
  )

  return {
    todos,
    loading,
    error,
    addTodo,
    completeTodo,
    toggleCollapse,
    indentTodo,
    unindentTodo,
  }
}
