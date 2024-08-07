import { Decimal } from "@prisma/client/runtime/library";
import {
  instanceof as instanceof_,
  object,
  string,
  enum as enum_,
  number,
} from "zod";

export const CreateOrderSchema = object({
  shippingAddressId: string(),
  billingAddressId: string(),
  status: enum_(["PENDING"]),
});

export const UpdateOrderSchema = object({
  status: enum_(["PENDING", "PROCESSING", "SHIPPED", "DELIVERED"]),
});

export const ProductWithPriceSchema = object({
  id: string(),
  name: string(),
  price: instanceof_(Decimal),
});

export const CartItemWithProductSchema = object({
  id: string(),
  productId: string(),
  product: ProductWithPriceSchema,
  quantity: number().int().positive(),
});

export const OrderIdSchema = object({
  orderId: string().optional(),
});

export const PageAndLimitSchema = object({
  page: string().optional(),
  limit: string().optional(),
});
