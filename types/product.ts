export interface CreateProductRequest {
  sku: string;
  name: string;
  description: string;
  tags: string[];
  price: string;
  quantity: string;
  categoryId: string;
  stock: string;
}

export interface UpdateProductRequest {
  sku?: string;
  name?: string;
  description?: string;
  tags?: string[];
  price?: string;
  quantity?: string;
  categoryId?: string;
  stock?: string;
}

export interface AddCategoryRequest {
  category: string;
}

export interface FilterAndSortProductsRequest {
  page?: string;
  limit?: string;
  category?: string;
  tags?: string[];
  minPrice?: string;
  maxPrice?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
