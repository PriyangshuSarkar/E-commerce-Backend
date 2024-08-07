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
  CategoryIdRequest,
  CreateProductRequest,
  FilterAndSortProductsRequest,
  PageAndLimitRequest,
  ProductIdRequest,
  SearchQueryRequest,
  UpdateProductRequest,
} from "../types/product";

// *Create New Product
// !Admin Only
export const createProduct = tryCatch(
  async (req: Request<{}, {}, CreateProductRequest>, res: Response) => {
    const files = req.files as Express.Multer.File[] | undefined;
    const imageUrls = files ? files.map((file) => file.path) : [];

    const validatedData = CreateProductSchema.parse({ ...req.body, imageUrls });

    const product = await prismaClient.product.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        categoryId: validatedData.categoryId,
        price: validatedData.price,
        stock: validatedData.stock,
        sku: validatedData.sku,
        tags: {
          connectOrCreate: validatedData.tags.map((tags: string) => ({
            where: { name: tags },
            create: { name: tags },
          })),
        },
        images: {
          create: validatedData.imageUrls?.map((url) => ({ url })),
        },
      },
      include: { tags: true, images: true, category: true },
    });
    return res.status(201).json({ product });
  }
);

// *Update Product
// !Admin Only
export const updateProduct = tryCatch(
  async (
    req: Request<ProductIdRequest, {}, UpdateProductRequest>,
    res: Response
  ) => {
    if (!req.params.productId) {
      return res.status(400).json({ error: "Product ID Invalid" });
    }

    const files = req.files as Express.Multer.File[] | undefined;
    const imageUrls = files ? files.map((file) => file.path) : [];

    const validatedData = UpdateProductSchema.parse({ ...req.body, imageUrls });

    const updateData: any = {
      name: validatedData.name,
      description: validatedData.description,
      categoryId: validatedData.categoryId,
      price: validatedData.price,
      stock: validatedData.stock,
      sku: validatedData.sku,
      images: {
        deleteMany: validatedData.removeImageUrls?.length
          ? {
              id: { in: validatedData.removeImageUrls },
            }
          : undefined,
        create: validatedData.imageUrls?.map((url) => ({ url })),
      },
      tags: {
        disconnect:
          validatedData.removeTags?.map((tag: string) => ({
            name: tag,
          })) || [],
        connect:
          validatedData.tags?.map((tag: string) => ({
            name: tag,
          })) || [],
      },
    };

    const updatedProduct = await prismaClient.product.update({
      where: { id: req.params.productId!, deletedAt: null },
      data: updateData,
      include: { tags: true, images: true, category: true },
    });

    return res.status(200).json({ updatedProduct });
  }
);

// *Delete Product
// !Admin Only
export const deleteProduct = tryCatch(
  async (req: Request<ProductIdRequest>, res: Response) => {
    const id = req.params.productId!;
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
  async (req: Request<{}, {}, {}, PageAndLimitRequest>, res: Response) => {
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
        include: { category: true, tags: true, images: true },
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
  async (req: Request<ProductIdRequest>, res: Response) => {
    const id = req.params.productId!;

    const existingProduct = await prismaClient.product.findFirstOrThrow({
      where: { id, deletedAt: null },
      include: { category: true, tags: true, images: true },
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
      return res.status(200).json({ existingCategory });
    }
    const newCategory = await prismaClient.category.create({
      data: { name: validatedData.category },
    });
    return res.status(200).json({ newCategory });
  }
);

// *Add Category
// !Admin Only
export const getAllCategories = tryCatch(
  async (req: Request, res: Response) => {
    const allCategories = await prismaClient.category.findMany({});
    return res.status(200).json({ allCategories });
  }
);

// *Delete Category
// !Admin Only
export const deleteCategory = tryCatch(
  async (req: Request<CategoryIdRequest>, res: Response) => {
    const existingCategory = await prismaClient.category.findFirst({
      where: { id: req.params.categoryId },
    });
    await prismaClient.category.delete({
      where: { id: req.params.categoryId },
    });
    return res
      .status(200)
      .json({ message: `category ${existingCategory?.name} is deleted` });
  }
);

// *Search Products
export const searchProducts = tryCatch(
  async (req: Request<{}, {}, {}, SearchQueryRequest>, res: Response) => {
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
          images: true,
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
          images: true,
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
