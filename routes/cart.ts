import { Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import {
  addToCart,
  getCart,
  removeFromCart,
  updateCartItemQuantity,
} from "../controllers/cart";

const cartRouter: Router = Router();

cartRouter.get("/get", authMiddleware, getCart);

cartRouter.post("/add/:id", authMiddleware, addToCart);

cartRouter.delete("/remove/:id", authMiddleware, removeFromCart);

cartRouter.put("/update/:id", authMiddleware, updateCartItemQuantity);

export default cartRouter;
