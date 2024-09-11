import { infer as infer_ } from "zod";
import {
  CategoryDiscountIdSchema,
  CategoryIdSchema,
  CreateCategoryDiscountSchema,
  CreateProductDiscountSchema,
  ProductDiscountIdSchema,
  ProductIdSchema,
  UpdateCategoryDiscountSchema,
  UpdateProductDiscountSchema,
} from "../schemas/discount";

export type ProductIdRequest = infer_<typeof ProductIdSchema>;

export type ProductDiscountIdRequest = infer_<typeof ProductDiscountIdSchema>;

export type CreateProductDiscountRequest = infer_<
  typeof CreateProductDiscountSchema
>;

export type UpdateProductDiscountRequest = infer_<
  typeof UpdateProductDiscountSchema
>;

export type CategoryIdRequest = infer_<typeof CategoryIdSchema>;

export type CategoryDiscountIdRequest = infer_<typeof CategoryDiscountIdSchema>;

export type CreateCategoryDiscountRequest = infer_<
  typeof CreateCategoryDiscountSchema
>;

export type UpdateCategoryDiscountRequest = infer_<
  typeof UpdateCategoryDiscountSchema
>;
