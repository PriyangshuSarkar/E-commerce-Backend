import type { Request, Response } from "express";
import { tryCatch } from "../middlewares/tryCatch";
import { prismaClient } from "../app";
import type {
  CartItemIdRequest,
  ProductIdRequest,
  ProductQuantityRequest,
} from "../types/cart";

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

// *Remove Item from Cart
export const removeFromCart = tryCatch(
  async (req: Request<CartItemIdRequest>, res: Response) => {
    const cart = await prismaClient.cart.findFirstOrThrow({
      where: { userId: req.user.id },
    });
    if (req.params.cartItemId === "all") {
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
          id: req.params.cartItemId,
          cartId: cart.id,
        },
      });
      return res.status(200).json({ message: "Item removed from cart" });
    }
  }
);

// *Set Cart Item Quantity
export const setCartItemQuantity = tryCatch(
  async (
    req: Request<ProductIdRequest, {}, {}, ProductQuantityRequest>,
    res: Response
  ) => {
    const productId = req.params.productId!;
    let quantity = +req.query.productQuantity!;

    if (!productId) {
      return res.status(400).json({ error: "Invalid productId" });
    }
    if (isNaN(quantity)) {
      return res.status(400).json({ error: "Invalid quantity" });
    }

    const product = await prismaClient.product.findFirstOrThrow({
      where: { id: productId, deletedAt: null },
    });

    // Ensure quantity is within stock limits
    quantity = Math.min(Math.max(quantity, 0), product.stock);

    let cart = await prismaClient.cart.findFirst({
      where: { userId: req.user.id },
    });

    if (!cart) {
      cart = await prismaClient.cart.create({
        data: { userId: req.user.id },
      });
    }

    const cartItem = await prismaClient.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId,
      },
    });

    if (quantity === 0) {
      if (cartItem) {
        await prismaClient.cartItem.delete({
          where: {
            cartId_productId: {
              cartId: cart.id,
              productId,
            },
          },
        });
        return res.status(200).json({ message: "Cart item removed" });
      }
      return res.status(404).json({ error: "Cart item not found" });
    } else {
      const newCartItem = cartItem
        ? await prismaClient.cartItem.update({
            where: {
              cartId_productId: {
                cartId: cart.id,
                productId,
              },
            },
            data: {
              quantity,
            },
          })
        : await prismaClient.cartItem.create({
            data: {
              cartId: cart.id,
              productId,
              quantity,
            },
          });
      return res.status(200).json({ newCartItem });
    }
  }
);

// *Update Cart Item Quantity by Value
export const updateCartItemQuantityByValue = tryCatch(
  async (
    req: Request<ProductIdRequest, {}, {}, ProductQuantityRequest>,
    res: Response
  ) => {
    const productId = req.params.productId!;
    let quantityChange = +req.query.productQuantityChange!;

    if (!productId) {
      return res.status(400).json({ error: "Invalid productId" });
    }
    if (isNaN(quantityChange)) {
      return res.status(400).json({ error: "Invalid quantity change" });
    }

    const product = await prismaClient.product.findFirstOrThrow({
      where: { id: productId, deletedAt: null },
    });

    let cart = await prismaClient.cart.findFirst({
      where: { userId: req.user.id },
    });

    if (!cart) {
      cart = await prismaClient.cart.create({
        data: { userId: req.user.id },
      });
    }

    const cartItem = await prismaClient.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId,
      },
    });

    const currentQuantity = cartItem ? cartItem.quantity : 0;
    let newQuantity = currentQuantity + quantityChange;

    // Ensure new quantity is within valid range
    newQuantity = Math.min(Math.max(newQuantity, 0), product.stock);

    if (newQuantity === 0) {
      if (cartItem) {
        await prismaClient.cartItem.delete({
          where: {
            cartId_productId: {
              cartId: cart.id,
              productId,
            },
          },
        });
        return res.status(200).json({ message: "Cart item removed" });
      }
      return res.status(404).json({ error: "Cart item not found" });
    } else {
      const updatedCartItem = cartItem
        ? await prismaClient.cartItem.update({
            where: {
              cartId_productId: {
                cartId: cart.id,
                productId,
              },
            },
            data: {
              quantity: newQuantity,
            },
          })
        : await prismaClient.cartItem.create({
            data: {
              cartId: cart.id,
              productId,
              quantity: newQuantity,
            },
          });
      return res.status(200).json({ updatedCartItem });
    }
  }
);
