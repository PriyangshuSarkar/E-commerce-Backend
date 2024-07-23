import type { NextFunction, Request, Response } from "express";
import { tryCatch } from "../middlewares/tryCatch";
import type { LoginRequest, SignupRequest } from "../types/user";
import { prismaClient } from "../app";
import { hashSync, compareSync } from "bcrypt";
import { sign } from "jsonwebtoken";
import { LoginSchema, SignupSchema } from "../schemas/user";
import type { Address } from "@prisma/client";

// *Signup Route
export const signup = tryCatch(
  async (req: Request<{}, {}, SignupRequest>, res: Response) => {
    SignupSchema.parse(req.body);
    const { email, password, name } = req.body;

    const user = await prismaClient.user.findFirst({ where: { email } });

    if (user) {
      return res.status(400).json({ error: "User already exists!" });
    }

    const newUser = await prismaClient.user.create({
      data: {
        name,
        email,
        password: hashSync(password, 10),
      },
    });

    const { password: _, ...userWithoutPassword } = newUser;

    const token = sign({ userId: newUser.id }, process.env.JWT_SECRET!, {
      expiresIn: process.env.JWT_EXPIRATION_TIME!,
    });

    return res.status(201).json({ user: userWithoutPassword, token });
  },
);

// *Login Route
export const login = tryCatch(
  async (req: Request<{}, {}, LoginRequest>, res: Response) => {
    LoginSchema.parse(req.body);
    const { email, password } = req.body;

    const user = await prismaClient.user.findFirst({ where: { email } });

    if (!user) {
      return res.status(404).json({ error: "User doesn't exist!" });
    }

    if (!compareSync(password, user.password)) {
      return res.status(401).json({ error: "Incorrect password!" });
    }

    const { password: _, ...userWithoutPassword } = user;

    const token = sign({ userId: user.id }, process.env.JWT_SECRET!, {
      expiresIn: process.env.JWT_EXPIRATION_TIME!,
    });

    return res.status(200).json({ user: userWithoutPassword, token });
  },
);

// *Me Route
export const me = tryCatch(async (req: Request, res: Response) => {
  return res.json(req.user);
});
