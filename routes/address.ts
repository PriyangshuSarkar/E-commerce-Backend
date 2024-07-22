import { Router } from "express";
import { addAddress, deleteAddress, listAddress } from "../controllers/address";
import { authMiddleware } from "../middlewares/auth";

const addressRoutes: Router = Router();

addressRoutes.post("/add", authMiddleware, addAddress);

addressRoutes.delete("/delete/:id", authMiddleware, deleteAddress);

addressRoutes.get("/all", authMiddleware, listAddress);

export default addressRoutes;
