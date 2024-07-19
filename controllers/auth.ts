import type { NextFunction, Request, Response } from "express";
import { tryCatch } from "../middlewares/tryCatch";

export const signup = tryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    res.send("signup route works!");
  }
);

export const login = tryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    res.send("login route works!");
  }
);
