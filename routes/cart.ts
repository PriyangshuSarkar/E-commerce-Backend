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

cartRouter.post("/update/:productId", authMiddleware, setCartItemQuantity);

cartRouter.post(
  "/change/:productId",
  authMiddleware,
  updateCartItemQuantityByValue
);

export default cartRouter;
