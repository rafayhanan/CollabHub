import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createTask, deleteTask, getProjectTasks, getUserTasks, updateTask } from "@/lib/api/services/tasks"
import type { Task } from "@/lib/api/types"

export const taskKeys = {
  user: ["tasks", "user"] as const,
  project: (projectId: string) => ["tasks", "project", projectId] as const,
  allProjects: (projectIds: string[]) => ["tasks", "projects", projectIds] as const,
}

export const useUserTasks = () => {
  return useQuery({
    queryKey: taskKeys.user,
    queryFn: getUserTasks,
  })
}

export const useProjectTasks = (projectId: string | null) => {
  return useQuery({
    queryKey: projectId ? taskKeys.project(projectId) : ["tasks", "project", "none"],
    queryFn: () => getProjectTasks(projectId as string),
    enabled: !!projectId,
  })
}

export const useAllProjectTasks = (projectIds: string[]) => {
  return useQuery({
    queryKey: taskKeys.allProjects(projectIds),
    queryFn: async () => {
      const taskLists = await Promise.all(projectIds.map((projectId) => getProjectTasks(projectId)))
      return taskLists.flat()
    },
    enabled: projectIds.length > 0,
  })
}

export const useCreateTask = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      projectId,
      title,
      description,
      dueDate,
    }: {
      projectId: string
      title: string
      description: string
      dueDate?: string
    }) => createTask(projectId, title, description, dueDate),
    onSuccess: (newTask) => {
      queryClient.setQueryData<Task[]>(taskKeys.project(newTask.projectId), (old) =>
        old ? [newTask, ...old] : [newTask],
      )
      queryClient.setQueriesData<Task[]>(
        { queryKey: ["tasks", "projects"] },
        (old) => (old ? [newTask, ...old] : old),
      )
    },
  })
}

export const useUpdateTask = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ taskId, updates }: { taskId: string; updates: Partial<Task> }) => updateTask(taskId, updates),
    onSuccess: (updatedTask) => {
      queryClient.setQueryData<Task[]>(taskKeys.project(updatedTask.projectId), (old) =>
        old ? old.map((task) => (task.id === updatedTask.id ? updatedTask : task)) : old,
      )
      queryClient.setQueriesData<Task[]>(
        { queryKey: ["tasks", "projects"] },
        (old) => (old ? old.map((task) => (task.id === updatedTask.id ? updatedTask : task)) : old),
      )
      queryClient.setQueryData<Task[]>(taskKeys.user, (old) =>
        old ? old.map((task) => (task.id === updatedTask.id ? updatedTask : task)) : old,
      )
    },
  })
}

export const useDeleteTask = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (task: Task) => deleteTask(task.id),
    onSuccess: (_, task) => {
      queryClient.setQueryData<Task[]>(taskKeys.project(task.projectId), (old) =>
        old ? old.filter((t) => t.id !== task.id) : old,
      )
      queryClient.setQueriesData<Task[]>(
        { queryKey: ["tasks", "projects"] },
        (old) => (old ? old.filter((t) => t.id !== task.id) : old),
      )
      queryClient.setQueryData<Task[]>(taskKeys.user, (old) => (old ? old.filter((t) => t.id !== task.id) : old))
    },
  })
}
