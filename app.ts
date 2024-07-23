import express, { type Express } from "express";
import rootRouter from "./routes";
import { errorHandler } from "./middlewares/errorHandler";
import { PrismaClient } from "@prisma/client";
import logger from "./logger";

// import type { NextFunction, Request, Response } from "express";
// import { tryCatch } from "./middlewares/tryCatch";

const app: Express = express();

app.use((req, res, next) => {
  const start = Date.now();
  logger.info(`Request: ${req.method} ${req.url}`);
  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.info(`Response: ${res.statusCode} Duration: ${duration}ms`);
  });
  next();
});

// *prismaClient
export const prismaClient = new PrismaClient({});

// *use
app.use(express.json());
app.use("/api", rootRouter);
app.use(errorHandler);
// app.get("/", (req: Request, res: Response, next: NextFunction) => {
//   res.send("Working");
// });

// *Server Start
app.listen(process.env.PORT, (err?: any) => {
  if (err) {
    console.log(`Server failed to start with the error:\n${err}`);
  } else {
    console.log(`App working at http://localhost:${process.env.PORT}`);
  }
});
