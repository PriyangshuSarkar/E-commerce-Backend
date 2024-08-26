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

export const PaymentVerificationSchema = object({
  razorpay_order_id: string(),
  razorpay_payment_id: string(),
  razorpay_signature: string(),
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
  productVariantId: string(), // Updated to use productVariantId
  productVariant: object({
    id: string(),
    productId: string(),
    product: object({
      id: string(),
      name: string(),
    }),
    price: instanceof_(Decimal),
  }),
  quantity: number().int().positive(),
});

export const OrderIdSchema = object({
  orderId: string().optional(),
});

export const PageAndLimitSchema = object({
  page: string().optional(),
  limit: string().optional(),
});
