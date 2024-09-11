import type { Request, Response } from "express";
import { tryCatch } from "../middlewares/tryCatch";
import { prismaClient } from "../app";
import {
  AddCategoryRequest,
  CategoryIdRequest,
  UpdateCategoryRequest,
} from "../types/category";
import { AddCategorySchema, UpdateCategorySchema } from "../schemas/category";

// *Add Category
// !Admin Only
export const addCategory = tryCatch(
  async (req: Request<{}, {}, AddCategoryRequest>, res: Response) => {
    const validatedData = AddCategorySchema.parse(req.body);
    const existingCategory = await prismaClient.category.findFirst({
      where: { name: validatedData.category },
    });
    if (existingCategory?.deletedAt === null) {
      return res.status(200).json({ existingCategory });
    } else if (existingCategory?.deletedAt != null) {
      const category = await prismaClient.category.update({
        where: { id: existingCategory.id },
        data: { deletedAt: null },
      });
      return res.status(200).json({ category });
    }
    const newCategory = await prismaClient.category.create({
      data: { name: validatedData.category },
    });
    return res.status(200).json({ newCategory });
  }
);

// *Update Category
// !Admin Only
export const updateCategory = tryCatch(
  async (
    req: Request<CategoryIdRequest, {}, UpdateCategoryRequest>,
    res: Response
  ) => {
    const validatedData = UpdateCategorySchema.parse(req.body);
    const existingCategory = await prismaClient.category.findFirst({
      where: { name: validatedData.category, deletedAt: null },
    });
    if (existingCategory) {
      return res.status(200).json({ existingCategory });
    }
    const newCategory = await prismaClient.category.update({
      where: { id: req.params.categoryId },
      data: { name: validatedData.category, deletedAt: null },
    });
    return res.status(200).json({ newCategory });
  }
);

// *Get Category
export const getAllCategories = tryCatch(
  async (req: Request, res: Response) => {
    const allCategories = await prismaClient.category.findMany({
      where: { deletedAt: null },
    });
    return res.status(200).json({ allCategories });
  }
);

// *Delete Category
// !Admin Only
export const deleteCategory = tryCatch(
  async (req: Request<CategoryIdRequest>, res: Response) => {
    const existingCategory = await prismaClient.category.findFirst({
      where: { id: req.params.categoryId },
    });
    await prismaClient.category.update({
      where: { id: req.params.categoryId },
      data: { deletedAt: new Date() },
    });
    return res
      .status(200)
      .json({ message: `category ${existingCategory?.name} is deleted` });
  }
);
