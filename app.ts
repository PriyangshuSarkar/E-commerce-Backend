import express, { type Express } from "express";
import rootRouter from "./routes";
import { errorHandler } from "./middlewares/errorHandler";
import { PrismaClient } from "@prisma/client";

// import type { NextFunction, Request, Response } from "express";
// import { tryCatch } from "./middlewares/tryCatch";

const app: Express = express();

const PORT = process.env.PORT;

export const prismaClient = new PrismaClient({
  log: ["query"],
});

app.listen(PORT, (err?: any) => {
  if (err) {
    console.log(`Server failed to start with the error:\n${err}`);
  } else {
    console.log(`App working at port: ${PORT}`);
  }
});

// app.get("/", (req: Request, res: Response, next: NextFunction) => {
//   res.send("Working");
// });

app.use("/api", rootRouter);

app.use(errorHandler);
