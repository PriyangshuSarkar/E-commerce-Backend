import type { Request, Response } from "express";
import { tryCatch } from "../middlewares/tryCatch";
import { prismaClient } from "../app";
import {
  CategoryDiscountIdRequest,
  CategoryIdRequest,
  CreateCategoryDiscountRequest,
  CreateProductDiscountRequest,
  ProductDiscountIdRequest,
  ProductIdRequest,
  UpdateCategoryDiscountRequest,
  UpdateProductDiscountRequest,
} from "../types/discount";
import {
  CreateCategoryDiscountSchema,
  CreateProductDiscountSchema,
  UpdateCategoryDiscountSchema,
  UpdateProductDiscountSchema,
} from "../schemas/discount";

// *Get All Product Discount Based on Product ID
export const getProductDiscount = tryCatch(
  async (req: Request<ProductIdRequest>, res: Response) => {
    const productId = req.params.productId;
    const newProductDiscount = await prismaClient.productDiscount.findMany({
      where: { productId },
    });
    return res.status(201).json({ newProductDiscount });
  }
);

// *Create Product Discount
export const createProductDiscount = tryCatch(
  async (
    req: Request<ProductIdRequest, {}, CreateProductDiscountRequest>,
    res: Response
  ) => {
    const productId = req.params.productId;
    const validatedDate = CreateProductDiscountSchema.parse(req.body);
    const newProductDiscount = await prismaClient.productDiscount.create({
      data: {
        productId: productId!,
        discount: validatedDate.discount,
        type: validatedDate.type,
        validFrom: validatedDate.validFrom,
        validTo: validatedDate.validTo,
      },
    });
    return res.status(201).json({ newProductDiscount });
  }
);

// *Update Product Discount
export const updateProductDiscount = tryCatch(
  async (
    req: Request<ProductDiscountIdRequest, {}, UpdateProductDiscountRequest>,
    res: Response
  ) => {
    const productDiscountId = req.params.productDiscountId;
    const validatedDate = UpdateProductDiscountSchema.parse(req.body);
    const updatedProductDiscount = await prismaClient.productDiscount.update({
      where: { id: productDiscountId },
      data: {
        discount: validatedDate.discount,
        type: validatedDate.type,
        validFrom: validatedDate.validFrom,
        validTo: validatedDate.validTo,
        deletedAt: null,
      },
    });
    return res.status(201).json({ updatedProductDiscount });
  }
);

//  *Delete Product Discount
export const deleteProductDiscount = tryCatch(
  async (req: Request<ProductDiscountIdRequest>, res: Response) => {
    const productDiscountId = req.params.productDiscountId;
    const deletedProductDiscount = await prismaClient.productDiscount.update({
      where: { id: productDiscountId },
      data: { deletedAt: new Date() },
    });
    return res.status(201).json({ deletedProductDiscount });
  }
);

// *Get All Category Discount Based on Category ID
export const getCategoryDiscount = tryCatch(
  async (
    req: Request<CategoryIdRequest, {}, CreateCategoryDiscountRequest>,
    res: Response
  ) => {
    const categoryId = req.params.categoryId;
    const newCategoryDiscount = await prismaClient.categoryDiscount.findMany({
      where: { categoryId },
    });
    return res.status(201).json({ newCategoryDiscount });
  }
);

// *Create Category Discount
export const createCategoryDiscount = tryCatch(
  async (
    req: Request<CategoryIdRequest, {}, CreateCategoryDiscountRequest>,
    res: Response
  ) => {
    const categoryId = req.params.categoryId;
    const validatedDate = CreateCategoryDiscountSchema.parse(req.body);
    const newCategoryDiscount = await prismaClient.categoryDiscount.create({
      data: {
        categoryId: categoryId!,
        discount: validatedDate.discount,
        type: validatedDate.type,
        validFrom: validatedDate.validFrom,
        validTo: validatedDate.validTo,
      },
    });
    return res.status(201).json({ newCategoryDiscount });
  }
);

// *Update Category Discount
export const updateCategoryDiscount = tryCatch(
  async (
    req: Request<CategoryDiscountIdRequest, {}, UpdateCategoryDiscountRequest>,
    res: Response
  ) => {
    const categoryDiscountId = req.params.categoryDiscountId;
    const validatedDate = UpdateCategoryDiscountSchema.parse(req.body);
    const updatedCategoryDiscount = await prismaClient.categoryDiscount.update({
      where: { id: categoryDiscountId },
      data: {
        discount: validatedDate.discount,
        type: validatedDate.type,
        validFrom: validatedDate.validFrom,
        validTo: validatedDate.validTo,
        deletedAt: null,
      },
    });
    return res.status(201).json({ updatedCategoryDiscount });
  }
);

// *Delete Category Discount
export const deleteCategoryDiscount = tryCatch(
  async (req: Request<CategoryDiscountIdRequest>, res: Response) => {
    const categoryDiscountId = req.params.categoryDiscountId;
    const deletedCategoryDiscount = await prismaClient.categoryDiscount.update({
      where: { id: categoryDiscountId },
      data: { deletedAt: new Date() },
    });
    return res.status(201).json({ deletedCategoryDiscount });
  }
);
