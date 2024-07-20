import type { NextFunction, Request, Response } from "express";
import { tryCatch } from "../middlewares/tryCatch";
import { prismaClient } from "../app";
import { CreateProductSchema, UpdateProductSchema } from "../schemas/product";
import type {
  CreateProductRequest,
  ParamsRequest,
  UpdateProductRequest,
} from "../types/product";

// *Create New Product
export const createProduct = tryCatch(
  async (
    req: Request<{}, {}, CreateProductRequest>,
    res: Response,
    next: NextFunction
  ) => {
    CreateProductSchema.parse(req.body);
    const product = await prismaClient.product.create({
      data: { ...req.body, tags: req.body.tags.join(",") },
    });
    res.json(product);
  }
);

// *Update Product
export const updateProduct = tryCatch(
  async (
    req: Request<ParamsRequest, {}, UpdateProductRequest>,
    res: Response,
    next: NextFunction
  ) => {
    UpdateProductSchema.parse(req.body);
    const product = req.body;
    const existingProduct = await prismaClient.product.findFirst({
      where: { id: +req.params.id! },
    });
    if (!product || !existingProduct) {
      return res.status(400).json({ error: "Invalid Product id!" });
    }
    if (product.tags) {
      product.tags = product.tags.join(",");
    }
    const updateProduct = await prismaClient.product.update({
      where: { id: +req.params.id! },
      data: product,
    });
    res.json(updateProduct);
  }
);

export const deleteProduct = tryCatch(
  async (req: Request<ParamsRequest>, res: Response, next: NextFunction) => {
    const product = req.body;
    const existingProduct = await prismaClient.product.findFirst({
      where: { id: +req.params.id! },
    });
    if (!product || !existingProduct) {
      return res.status(400).json({ error: "Invalid Product id!" });
    }
    const id = req.params.id!;
    const name = existingProduct.name;
    await prismaClient.product.delete({
      where: { id: +id },
    });
    res.json(`Product: ${name} deleted of Id: ${id}`);
  }
);

export const listProducts = tryCatch(
  async (req: Request<ParamsRequest>, res: Response, next: NextFunction) => {
    const count = await prismaClient.product.count();
    const product = await prismaClient.product.findMany({
      skip: +req.query.skip! || 0,
      take: 5,
    });
    res.json({ count, data: product });
  }
);

export const getProductById = tryCatch(
  async (req: Request<ParamsRequest>, res: Response, next: NextFunction) => {
    const product = req.body;
    const existingProduct = await prismaClient.product.findFirst({
      where: { id: +req.params.id! },
    });
    if (!product || !existingProduct) {
      return res.status(400).json({ error: "Invalid Product id!" });
    }
    res.json(existingProduct);
  }
);
