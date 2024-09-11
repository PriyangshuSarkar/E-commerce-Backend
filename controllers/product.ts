import type { Request, Response } from "express";
import { tryCatch } from "../middlewares/tryCatch";
import { prismaClient } from "../app";
import { CreateProductSchema, UpdateProductSchema } from "../schemas/product";
import type {
  CreateProductRequest,
  PageAndLimitRequest,
  ProductIdRequest,
  SearchFilterSortProductsRequest,
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
        tags: {
          connectOrCreate: validatedData.tags.map((tag: string) => ({
            where: { name: tag },
            create: { name: tag },
          })),
        },
        images: {
          create: validatedData.imageUrls?.map((url) => ({ url })),
        },
        variants: {
          create: validatedData.variants.map((variant) => ({
            sku: variant.sku,
            size: variant.size,
            price: variant.price,
            stock: variant.stock,
          })),
        },
        createdBy: req.user.id,
      },
      include: { tags: true, images: true, category: true, variants: true },
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
      variants: {
        upsert: validatedData.variants?.map((variant) => ({
          where: { sku: variant.sku },
          update: {
            size: variant.size,
            price: variant.price,
            stock: variant.stock,
          },
          create: {
            sku: variant.sku,
            size: variant.size,
            price: variant.price,
            stock: variant.stock,
          },
        })),
        deleteMany: validatedData.removeVariants?.map((variant) => ({
          sku: variant.sku,
        })),
      },
    };
    const masterFilter =
      req.user.role !== "MASTER" ? { createdBy: req.user.id } : {};

    const updatedProduct = await prismaClient.product.update({
      where: { id: req.params.productId!, ...masterFilter, deletedAt: null },
      data: updateData,
      include: { tags: true, images: true, category: true, variants: true },
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
    const masterFilter =
      req.user.role !== "MASTER" ? { createdBy: req.user.id } : {};
    await prismaClient.$transaction([
      prismaClient.product.update({
        where: { id, ...masterFilter, deletedAt: null },
        data: { deletedAt: new Date() },
      }),
      prismaClient.productVariant.updateMany({
        where: { productId: id },
        data: { deletedAt: new Date() },
      }),
    ]);
    return res.status(200).json({
      message: `Product: ${existingProduct.name} with ID: ${id} has been deleted`,
    });
  }
);

// *List All Products
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
        include: { category: true, tags: true, images: true, variants: true },
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
      include: { category: true, tags: true, images: true, variants: true },
    });
    return res.status(200).json({ existingProduct });
  }
);

// *Search, Filter, and Sort Products
export const searchFilterSortProducts = tryCatch(
  async (
    req: Request<{}, {}, {}, SearchFilterSortProductsRequest>,
    res: Response
  ) => {
    const page = Math.max(1, +req.query.page! || 1);
    const limit = Math.max(1, +req.query.limit! || 5);
    const skip = (page - 1) * limit;

    const searchQuery = req.query.query || "";
    const filters: any = { deletedAt: null };

    // Search filters
    if (searchQuery) {
      filters.OR = [
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
      ];
    }

    // Additional filters
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
          variants: true,
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

// *Search, Filter, and Sort Admin Products
export const searchFilterSortAdminProducts = tryCatch(
  async (
    req: Request<{}, {}, {}, SearchFilterSortProductsRequest>,
    res: Response
  ) => {
    const page = Math.max(1, +req.query.page! || 1);
    const limit = Math.max(1, +req.query.limit! || 5);
    const skip = (page - 1) * limit;

    const searchQuery = req.query.query || "";

    const masterFilter =
      req.user.role !== "MASTER" ? { createdBy: req.user.id } : {};

    const filters: any = { ...masterFilter, deletedAt: null };

    // Search filters
    if (searchQuery) {
      filters.OR = [
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
      ];
    }

    // Additional filters
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
          variants: true,
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
