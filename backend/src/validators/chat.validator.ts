import { z } from 'zod';

// Channel types enum
export const ChannelTypeSchema = z.enum([
  'PROJECT_GENERAL',
  'TASK_SPECIFIC', 
  'ANNOUNCEMENTS'
]);

// Channel role enum
export const ChannelRoleSchema = z.enum(['ADMIN', 'MEMBER']);

/**
 * Validator for creating a new channel
 */
export const createChannelValidator = z.object({
  name: z.string()
    .min(1, 'Channel name is required')
    .max(100, 'Channel name must be less than 100 characters')
    .trim(),
  
  type: ChannelTypeSchema,
  
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  
  projectId: z.string()
    .uuid('Invalid project ID format')
    .optional(),
  
  taskId: z.string()
    .uuid('Invalid task ID format')
    .optional(),

  memberIds: z.array(
    z.string().uuid('Invalid user ID format'),
  ).optional(),
}).refine((data) => {
  // Project channels must have a projectId
  if (data.type === 'PROJECT_GENERAL' || data.type === 'ANNOUNCEMENTS') {
    return !!data.projectId;
  }
  
  // Task-specific channels must have both projectId and taskId
  if (data.type === 'TASK_SPECIFIC') {
    return !!data.projectId && !!data.taskId;
  }
  
  return true;
}, {
  message: 'Project channels require projectId, task channels require both projectId and taskId'
});

/**
 * Validator for adding members to a channel
 */
export const addChannelMemberValidator = z.object({
  userId: z.string()
    .uuid('Invalid user ID format'),
  
  role: ChannelRoleSchema
    .default('MEMBER'),
});

/**
 * Validator for sending messages
 */
export const sendMessageValidator = z.object({
  content: z.string()
    .min(1, 'Message content is required')
    .max(2000, 'Message content must be less than 2000 characters')
    .trim(),
});

/**
 * Validator for updating messages
 */
export const updateMessageValidator = z.object({
  content: z.string()
    .min(1, 'Message content is required')
    .max(2000, 'Message content must be less than 2000 characters')
    .trim(),
});

/**
 * Validator for channel query parameters
 */
export const channelQueryValidator = z.object({
  limit: z.string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1).max(100))
    .default(50),
  
  offset: z.string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(0))
    .default(0),
});

/**
 * Validator for direct message creation
 */
export const createDirectMessageValidator = z.object({
  recipientId: z.string()
    .uuid('Invalid recipient ID format'),
  
  content: z.string()
    .min(1, 'Message content is required')
    .max(2000, 'Message content must be less than 2000 characters')
    .trim(),
});

export type CreateChannelInput = z.infer<typeof createChannelValidator>;
export type AddChannelMemberInput = z.infer<typeof addChannelMemberValidator>;
export type SendMessageInput = z.infer<typeof sendMessageValidator>;
export type UpdateMessageInput = z.infer<typeof updateMessageValidator>;
export type ChannelQueryInput = z.infer<typeof channelQueryValidator>;
export type CreateDirectMessageInput = z.infer<typeof createDirectMessageValidator>;
