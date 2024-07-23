import express, {
  type Express,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import rootRouter from "./routes";
import { errorHandler } from "./middlewares/errorHandler";
import { PrismaClient } from "@prisma/client";
import logger from "./utils/logger";
import loggerMiddleware from "./middlewares/logger";

const app: Express = express();

app.use(express.json());
app.use(loggerMiddleware);

// *prismaClient
export const prismaClient = new PrismaClient({});

// *use
app.use("/api", rootRouter);

app.use(errorHandler);

// *Server Start
app.listen(process.env.PORT, (err?: any) => {
  if (err) {
    console.log(`Server failed to start with the error:\n${err}`);
  } else {
    console.log(`App working at http://localhost:${process.env.PORT}`);
  }
});
