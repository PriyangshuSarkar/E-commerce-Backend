import { array, number, object, string, enum as enum_ } from "zod";

export const OrderItemSchema = object({
  productId: string(),
  quantity: number().min(1),
});

export const CreateOrderSchema = object({
  items: array(OrderItemSchema),
  shippingAddressId: string(),
  billingAddressId: string(),
  status: enum_(["PENDING"]),
});

export const UpdateOrderSchema = object({
  status: enum_(["PENDING", "PROCESSING", "SHIPPED", "DELIVERED"]),
});
