import { z } from 'zod';

export const transactionFormSchema = z.object({
  description: z.string().trim().min(1, 'Informe a descrição').max(200),
  type: z.enum(['income', 'expense', 'transfer']),
  amount: z.number().positive('Valor deve ser maior que zero'),
  categoryId: z.string().optional().nullable(),
  accountId: z.string().optional().nullable(),
  toAccountId: z.string().optional().nullable(),
  paymentMethod: z.string().optional().or(z.literal('')),
  dueDate: z.string().min(1, 'Informe a data'),
  status: z.enum(['pending', 'paid', 'overdue', 'cancelled']).default('pending'),
  notes: z.string().trim().max(2000).optional().or(z.literal('')),
  recurring: z.boolean().default(false),
}).superRefine((data, ctx) => {
  if (data.type === 'transfer' && !data.toAccountId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Selecione a conta de destino',
      path: ['toAccountId'],
    });
  }
});

export type TransactionFormValues = z.infer<typeof transactionFormSchema>;
