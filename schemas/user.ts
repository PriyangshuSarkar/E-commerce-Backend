import { number, object, string } from "zod";

export const SignupSchema = object({
  name: string(),
  email: string().email(),
  password: string().min(6),
});

export const LoginSchema = object({
  email: string().email(),
  password: string(),
});

export const ChangePasswordSchema = object({
  oldPassword: string(),
  newPassword: string().min(6),
});
