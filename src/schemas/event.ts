import { z } from 'zod';

export const eventCategorySchema = z.enum([
  'work',
  'personal',
  'study',
  'health',
  'finance',
  'other',
]);

export const eventFormSchema = z.object({
  title: z.string().trim().min(1, 'Informe um título').max(200),
  description: z.string().trim().max(5000).optional().or(z.literal('')),
  date: z.string().min(1, 'Informe a data'),
  startTime: z.string().optional().nullable(),
  endTime: z.string().optional().nullable(),
  allDay: z.boolean().default(false),
  category: eventCategorySchema.default('personal'),
  location: z.string().trim().max(200).optional().or(z.literal('')),
  meetingUrl: z.string().url('URL inválida').optional().or(z.literal('')),
  notes: z.string().trim().max(5000).optional().or(z.literal('')),
  recurrence: z.string().optional().nullable(),
});

export type EventFormValues = z.infer<typeof eventFormSchema>;
