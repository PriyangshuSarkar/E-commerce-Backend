import express, { type Express } from "express";
import rootRouter from "./routes";
import { errorHandler } from "./middlewares/errorHandler";
import { PrismaClient } from "@prisma/client";
import morgan from "morgan";
import { SignUpSchema } from "./schemas/auth";

// import type { NextFunction, Request, Response } from "express";
// import { tryCatch } from "./middlewares/tryCatch";

const app: Express = express();

// *prismaClient
export const prismaClient = new PrismaClient({
  log: ["query"],
});

// *use
app.use(express.json());
app.use(morgan("dev"));
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
