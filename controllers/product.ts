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
  FilterAndSortProductsRequest,
  UpdateProductRequest,
} from "../types/product";
import { error } from "winston";

// *Create New Product
// !Admin Only
export const createProduct = tryCatch(
  async (req: Request<{}, {}, CreateProductRequest>, res: Response) => {
    // console.log(req.body);
    // console.log(req.file);
    // throw error;
    const imageUrl = req.file?.path;
    const validatedData = CreateProductSchema.parse({ ...req.body, imageUrl });

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
// !Admin Only
export const updateProduct = tryCatch(
  async (
    req: Request<{ id?: string }, {}, UpdateProductRequest>,
    res: Response
  ) => {
    const imageUrl = req.file?.path;
    const validatedData = UpdateProductSchema.parse({ ...req.body, imageUrl });

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
// !Admin Only
export const deleteProduct = tryCatch(
  async (req: Request<{ id?: string }>, res: Response) => {
    const id = req.params.id!;
    const existingProduct = await prismaClient.product.findFirstOrThrow({
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

    const existingProduct = await prismaClient.product.findFirstOrThrow({
      where: { id, deletedAt: null },
    });
    return res.status(200).json({ existingProduct });
  }
);

// *Add Category
// !Admin Only
export const addCategory = tryCatch(
  async (req: Request<{}, {}, AddCategoryRequest>, res: Response) => {
    const validatedData = AddCategorySchema.parse(req.body);
    const existingCategory = await prismaClient.category.findFirst({
      where: { name: validatedData.category },
    });
    if (existingCategory) {
      return res.status(400).json({ error: "Category already exists" });
    }
    const newCategory = await prismaClient.category.create({
      data: { name: validatedData.category },
    });
    return res
      .status(200)
      .json({ message: `Category ${validatedData.category} is created` });
  }
);

// *Delete Product
// !Admin Only
export const deleteCategory = tryCatch(
  async (req: Request<{ id?: string }>, res: Response) => {
    const existingCategory = await prismaClient.category.findFirst({
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

// *Search Products
export const searchProducts = tryCatch(
  async (
    req: Request<{}, {}, {}, { query?: string; page?: string; limit?: string }>,
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
    const searchQuery = req.query.query || "";

    const filters = {
      OR: [
        {
          name: {
            contains: searchQuery,
          },
        },
        {
          description: {
            contains: searchQuery,
          },
        },
        {
          category: {
            name: {
              contains: searchQuery,
            },
          },
        },
        {
          tags: {
            some: {
              name: {
                contains: searchQuery,
              },
            },
          },
        },
      ],
      deletedAt: null,
    };
    const [count, products] = await prismaClient.$transaction([
      prismaClient.product.count({ where: filters }),
      prismaClient.product.findMany({
        skip,
        take: limit,
        where: filters,
        include: {
          category: true,
          tags: true,
        },
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

// *Filter and Sort Products
export const filterAndSortProducts = tryCatch(
  async (
    req: Request<{}, {}, {}, FilterAndSortProductsRequest>,
    res: Response
  ) => {
    const page = Math.max(1, +req.query.page! || 1);
    const limit = Math.max(1, +req.query.limit! || 5);
    const skip = (page - 1) * limit;

    const filters: any = { deletedAt: null };

    if (req.query.category) {
      filters.categoryId = req.query.category;
    }

    if (req.query.tags) {
      const tagNames = Array.isArray(req.query.tags)
        ? req.query.tags
        : [req.query.tags];
      filters.tags = {
        some: {
          name: { in: tagNames },
        },
      };
    }

    if (req.query.minPrice) {
      filters.price = { gte: +req.query.minPrice };
    }

    if (req.query.maxPrice) {
      filters.price = { ...filters.price, lte: +req.query.maxPrice };
    }

    const sortBy = req.query.sortBy || "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? "asc" : "desc";

    const [count, products] = await prismaClient.$transaction([
      prismaClient.product.count({ where: filters }),
      prismaClient.product.findMany({
        skip,
        take: limit,
        where: filters,
        orderBy: { [sortBy]: sortOrder },
        include: {
          category: true,
          tags: true,
        },
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
