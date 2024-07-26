import { password } from "bun";
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

export const UpdateUserSchema = object({
  name: string().optional(),
  email: string().email().optional(),
}).superRefine((data) => {
  const hasValue = Object.values(data).some((value) => value !== undefined);
  if (!hasValue) {
    throw new Error("At least one field must be provided for update.");
  }
  return data;
});

export const DeleteUserSchema = object({
  password: string(),
});
