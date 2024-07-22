import { object, string } from "zod";

export const SignUpSchema = object({
  name: string(),
  email: string().email(),
  password: string().min(6),
});

export const LoginSchema = object({
  email: string().email(),
  password: string(),
});
