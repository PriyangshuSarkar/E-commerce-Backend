import { number, object, string, enum as enum_, date, preprocess } from "zod";

export const ProductIdSchema = object({
  productId: string().optional(),
});

export const ProductDiscountIdSchema = object({
  productDiscountId: string().optional(),
});

export const CreateProductDiscountSchema = object({
  discount: number(),
  type: enum_(["REGULAR", "FLASH"]),
  validFrom: preprocess(
    (val) => (val ? new Date(val as string | number) : new Date()),
    date()
  ),
  validTo: preprocess(
    (val) => (val ? new Date(val as string | number) : new Date()),
    date()
  ),
});

export const UpdateProductDiscountSchema = object({
  discount: number().optional(),
  type: enum_(["REGULAR", "FLASH"]).optional(),
  validFrom: preprocess(
    (val) => (val ? new Date(val as string | number) : new Date()),
    date()
  ).optional(),
  validTo: preprocess(
    (val) => (val ? new Date(val as string | number) : new Date()),
    date()
  ).optional(),
}).superRefine((data) => {
  const hasValue = Object.values(data).some((value) => value !== undefined);
  if (!hasValue) {
    throw new Error("At least one field must be provided for update.");
  }
  return data;
});

export const CategoryIdSchema = object({
  categoryId: string().optional(),
});

export const CategoryDiscountIdSchema = object({
  categoryDiscountId: string().optional(),
});

export const CreateCategoryDiscountSchema = object({
  discount: number(),
  type: enum_(["REGULAR", "FLASH"]),
  validFrom: preprocess(
    (val) => (val ? new Date(val as string | number) : new Date()),
    date()
  ),
  validTo: preprocess(
    (val) => (val ? new Date(val as string | number) : new Date()),
    date()
  ),
});

export const UpdateCategoryDiscountSchema = object({
  discount: number().optional(),
  type: enum_(["REGULAR", "FLASH"]).optional(),
  validFrom: preprocess(
    (val) => (val ? new Date(val as string | number) : new Date()),
    date()
  ).optional(),
  validTo: preprocess(
    (val) => (val ? new Date(val as string | number) : new Date()),
    date()
  ).optional(),
}).superRefine((data) => {
  const hasValue = Object.values(data).some((value) => value !== undefined);
  if (!hasValue) {
    throw new Error("At least one field must be provided for update.");
  }
  return data;
});
