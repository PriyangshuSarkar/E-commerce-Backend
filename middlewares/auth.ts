import type { NextFunction, Request, Response } from "express";
import { tryCatch } from "../middlewares/tryCatch";
import { verify } from "jsonwebtoken";
import { prismaClient } from "../app";

export const authMiddleware = tryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res
        .status(401)
        .json({ error: "Unauthorized: No token provided!" });
    }

    const token = authHeader;

    const payload = verify(token, process.env.JWT_SECRET!) as {
      userId: string;
    };

    const user = await prismaClient.user.findUniqueOrThrow({
      where: { id: payload.userId, deletedAt: null },
    });

    if (!user) {
      return res.status(401).json({ error: "Unauthorized User!" });
    }

    req.user = user;
    next();
  }
);
