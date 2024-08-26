import type { NextFunction, Request, Response } from "express";
import { tryCatch } from "./tryCatch";
import { ShiprocketAuthResponse } from "../types/shiprocketAuth";

export const shiprocketAuth = tryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const response = await fetch(
      "https://apiv2.shiprocket.in/v1/external/auth/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: process.env.SHIPROCKET_EMAIL,
          password: process.env.SHIPROCKET_PASSWORD,
        }),
      }
    );

    const data = (await response.json()) as ShiprocketAuthResponse;

    req.shiprocketToken = data.token;

    next();
  }
);
