import express, { json, static as static_, type Express } from "express";
import rootRouter from "./routes";
import { errorHandler } from "./middlewares/errorHandler";
import { PrismaClient } from "@prisma/client";
import logger from "./utils/logger";
import loggerMiddleware from "./middlewares/logger";

const app: Express = express();

app.use(json());
app.use(loggerMiddleware);
app.use("/public", static_("./public"));

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
