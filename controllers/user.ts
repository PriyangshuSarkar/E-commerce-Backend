import type { Request, Response } from "express";
import { tryCatch } from "../middlewares/tryCatch";
import type {
  ChangePasswordRequest,
  LoginRequest,
  SignupRequest,
  UpdateUserRequest,
  DeleteUserRequest,
  ChangeUserRoleRequest,
  PageAndLimitRequest,
  UserIdRequest,
  SearchQueryRequest,
} from "../types/user";
import { prismaClient } from "../app";
import { hashSync, compareSync } from "bcryptjs";
import { sign, verify } from "jsonwebtoken";
import {
  ChangePasswordSchema,
  ChangeUserRoleSchema,
  DeleteUserSchema,
  LoginSchema,
  SignupSchema,
  UpdateUserSchema,
} from "../schemas/user";
import { sendEmail, sendOtpEmail } from "../utils/emailService";
import { generateOtp } from "../utils/generateOtp";

// *Signup Route
export const signup = tryCatch(
  async (req: Request<{}, {}, SignupRequest>, res: Response) => {
    const validatedData = SignupSchema.parse(req.body);
    const user = await prismaClient.user.findFirst({
      where: { email: validatedData.email },
    });
    const sendVerificationEmail = async (
      userName: string,
      email: string,
      token: string
    ) => {
      const emailSubject = "Confirm Your Email Address";
      const emailText = `Hello ${userName},\n\nThank you for signing up! Please confirm your email address by clicking the following link:\n\n${process.env.WEBSITE}/api/user/confirm/email?token=${token}\n\nBest regards,\nYour Company Name`;

      await sendEmail(email, emailSubject, emailText);
    };
    const token = sign(
      { userId: user?.id ?? "new_user_id" },
      process.env.JWT_SECRET!,
      {
        expiresIn: process.env.JWT_EXPIRATION_TIME!,
      }
    );

    if (user) {
      if (user.deletedAt) {
        await prismaClient.user.update({
          where: { id: user.id },
          data: {
            deletedAt: null,
            password: validatedData.password,
          },
        });

        await sendVerificationEmail(user.name, user.email, token);
        return res
          .status(200)
          .json({ message: "Account reactivated! Please verify your email." });
      } else if (!user.emailVerified) {
        await sendVerificationEmail(user.name, user.email, token);
        return res.status(200).json({
          message: "Email verification sent! Please verify your email.",
        });
      } else {
        return res
          .status(400)
          .json({ error: "User already exists and email is verified!" });
      }
    }
    // User does not exist, create a new one
    const newUser = await prismaClient.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        password: validatedData.password,
      },
    });

    const { password: _, ...userWithoutPassword } = newUser;

    await sendVerificationEmail(newUser.name, newUser.email, token);

    return res
      .status(201)
      .cookie("authToken", token, {
        httpOnly: true,
        maxAge:
          parseInt(process.env.JWT_EXPIRATION_TIME!, 10) * 24 * 60 * 60 * 1000,
      })
      .json({
        user: userWithoutPassword,
        message: "User created! Please verify your email.",
      });
  }
);

// *Email Confirmation Controller
export const confirmEmail = tryCatch(async (req: Request, res: Response) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: "Token is required" });
  }

  try {
    const decoded = verify(token as string, process.env.JWT_SECRET!) as {
      userId: string;
    };
    await prismaClient.user.update({
      where: { id: decoded.userId },
      data: { emailVerified: true }, // Assuming you have this field
    });

    return res.status(200).json({ message: "Email confirmed successfully!" });
  } catch (error) {
    return res.status(400).json({ error: "Invalid or expired token" });
  }
});

// *Login Route
export const login = tryCatch(
  async (req: Request<{}, {}, LoginRequest>, res: Response) => {
    const validatedData = LoginSchema.parse(req.body);
    const user = await prismaClient.user.findFirst({
      where: {
        email: validatedData.email,
        deletedAt: null,
        emailVerified: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User doesn't exist!" });
    }

    if (validatedData.password !== user.password) {
      // Removed compareSync
      return res.status(401).json({ error: "Incorrect password!" });
    }

    const { password: _, ...userWithoutPassword } = user;

    const token = sign({ userId: user.id }, process.env.JWT_SECRET!, {
      expiresIn: process.env.JWT_EXPIRATION_TIME!,
    });

    return res
      .status(200)
      .cookie("authToken", token, {
        httpOnly: true,
        maxAge:
          parseInt(process.env.JWT_EXPIRATION_TIME!, 10) * 24 * 60 * 60 * 1000,
      })
      .json({ user: userWithoutPassword, token });
  }
);

// *Me Route
export const me = tryCatch(async (req: Request, res: Response) => {
  const user = await prismaClient.user.findFirstOrThrow({
    where: { id: req.user.id },
    include: {
      addresses: true,
      orders: true,
      reviews: true,
    },
  });
  return res.status(200).json(user);
});

// *Request OTP Route
export const requestOtp = tryCatch(async (req: Request, res: Response) => {
  const otpCode = generateOtp(req.user.email, req.user.password);
  await sendOtpEmail(req.user.email, otpCode);

  return res.status(200).json({ message: "OTP sent to your email!" });
});

// *Change Password Route
export const changePassword = tryCatch(
  async (req: Request<{}, {}, ChangePasswordRequest>, res: Response) => {
    const validatedData = ChangePasswordSchema.parse(req.body);
    if (generateOtp(req.user.email, req.user.password) !== validatedData.otp) {
      return res.status(400).json({ error: "Invalid OTP!" });
    }
    await prismaClient.user.update({
      where: { id: req.user.id!, deletedAt: null },
      data: { password: validatedData.newPassword }, // Removed hashSync
    });
    return res.status(201).json({ message: "Password updated successfully!" });
  }
);

// *Delete User Route
export const deleteUser = tryCatch(
  async (req: Request<{}, {}, DeleteUserRequest>, res: Response) => {
    const validatedData = DeleteUserSchema.parse(req.body);

    if (validatedData.password !== req.user.password) {
      // Removed compareSync
      return res.status(401).json({ error: "Incorrect password!" });
    }

    await prismaClient.user.update({
      where: { id: req.user.id!, deletedAt: null },
      data: { deletedAt: new Date(), emailVerified: false },
    });

    return res.status(201).json({
      message: `User ${req.user.name} of ID: ${req.user.id} is deleted, Successfully.`,
    });
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

// * Get All Users
// !Admin Only
export const getAllUsers = tryCatch(
  async (req: Request<{}, {}, {}, PageAndLimitRequest>, res: Response) => {
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
        orderBy: {
          createdAt: "desc", // Orders by `createdAt` in descending order (latest first)
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

// *Get User By ID
// !Admin Only
export const getUserById = tryCatch(
  async (req: Request<UserIdRequest>, res: Response) => {
    const user = await prismaClient.user.findFirstOrThrow({
      where: { id: req.params.userId, deletedAt: null },
    });
    return res.status(200).json({ user });
  }
);

// * Search User
// !Admin Only
export const searchUser = tryCatch(
  async (req: Request<{}, {}, {}, SearchQueryRequest>, res: Response) => {
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
    req: Request<UserIdRequest, {}, ChangeUserRoleRequest>,
    res: Response
  ) => {
    if (req.params.userId === req.user.id) {
      return res
        .status(403)
        .json({ message: "User cannot change their own role." });
    }

    const validatedData = ChangeUserRoleSchema.parse(req.body);
    const user = await prismaClient.user.update({
      where: { id: req.params.userId },
      data: validatedData,
    });

    return res.status(200).json({ user });
  }
);
