import type { Request, Response } from "express";
import { tryCatch } from "../middlewares/tryCatch";
import { AddItemToCartSchema } from "../schemas/cart";
import type { AddItemToCartRequest } from "../types/cart";
import { prismaClient } from "../app";

export const addItemToCart = tryCatch(
  async (req: Request, res: Response) => {}
);

export const deleteItemFromCart = tryCatch(
  async (req: Request, res: Response) => {}
);

export const changeQuantity = tryCatch(
  async (req: Request, res: Response) => {}
);

export const getCart = tryCatch(async (req: Request, res: Response) => {});
