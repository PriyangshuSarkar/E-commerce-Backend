// src/middleware/loggerMiddleware.ts
import type { Request, Response, NextFunction } from "express";
import logger from "../utils/logger";

const loggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Log incoming request
  logger.info(`Incoming Request: ${req.method} ${req.originalUrl}`);

  // Capture the start time
  const start = process.hrtime();

  // Capture the original send method
  const originalSend = res.send.bind(res);

  // Override the send method to log response details
  res.send = (body: any) => {
    const elapsed = process.hrtime(start);
    const milliseconds = (elapsed[0] * 1000 + elapsed[1] / 1e6).toFixed(2);
    logger.info(`Outgoing Response: ${res.statusCode} / ${milliseconds}ms`);

    // Call the original send method
    return originalSend(body);
  };

  next();
};

export default loggerMiddleware;
