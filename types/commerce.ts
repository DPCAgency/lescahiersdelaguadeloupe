export type {
  ProductType,
  OrderStatus,
  ResourceType,
  SourceType,
} from './database';

export interface ProductWithResource {
  id: string;
  type: string;
  resource_id: string | null;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  is_active: boolean;
  external_price_id: string | null;
}

export interface OrderWithItems {
  id: string;
  user_id: string;
  status: string;
  total_amount: number;
  currency: string;
  payment_provider: string | null;
  external_payment_id: string | null;
  created_at: string;
  items?: OrderItemRow[];
}

export interface OrderItemRow {
  id: string;
  order_id: string;
  product_id: string | null;
  resource_type: string;
  resource_id: string | null;
  unit_price: number;
  quantity: number;
  total_price: number;
}

export interface EntitlementWithResource {
  id: string;
  user_id: string;
  resource_type: string;
  resource_id: string;
  source_type: string;
  source_id: string | null;
  starts_at: string;
  expires_at: string | null;
}
