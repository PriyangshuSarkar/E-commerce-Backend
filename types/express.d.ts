import { User } from "@prisma/client";
import express from "express";

declare module "express-serve-static-core" {
  interface Request {
    user: User;
    filePaths?: string[];
    shiprocketToken: string;
  }
}
