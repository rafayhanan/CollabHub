import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createProject, deleteProject, getProject, getProjects, updateProject } from "@/lib/api/services/projects"
import type { Project } from "@/lib/api/types"

export const projectKeys = {
  all: ["projects"] as const,
  detail: (projectId: string) => ["projects", projectId] as const,
}

export const useProjects = () => {
  return useQuery({
    queryKey: projectKeys.all,
    queryFn: getProjects,
  })
}

export const useProject = (projectId: string | null) => {
  return useQuery({
    queryKey: projectId ? projectKeys.detail(projectId) : ["projects", "none"],
    queryFn: () => getProject(projectId as string),
    enabled: !!projectId,
  })
}

export const useCreateProject = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ name, description }: { name: string; description: string }) => createProject(name, description),
    onSuccess: (newProject) => {
      queryClient.setQueryData<Project[]>(projectKeys.all, (old) => (old ? [newProject, ...old] : [newProject]))
    },
  })
}

export const useUpdateProject = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, name, description }: { id: string; name: string; description: string }) =>
      updateProject(id, name, description),
    onSuccess: (updatedProject) => {
      queryClient.setQueryData<Project[]>(projectKeys.all, (old) =>
        old ? old.map((project) => (project.id === updatedProject.id ? updatedProject : project)) : old,
      )
      queryClient.setQueryData<Project>(projectKeys.detail(updatedProject.id), updatedProject)
    },
  })
}

export const useDeleteProject = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (projectId: string) => deleteProject(projectId),
    onSuccess: (_, projectId) => {
      queryClient.setQueryData<Project[]>(projectKeys.all, (old) => (old ? old.filter((p) => p.id !== projectId) : old))
    },
  })
}
