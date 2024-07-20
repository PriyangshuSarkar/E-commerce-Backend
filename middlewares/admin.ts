import type { NextFunction, Request, Response } from "express";
import { tryCatch } from "./tryCatch";

export const adminMiddleware = tryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (user.role == "ADMIN") {
      next();
    } else {
      return res.status(401).json({ error: "Unauthorized User!" });
    }
  }
);
