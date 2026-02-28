// packages/utils/src/validation.ts
import { z } from 'zod';

/** Password must be 8+ chars, with upper, lower, number, and special char */
export const passwordSchema = z
  .string()
  .min(8, 'At least 8 characters required')
  .regex(/[A-Z]/, 'Must contain an uppercase letter')
  .regex(/[a-z]/, 'Must contain a lowercase letter')
  .regex(/\d/, 'Must contain a number')
  .regex(/[^A-Za-z0-9]/, 'Must contain a special character');

export const emailSchema = z
  .string()
  .email('Please enter a valid email address');

export const usPhoneSchema = z
  .string()
  .regex(
    /^\+?1?\s*\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/,
    'Please enter a valid US phone number',
  );

export const loginSchema = z.object({
  email:    emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z
  .object({
    firstName:       z.string().min(1, 'First name is required'),
    lastName:        z.string().min(1, 'Last name is required'),
    email:           emailSchema,
    password:        passwordSchema,
    confirmPassword: z.string(),
    acceptTerms:     z.literal(true, {
      errorMap: () => ({ message: 'You must accept the terms to continue' }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type LoginFormValues    = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
