import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createChannel, getProjectChannels } from "@/lib/api/services/chat"
import type { Channel } from "@/lib/api/types"

export const channelKeys = {
  project: (projectId: string) => ["channels", "project", projectId] as const,
  allProjects: (projectIds: string[]) => ["channels", "projects", projectIds] as const,
}

export const useProjectChannels = (projectId: string | null) => {
  return useQuery({
    queryKey: projectId ? channelKeys.project(projectId) : ["channels", "project", "none"],
    queryFn: () => getProjectChannels(projectId as string),
    enabled: !!projectId,
  })
}

export const useAllProjectChannels = (projectIds: string[]) => {
  return useQuery({
    queryKey: channelKeys.allProjects(projectIds),
    queryFn: async () => {
      const channelLists = await Promise.all(projectIds.map((projectId) => getProjectChannels(projectId)))
      return channelLists.flat()
    },
    enabled: projectIds.length > 0,
  })
}

export const useCreateChannel = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      name,
      type,
      description,
      projectId,
      taskId,
    }: {
      name: string
      type: Channel["type"]
      description?: string
      projectId?: string
      taskId?: string
    }) => createChannel(name, type, description, projectId, taskId),
    onSuccess: (newChannel) => {
      if (newChannel.projectId) {
        queryClient.setQueryData<Channel[]>(channelKeys.project(newChannel.projectId), (old) =>
          old ? [newChannel, ...old] : [newChannel],
        )
      }
      queryClient.setQueriesData<Channel[]>(
        { queryKey: ["channels", "projects"] },
        (old) => (old ? [newChannel, ...old] : old),
      )
    },
  })
}
