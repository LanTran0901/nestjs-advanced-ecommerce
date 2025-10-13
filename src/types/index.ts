import { Request } from "express"

export interface JwtPayload {
  id: number;
  session: number;
  role: string;
  roleId: number;
}
export interface requestWithUserType extends Request {
    user: JwtPayload | null 
}
export enum UserRole {
  ADMIN = 'ADMIN',
  SELLER = 'SELLER',
  CLIENT = 'CLIENT',
}

// Cart related interfaces
export interface CartItemWithDetails {
  id: number;
  quantity: number;
  skuId: number;
  userId: number;
  sku: {
    id: number;
    value: string;
    price: number;
    stock: number;
    image: string;
    product: {
      id: number;
      name: string;
      images: string[];
      brand: {
        id: number;
        name: string;
        logo: string;
      };
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CartSummary {
  totalItems: number;
  totalAmount: number;
  items: CartItemWithDetails[];
}
