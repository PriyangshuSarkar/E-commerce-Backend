export interface CreateProductRequest {
  sku: string;
  name: string;
  description: string;
  tags: string[];
  price: number;
  quantity: number;
  categoryId: string;
  stock: number;
  imageUrl?: string;
}

export interface UpdateProductRequest {
  sku?: string;
  name?: string;
  description?: string;
  tags?: string[];
  price?: number;
  quantity?: number;
  categoryId?: string;
  stock?: number;
  imageUrl?: string;
}

export interface AddCategoryRequest {
  category: string;
}
