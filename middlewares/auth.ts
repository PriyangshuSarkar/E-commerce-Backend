import type { NextFunction, Request, Response } from "express";
import { tryCatch } from "../middlewares/tryCatch";
import { verify } from "jsonwebtoken";
import { prismaClient } from "../app";

export const authMiddleware = tryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer")) {
      return res
        .status(401)
        .json({ error: "Unauthorized: No token provided!" });
    }

    const token = authHeader.split("")[1];

    const payload = verify(token, process.env.JWT_SECRET!) as {
      userId: number;
    };

    const user = await prismaClient.user.findFirst({
      where: { id: payload.userId },
    });

    if (!user) {
      return res.status(401).json({ error: "Unauthorized User!" });
    }

    req.user = user;
    next();
  }
);
