import { Router } from "express";
import { addItemToCart } from "../controllers/cart";
import { authMiddleware } from "../middlewares/auth";

const cartRouter: Router = Router();

export default cartRouter;
