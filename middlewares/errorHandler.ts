import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { unlink } from "node:fs/promises";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.file) {
    unlink(req.file.path).catch((unlinkError) => {
      console.error("Error deleting file:", unlinkError);
    });
  }

  console.error(err);

  let status = err.status || 500;
  let message = err.message || "Internal Server Error";

  if (err instanceof ZodError) {
    message = "Un-processable Entity!";
  }

  res.status(status).json({
    message,
    error: err,
  });
};
