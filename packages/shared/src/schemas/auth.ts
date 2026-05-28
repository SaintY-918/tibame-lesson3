import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(1, "username 必填"),
  password: z.string().min(1, "password 必填"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, "密碼長度需 >= 8"),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
