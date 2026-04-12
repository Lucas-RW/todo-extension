import type { CreateTodoInput, TodoItem, UpdateTodoInput } from "@repo/types"

import { supabase } from "~/lib/supabase"

type DbRow = Record<string, unknown>

function rowToTodo(row: DbRow): TodoItem {
  return {
    id: row.id as string,
    title: row.title as string,
    completed: row.completed as boolean,
    parentId: (row.parent_id as string | null) ?? undefined,
    order: row.order as number,
    collapsed: (row.collapsed as boolean) ?? false,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string)
  }
}

export async function getTodos(): Promise<TodoItem[]> {
  const { data, error } = await supabase
    .from("todos")
    .select("*")
    .order("order", { ascending: true })

  if (error) throw error
  return (data ?? []).map(rowToTodo)
}

export async function createTodo(input: CreateTodoInput): Promise<TodoItem> {
  const { data, error } = await supabase
    .from("todos")
    .insert({ title: input.title, parent_id: input.parentId ?? null })
    .select()
    .single()

  if (error) throw error
  return rowToTodo(data as DbRow)
}

export async function updateTodo(
  id: string,
  input: UpdateTodoInput
): Promise<TodoItem> {
  const patch: DbRow = {}
  if (input.title !== undefined) patch.title = input.title
  if (input.completed !== undefined) patch.completed = input.completed
  if (input.parentId !== undefined) patch.parent_id = input.parentId
  if (input.order !== undefined) patch.order = input.order
  if (input.collapsed !== undefined) patch.collapsed = input.collapsed

  const { data, error } = await supabase
    .from("todos")
    .update(patch)
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return rowToTodo(data as DbRow)
}

export async function deleteTodo(id: string): Promise<void> {
  const { error } = await supabase.from("todos").delete().eq("id", id)
  if (error) throw error
}
