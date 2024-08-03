export interface SignupRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface UpdateUserRequest {
  email?: string;
  name?: string;
}

export interface DeleteUserRequest {
  password?: string;
}

export interface ChangeUserRoleRequest {
  role: "ADMIN" | "USER";
}
