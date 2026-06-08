import React, { useState, useRef, useEffect } from "react";
import { 
  Search, 
  Trash2, 
  UserPlus, 
  CreditCard, 
  Plus, 
  Minus, 
  ShoppingBag, 
  QrCode, 
  Check, 
  Loader2, 
  Printer, 
  Bookmark, 
  BookmarkCheck,
  AlertCircle,
  Hash,
  RefreshCw,
  TrendingDown,
  Percent,
  DollarSign
} from "lucide-react";
import { Product, CartItem, Customer, Order, BakongSettings, HoldCart } from "../types";
import { DEFAULT_CUSTOMERS, CATEGORIES } from "../data";
import { generateKHQRString } from "../utils/khqr";

interface POSTerminalProps {
  products: Product[];
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  settings: BakongSettings;
  addOrder: (order: Order) => void;
  updateProductStock: (id: string, newStock: number) => void;
  activeCheckoutKHQR: { invoiceNo: string; amount: number; currency: "USD" | "KHR"; qrStr: string } | null;
  setActiveCheckoutKHQR: React.Dispatch<React.SetStateAction<{ invoiceNo: string; amount: number; currency: "USD" | "KHR"; qrStr: string } | null>>;
  onSimulateCheckoutSuccess: () => void;
  categories?: string[];
}

export default function POSTerminal({
  products,
  customers,
  setCustomers,
  settings,
  addOrder,
  updateProductStock,
  activeCheckoutKHQR,
  setActiveCheckoutKHQR,
  onSimulateCheckoutSuccess,
  categories = ["Main Dishes", "Beverages", "Groceries", "Snacks"]
}: POSTerminalProps) {
  // State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All Items");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("cust-0");
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [taxPercent, setTaxPercent] = useState<number>(settings.taxPercent ?? 10); // Dynamic Store Tax Percent

  // Barcode input simulator
  const [barcodeQuery, setBarcodeQuery] = useState<string>("");
  const [barcodeAlert, setBarcodeAlert] = useState<string | null>(null);

  // New Customer creation
  const [addingCustomer, setAddingCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newCustEmail, setNewCustEmail] = useState("");
  const [newCustLoc, setNewCustLoc] = useState("");
  const [newCustNote, setNewCustNote] = useState("");
  const [newCustOther, setNewCustOther] = useState("");

  // Saved / Hold Carts logic
  const [holdCarts, setHoldCarts] = useState<HoldCart[]>([]);
  const [holdNameInput, setHoldNameInput] = useState("");
  const [showHoldModal, setShowHoldModal] = useState(false);

  // Checkout modal
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState<"Cash" | "Bakong_KHQR">("Bakong_KHQR");
  const [checkoutCurrency, setCheckoutCurrency] = useState<"USD" | "KHR">("USD");

  // Cash payment variables
  const [cashAmountPaid, setCashAmountPaid] = useState<string>("");
  const [lastCompletedOrder, setLastCompletedOrder] = useState<Order | null>(null);
  const [isPrintingAnimation, setIsPrintingAnimation] = useState(false);

  // Auto focus triggers
  const itemSearchRef = useRef<HTMLInputElement>(null);

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === "All Items" || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.barcode === searchQuery;
    return matchesCategory && matchesSearch;
  });

  // Hotkey / bar code search effect
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeQuery) return;
    const matched = products.find(p => p.barcode === barcodeQuery || p.sku.toLowerCase() === barcodeQuery.toLowerCase());
    if (matched) {
      if (matched.stock <= 0) {
        setBarcodeAlert(`Product "${matched.name}" is OUT OF STOCK.`);
      } else {
        addToCart(matched);
        setBarcodeQuery("");
        setBarcodeAlert(null);
      }
    } else {
      setBarcodeAlert(`Barcode/SKU "${barcodeQuery}" not found.`);
    }
    setTimeout(() => setBarcodeAlert(null), 3000);
  };

  // Cart operations
  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;
    setCart(prev => {
      const idx = prev.findIndex(item => item.product.id === product.id);
      if (idx > -1) {
        const item = prev[idx];
        const newQty = item.quantity + 1;
        if (newQty > product.stock) {
          alert(`Warning: Only ${product.stock} units available in stock.`);
          return prev;
        }
        const updated = [...prev];
        updated[idx] = { ...item, quantity: newQty };
        return updated;
      } else {
        return [...prev, { product, quantity: 1, discountPercent: 0 }];
      }
    });
  };

  const updateCartQty = (productId: string, quantity: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    if (quantity > product.stock) {
      alert(`Warning: Only ${product.stock} units of "${product.name}" in stock.`);
      return;
    }
    setCart(prev => prev.map(item => 
      item.product.id === productId ? { ...item, quantity } : item
    ));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Calculations
  const cartSubtotal = cart.reduce((sum, item) => {
    const itemPrice = item.product.sellPrice * (1 - item.discountPercent / 100);
    return sum + (itemPrice * item.quantity);
  }, 0);

  const discountAmount = cartSubtotal * (discountPercent / 100);
  const afterDiscount = cartSubtotal - discountAmount;
  const taxAmount = afterDiscount * (taxPercent / 100);
  const cartTotal = afterDiscount + taxAmount;
  const cartTotalKHR = cartTotal * settings.exchangeRate;

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId) || customers[0] || { id: "cust-0", name: "Walk-in Customer", phone: "N/A", points: 0 };
  const earnedPoints = Math.floor(cartTotal);

  // Add custom customer
  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;
    const newId = `cust-${Date.now()}`;
    const newCustomer: Customer = {
      id: newId,
      name: newCustName.trim(),
      phone: newCustPhone.trim() || "N/A",
      email: newCustEmail.trim() || undefined,
      location: newCustLoc.trim() || undefined,
      note: newCustNote.trim() || undefined,
      other: newCustOther.trim() || undefined,
      points: 0
    };
    setCustomers(prev => [...prev, newCustomer]);
    setSelectedCustomerId(newId);
    setNewCustName("");
    setNewCustPhone("");
    setNewCustEmail("");
    setNewCustLoc("");
    setNewCustNote("");
    setNewCustOther("");
    setAddingCustomer(false);
  };

  // Hold / retrieve bills logic
  const handleHoldCart = () => {
    if (cart.length === 0) return;
    const holdName = holdNameInput.trim() || `Ticket #${holdCarts.length + 1} (${new Date().toLocaleTimeString()})`;
    const pending: HoldCart = {
      id: `hold-${Date.now()}`,
      name: holdName,
      items: cart,
      date: new Date().toLocaleTimeString()
    };
    setHoldCarts(prev => [pending, ...prev]);
    setCart([]);
    setHoldNameInput("");
  };

  const resumeHoldCart = (hc: HoldCart) => {
    setCart(hc.items);
    setHoldCarts(prev => prev.filter(c => c.id !== hc.id));
  };

  // Trigger Checkout Setup
  const openCheckoutDrawer = () => {
    if (cart.length === 0) return;
    setCheckoutCurrency("USD");
    setCashAmountPaid("");
    setCheckoutModalOpen(true);
    // Auto preset values for Cash if it was chosen
    setCheckoutPaymentMethod("Bakong_KHQR");
  };

  // Generate dynamic invoice numbers
  const generateInvoiceNumber = () => {
    const prefix = settings.invoicePrefix || "INV";
    const timestamp = Date.now().toString().slice(-6);
    const rand = Math.floor(100 + Math.random() * 900);
    return `${prefix}-${timestamp}-${rand}`;
  };

  // Launch KHQR Generator
  useEffect(() => {
    if (checkoutModalOpen && checkoutPaymentMethod === "Bakong_KHQR" && !lastCompletedOrder) {
      const invoiceNo = generateInvoiceNumber();
      const amount = checkoutCurrency === "USD" ? cartTotal : cartTotalKHR;
      const { qrString } = generateKHQRString({
        settings,
        amount,
        currency: checkoutCurrency,
        invoiceNo
      });

      setActiveCheckoutKHQR({
        invoiceNo,
        amount,
        currency: checkoutCurrency,
        qrStr: qrString
      });
    } else {
      setActiveCheckoutKHQR(null);
    }
  }, [checkoutModalOpen, checkoutPaymentMethod, checkoutCurrency]);

  // Hook for simulation to execute completion
  // We can write a handler for completing the POS order
  const handlePOSOrderCompletion = (method: "Cash" | "Bakong_KHQR", extTxId?: string) => {
    const invoiceNo = activeCheckoutKHQR?.invoiceNo || generateInvoiceNumber();
    const activeCustomer = customers.find(c => c.id === selectedCustomerId) || customers[0];
    
    const finalTotal = cartTotal;
    const finalSubtotal = cartSubtotal;

    let payPaid = finalTotal;
    let change = 0;

    if (method === "Cash") {
      const numPaid = parseFloat(cashAmountPaid) || finalTotal;
      payPaid = numPaid;
      change = numPaid - finalTotal;
    }

    const pointsEarned = selectedCustomerId !== "cust-0" ? Math.floor(finalTotal) : 0;
    const updatedCustomer = activeCustomer ? {
      ...activeCustomer,
      points: (activeCustomer.points || 0) + pointsEarned
    } : activeCustomer;

    const newOrder: Order = {
      id: `order-${Date.now()}`,
      invoiceNumber: invoiceNo,
      date: new Date().toISOString(),
      customer: updatedCustomer,
      items: cart.map(i => ({
        productId: i.product.id,
        productName: i.product.name,
        sku: i.product.sku,
        quantity: i.quantity,
        sellPrice: i.product.sellPrice,
        discountPercent: i.discountPercent
      })),
      subtotal: finalSubtotal,
      discountPercent,
      discountAmount,
      taxPercent,
      taxAmount,
      total: finalTotal,
      totalKHR: finalTotal * settings.exchangeRate,
      paymentMethod: method,
      amountPaid: payPaid,
      changeAmount: Math.max(0, change),
      bakongTxId: extTxId || (method === "Bakong_KHQR" ? `BKNG-${Math.floor(100000 + Math.random() * 900000)}` : undefined),
      status: "Completed"
    };

    // Deduct stock quantities locally
    cart.forEach(item => {
      const currentProduct = products.find(p => p.id === item.product.id);
      if (currentProduct) {
        updateProductStock(item.product.id, Math.max(0, currentProduct.stock - item.quantity));
      }
    });

    // Update customer loyalty points if register customer
    if (selectedCustomerId !== "cust-0" && pointsEarned > 0) {
      setCustomers(prev => prev.map(c => 
        c.id === selectedCustomerId 
          ? { ...c, points: (c.points || 0) + pointsEarned }
          : c
      ));
    }

    // Save order
    addOrder(newOrder);
    setLastCompletedOrder(newOrder);
    setCart([]);
  };

  // Close everything and start afresh
  const handleStartNewSale = () => {
    setLastCompletedOrder(null);
    setCheckoutModalOpen(false);
    setActiveCheckoutKHQR(null);
    setSelectedCustomerId("cust-0");
    setDiscountPercent(0);
  };

  // Simulate print receipt animation
  const handlePrintReceipt = () => {
    setIsPrintingAnimation(true);
    setTimeout(() => {
      setIsPrintingAnimation(false);
      window.print(); // stylishly trigger standard browser render
    }, 1500);
  };

  // Watch for global simulator confirmation trigger passed as prop
  useEffect(() => {
    const handleBakongPaymentApproved = (e: Event) => {
      const customEvent = e as CustomEvent<{ method: "Cash" | "Bakong_KHQR"; extTxId: string }>;
      if (checkoutModalOpen && checkoutPaymentMethod === "Bakong_KHQR" && !lastCompletedOrder) {
        handlePOSOrderCompletion(customEvent.detail.method, customEvent.detail.extTxId);
      }
    };

    window.addEventListener("SIMULATE_BAKONG_PAID", handleBakongPaymentApproved);
    return () => {
      window.removeEventListener("SIMULATE_BAKONG_PAID", handleBakongPaymentApproved);
    };
  }, [checkoutModalOpen, checkoutPaymentMethod, lastCompletedOrder, cart, cartSubtotal, cartTotal]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 h-[calc(100vh-6rem)] overflow-hidden select-none animate-fade-in relative">
      
      {/* LEFT COL: Products Panel (7/12 width) */}
      <div className="xl:col-span-7 bg-white border border-gray-200 rounded-xl flex flex-col h-full overflow-hidden shadow-sm">
        
        {/* Header bar: Fast Search, Scanner and Hold retrieve counters */}
        <div className="p-4 border-b border-gray-100 flex flex-col gap-3 shrink-0 bg-slate-50/50">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Input Box */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                ref={itemSearchRef}
                type="text"
                placeholder="Search products by title, SKU, tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white text-slate-800 text-sm border border-gray-200 rounded-lg pl-9 pr-4 py-2 focus:stroke-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            {/* Simulated Handheld Barcode Scanner Trigger */}
            <form onSubmit={handleBarcodeSubmit} className="flex gap-2 min-w-[220px]">
              <div className="relative flex-1">
                <Hash className="w-4.5 h-4.5 text-gray-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Scan SKU/Barcode..."
                  value={barcodeQuery}
                  onChange={(e) => setBarcodeQuery(e.target.value)}
                  className="w-full bg-white text-slate-800 text-xs border border-gray-200 rounded-lg pl-8 pr-2 py-2.5 font-mono focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
              <button 
                type="submit"
                className="bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs py-2 px-3 rounded-lg flex items-center gap-1 transition"
              >
                Enter
              </button>
            </form>
          </div>

          {/* Alert messages for scan errors */}
          {barcodeAlert && (
            <div className="flex items-center gap-1.5 text-xs text-rose-700 bg-rose-50 px-2 py-1.5 rounded-md border border-rose-100 animate-pulse">
              <AlertCircle className="w-4 h-4" />
              <span>{barcodeAlert}</span>
            </div>
          )}

          {/* Categories Tab slider and Hold Cart overview count */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 mt-1 scrollbar-thin">
            <div className="flex gap-1.5 shrink-0">
              {["All Items", ...categories].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`py-1 px-3 text-xs font-semibold rounded-lg transition-all ${
                    selectedCategory === cat
                      ? "bg-orange-500 text-white shadow-sm"
                      : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {holdCarts.length > 0 && (
              <button
                onClick={() => setShowHoldModal(true)}
                className="bg-amber-100 border border-amber-200 text-amber-800 text-[11px] font-bold py-1 px-2.5 rounded-lg flex items-center gap-1 shrink-0 animate-bounce cursor-pointer hover:bg-amber-200"
              >
                <BookmarkCheck className="w-3.5 h-3.5 text-amber-700" />
                <span>{holdCarts.length} Held Cart(s)</span>
              </button>
            )}
          </div>
        </div>

        {/* Products Grid list */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50/20">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <ShoppingBag className="w-12 h-12 stroke-1" />
              <p className="text-sm font-semibold mt-2">No products matched criteria</p>
              <p className="text-xs text-slate-400">Try refining search parameters or category filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map(p => {
                const countInCart = cart.find(i => i.product.id === p.id)?.quantity || 0;
                const isOutOfStock = p.stock <= 0;
                return (
                  <div
                    key={p.id}
                    onClick={() => !isOutOfStock && addToCart(p)}
                    className={`bg-white border rounded-lg overflow-hidden relative cursor-pointer select-none group flex flex-col justify-between transition-all ${
                      countInCart > 0 
                        ? "border-orange-500 shadow-sm ring-1 ring-orange-500" 
                        : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                    } ${isOutOfStock ? "opacity-55 cursor-not-allowed bg-slate-50" : ""}`}
                  >
                    {/* Item count overlay badge */}
                    {countInCart > 0 && (
                      <span className="absolute z-10 top-2 right-2 bg-orange-500 text-white text-[10px] font-black w-5.5 h-5.5 rounded-full flex items-center justify-center shadow">
                        {countInCart}
                      </span>
                    )}

                    {/* Image Block */}
                    <div className="relative h-28 w-full bg-slate-100 overflow-hidden shrink-0">
                      {p.image ? (
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-200 pointer-events-none"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 text-xs font-mono">
                          No Image
                        </div>
                      )}
                      
                      {/* Out of Stock overlay overlay */}
                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white font-bold text-xs font-sans uppercase tracking-widest leading-none">
                          OUT OF STOCK
                        </div>
                      )}
                    </div>

                    {/* Product Specs */}
                    <div className="p-3 text-left">
                      <h4 className="text-xs font-bold text-gray-800 line-clamp-2 leading-tight">
                        {p.name}
                      </h4>
                      <p className="text-[9px] text-gray-400 font-mono mt-0.5">SKU: {p.sku}</p>
                      
                      {/* Stock units list */}
                      <p className="text-[9px] font-semibold mt-1">
                        {isOutOfStock ? (
                          <span className="text-red-500">Stock empty</span>
                        ) : p.stock <= p.lowStockThreshold ? (
                          <span className="text-amber-600 bg-amber-50 px-1 rounded flex items-center gap-0.5 w-max">
                            <span>Low stock ({p.stock})</span>
                          </span>
                        ) : (
                          <span className="text-emerald-600">{p.stock} units left</span>
                        )}
                      </p>

                      <div className="flex items-baseline justify-between mt-2 gap-1 flex-wrap">
                        <span className="text-sm font-black text-slate-900 font-mono">
                          ${p.sellPrice.toFixed(2)}
                        </span>
                        <span className="text-[9px] text-gray-400 font-semibold font-mono">
                          ៛ {(p.sellPrice * settings.exchangeRate).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COL: Cashier Cart (5/12 width) */}
      <div className="xl:col-span-5 bg-white border border-gray-200 rounded-xl flex flex-col h-full overflow-hidden shadow-sm">
        
        {/* Customer Select Toolbar */}
        <div className="p-3 border-b border-gray-200 bg-slate-50/50 flex flex-col gap-2 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase font-mono tracking-wider">Customer</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full bg-white text-slate-800 text-xs border border-gray-200 rounded px-2 py-1 mt-0.5 focus:outline-none"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phone !== "N/A" ? `(${c.phone})` : ""} {c.id !== "cust-0" ? `[${c.points || 0} pts]` : ""}
                  </option>
                ))}
              </select>
            </div>
            
            <button
              onClick={() => setAddingCustomer(true)}
              className="mt-4 p-1.5 bg-orange-50 text-orange-600 border border-orange-100 rounded hover:bg-orange-100 transition shrink-0"
              title="Create New Customer Account"
            >
              <UserPlus className="w-4 h-4" />
            </button>
          </div>

          {selectedCustomerId !== "cust-0" && (
            <div className="flex items-center justify-between text-[11px] bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1 text-amber-900">
              <span className="flex items-center gap-1 font-semibold">
                <span className="text-amber-500 font-bold">★</span> loyalty balance:
              </span>
              <span className="font-mono font-bold text-xs text-amber-700">
                {selectedCustomer.points || 0} pts
              </span>
            </div>
          )}
        </div>

        {/* Hold Bill descriptor input */}
        <div className="px-3 py-2 bg-slate-100 border-b border-gray-200 flex gap-2 shrink-0">
          <input
            type="text"
            placeholder="Hold bill label (optional)..."
            value={holdNameInput}
            onChange={(e) => setHoldNameInput(e.target.value)}
            className="bg-white border text-xs text-slate-800 rounded px-2 py-1 flex-1 focus:outline-none"
          />
          <button
            onClick={handleHoldCart}
            disabled={cart.length === 0}
            className={`text-xs font-semibold px-2.5 py-1 rounded flex items-center gap-1 border transition ${
              cart.length === 0 
                ? "bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed" 
                : "bg-slate-800 text-white border-slate-700 hover:bg-slate-700"
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Hold Bill</span>
          </button>
        </div>

        {/* Cart Item Rows */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100 pr-1 select-text">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 py-12">
              <ShoppingBag className="w-10 h-10 opacity-30 animate-pulse mb-3" />
              <p className="text-xs font-semibold">Active basket is empty</p>
              <p className="text-[10px] text-gray-400 text-center max-w-xs mt-1">
                Select items from the list or scan mock barcodes to construct an receipt.
              </p>
            </div>
          ) : (
            cart.map((item) => {
              const discountedPrice = item.product.sellPrice * (1 - item.discountPercent / 100);
              return (
                <div key={item.product.id} className="p-3 flex items-center justify-between gap-3 text-sm">
                  {/* Item metadata */}
                  <div className="flex-1 min-w-0">
                    <h5 className="font-semibold text-gray-800 truncate">{item.product.name}</h5>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className="text-[10px] text-gray-400 font-mono">${item.product.sellPrice.toFixed(2)}</span>
                      
                      {/* Item level discounts */}
                      <button
                        onClick={() => {
                          const val = window.prompt(`Enter item discount % for ${item.product.name}:`, item.discountPercent.toString());
                          if (val !== null) {
                            const num = parseFloat(val);
                            if (!isNaN(num) && num >= 0 && num <= 100) {
                              setCart(prev => prev.map(i => i.product.id === item.product.id ? { ...i, discountPercent: num } : i));
                            }
                          }
                        }}
                        className="text-[9px] bg-sky-50 text-sky-700 hover:bg-sky-100 px-1 py-0.2 rounded font-mono font-bold flex items-center gap-0.5"
                      >
                        <Percent className="w-2.5 h-2.5" />
                        <span>Discount: {item.discountPercent}%</span>
                      </button>
                    </div>
                  </div>

                  {/* Quantity increment decrement widgets */}
                  <div className="flex items-center gap-1.5 shrink-0 select-none">
                    <button
                      onClick={() => updateCartQty(item.product.id, item.quantity - 1)}
                      className="w-6 h-6 border rounded-full flex items-center justify-center bg-slate-50 text-slate-600 hover:bg-slate-200"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center font-bold font-mono text-xs">{item.quantity}</span>
                    <button
                      onClick={() => updateCartQty(item.product.id, item.quantity + 1)}
                      className="w-6 h-6 border rounded-full flex items-center justify-center bg-slate-50 text-slate-600 hover:bg-slate-200"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Price column */}
                  <div className="text-right shrink-0 min-w-[70px]">
                    <span className="font-bold text-gray-800 font-mono">
                      ${(discountedPrice * item.quantity).toFixed(2)}
                    </span>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="block text-[10px] text-red-500 hover:underline mt-0.5 text-right font-semibold ml-auto"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pricing Summary calculations */}
        <div className="p-4 border-t border-gray-200 bg-slate-50 shrink-0">
          <div className="space-y-1.5 text-xs">
            {/* Subtotal */}
            <div className="flex justify-between text-gray-500">
              <span>Subtotal:</span>
              <span className="font-mono font-bold">${cartSubtotal.toFixed(2)}</span>
            </div>

            {/* Cart wide discount */}
            <div className="flex justify-between items-center text-gray-500 gap-4">
              <span className="flex items-center gap-1.5">
                <span>Discount (%):</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discountPercent}
                  onChange={(e) => {
                    const v = parseInt(e.target.value) || 0;
                    setDiscountPercent(Math.min(100, Math.max(0, v)));
                  }}
                  className="w-12 bg-white text-slate-800 text-[11px] font-bold border rounded p-0.5 text-center font-mono focus:outline-none"
                />
              </span>
              <span className="font-mono text-rose-600 font-semibold">- ${discountAmount.toFixed(2)}</span>
            </div>

            {/* Tax Percentage */}
            <div className="flex justify-between items-center text-gray-500 gap-4">
              <span className="flex items-center gap-1.5">
                <span>VAT Tax (%):</span>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={taxPercent}
                  onChange={(e) => {
                    const v = parseInt(e.target.value) || 0;
                    setTaxPercent(Math.min(50, Math.max(0, v)));
                  }}
                  className="w-12 bg-white text-slate-800 text-[11px] font-bold border rounded p-0.5 text-center font-mono focus:outline-none"
                />
              </span>
              <span className="font-mono font-semibold">+ ${taxAmount.toFixed(2)}</span>
            </div>

            <hr className="border-gray-200 my-1" />

            {/* Total USD */}
            <div className="flex justify-between items-baseline text-slate-950">
              <span className="font-bold text-sm">Grand Total (USD):</span>
              <span className="text-xl font-black font-mono tracking-tight text-orange-600">
                ${cartTotal.toFixed(2)}
              </span>
            </div>

            {/* KHR Cambodian Riel conversion */}
            <div className="flex justify-between items-baseline text-slate-500">
              <span className="text-[10px] uppercase font-bold tracking-wider">Equivalent KHR Riel:</span>
              <span className="text-xs font-bold font-mono">
                ៛ {cartTotalKHR.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>

          {/* Pay buttons */}
          <div className="grid grid-cols-2 gap-3 mt-4 select-none">
            <button
              onClick={clearCart}
              disabled={cart.length === 0}
              className="py-2.5 px-4 bg-slate-200 text-slate-700 hover:bg-slate-300 font-bold text-xs rounded-lg flex items-center justify-center gap-1 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" />
              <span>Reset Cart</span>
            </button>

            <button
              onClick={openCheckoutDrawer}
              disabled={cart.length === 0}
              className="py-2.5 px-4 bg-orange-500 text-white hover:bg-orange-600 font-black text-xs rounded-lg shadow flex items-center justify-center gap-1 transition active:scale-95 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed disabled:shadow-none"
            >
              <CreditCard className="w-4 h-4" />
              <span>PROCEED TO PAY</span>
            </button>
          </div>
        </div>
      </div>

      {/* CREATE CUSTOMER POPUP PANEL */}
      {addingCustomer && (
        <div className="absolute inset-x-0 inset-y-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-40">
          <form 
            onSubmit={handleCreateCustomer}
            className="bg-white border rounded-xl overflow-hidden shadow-2xl max-w-sm w-full p-5 space-y-4 text-left"
          >
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider font-sans">
                Create Staff/Customer Account
              </h3>
              <button 
                type="button" 
                onClick={() => setAddingCustomer(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block font-mono">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="e.g. Heang Chan"
                  className="w-full border text-xs text-slate-800 rounded px-3 py-2 mt-1 focus:ring-1 focus:ring-orange-500 outline-none animate-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block font-mono">Phone Number</label>
                  <input
                    type="text"
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    placeholder="e.g. 012 555 666"
                    className="w-full border text-xs text-slate-800 rounded px-3 py-2 mt-1 focus:ring-1 focus:ring-orange-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block font-mono">Email</label>
                  <input
                    type="email"
                    value={newCustEmail}
                    onChange={(e) => setNewCustEmail(e.target.value)}
                    placeholder="e.g. heang@gmail.com"
                    className="w-full border text-xs text-slate-800 rounded px-3 py-2 mt-1 focus:ring-1 focus:ring-orange-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block font-mono">Location</label>
                  <input
                    type="text"
                    value={newCustLoc}
                    onChange={(e) => setNewCustLoc(e.target.value)}
                    placeholder="Toul Kork"
                    className="w-full border text-xs text-slate-800 rounded px-3 py-2 mt-1 focus:ring-1 focus:ring-orange-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block font-mono">Other Info</label>
                  <input
                    type="text"
                    value={newCustOther}
                    onChange={(e) => setNewCustOther(e.target.value)}
                    placeholder="Corporate, Alternate contact"
                    className="w-full border text-xs text-slate-800 rounded px-3 py-2 mt-1 focus:ring-1 focus:ring-orange-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block font-mono">Note / Preference</label>
                <input
                  type="text"
                  value={newCustNote}
                  onChange={(e) => setNewCustNote(e.target.value)}
                  placeholder="Prefers special packaging"
                  className="w-full border text-xs text-slate-800 rounded px-3 py-2 mt-1 focus:ring-1 focus:ring-orange-500 outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setAddingCustomer(false)}
                className="px-3 py-1.5 text-xs text-gray-500 hover:bg-slate-100 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-orange-500 text-white text-xs font-bold rounded hover:bg-orange-600"
              >
                Save Member
              </button>
            </div>
          </form>
        </div>
      )}

      {/* DETAILED HOLD CARTS RETRIEVAL PANEL */}
      {showHoldModal && (
        <div className="absolute inset-x-0 inset-y-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-40">
          <div className="bg-white border rounded-xl overflow-hidden shadow-2xl max-w-md w-full p-5 space-y-4 text-left">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider font-sans flex items-center gap-1.5">
                <Bookmark className="w-4 h-4 text-orange-500" />
                Held/Active Tickets List ({holdCarts.length})
              </h3>
              <button 
                type="button" 
                onClick={() => setShowHoldModal(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="divide-y divide-gray-100 max-h-[300px] overflow-y-auto">
              {holdCarts.map((item) => {
                const countItems = item.items.reduce((sum, i) => sum + i.quantity, 0);
                const sumTotal = item.items.reduce((sum, i) => sum + (i.product.sellPrice * i.quantity), 0);
                return (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-3 text-xs select-text">
                    <div>
                      <h4 className="font-extrabold text-gray-800">{item.name}</h4>
                      <p className="text-[10px] text-gray-400 font-mono font-bold mt-0.5">
                        Saved: {item.date} • {countItems} units items
                      </p>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <span className="font-mono text-sm leading-none font-bold text-slate-900">${sumTotal.toFixed(2)}</span>
                      <button
                        onClick={() => {
                          resumeHoldCart(item);
                          setShowHoldModal(false);
                        }}
                        className="bg-orange-500 text-white font-extrabold px-3 py-1.5 rounded hover:bg-orange-600 text-[10px] tracking-wide"
                      >
                        Restore
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* PRIMARY CENTRAL CHECKOUT MODAL & RECEIPT INTERACTIVE POPUP */}
      {checkoutModalOpen && (
        <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          
          <div className="bg-white border rounded-2xl overflow-hidden shadow-2xl max-w-lg w-full flex flex-col relative animate-scale-up my-auto max-h-[96vh]">
            
            {/* Header bar */}
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-slate-50 shrink-0">
              <h2 className="font-bold text-gray-800 tracking-wide text-sm font-sans flex items-center gap-1.5 uppercase">
                <CreditCard className="w-4 h-4 text-orange-500" />
                POS Cashier Checkout Terminal
              </h2>
              {!lastCompletedOrder && (
                <button
                  onClick={() => setCheckoutModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 text-lg font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* CONTENT SPLIT: Pending checkout forms vs Thermal bill printing receipt output */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              
              {!lastCompletedOrder ? (
                // Standard active forms: Choose payment option
                <div className="space-y-4">
                  {/* Bill details */}
                  <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl text-center">
                    <p className="text-[10px] uppercase font-bold tracking-widest text-gray-400">GRAND TOTAL PAYABLE</p>
                    <h3 className="text-3xl font-black font-mono tracking-tight text-slate-900 mt-1">
                      ${cartTotal.toFixed(2)}
                    </h3>
                    <p className="text-xs font-semibold text-slate-500 font-sans mt-1">
                      ៛ {cartTotalKHR.toLocaleString(undefined, { maximumFractionDigits: 0 })} Cambodian Riel
                    </p>
                  </div>

                  {/* Loyalty Points System details in checkout */}
                  <div className="bg-amber-50/60 border border-amber-100/80 rounded-xl p-3 flex flex-col gap-1.5 text-xs text-amber-950">
                    <div className="flex items-center justify-between font-bold border-b border-amber-100/50 pb-1.5">
                      <span className="flex items-center gap-1">
                        <span className="text-amber-500 text-sm">★</span> Loyalty Rewards Status
                      </span>
                      <span className="bg-amber-100/80 text-amber-800 text-[9px] px-2 py-0.5 rounded-full font-sans font-bold uppercase tracking-wider">
                        1 Point per $1 spent
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-center pt-1">
                      <div className="bg-white/65 p-2 rounded-lg border border-amber-100/30">
                        <p className="text-[8px] text-gray-400 font-bold uppercase font-mono">Current points</p>
                        <p className="font-mono font-black text-xs mt-0.5 text-amber-950">
                          {selectedCustomerId === "cust-0" ? "N/A" : `${selectedCustomer.points || 0} pts`}
                        </p>
                      </div>
                      
                      <div className="bg-amber-100/40 p-2 rounded-lg border border-amber-100/50">
                        <p className="text-[8px] text-amber-800 font-bold uppercase font-mono">Will earn</p>
                        <p className="font-mono font-black text-xs mt-0.5 text-emerald-700">
                          {selectedCustomerId === "cust-0" ? "0 pts" : `+${earnedPoints} pts`}
                        </p>
                      </div>

                      <div className="bg-white/65 p-2 rounded-lg border border-amber-100/30">
                        <p className="text-[8px] text-gray-400 font-bold uppercase font-mono">New points</p>
                        <p className="font-mono font-black text-xs mt-0.5 text-indigo-700">
                          {selectedCustomerId === "cust-0" ? "N/A" : `${(selectedCustomer.points || 0) + earnedPoints} pts`}
                        </p>
                      </div>
                    </div>
                    {selectedCustomerId === "cust-0" && (
                      <p className="text-[10px] text-amber-900/80 text-center italic mt-0.5">
                        💡 Direct walk-in customer. Attach a registered customer card to award points!
                      </p>
                    )}
                  </div>

                  {/* Payment option selectors */}
                  <div className="grid grid-cols-2 gap-3.5 select-none">
                    <button
                      type="button"
                      onClick={() => setCheckoutPaymentMethod("Bakong_KHQR")}
                      className={`p-3 border rounded-xl flex flex-col items-center justify-center gap-1.5 transition text-center ${
                        checkoutPaymentMethod === "Bakong_KHQR"
                          ? "border-indigo-600 bg-indigo-50/50 text-indigo-950 font-bold shadow-sm"
                          : "border-gray-200 text-gray-500 hover:bg-slate-50"
                      }`}
                    >
                      <QrCode className="w-6 h-6 text-indigo-600" />
                      <span className="text-xs font-sans">KHQR Bakong Mobile</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCheckoutPaymentMethod("Cash")}
                      className={`p-3 border rounded-xl flex flex-col items-center justify-center gap-1.5 transition text-center ${
                        checkoutPaymentMethod === "Cash"
                          ? "border-emerald-600 bg-emerald-50/50 text-emerald-950 font-bold shadow-sm"
                          : "border-gray-200 text-gray-500 hover:bg-slate-50"
                      }`}
                    >
                      <DollarSign className="w-6 h-6 text-emerald-600" />
                      <span className="text-xs font-sans">Cash Register Drawer</span>
                    </button>
                  </div>

                  {/* SUBFORM A: Bakong KHQR details */}
                  {checkoutPaymentMethod === "Bakong_KHQR" && activeCheckoutKHQR && (
                    <div className="p-3 border border-indigo-100 bg-slate-50 rounded-xl space-y-4">
                      {/* Currency selectors */}
                      <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                        <span className="text-xs text-gray-500 font-sans">Invoice Currency:</span>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => setCheckoutCurrency("USD")}
                            className={`py-0.5 px-2 text-[10px] font-bold rounded ${
                              checkoutCurrency === "USD" ? "bg-indigo-600 text-white" : "bg-white text-gray-600 border"
                            }`}
                          >
                            USD ($)
                          </button>
                          <button
                            onClick={() => setCheckoutCurrency("KHR")}
                            className={`py-0.5 px-2 text-[10px] font-bold rounded ${
                              checkoutCurrency === "KHR" ? "bg-indigo-600 text-white" : "bg-white text-gray-600 border"
                            }`}
                          >
                            KHR (៛)
                          </button>
                        </div>
                      </div>

                      {/* Visually genuine, premium red/blue Cambodia KHQR Frame */}
                      <div className="flex flex-col items-center p-3 bg-white border border-gray-200 rounded-xl max-w-xs mx-auto shadow-sm">
                        
                        {/* Red Title banner with authentic KHQR look */}
                        <div className="w-full bg-[#E5122F] text-white p-2 rounded-t-lg text-center leading-none">
                          <span className="text-[13px] font-extrabold tracking-widest font-sans uppercase">KHQR</span>
                          <span className="text-[7px] block tracking-wide font-sans mt-0.5">KINGDOM OF CAMBODIA</span>
                        </div>

                        {/* Mid-bar indicating currency symbol and logo */}
                        <div className="w-full py-1.5 px-3 border-x border-gray-200 flex items-center justify-between bg-slate-50 select-none border-b">
                          <div className="flex items-center gap-1">
                            <span className="bg-[#24292e] text-white text-[8px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center font-mono">BK</span>
                            <span className="text-[9px] font-bold text-slate-800">BAKONG</span>
                          </div>
                          
                          {/* Display Amount */}
                          <div className="text-right leading-none">
                            <span className="text-[11px] font-extrabold text-indigo-700 font-mono">
                              {checkoutCurrency === "USD" ? `$ ${cartTotal.toFixed(2)}` : `៛ ${cartTotalKHR.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                            </span>
                          </div>
                        </div>

                        {/* Centered QR Frame inside */}
                        <div className="py-4 px-5 border-x border-b border-gray-200 rounded-b-lg w-full flex flex-col items-center justify-center relative bg-white">
                          
                          {/* Simulated scan code loading pixels via external free visual service */}
                          <div className="w-44 h-44 border border-gray-100 p-1 rounded-md bg-white select-none relative">
                            <img
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&color=091E42&data=${encodeURIComponent(activeCheckoutKHQR.qrStr)}`}
                              alt="Genuine Bakong KHQR Code"
                              className="w-full h-full object-contain pointer-events-none"
                              referrerPolicy="no-referrer"
                            />
                            
                            {/* Inner Logo */}
                            <div className="absolute inset-0 m-auto w-8 h-8 rounded-full border border-white bg-[#e05e26] text-white flex items-center justify-center font-black text-[9px] tracking-widest shadow">
                              KH
                            </div>
                          </div>

                          <p className="text-[10px] font-semibold text-slate-500 font-sans mt-2">
                            Bill Ref: <strong className="font-bold text-slate-800">{activeCheckoutKHQR.invoiceNo}</strong>
                          </p>
                        </div>
                      </div>

                      {/* Long polling status simulating live websocket triggers */}
                      <div className="flex flex-col items-center justify-center text-center py-2 space-y-1.5">
                        <div className="flex items-center gap-2 text-indigo-700 text-xs font-semibold uppercase tracking-wider bg-indigo-50 border border-indigo-100 px-3.5 py-1 rounded-full shrink-0">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Pulsating Live Gateway...</span>
                        </div>
                        <p className="text-[10px] text-gray-500 max-w-sm">
                          POS is linked to simulated webhook. You can open <strong>Bakong Wallet Sim</strong> above or click below to simulate instant buyer swipe validation.
                        </p>

                        <button
                          type="button"
                          onClick={() => {
                            // Instant simulate checkout success locally
                            handlePOSOrderCompletion("Bakong_KHQR");
                            onSimulateCheckoutSuccess();
                          }}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[11px] py-1.5 px-4 rounded-lg mt-2 transition active:scale-95"
                        >
                          Simulate Payment Received ✅
                        </button>
                      </div>
                    </div>
                  )}

                  {/* SUBFORM B: Cash payment details */}
                  {checkoutPaymentMethod === "Cash" && (
                    <div className="p-3.5 border border-emerald-100 bg-slate-50 rounded-xl space-y-3 text-left">
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase font-mono block">Cash Handed by Customer ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          placeholder="0.00"
                          value={cashAmountPaid}
                          onChange={(e) => setCashAmountPaid(e.target.value)}
                          className="w-full border bg-white rounded-lg px-3 py-2.5 mt-1 font-mono text-base focus:ring-1 focus:ring-emerald-500 outline-none"
                        />
                      </div>

                      {/* Cash calculations */}
                      {parseFloat(cashAmountPaid) > 0 && (
                        <div className="bg-white border rounded-lg p-2.5 space-y-1.5 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Bill Fee:</span>
                            <span className="font-mono font-bold">${cartTotal.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Paid Amount:</span>
                            <span className="font-mono font-bold text-emerald-600">${parseFloat(cashAmountPaid).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-base border-t border-dashed border-gray-200 pt-1.5">
                            <span className="font-bold text-slate-800">Change Due (USD):</span>
                            <span className="font-mono font-extrabold text-emerald-700">
                              ${(parseFloat(cashAmountPaid) - cartTotal).toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between text-[11px] text-gray-400">
                            <span>Equivalent Change in KHR:</span>
                            <span className="font-mono font-semibold">
                              ៛ {Math.max(0, (parseFloat(cashAmountPaid) - cartTotal) * settings.exchangeRate).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Fast Cash input buttons */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Quick Cash Select:</span>
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            Math.ceil(cartTotal),
                            Math.ceil(cartTotal / 5) * 5,
                            Math.ceil(cartTotal / 10) * 10,
                            Math.ceil(cartTotal / 20) * 20,
                            20, 50, 100
                          ]
                            .filter(val => val >= cartTotal)
                            // Unique items
                            .filter((item, index, self) => self.indexOf(item) === index)
                            .slice(0, 8)
                            .map((denom) => (
                              <button
                                type="button"
                                key={denom}
                                onClick={() => setCashAmountPaid(denom.toString())}
                                className="bg-white hover:bg-slate-100 border text-slate-800 font-bold font-mono text-xs py-1.5 px-2 rounded transition"
                              >
                                ${denom}
                              </button>
                            ))}
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={parseFloat(cashAmountPaid) < cartTotal}
                        onClick={() => handlePOSOrderCompletion("Cash")}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold py-2.5 rounded-lg text-xs tracking-wider transition uppercase disabled:cursor-not-allowed mt-2"
                      >
                        Complete Order & Open Cash Drawer 💵
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                // Order completed! Show Thermal receipt printer layout
                <div className="space-y-4">
                  
                  {/* Print checkout Success banner */}
                  <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl text-center select-none text-emerald-800 text-xs font-semibold flex items-center justify-center gap-1.5">
                    <Check className="w-5 h-5 text-emerald-600 bg-emerald-100 rounded-full p-0.5 shrink-0" />
                    <span>Transaction successfully verified in standard POS logs!</span>
                  </div>

                  {/* Aesthetic 80mm Custom Terminal Thermal Receipt simulation paper frame */}
                  <div className="bg-neutral-50 border border-gray-300 rounded-lg p-5 shadow-inner max-w-sm mx-auto font-mono text-xs text-neutral-800 leading-normal relative overflow-hidden select-text">
                    
                    {/* Simulated paper serrated teeth effect on top and bottom */}
                    <div className="absolute top-0 inset-x-0 h-1 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-200 via-transparent to-transparent"></div>

                    <div className="text-center space-y-1">
                      <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-900 leading-none">
                        {settings.merchantName}
                      </h4>
                      {settings.receiptHeaderText ? (
                        <p className="text-[9px] text-gray-500 whitespace-pre-line leading-tight">
                          {settings.receiptHeaderText}
                        </p>
                      ) : (
                        <p className="text-[10px] text-gray-500">
                          {settings.merchantCity}, Cambodia
                        </p>
                      )}
                      <p className="text-[10px] text-gray-500">
                        POS terminal: {settings.storeLabel}
                      </p>
                      <p className="text-[10px] text-gray-500 border-b border-dashed border-gray-300 pb-2">
                        Tel: {DEFAULT_CUSTOMERS[1].phone} (Admin Route)
                      </p>
                    </div>

                    <div className="py-2 space-y-0.5 text-[10px]">
                      <div className="flex justify-between">
                        <span>Invoice ID:</span>
                        <span className="font-bold">{lastCompletedOrder.invoiceNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cashier Log:</span>
                        <span>ADMINISTRATOR</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Customer Name:</span>
                        <span>{lastCompletedOrder.customer?.name || "Walk-in Customer"}</span>
                      </div>
                      <div className="flex justify-between border-b border-dashed border-gray-350 pb-2">
                        <span>Date / Check:</span>
                        <span>{new Date(lastCompletedOrder.date).toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Bought products list */}
                    <table className="w-full text-left text-[10px] my-2 select-text border-b border-dashed border-gray-300 pb-2">
                      <thead>
                        <tr className="border-b border-dashed border-gray-300">
                          <th className="font-bold py-1">Item Title</th>
                          <th className="font-bold py-1 text-center">Qty</th>
                          <th className="font-bold py-1 text-right">Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lastCompletedOrder.items.map((item, idx) => {
                          const discPercent = item.discountPercent;
                          const ratePrice = item.sellPrice * (1 - discPercent / 100);
                          return (
                            <tr key={idx}>
                              <td className="py-1">
                                {item.productName}
                                {discPercent > 0 && <span className="block text-[8px] text-rose-500">({discPercent}% Off)</span>}
                              </td>
                              <td className="py-1 text-center">{item.quantity}</td>
                              <td className="py-1 text-right font-mono">${(ratePrice * item.quantity).toFixed(2)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    {/* Tax summaries */}
                    <div className="text-[10px] space-y-0.5 border-b border-dashed border-gray-350 pb-2 my-2 text-right">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span className="font-mono">${lastCompletedOrder.subtotal.toFixed(2)}</span>
                      </div>
                      {lastCompletedOrder.discountPercent > 0 && (
                        <div className="flex justify-between text-rose-600">
                          <span>Discount ({lastCompletedOrder.discountPercent}%):</span>
                          <span className="font-mono">-${lastCompletedOrder.discountAmount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>VAT ({lastCompletedOrder.taxPercent}%):</span>
                        <span className="font-mono">${lastCompletedOrder.taxAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs font-extrabold text-slate-900 border-t border-dashed border-gray-200 pt-1">
                        <span>Grand Total (USD):</span>
                        <span className="font-mono">${lastCompletedOrder.total.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs font-bold text-gray-500 mt-0.5">
                        <span>Total Riel KHR:</span>
                        <span className="font-mono">៛ {lastCompletedOrder.totalKHR.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                      </div>
                    </div>

                    <div className="text-[9px] text-slate-750 space-y-0.5 border-b border-dashed border-gray-350 pb-2 text-center select-all bg-slate-50 p-1.5 rounded border">
                      <p className="font-extrabold uppercase text-slate-800 flex items-center justify-center gap-1">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        PAID BY {lastCompletedOrder.paymentMethod === "Bakong_KHQR" ? "KHQR BAKONG APP" : "CASH"}
                      </p>
                      
                      {lastCompletedOrder.bakongTxId && (
                        <p className="font-sans text-[8px] font-semibold mt-1">
                          Bakong Tx ID: <strong className="font-bold text-blue-800">{lastCompletedOrder.bakongTxId}</strong>
                        </p>
                      )}
                      
                      <p className="text-[8px] text-slate-400 leading-normal">
                        Settled locally via Bank Router
                      </p>
                    </div>

                    {/* Loyalty rewards status */}
                    {lastCompletedOrder.customer && lastCompletedOrder.customer.id !== "cust-0" && (
                      <div className="border-b border-dashed border-gray-350 py-2.5 text-[9.5px] space-y-0.5">
                        <p className="font-bold text-slate-950 text-center uppercase tracking-wider mb-1.5">★ LOYALTY REWARDS STATUS ★</p>
                        <div className="flex justify-between">
                          <span>Previous Points Balance:</span>
                          <span>{(lastCompletedOrder.customer.points || 0) - Math.floor(lastCompletedOrder.total)} pts</span>
                        </div>
                        <div className="flex justify-between text-emerald-700 font-semibold">
                          <span>Earned this purchase:</span>
                          <span>+{Math.floor(lastCompletedOrder.total)} pts</span>
                        </div>
                        <div className="flex justify-between font-bold border-t border-dotted border-gray-250 mt-1.5 pt-1 text-slate-900">
                          <span>New Points Balance:</span>
                          <span>{lastCompletedOrder.customer.points || 0} pts</span>
                        </div>
                      </div>
                    )}

                    <div className="text-center pt-3 select-none">
                      {settings.receiptFooterText ? (
                        <p className="text-[9px] text-gray-500 whitespace-pre-line leading-tight">
                          {settings.receiptFooterText}
                        </p>
                      ) : (
                        <>
                          <p className="text-[10px] font-bold">សូមអរគុណ! - THANK YOU!</p>
                          <p className="text-[8px] text-gray-400 mt-0.5 font-sans">Developed with Laravel 12 & AdminLTE rules</p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Receipt operations buttons */}
                  <div className="flex gap-2 justify-center py-2 select-none">
                    <button
                      type="button"
                      onClick={handlePrintReceipt}
                      className="bg-slate-800 hover:bg-slate-700 font-bold text-xs py-2 px-4 rounded-lg flex items-center justify-center gap-1.5 transition text-white"
                    >
                      {isPrintingAnimation ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Printing Spooler...</span>
                        </>
                      ) : (
                        <>
                          <Printer className="w-4 h-4" />
                          <span>Print Simulated Invoice Receipt</span>
                        </>
                      )}
                    </button>
                    
                    <button
                      type="button"
                      onClick={handleStartNewSale}
                      className="bg-orange-500 hover:bg-orange-600 font-black text-xs py-2 px-5 rounded-lg text-white"
                    >
                      New Sale
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
