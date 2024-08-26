import type { infer as infer_ } from "zod";
import type {
  AddCategorySchema,
  CategoryIdSchema,
  CreateProductSchema,
  PageAndLimitSchema,
  ProductIdSchema,
  SearchFilterSortProductsSchema,
  UpdateProductSchema,
} from "../schemas/product";

export type CreateProductRequest = infer_<typeof CreateProductSchema>;

export type UpdateProductRequest = infer_<typeof UpdateProductSchema>;

export type AddCategoryRequest = infer_<typeof AddCategorySchema>;

export type ProductIdRequest = infer_<typeof ProductIdSchema>;

export type CategoryIdRequest = infer_<typeof CategoryIdSchema>;

export type PageAndLimitRequest = infer_<typeof PageAndLimitSchema>;

export type SearchFilterSortProductsRequest = infer_<
  typeof SearchFilterSortProductsSchema
>;
