import { z } from 'zod';

export const taskPrioritySchema = z.enum(['critical', 'high', 'medium', 'low']);
export const taskStatusSchema = z.enum(['todo', 'in_progress', 'done', 'archived']);

export const taskFormSchema = z.object({
  title: z.string().trim().min(1, 'Informe um título').max(200),
  description: z.string().trim().max(5000).optional().or(z.literal('')),
  status: taskStatusSchema.default('todo'),
  priority: taskPrioritySchema.default('medium'),
  date: z.string().optional().nullable(),
  time: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(),
  category: z.string().trim().max(80).optional().or(z.literal('')),
  tags: z.array(z.string()).default([]),
  notes: z.string().trim().max(5000).optional().or(z.literal('')),
  reminderAt: z.number().optional().nullable(),
  recurrence: z.string().optional().nullable(),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;
