export interface CreateProductRequest {
  name: string;
  description: string;
  tags: string[];
  price: number;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  tags?: any;
  price?: number;
}

export interface ParamsRequest {
  id?: string;
  skip?: string;
}
