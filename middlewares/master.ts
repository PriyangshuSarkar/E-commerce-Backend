import type { NextFunction, Request, Response } from "express";
import { tryCatch } from "./tryCatch";

export const masterMiddleware = tryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (user.role == "MASTER") {
      next();
    } else {
      return res.status(401).json({ error: "Unauthorized User!" });
    }
  }
);
