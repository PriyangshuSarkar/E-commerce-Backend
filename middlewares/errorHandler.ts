import type { Request, Response, NextFunction } from "express";
import type { CustomError } from "../types/error";

export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err);

  const status = err.status || 500;
  const message = err.message || "Internal Server Error";

  res.status(status).json({
    status,
    message,
  });
};
