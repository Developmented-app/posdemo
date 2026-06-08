export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  costPrice: number; // Cost in USD
  sellPrice: number; // Selling price in USD
  stock: number;
  lowStockThreshold: number;
  image?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  discountPercent: number; // item level discount
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  location?: string;
  note?: string;
  other?: string;
  points?: number;
}

export type PaymentMethod = "Cash" | "Bakong_KHQR";

export interface Order {
  id: string;
  invoiceNumber: string;
  date: string; // ISO String
  customer?: Customer;
  items: {
    productId: string;
    productName: string;
    sku: string;
    quantity: number;
    sellPrice: number; // Price sold at (USD)
    discountPercent: number;
  }[];
  subtotal: number; // USD
  discountPercent: number; // Cart-level discount
  discountAmount: number; // USD
  taxPercent: number;
  taxAmount: number; // USD
  total: number; // USD
  totalKHR: number; // Equivalent in Cambodian Riel
  paymentMethod: PaymentMethod;
  amountPaid: number; // USD
  changeAmount: number; // USD
  bakongTxId?: string;
  status: "Completed" | "Voided";
}

export interface BakongSettings {
  merchantName: string;
  merchantId: string; // e.g. sopheap_store@aba
  acquirerId: string; // e.g. ABA Bank / 00000018
  merchantCity: string;
  storeLabel: string;
  exchangeRate: number; // e.g. 4100 KHR per USD
  taxPercent?: number;
  invoicePrefix?: string;
  receiptHeaderText?: string;
  receiptFooterText?: string;
  enableSoundAlerts?: boolean;
  telegramBotToken?: string;
  telegramChatId?: string;
  enableTelegramDailyReport?: boolean;
  telegramReportHour?: number;
  telegramReportMinute?: number;
  telegramLastSentDate?: string;
}

export interface HoldCart {
  id: string;
  name: string;
  items: CartItem[];
  date: string;
}
