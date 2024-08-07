import { number, object, string } from "zod";

export const ProductIdSchema = object({
  productId: string().optional(),
});

export const ProductQuantitySchema = object({
  productQuantity: number().optional(),
  productQuantityChange: number().optional(),
});

export const CartItemIdSchema = object({
  cartItemId: string().optional(),
});
