import { Product, Customer, BakongSettings } from "./types";

export const DEFAULT_PRODUCTS: Product[] = [
  {
    id: "prod-001",
    name: "Classic Fish Amok (ត្រីអាម៉ុក)",
    sku: "FO-AMOK-01",
    barcode: "884100100018",
    category: "Main Dishes",
    costPrice: 2.80,
    sellPrice: 5.50,
    stock: 45,
    lowStockThreshold: 10,
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=120&auto=format&fit=crop&q=80"
  },
  {
    id: "prod-002",
    name: "Beef Lok Lak (ឡុកឡាក់សាច់គោ)",
    sku: "FO-LOKLAK-02",
    barcode: "884100100025",
    category: "Main Dishes",
    costPrice: 3.20,
    sellPrice: 6.00,
    stock: 50,
    lowStockThreshold: 10,
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=120&auto=format&fit=crop&q=80"
  },
  {
    id: "prod-003",
    name: "Angkor Beer Can (ស្រាបៀរអង្គរ)",
    sku: "BE-ANGKOR-01",
    barcode: "884100200015",
    category: "Beverages",
    costPrice: 0.65,
    sellPrice: 1.25,
    stock: 120,
    lowStockThreshold: 15,
    image: "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=120&auto=format&fit=crop&q=80"
  },
  {
    id: "prod-004",
    name: "Iced Coconut Latte (កាហ្វេដូង)",
    sku: "BE-COCOCOF-02",
    barcode: "884100200022",
    category: "Beverages",
    costPrice: 0.90,
    sellPrice: 2.20,
    stock: 80,
    lowStockThreshold: 10,
    image: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=120&auto=format&fit=crop&q=80"
  },
  {
    id: "prod-005",
    name: "Cambodian Jasmine Rice 5kg",
    sku: "GR-JASRICE-01",
    barcode: "884100300012",
    category: "Groceries",
    costPrice: 3.50,
    sellPrice: 5.80,
    stock: 30,
    lowStockThreshold: 5,
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=120&auto=format&fit=crop&q=80"
  },
  {
    id: "prod-006",
    name: "Battambang Oranges 1kg (ក្រូចពោធិ៍សាត់)",
    sku: "GR-BTBORG-02",
    barcode: "884100300029",
    category: "Groceries",
    costPrice: 1.20,
    sellPrice: 2.50,
    stock: 40,
    lowStockThreshold: 8,
    image: "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=120&auto=format&fit=crop&q=80"
  },
  {
    id: "prod-007",
    name: "Fried Spring Rolls (ចៃយ៉រ)",
    sku: "FO-SPRING-03",
    barcode: "884100100032",
    category: "Snacks",
    costPrice: 1.00,
    sellPrice: 2.50,
    stock: 60,
    lowStockThreshold: 12,
    image: "https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?w=120&auto=format&fit=crop&q=80"
  },
  {
    id: "prod-008",
    name: "Kambuja Lemongrass Tea",
    sku: "BE-LMTEA-03",
    barcode: "884100200039",
    category: "Beverages",
    costPrice: 0.50,
    sellPrice: 1.50,
    stock: 14,
    lowStockThreshold: 15,
    image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=120&auto=format&fit=crop&q=80"
  }
];

export const DEFAULT_CUSTOMERS: Customer[] = [
  { id: "cust-0", name: "Walk-in Customer", phone: "N/A", points: 0 },
  { id: "cust-1", name: "Chan Prasidh", phone: "012345678", email: "prasidh@gmail.com", points: 120 },
  { id: "cust-2", name: "Sokha Sreynea", phone: "098765432", email: "sreynea@gmail.com", points: 45 },
  { id: "cust-3", name: "Bora Vannak", phone: "017228899", email: "bora.vannak@outlook.com", points: 280 }
];

export const DEFAULT_BAKONG_SETTINGS: BakongSettings = {
  merchantName: "Prasidh Food Outlet",
  merchantId: "prasidh_outlet@aba",
  acquirerId: "ABA Bank",
  merchantCity: "Phnom Penh",
  storeLabel: "Counter 01",
  exchangeRate: 4100, // 1 USD = 4100 KHR
  taxPercent: 10,
  invoicePrefix: "INV",
  receiptHeaderText: "Prasidh Food Outlet\nPhnom Penh, Cambodia",
  receiptFooterText: "Thank you for supporting Cambodian local businesses!\nExchange policy: 7 days with invoice.",
  enableSoundAlerts: true,
  telegramBotToken: "",
  telegramChatId: "",
  enableTelegramDailyReport: false,
  telegramReportHour: 20, // 8:00 PM default
  telegramReportMinute: 0,
  telegramLastSentDate: ""
};

export const CATEGORIES = [
  "All Items",
  "Main Dishes",
  "Beverages",
  "Groceries",
  "Snacks"
];
