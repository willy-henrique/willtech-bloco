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
  description: z.string().trim().max(5000).optional().default(''),
  date: z.string().min(1, 'Informe a data'),
  startTime: z.string().nullable().optional().default(null),
  endTime: z.string().nullable().optional().default(null),
  allDay: z.boolean().default(true),
  category: eventCategorySchema.default('personal'),
  location: z.string().trim().max(200).optional().default(''),
  meetingUrl: z
    .string()
    .trim()
    .optional()
    .default('')
    .refine((value) => value === '' || /^https?:\/\//i.test(value), 'URL inválida'),
  notes: z.string().trim().max(5000).optional().default(''),
  recurrence: z.string().nullable().optional().default(null),
});

export type EventFormValues = z.infer<typeof eventFormSchema>;
