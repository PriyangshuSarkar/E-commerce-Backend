import type { infer as infer_ } from "zod";
import type {
  ChangePasswordSchema,
  ChangeUserRoleSchema,
  DeleteUserSchema,
  LoginSchema,
  PageAndLimitSchema,
  SearchQuerySchema,
  SignupSchema,
  UpdateUserSchema,
  UserIdSchema,
} from "../schemas/user";

export type SignupRequest = infer_<typeof SignupSchema>;

export type LoginRequest = infer_<typeof LoginSchema>;

export type ChangePasswordRequest = infer_<typeof ChangePasswordSchema>;

export type UpdateUserRequest = infer_<typeof UpdateUserSchema>;

export type DeleteUserRequest = infer_<typeof DeleteUserSchema>;

export type ChangeUserRoleRequest = infer_<typeof ChangeUserRoleSchema>;

export type PageAndLimitRequest = infer_<typeof PageAndLimitSchema>;

export type UserIdRequest = infer_<typeof UserIdSchema>;

export type SearchQueryRequest = infer_<typeof SearchQuerySchema>;
