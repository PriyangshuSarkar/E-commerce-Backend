import type { Request, Response, NextFunction } from "express";

export type controllerType = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void | Response<any, Record<string, any>>>;

export const tryCatch = (func: controllerType) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await Promise.resolve(func(req, res, next));
    } catch (error) {
      next(error); // Pass the error to the next middleware
    }
  };
};
