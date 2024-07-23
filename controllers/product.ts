import type { Request, Response } from "express";
import { tryCatch } from "../middlewares/tryCatch";
import { prismaClient } from "../app";
import { CreateProductSchema, UpdateProductSchema } from "../schemas/product";
import type {
  CreateProductRequest,
  UpdateProductRequest,
} from "../types/product";

// *Create New Product
export const createProduct = tryCatch(
  async (req: Request<{}, {}, CreateProductRequest>, res: Response) => {
    CreateProductSchema.parse(req.body);
    const product = await prismaClient.product.create({
      data: { ...req.body, tags: req.body.tags.join(",") },
    });
    return res.status(201).json({ product });
  },
);

// *Update Product
export const updateProduct = tryCatch(
  async (
    req: Request<{ id?: string }, {}, UpdateProductRequest>,
    res: Response,
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
    return res.status(201).json({ updateProduct });
  },
);

// *Delete Product
export const deleteProduct = tryCatch(
  async (req: Request<{ id?: string }>, res: Response) => {
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
    return res
      .status(200)
      .json({ message: `Product: ${name} deleted of Id: ${id}` });
  },
);

// *ListAllProducts
export const listProducts = tryCatch(async (req: Request, res: Response) => {
  const count = await prismaClient.product.count();
  const product = await prismaClient.product.findMany({
    skip: +req.query.skip! || 0,
    take: 5,
  });
  return res.status(200).json({ count, data: product });
});

// *GetProductById
export const getProductById = tryCatch(
  async (req: Request<{ id?: string }>, res: Response) => {
    const product = req.body;
    const existingProduct = await prismaClient.product.findFirst({
      where: { id: +req.params.id! },
    });
    if (!product || !existingProduct) {
      return res.status(400).json({ error: "Invalid Product id!" });
    }
    return res.status(200).json({ existingProduct });
  },
);
