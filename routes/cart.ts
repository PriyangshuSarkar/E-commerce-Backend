import { Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import {
  getCart,
  removeFromCart,
  setCartItemQuantity,
  updateCartItemQuantityByValue,
} from "../controllers/cart";

const cartRouter: Router = Router();

cartRouter.get("/get", authMiddleware, getCart);

cartRouter.delete("/remove/:cartItemId", authMiddleware, removeFromCart);

cartRouter.post(
  "/update/:productVariantId",
  authMiddleware,
  setCartItemQuantity
);

cartRouter.post(
  "/change/:productVariantId",
  authMiddleware,
  updateCartItemQuantityByValue
);

export default cartRouter;
