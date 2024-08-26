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
          productVariant: {
            include: {
              product: true,
            },
          },
        },
        where: {
          productVariant: {
            deletedAt: null,
          },
        },
      },
    },
  });
  // Adjust quantities and update in database
  const updatedCartItems = await Promise.all(
    cart.items.map(async (item) => {
      const adjustedQuantity =
        item.quantity > item.productVariant.stock
          ? item.productVariant.stock
          : item.quantity;

      // Update the cart item with the adjusted quantity
      if (adjustedQuantity !== item.quantity) {
        await prismaClient.cartItem.update({
          where: {
            id: item.id,
          },
          data: {
            quantity: adjustedQuantity,
          },
        });
      }

      // Return the updated cart item
      return {
        ...item,
        quantity: adjustedQuantity,
      };
    })
  );

  return res.status(200).json({
    ...cart,
    items: updatedCartItems,
  });
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
    const productId = req.params.productVariantId!;
    let quantity = +req.query.productQuantity!;

    if (!productId || isNaN(quantity)) {
      return res.status(400).json({ error: "Invalid productId or quantity" });
    }

    const productVariant = await prismaClient.productVariant.findFirstOrThrow({
      where: {
        productId: productId,
        deletedAt: null,
      },
    });

    // Ensure quantity is within stock limits
    quantity = Math.min(Math.max(quantity, 0), productVariant.stock);

    let cart = await prismaClient.cart.findUnique({
      where: { userId: req.user.id },
    });

    if (!cart) {
      cart = await prismaClient.cart.create({
        data: { userId: req.user.id },
      });
    }

    const cartItem = await prismaClient.cartItem.findUnique({
      where: {
        cartId_productVariantId: {
          cartId: cart.id,
          productVariantId: productVariant.id,
        },
      },
    });

    if (quantity === 0) {
      if (cartItem) {
        await prismaClient.cartItem.delete({
          where: {
            cartId_productVariantId: {
              cartId: cart.id,
              productVariantId: productVariant.id,
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
              cartId_productVariantId: {
                cartId: cart.id,
                productVariantId: productVariant.id,
              },
            },
            data: {
              quantity,
            },
          })
        : await prismaClient.cartItem.create({
            data: {
              cartId: cart.id,
              productVariantId: productVariant.id,
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
    const productId = req.params.productVariantId!;
    let quantityChange = +req.query.productQuantityChange!;

    if (!productId || isNaN(quantityChange)) {
      return res
        .status(400)
        .json({ error: "Invalid productId or quantity change" });
    }

    const productVariant = await prismaClient.productVariant.findFirstOrThrow({
      where: {
        productId: productId,
        deletedAt: null,
      },
    });

    let cart = await prismaClient.cart.findUnique({
      where: { userId: req.user.id },
    });

    if (!cart) {
      cart = await prismaClient.cart.create({
        data: { userId: req.user.id },
      });
    }

    const cartItem = await prismaClient.cartItem.findUnique({
      where: {
        cartId_productVariantId: {
          cartId: cart.id,
          productVariantId: productVariant.id,
        },
      },
    });

    const currentQuantity = cartItem ? cartItem.quantity : 0;
    let newQuantity = currentQuantity + quantityChange;

    // Ensure new quantity is within valid range
    newQuantity = Math.min(Math.max(newQuantity, 0), productVariant.stock);

    if (newQuantity === 0) {
      if (cartItem) {
        await prismaClient.cartItem.delete({
          where: {
            cartId_productVariantId: {
              cartId: cart.id,
              productVariantId: productVariant.id,
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
              cartId_productVariantId: {
                cartId: cart.id,
                productVariantId: productVariant.id,
              },
            },
            data: {
              quantity: newQuantity,
            },
          })
        : await prismaClient.cartItem.create({
            data: {
              cartId: cart.id,
              productVariantId: productVariant.id,
              quantity: newQuantity,
            },
          });
      return res.status(200).json({ updatedCartItem });
    }
  }
);
