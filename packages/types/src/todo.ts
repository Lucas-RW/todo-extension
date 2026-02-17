export interface TodoItem {
  id: string; 
  title: string;
  completed: boolean; 

  parentId?: string;
  order: number;
  collapsed: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTodoInput {
  title: string;
  parentId?: string;
}

export interface UpdateTodoInput {
  title?: string;
  completed?: boolean;
  parentId?: string;
  order?: number;
  collapsed?: boolean;
}