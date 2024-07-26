import type { Request, Response } from "express";
import { tryCatch } from "../middlewares/tryCatch";
import { prismaClient } from "../app";
import {
  AddCategorySchema,
  CreateProductSchema,
  UpdateProductSchema,
} from "../schemas/product";
import type {
  AddCategoryRequest,
  CreateProductRequest,
  UpdateProductRequest,
} from "../types/product";

// *Create New Product
export const createProduct = tryCatch(
  async (req: Request<{}, {}, CreateProductRequest>, res: Response) => {
    const validatedData = CreateProductSchema.parse(req.body);
    // Create the product
    const product = await prismaClient.product.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        categoryId: validatedData.categoryId,
        price: validatedData.price,
        imageUrl: validatedData.imageUrl,
        stock: validatedData.stock,
        sku: validatedData.sku,
        tags: {
          connectOrCreate: validatedData.tags.map((tags: string) => ({
            where: { name: tags },
            create: { name: tags },
          })),
        },
      },
      include: { tags: true },
    });
    return res.status(201).json({ product });
  }
);

// *Update Product
export const updateProduct = tryCatch(
  async (
    req: Request<{ id?: string }, {}, UpdateProductRequest>,
    res: Response
  ) => {
    const validatedData = UpdateProductSchema.parse(req.body);
    const updateData: any = {
      name: validatedData.name,
      description: validatedData.description,
      categoryId: validatedData.categoryId,
      price: validatedData.price,
      imageUrl: validatedData.imageUrl,
      stock: validatedData.stock,
      sku: validatedData.sku,
    };

    if (validatedData.tags) {
      updateData.tags = {
        connectOrCreate: validatedData.tags.map((tags: string) => ({
          where: { name: tags },
          create: { name: tags },
        })),
      };
    }
    // Update the product
    const updatedProduct = await prismaClient.product.update({
      where: { id: req.params.id!, deletedAt: null },

      data: updateData,
      include: { tags: true },
    });

    return res.status(200).json({ updatedProduct });
  }
);

// *Delete Product
export const deleteProduct = tryCatch(
  async (req: Request<{ id?: string }>, res: Response) => {
    const id = req.params.id!;
    const existingProduct = await prismaClient.product.findUniqueOrThrow({
      where: { id, deletedAt: null },
    });
    await prismaClient.product.update({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    return res.status(200).json({
      message: `Product: ${existingProduct.name} with ID: ${id} has been deleted`,
    });
  }
);

// *ListAllProducts
export const listProducts = tryCatch(
  async (
    req: Request<{}, {}, {}, { page?: string; limit?: string }>,
    res: Response
  ) => {
    const page = +req.query.page! || 1;
    const limit = +req.query.limit! || 5;
    if (page <= 0 || limit <= 0) {
      return res
        .status(400)
        .json({ error: "Page and limit must be positive integers." });
    }
    const skip = (page - 1) * limit;

    const [count, products] = await prismaClient.$transaction([
      prismaClient.product.count({ where: { deletedAt: null } }),
      prismaClient.product.findMany({
        skip,
        take: limit,
        where: { deletedAt: null },
      }),
    ]);
    const totalPages = Math.ceil(count / limit);
    return res.status(200).json({
      products,
      currentPage: page,
      totalPages,
      totalCount: count,
    });
  }
);

// *GetProductById
export const getProductById = tryCatch(
  async (req: Request<{ id?: string }>, res: Response) => {
    const id = req.params.id!;

    const existingProduct = await prismaClient.product.findUniqueOrThrow({
      where: { id, deletedAt: null },
    });
    return res.status(200).json({ existingProduct });
  }
);

export const addCategory = tryCatch(
  async (req: Request<{}, {}, AddCategoryRequest>, res: Response) => {
    const validatedData = AddCategorySchema.parse(req.body);
    const existingCategory = await prismaClient.category.findUnique({
      where: { name: validatedData.category },
    });
    if (existingCategory) {
      return res.status(400).json({ message: "Category already exists" });
    }
    const newCategory = await prismaClient.category.create({
      data: { name: validatedData.category },
    });
    return res
      .status(200)
      .json({ message: `Category ${validatedData.category} is created` });
  }
);
export const deleteCategory = tryCatch(
  async (req: Request<{ id?: string }>, res: Response) => {
    const existingCategory = await prismaClient.category.findUnique({
      where: { id: req.params.id },
    });
    await prismaClient.category.delete({
      where: { id: req.params.id },
    });
    return res
      .status(200)
      .json({ message: `category ${existingCategory?.name} is deleted` });
  }
);
