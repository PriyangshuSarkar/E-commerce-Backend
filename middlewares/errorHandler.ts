import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { rm } from "fs";

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

  // Clean up uploaded files if any
  if (req.filePaths && req.filePaths.length > 0) {
    cleanupFiles(req.filePaths).finally(() => {
      return res.status(status).json({
        message,
        error: err,
      });
    });
  } else {
    return res.status(status).json({
      message,
      error: err,
    });
  }
  return res.status(status).json({
    message,
    error: err,
  });
};

// Function to clean up files
async function cleanupFiles(filePaths: string[]) {
  for (const filePath of filePaths) {
    try {
      await rm(filePath, () => console.log("Deleted"));
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  }
}
