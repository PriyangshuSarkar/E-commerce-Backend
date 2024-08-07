import type { NextFunction, Request, Response } from "express";

// Middleware to attach file paths to req
export const attachFileData = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const files = req.files as Express.Multer.File[] | undefined;
  req.filePaths = files ? files.map((file) => file.path) : [];

  next();
};
