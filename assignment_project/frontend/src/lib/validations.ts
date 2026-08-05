import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type LoginSchemaType = z.infer<typeof loginSchema>;

export const chatQuestionSchema = z.object({
  question: z.string().min(1, 'Question cannot be empty').max(1000, 'Question too long'),
});

export type ChatQuestionSchemaType = z.infer<typeof chatQuestionSchema>;
