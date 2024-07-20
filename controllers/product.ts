import type { NextFunction, Request, Response } from "express";
import { tryCatch } from "../middlewares/tryCatch";
import { prismaClient } from "../app";

// *Create New Productg
export const createProduct = tryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const product = await prismaClient.product.create({
      data: { ...req.body, tags: req.body.tags.join(",") },
    });
    res.json(product);
  }
);

export const updateProduct = tryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const product = req.body;
    const existingProduct = await prismaClient.product.findFirst({
      where: { id: +req.params.id },
    });
    if (!product || !existingProduct) {
      return res.status(400).json({ error: "Invalid Product id!" });
    }
    if (product.tags) {
      product.tags = product.tags.json(",");
    }
    const updateProduct = await prismaClient.product.update({
      where: { id: +req.params.id },
      data: product,
    });
    res.json(updateProduct);
  }
);

export const deleteProduct = tryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const product = req.body;
    const existingProduct = await prismaClient.product.findFirst({
      where: { id: +req.params.id },
    });
    if (!product || !existingProduct) {
      return res.status(400).json({ error: "Invalid Product id!" });
    }
    const id = req.params.id;
    const name = existingProduct.name;
    await prismaClient.product.delete({
      where: { id: +id },
    });
    res.json(`Product: ${name} deleted of Id: ${id}`);
  }
);

export const listProducts = tryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const count = await prismaClient.product.count();
    const product = await prismaClient.product.findMany({
      skip: +req.query.skip! || 0,
      take: 5,
    });
    res.json({ count, data: product });
  }
);

export const getProductById = tryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const product = req.body;
    const existingProduct = await prismaClient.product.findFirst({
      where: { id: +req.params.id },
    });
    if (!product || !existingProduct) {
      return res.status(400).json({ error: "Invalid Product id!" });
    }
    res.json(existingProduct);
  }
);
