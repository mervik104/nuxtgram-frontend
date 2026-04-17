import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Введите корректный email.'), // Исправил z.email на z.string().email
  password: z.string()
    .min(1, 'Поле не должно быть пустым')
    .min(8, 'Пароль должен быть не менее 8 символов')
    .regex(/[a-zA-Z]/, 'Пароль должен содержать латинские буквы'),
})

export const registerSchema = z.object({
  username: z.string().min(1, 'Поле не должно быть пустым').min(3, 'Минимум 3 символа').max(48, 'Максимум 48 символов'),
  email: z.string().email('Введите корректный email.'),
  password: z.string()
    .min(1, 'Поле не должно быть пустым')
    .min(8, 'Пароль должен быть не менее 8 символов')
    .regex(/[a-zA-Z]/, 'Пароль должен содержать латинские буквы'),
  'verify-password': z.string().min(1, 'Поле не должно быть пустым'),
}).refine((data) => data.password === data['verify-password'], {
  message: 'Пароли не совпадают',
  path: ['verify-password'], 
})

export const editProfileSchema = z.object({
  username: z.string().min(1, 'Поле не должно быть пустым').min(3, 'Минимум 3 символа').max(48, 'Максимум 48 символов'),
  nickname: z.string().min(3, 'Минимум 3 символа').max(30, 'Максимум 30 символов'),
  biography: z.string().max(200, 'Максимум 200 символов'), 
})

export type EditProfileFormData = z.infer<typeof editProfileSchema>
export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>