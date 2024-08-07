import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { unlink } from "node:fs/promises";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
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
  // Clean up uploaded files if any
  if (req.filePaths && req.filePaths.length > 0) {
    cleanupFiles(req.filePaths).finally(() => {
      res.status(status).json({
        message,
        error: err,
      });
    });
  } else {
    res.status(status).json({
      message,
      error: err,
    });
  }
};

// Function to clean up files
async function cleanupFiles(filePaths: string[]) {
  for (const filePath of filePaths) {
    try {
      await unlink(filePath);
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  }
}
