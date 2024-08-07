import { password } from "bun";
import { number, object, string, enum as enum_ } from "zod";

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

export const ChangeUserRoleSchema = object({
  role: enum_(["ADMIN", "USER"]),
});

export const PageAndLimitSchema = object({
  page: string().optional(),
  limit: string().optional(),
});

export const UserIdSchema = object({
  userId: string().optional(),
});

export const SearchQuerySchema = object({
  query: string().optional(),
  page: string().optional(),
  limit: string().optional(),
});
