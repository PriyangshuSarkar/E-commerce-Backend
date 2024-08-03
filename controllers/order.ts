import type { Request, Response } from "express";
import { tryCatch } from "../middlewares/tryCatch";
import type { CreateOrderRequest, UpdateOrderRequest } from "../types/order";
import { CreateOrderSchema, UpdateOrderSchema } from "../schemas/order";
import { prismaClient } from "../app";

// *Create New Order
// !Admin Only
export const createOrder = tryCatch(
  async (req: Request<{}, {}, CreateOrderRequest>, res: Response) => {
    const result = await prismaClient.$transaction(async (prisma) => {
      const validatedData = CreateOrderSchema.parse(req.body);

      let totalAmount = 0.0;

      // Fetch prices from the database
      const itemsWithPrices = await Promise.all(
        validatedData.items.map(async (item) => {
          const product = await prisma.product.findFirstOrThrow({
            where: { id: item.productId },
            select: { price: true },
          });
          totalAmount += +product.price * item.quantity;
          return {
            productId: item.productId,
            quantity: item.quantity,
            price: product.price,
          };
        })
      );

      const order = await prismaClient.order.create({
        data: {
          userId: req.user.id,
          shippingAddressId: validatedData.shippingAddressId,
          billingAddressId: validatedData.billingAddressId,
          totalAmount: totalAmount,
          status: validatedData.status,
          items: {
            create: itemsWithPrices.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        },
      });
      await Promise.all(
        validatedData.items.map(async (item) => {
          await prisma.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          });
        })
      );

      return order;
    });

    return res.status(201).json({ result });
  }
);

// *Update Order
// !Admin Only
export const updateOrder = tryCatch(
  async (
    req: Request<{ id?: string }, {}, UpdateOrderRequest>,
    res: Response
  ) => {
    const order = await prismaClient.order.findFirstOrThrow({
      where: { id: req.params.id },
    });
    if (order.status === "CANCELLED") {
      return res.status(400).json({ error: "Order is already cancelled." });
    }
    const validatedData = UpdateOrderSchema.parse(req.body);
    const updatedOrder = await prismaClient.order.update({
      where: { id: req.params.id },
      data: { status: validatedData.status },
    });
    return res.status(200).json({ updatedOrder });
  }
);

// *Get All Orders
// !Admin Only
export const getAllOrders = tryCatch(
  async (
    req: Request<{}, {}, {}, { page?: string; limit?: string }>,
    res: Response
  ) => {
    const page = +req.query.page! || 1;
    const limit = +req.query.limit! || 5;
    if (page <= 0 || limit <= 0) {
      return res
        .status(400)
        .json({ error: "Page and limit must be positive integers." });
    }
    const skip = (page - 1) * limit;

    const orderFilter =
      req.user.role !== "ADMIN" ? { userId: req.user.id } : {};

    const [count, orders] = await prismaClient.$transaction([
      prismaClient.order.count({ where: orderFilter }),
      prismaClient.order.findMany({
        skip,
        take: limit,
        where: orderFilter,
        include: {
          items: true,
          shippingAddress: true,
          billingAddress: true,
          user: true,
        },
      }),
    ]);

    const totalPages = Math.ceil(count / limit);
    return res.status(200).json({
      orders,
      currentPage: page,
      totalPages,
      totalCount: count,
    });
  }
);

// *Get Order By ID
// !Admin Only or Order Owner
export const getOrderById = tryCatch(
  async (
    req: Request<{ id?: string }, {}, {}, { page?: string; limit?: string }>,
    res: Response
  ) => {
    const page = +req.query.page! || 1;
    const limit = +req.query.limit! || 5;
    if (page <= 0 || limit <= 0) {
      return res
        .status(400)
        .json({ error: "Page and limit must be positive integers." });
    }
    const order = await prismaClient.order.findFirstOrThrow({
      where:
        req.user.role !== "ADMIN"
          ? { id: req.params.id, userId: req.user.id }
          : { id: req.params.id },
      include: {
        items: true,
        shippingAddress: true,
        billingAddress: true,
        user: true,
      },
    });
    return res.status(200).json({ order });
  }
);

// *Cancel Order
// !Admin Only or Order Owner
export const cancelOrder = tryCatch(
  async (req: Request<{ id?: string }>, res: Response) => {
    const order = await prismaClient.order.findFirstOrThrow({
      where:
        req.user.role !== "ADMIN"
          ? { id: req.params.id, userId: req.user.id }
          : { id: req.params.id },
      include: { items: true },
    });
    if (order.status === "CANCELLED") {
      return res.status(400).json({ error: "Order is already cancelled." });
    }

    const updatedOrder = await prismaClient.$transaction(async (prisma) => {
      const cancelledOrder = await prisma.order.update({
        where:
          req.user.role !== "ADMIN"
            ? { id: req.params.id, userId: req.user.id }
            : { id: req.params.id },
        data: { status: "CANCELLED" },
      });
      await Promise.all(
        order.items.map(async (item) => {
          await prisma.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                increment: item.quantity,
              },
            },
          });
        })
      );

      return cancelledOrder;
    });
    return res.status(200).json({ order: updatedOrder });
  }
);
