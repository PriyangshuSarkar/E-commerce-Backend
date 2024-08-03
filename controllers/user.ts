import type { Request, Response } from "express";
import { tryCatch } from "../middlewares/tryCatch";
import type {
  ChangePasswordRequest,
  LoginRequest,
  SignupRequest,
  UpdateUserRequest,
  DeleteUserRequest,
  ChangeUserRoleRequest,
} from "../types/user";
import { prismaClient } from "../app";
import { hashSync, compareSync } from "bcrypt";
import { sign } from "jsonwebtoken";
import {
  ChangePasswordSchema,
  ChangeUserRoleSchema,
  DeleteUserSchema,
  LoginSchema,
  SignupSchema,
  UpdateUserSchema,
} from "../schemas/user";

// *Signup Route
export const signup = tryCatch(
  async (req: Request<{}, {}, SignupRequest>, res: Response) => {
    const validatedData = SignupSchema.parse(req.body);
    const user = await prismaClient.user.findFirst({
      where: { email: validatedData.email },
    });

    if (user) {
      if (user.deletedAt) {
        await prismaClient.user.update({
          where: { id: user.id },
          data: {
            deletedAt: null,
            password: hashSync(validatedData.password, 10),
          },
        });
        return res.status(200).json({ message: "Account reactivated!" });
      } else {
        return res.status(400).json({ error: "User already exists!" });
      }
    }
    const newUser = await prismaClient.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        password: hashSync(validatedData.password, 10),
      },
    });

    const { password: _, ...userWithoutPassword } = newUser;

    const token = sign({ userId: newUser.id }, process.env.JWT_SECRET!, {
      expiresIn: process.env.JWT_EXPIRATION_TIME!,
    });

    return res.status(201).json({ user: userWithoutPassword, token });
  }
);

// *Login Route
export const login = tryCatch(
  async (req: Request<{}, {}, LoginRequest>, res: Response) => {
    const validatedData = LoginSchema.parse(req.body);
    const user = await prismaClient.user.findFirst({
      where: { email: validatedData.email, deletedAt: null },
    });

    if (!user) {
      return res.status(404).json({ error: "User doesn't exist!" });
    }

    if (!compareSync(validatedData.password, user.password)) {
      return res.status(401).json({ error: "Incorrect password!" });
    }

    const { password: _, ...userWithoutPassword } = user;

    const token = sign({ userId: user.id }, process.env.JWT_SECRET!, {
      expiresIn: process.env.JWT_EXPIRATION_TIME!,
    });

    return res.status(200).json({ user: userWithoutPassword, token });
  }
);

// *Me Route
export const me = tryCatch(async (req: Request, res: Response) => {
  return res.status(200).json(req.user);
});

// *Change Password Route
export const changePassword = tryCatch(
  async (req: Request<{}, {}, ChangePasswordRequest>, res: Response) => {
    const validatedData = ChangePasswordSchema.parse(req.body);
    if (!compareSync(validatedData.oldPassword, req.user.password)) {
      return res.status(401).json({ error: "Incorrect password!" });
    }
    await prismaClient.user.update({
      where: { id: req.user.id!, deletedAt: null },
      data: { password: hashSync(validatedData.newPassword, 10) },
    });
    return res.status(201).json({ message: "Password updated successfully!" });
  }
);

// *Update User Route
export const updateUser = tryCatch(
  async (req: Request<{}, {}, UpdateUserRequest>, res: Response) => {
    const validatedData = UpdateUserSchema.parse(req.body);
    const updatedUser = await prismaClient.user.update({
      where: { id: req.user.id!, deletedAt: null },
      data: validatedData,
    });
    return res.status(201).json({ updatedUser });
  }
);

// *Delete User Route
export const deleteUser = tryCatch(
  async (req: Request<{}, {}, DeleteUserRequest>, res: Response) => {
    const validatedData = DeleteUserSchema.parse(req.body);

    if (!compareSync(validatedData.password, req.user.password)) {
      return res.status(401).json({ error: "Incorrect password!" });
    }

    await prismaClient.user.update({
      where: { id: req.user.id!, deletedAt: null },
      data: { deletedAt: new Date() },
    });

    return res.status(201).json({
      message: `User ${req.user.name} of ID: ${req.user.id} is deleted, Successfully.`,
    });
  }
);

// * Get All Users
// !Admin Only
export const getAllUsers = tryCatch(
  async (
    req: Request<{}, {}, {}, { page?: string; limit?: string }>,
    res: Response
  ) => {
    const page = +req.query.page! || 1;
    const limit = +req.query.limit! || 5;
    if (page <= 0 || limit <= 0) {
      return res
        .status(400)
        .json({ error: "Page and limit must be positive integers." });
    }
    const skip = (page - 1) * limit;

    const userFilter = { deletedAt: null };

    const [count, users] = await prismaClient.$transaction([
      prismaClient.user.count({ where: userFilter }),
      prismaClient.user.findMany({
        skip,
        take: limit,
        where: userFilter,
      }),
    ]);

    const totalPages = Math.ceil(count / limit);
    return res.status(200).json({
      users,
      currentPage: page,
      totalPages,
      totalCount: count,
    });
  }
);

// *Get User By ID
// !Admin Only
export const getUserById = tryCatch(
  async (req: Request<{ id?: string }>, res: Response) => {
    const user = await prismaClient.user.findFirstOrThrow({
      where: { id: req.params.id, deletedAt: null },
    });
    return res.status(200).json({ user });
  }
);

// * Search User
// !Admin Only
export const searchUser = tryCatch(
  async (
    req: Request<{}, {}, {}, { query?: string; page?: string; limit?: string }>,
    res: Response
  ) => {
    const page = +req.query.page! || 1;
    const limit = +req.query.limit! || 5;
    if (page <= 0 || limit <= 0) {
      return res
        .status(400)
        .json({ error: "Page and limit must be positive integers." });
    }
    const skip = (page - 1) * limit;

    const searchQuery = req.query.query || "";

    const [count, users] = await prismaClient.$transaction([
      prismaClient.user.count({
        where: {
          OR: [
            {
              name: {
                contains: searchQuery,
              },
            },
            {
              email: {
                contains: searchQuery,
              },
            },
          ],
          deletedAt: null,
        },
      }),
      prismaClient.user.findMany({
        skip,
        take: limit,
        where: {
          OR: [
            {
              name: {
                contains: searchQuery,
              },
            },
            {
              email: {
                contains: searchQuery,
              },
            },
          ],
          deletedAt: null,
        },
      }),
    ]);

    const totalPages = Math.ceil(count / limit);
    return res.status(200).json({
      users,
      currentPage: page,
      totalPages,
      totalCount: count,
    });
  }
);

// *Change User Role
// !Admin Only
export const changeUserRole = tryCatch(
  async (
    req: Request<{ id?: string }, {}, ChangeUserRoleRequest>,
    res: Response
  ) => {
    if (req.params.id === req.user.id) {
      return res
        .status(403)
        .json({ message: "Admins cannot change their own role." });
    }
    const validatedData = ChangeUserRoleSchema.parse(req.body);
    const user = await prismaClient.user.update({
      where: { id: req.params.id },
      data: validatedData,
    });
    return res.status(200).json({ user });
  }
);
