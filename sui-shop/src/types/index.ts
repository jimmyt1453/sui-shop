export interface CartItem {
  productId: number;
  quantity: number;
}

export interface OrderReceipt {
  id: string;
  orderNumber: number;
  productId: number;
  productName: string;
  price: number;
  buyer: string;
  email: string;
  timestamp: number;
  shopId: string;
  digest?: string;
}
