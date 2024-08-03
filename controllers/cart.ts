import type { Request, Response } from "express";
import { tryCatch } from "../middlewares/tryCatch";
import { prismaClient } from "../app";

// *Get Cart
export const getCart = tryCatch(async (req: Request, res: Response) => {
  const cart = await prismaClient.cart.findFirstOrThrow({
    where: { userId: req.user.id },
    include: {
      items: {
        include: {
          product: true,
        },
        where: {
          product: {
            deletedAt: null,
          },
        },
      },
    },
  });
  const adjustedItems = cart.items.map((item) => {
    const adjustedQuantity =
      item.quantity > item.product.stock ? item.product.stock : item.quantity;
    return {
      ...item,
      quantity: adjustedQuantity,
    };
  });
  const adjustedCart = {
    ...cart,
    items: adjustedItems,
  };
  return res.status(200).json({ cart });
});

// *Add Items to Cart
export const addToCart = tryCatch(
  async (
    req: Request<{ id?: string }, {}, {}, { quantity?: number }>,
    res: Response
  ) => {
    const productId = req.params.id!;
    let quantity = +req.query.quantity!;

    if (!productId) {
      return res.status(400).json({ error: "Invalid productId" });
    }
    if (isNaN(quantity)) {
      return res.status(400).json({ error: "Invalid quantity" });
    }
    const product = await prismaClient.product.findFirstOrThrow({
      where: { id: productId, deletedAt: null },
    });
    quantity = quantity > product.stock ? product.stock : quantity;
    let cart = await prismaClient.cart.findFirst({
      where: { userId: req.user.id },
    });
    if (!cart) {
      cart = await prismaClient.cart.create({
        data: {
          userId: req.user.id,
        },
      });
    }
    const existingCartItems = await prismaClient.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    });
    if (existingCartItems) {
      const updateCartItems = await prismaClient.cartItem.update({
        where: { id: existingCartItems.id },
        data: {
          quantity: existingCartItems.quantity + quantity,
        },
      });
      return res.status(200).json({ updateCartItems });
    } else {
      const newCartItems = await prismaClient.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
        },
      });
      return res.status(200).json({ newCartItems });
    }
  }
);

// *Remove Item from Cart
export const removeFromCart = tryCatch(
  async (req: Request<{ id?: string }>, res: Response) => {
    const cart = await prismaClient.cart.findFirstOrThrow({
      where: { userId: req.user.id },
    });
    if (req.params.id === "all") {
      // Clear entire cart
      await prismaClient.cartItem.deleteMany({
        where: {
          cartId: cart.id,
        },
      });
      return res.status(200).json({ message: "Cart cleared" });
    } else {
      // Remove specific item from cart
      await prismaClient.cartItem.delete({
        where: {
          id: req.params.id,
          cartId: cart.id,
        },
      });
      return res.status(200).json({ message: "Item removed from cart" });
    }
  }
);

// *Update Item Quantity
export const updateCartItemQuantity = tryCatch(
  async (
    req: Request<{ id?: string }, {}, {}, { quantity?: number }>,
    res: Response
  ) => {
    const productId = req.params.id!;
    let quantity = +req.query.quantity!;
    if (!productId) {
      return res.status(400).json({ error: "Invalid productId" });
    }
    if (isNaN(quantity)) {
      return res.status(400).json({ error: "Invalid quantity" });
    }
    const product = await prismaClient.product.findFirstOrThrow({
      where: { id: productId, deletedAt: null },
    });
    quantity = quantity > product.stock ? product.stock : quantity;
    const cart = await prismaClient.cart.findFirstOrThrow({
      where: { userId: req.user.id },
    });
    const newCartItem = await prismaClient.cartItem.update({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
      data: {
        quantity,
      },
    });
    res.status(200).json({ newCartItem });
  }
);
