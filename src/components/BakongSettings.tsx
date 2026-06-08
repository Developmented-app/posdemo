import React, { useState } from "react";
import { 
  QrCode, 
  Settings, 
  HelpCircle, 
  Eye, 
  TrendingUp, 
  Globe, 
  RefreshCw,
  Award,
  Smartphone,
  CheckCircle,
  Users,
  UserPlus,
  Tags,
  FolderPlus,
  Plus,
  Package,
  FilePlus,
  Sliders,
  Printer,
  Volume2,
  Database,
  Trash2,
  Search,
  FileText,
  DollarSign,
  Edit3,
  Send,
  Bell,
  Clock
} from "lucide-react";
import { BakongSettings, Customer, Product, Order } from "../types";
import { generateDailyReportHTML, sendTelegramNotification } from "../utils/telegram";

interface SettingsProps {
  settings: BakongSettings;
  setSettings: React.Dispatch<React.SetStateAction<BakongSettings>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  categories: string[];
  setCategories: React.Dispatch<React.SetStateAction<string[]>>;
  onResetDatabase: () => void;
  orders: Order[];
}

type ActiveTab = "credentials" | "customers" | "catalog" | "general" | "telegram";

export default function BakongSettingsPanel({
  settings,
  setSettings,
  products,
  setProducts,
  customers,
  setCustomers,
  categories,
  setCategories,
  onResetDatabase,
  orders
}: SettingsProps) {
  // Navigation sub-tab
  const [activeTab, setActiveTab] = useState<ActiveTab>("credentials");

  // State: Tab 1 - Credentials Form
  const [name, setName] = useState(settings.merchantName);
  const [mid, setMid] = useState(settings.merchantId);
  const [acq, setAcq] = useState(settings.acquirerId);
  const [city, setCity] = useState(settings.merchantCity);
  const [label, setLabel] = useState(settings.storeLabel);
  const [rate, setRate] = useState(settings.exchangeRate);

  // State: Tab 2 - New Customer Form
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custEmail, setCustEmail] = useState("");
  const [custLoc, setCustLoc] = useState("");
  const [custNote, setCustNote] = useState("");
  const [custOther, setCustOther] = useState("");
  const [custPoints, setCustPoints] = useState<number>(0);
  const [custSearch, setCustSearch] = useState("");
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // State: Tab 3 - Product & Categories
  const [newCatName, setNewCatName] = useState("");
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editCategoryVal, setEditCategoryVal] = useState<string>("");
  
  const [prodName, setProdName] = useState("");
  const [prodCat, setProdCat] = useState("");
  const [prodPriceInput, setProdPriceInput] = useState<string>("5.00");
  const [prodCurrency, setProdCurrency] = useState<"USD" | "KHR">("USD");
  const [prodImg, setProdImg] = useState("");
  const [prodQty, setProdQty] = useState<number>(30);
  const [prodSku, setProdSku] = useState("");
  const [prodBarcode, setProdBarcode] = useState("");
  const [prodCost, setProdCost] = useState<string>("2.50");
  const [prodOther, setProdOther] = useState("");

  // State: Tab 4 - General Control Settings
  const [invoicePrefix, setInvoicePrefix] = useState(settings.invoicePrefix || "INV");
  const [taxPercent, setTaxPercent] = useState<number>(settings.taxPercent ?? 10);
  const [receiptHeaderTxt, setReceiptHeaderTxt] = useState(settings.receiptHeaderText || "");
  const [receiptFooterTxt, setReceiptFooterTxt] = useState(settings.receiptFooterText || "");
  const [enableSound, setEnableSound] = useState(settings.enableSoundAlerts ?? true);

  // State: Tab 5 - Telegram Bot Reporting Settings
  const [tgBotToken, setTgBotToken] = useState(settings.telegramBotToken || "");
  const [tgChatId, setTgChatId] = useState(settings.telegramChatId || "");
  const [tgEnable, setTgEnable] = useState(settings.enableTelegramDailyReport ?? false);
  const [tgHour, setTgHour] = useState<number>(settings.telegramReportHour ?? 18);
  const [tgMinute, setTgMinute] = useState<number>(settings.telegramReportMinute ?? 0);
  const [testSending, setTestSending] = useState(false);

  // Status indicators per submission action
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // Dynamic search directory
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(custSearch.toLowerCase()) || 
    c.phone.includes(custSearch) ||
    (c.location || "").toLowerCase().includes(custSearch.toLowerCase())
  );

  const triggerFeedback = (text: string, type: "success" | "error" = "success") => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // 1. Submit Credentials
  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAction("credentials");

    setTimeout(() => {
      setSettings(prev => ({
        ...prev,
        merchantName: name.trim() || prev.merchantName,
        merchantId: mid.trim() || prev.merchantId,
        acquirerId: acq.trim() || prev.acquirerId,
        merchantCity: city.trim() || prev.merchantCity,
        storeLabel: label.trim() || prev.storeLabel,
        exchangeRate: Math.max(100, rate)
      }));
      setLoadingAction(null);
      triggerFeedback("Bakong API security settings and credentials updated successfully!");
    }, 800);
  };

  // 2. Submit New / Edit Customer
  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim() || !custPhone.trim()) {
      triggerFeedback("Name and Phone are mandatory customer identifier fields.", "error");
      return;
    }

    setLoadingAction("customer");

    setTimeout(() => {
      if (editingCustomer) {
        setCustomers(prev => prev.map(c => 
          c.id === editingCustomer.id
            ? {
                ...c,
                name: custName.trim(),
                phone: custPhone.trim(),
                email: custEmail.trim() || undefined,
                location: custLoc.trim() || undefined,
                note: custNote.trim() || undefined,
                other: custOther.trim() || undefined,
                points: custPoints
              }
            : c
        ));
        setEditingCustomer(null);
        triggerFeedback(`Customer "${custName.trim()}" information up-to-date.`);
      } else {
        const newCustomer: Customer = {
          id: `cust-${Date.now()}`,
          name: custName.trim(),
          phone: custPhone.trim(),
          email: custEmail.trim() || undefined,
          location: custLoc.trim() || undefined,
          note: custNote.trim() || undefined,
          other: custOther.trim() || undefined,
          points: custPoints
        };

        setCustomers(prev => [...prev, newCustomer]);
        triggerFeedback(`Registered user/customer "${newCustomer.name}" successfully into the POS register.`);
      }

      setCustName("");
      setCustPhone("");
      setCustEmail("");
      setCustLoc("");
      setCustNote("");
      setCustOther("");
      setCustPoints(0);

      setLoadingAction(null);
    }, 600);
  };

  const handleStartEditCustomer = (c: Customer) => {
    setEditingCustomer(c);
    setCustName(c.name);
    setCustPhone(c.phone);
    setCustEmail(c.email || "");
    setCustLoc(c.location || "");
    setCustNote(c.note || "");
    setCustOther(c.other || "");
    setCustPoints(c.points || 0);
  };

  const handleCancelEditCustomer = () => {
    setEditingCustomer(null);
    setCustName("");
    setCustPhone("");
    setCustEmail("");
    setCustLoc("");
    setCustNote("");
    setCustOther("");
    setCustPoints(0);
  };

  // Delete customer
  const handleDeleteCustomer = (id: string, name: string) => {
    if (id === "cust-0") {
      alert("Cannot delete primary default Walk-in Customer identifier.");
      return;
    }
    if (confirm(`Are you sure you want to remove "${name}" from customer lists?`)) {
      setCustomers(prev => prev.filter(c => c.id !== id));
      if (editingCustomer?.id === id) {
        handleCancelEditCustomer();
      }
      triggerFeedback(`Deleted user "${name}" from local active indexers.`);
    }
  };

  // 3. Submit New Category
  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedCat = newCatName.trim();
    if (!formattedCat) return;

    if (categories.some(cat => cat.toLowerCase() === formattedCat.toLowerCase())) {
      triggerFeedback(`Category "${formattedCat}" already exists.`, "error");
      return;
    }

    setCategories(prev => [...prev, formattedCat]);
    setNewCatName("");
    triggerFeedback(`Successfully added category: "${formattedCat}" to options.`);
  };

  const handleStartEditCategory = (catToEdit: string) => {
    setEditingCategory(catToEdit);
    setEditCategoryVal(catToEdit);
  };

  const handleCancelEditCategory = () => {
    setEditingCategory(null);
    setEditCategoryVal("");
  };

  const handleSaveEditedCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedNewCat = editCategoryVal.trim();
    if (!formattedNewCat || !editingCategory) return;

    if (formattedNewCat.toLowerCase() === editingCategory.toLowerCase()) {
      setEditingCategory(null);
      return;
    }

    if (categories.some(cat => cat.toLowerCase() === formattedNewCat.toLowerCase() && cat !== editingCategory)) {
      triggerFeedback(`Category "${formattedNewCat}" already exists.`, "error");
      return;
    }

    // Update categories
    setCategories(prev => prev.map(cat => cat === editingCategory ? formattedNewCat : cat));

    // Update products with matching category
    setProducts(prev => prev.map(p => 
      p.category === editingCategory 
        ? { ...p, category: formattedNewCat } 
        : p
    ));

    triggerFeedback(`Category renamed from "${editingCategory}" to "${formattedNewCat}". Associated products refreshed.`);
    setEditingCategory(null);
    setEditCategoryVal("");
  };

  // Delete Category
  const handleDeleteCategory = (catToDelete: string) => {
    if (["Main Dishes", "Beverages", "Groceries", "Snacks"].includes(catToDelete)) {
      alert("System categories cannot be deleted to retain integrity of default mock products.");
      return;
    }
    if (confirm(`Are you sure you want to remove category "${catToDelete}"? Related products might fall back to general filter.`)) {
      setCategories(prev => prev.filter(cat => cat !== catToDelete));
      if (editingCategory === catToDelete) {
        handleCancelEditCategory();
      }
      triggerFeedback(`Inbound category "${catToDelete}" deleted successfully.`);
    }
  };

  // 4. Submit New Product
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim()) {
      triggerFeedback("Product Title is a required field.", "error");
      return;
    }

    setLoadingAction("product");

    setTimeout(() => {
      // Currency pricing conversions
      const parsedPriceInput = parseFloat(prodPriceInput) || 0;
      let finalSellPriceUsd = parsedPriceInput;
      if (prodCurrency === "KHR") {
        // convert KHR -> USD based on exchange setting
        finalSellPriceUsd = parsedPriceInput / settings.exchangeRate;
      }

      const parsedCostInput = parseFloat(prodCost) || 0;
      const skuVal = prodSku.trim() || `FO-NEW-${Math.floor(10 + Math.random() * 89)}`;
      const barcodeVal = prodBarcode.trim() || `88410099${Math.floor(1000 + Math.random() * 8999)}`;
      
      const newProduct: Product = {
        id: `prod-${Date.now()}`,
        name: prodName.trim(),
        sku: skuVal,
        barcode: barcodeVal,
        category: prodCat || categories[0] || "Main Dishes",
        costPrice: parsedCostInput || (finalSellPriceUsd * 0.5), // Estimate 50% profit cost if omitted
        sellPrice: parseFloat(finalSellPriceUsd.toFixed(2)),
        stock: prodQty,
        lowStockThreshold: 5,
        image: prodImg.trim() || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=120&auto=format&fit=crop&q=80"
      };

      setProducts(prev => [newProduct, ...prev]);

      // Reset fields
      setProdName("");
      setProdPriceInput("5.00");
      setProdQty(30);
      setProdSku("");
      setProdBarcode("");
      setProdCost("2.50");
      setProdImg("");
      setProdOther("");

      setLoadingAction(null);
      triggerFeedback(`Added "${newProduct.name}" to the active physical catalog, listed under "${newProduct.category}".`);
    }, 700);
  };

  // 5. Submit General controls Settings
  const handleSaveGeneralControls = (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAction("general");

    setTimeout(() => {
      setSettings(prev => ({
        ...prev,
        invoicePrefix: invoicePrefix.trim() || "INV",
        taxPercent: Math.max(0, Math.min(100, taxPercent)),
        receiptHeaderText: receiptHeaderTxt.trim() || undefined,
        receiptFooterText: receiptFooterTxt.trim() || undefined,
        enableSoundAlerts: enableSound
      }));
      setLoadingAction(null);
      triggerFeedback("General controls, invoice parameters, and receipt layout updated successfully!");
    }, 600);
  };

  // 6. Submit Telegram Bot Reporting Settings
  const handleSaveTelegramSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAction("telegram");

    setTimeout(() => {
      setSettings(prev => ({
        ...prev,
        telegramBotToken: tgBotToken.trim(),
        telegramChatId: tgChatId.trim(),
        enableTelegramDailyReport: tgEnable,
        telegramReportHour: tgHour,
        telegramReportMinute: tgMinute
      }));
      setLoadingAction(null);
      triggerFeedback("Telegram Bot Reporting configurations updated and synchronized successfully!");
    }, 600);
  };

  const handleSendTestReport = async () => {
    if (!tgBotToken.trim() || !tgChatId.trim()) {
      triggerFeedback("Please specify both a valid Telegram Bot Token and Chat ID to send a report.", "error");
      return;
    }
    
    setTestSending(true);
    
    const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
    
    // Compile and generate HTML message
    const reportText = generateDailyReportHTML(orders, products, settings, todayStr);
    
    const res = await sendTelegramNotification(tgBotToken.trim(), tgChatId.trim(), reportText);
    setTestSending(false);
    
    if (res.success) {
      triggerFeedback("Success! Immediate daily POS summary report compiled and sent to your Telegram chat!");
    } else {
      triggerFeedback(`Telegram Delivery Failed: ${res.error}`, "error");
    }
  };

  return (
    <div className="space-y-6 select-none animate-fade-in text-left">
      
      {/* Page Title Header */}
      <div className="border-b border-gray-200 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight font-sans flex items-center gap-2">
            <Settings className="w-6 h-6 text-orange-500" />
            AdminLTE Master POS Configuration Hub
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Configure Bakong KHQR credentials, manage users/customers, dynamic categories, seed items, and format custom receipts.
          </p>
        </div>

        {/* Global Reset Database Trigger */}
        <button
          onClick={onResetDatabase}
          className="bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-bold text-xs py-1.5 px-4 rounded-lg flex items-center gap-1.5 transition active:scale-95 cursor-pointer leading-none"
        >
          <Database className="w-4 h-4 text-amber-700" />
          Wipe & Reload Cambodian Demo Cache
        </button>
      </div>

      {/* SUB TAB INDICATORS */}
      <div className="flex border-b border-gray-200 overflow-x-auto gap-1 pb-px scrollbar-none select-none">
        <button
          onClick={() => setActiveTab("credentials")}
          className={`py-2 px-4 text-xs font-bold font-sans flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
            activeTab === "credentials" 
              ? "border-orange-500 text-orange-600 bg-white" 
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          <QrCode className="w-4 h-4" />
          Bakong KHQR Credentials
        </button>

        <button
          onClick={() => {
            setActiveTab("customers");
            setFeedbackMsg(null);
          }}
          className={`py-2 px-4 text-xs font-bold font-sans flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
            activeTab === "customers" 
              ? "border-orange-500 text-orange-600 bg-white" 
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          <Users className="w-4 h-4" />
          Customers Setup ("Customer or Other")
        </button>

        <button
          onClick={() => {
            setActiveTab("catalog");
            setFeedbackMsg(null);
            // Default selected form category
            if (!prodCat && categories.length > 0) {
              setProdCat(categories[0]);
            }
          }}
          className={`py-2 px-4 text-xs font-bold font-sans flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
            activeTab === "catalog" 
              ? "border-orange-500 text-orange-600 bg-white" 
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          <Plus className="w-4 h-4" />
          Setup Categories & Products
        </button>

        <button
          onClick={() => {
            setActiveTab("general")}
          }
          className={`py-2 px-4 text-xs font-bold font-sans flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
            activeTab === "general" 
              ? "border-orange-500 text-orange-600 bg-white" 
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          <Sliders className="w-4 h-4" />
          Control General (Print, Invoice, VAT)
        </button>

        <button
          onClick={() => {
            setActiveTab("telegram");
            setFeedbackMsg(null);
          }}
          className={`py-2 px-4 text-xs font-bold font-sans flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
            activeTab === "telegram" 
              ? "border-orange-500 text-orange-600 bg-white" 
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          <Send className="w-4 h-4 text-[#0088cc]" />
          Telegram Bot Reports
        </button>
      </div>

      {/* Global Toast Alert banner */}
      {feedbackMsg && (
        <div className={`p-4 rounded-xl border flex items-center gap-2.5 text-xs animate-scale-up ${
          feedbackMsg.type === "success" 
            ? "text-emerald-900 bg-emerald-50 border-emerald-200" 
            : "text-rose-900 bg-rose-50 border-rose-200"
        }`}>
          <CheckCircle className={`w-5 h-5 shrink-0 ${feedbackMsg.type === "success" ? "text-emerald-600" : "text-rose-600"}`} />
          <span className="font-medium font-sans leading-relaxed">{feedbackMsg.text}</span>
        </div>
      )}

      {/* TAB CONTENT GRID LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* ======================= TAB 1: BAKONG GATEWAY CREDENTIALS ======================= */}
        {activeTab === "credentials" && (
          <>
            <div className="lg:col-span-8 bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider font-sans flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-orange-500" />
                  EMVCo Merchant Security Credentials
                </h2>
                <span className="text-[10px] bg-slate-100 font-bold border font-mono text-slate-500 px-2 py-0.5 rounded leading-none">
                  Bakong API Key Secure Proxy
                </span>
              </div>

              <form onSubmit={handleSaveCredentials} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block font-mono">Merchant Shop Name *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full border bg-white rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-orange-500 outline-none mt-1.5 font-sans font-semibold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block font-mono">Merchant Account ID / IBC *</label>
                    <input
                      type="text"
                      required
                      value={mid}
                      onChange={(e) => setMid(e.target.value)}
                      placeholder="e.g. storename@aba"
                      className="w-full border bg-white rounded-lg px-3 py-2 text-xs font-mono focus:ring-1 focus:ring-orange-500 outline-none mt-1.5 text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block font-mono">Acquiring Bank</label>
                    <input
                      type="text"
                      value={acq}
                      onChange={(e) => setAcq(e.target.value)}
                      className="w-full border bg-white rounded-lg px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-orange-500 outline-none mt-1.5 text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block font-mono">Store Counter Label</label>
                    <input
                      type="text"
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                      className="w-full border bg-white rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-orange-500 outline-none mt-1.5 font-mono text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block font-mono">Merchant Region City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full border bg-white rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-orange-500 outline-none mt-1.5 text-slate-800"
                    />
                  </div>
                </div>

                {/* Exchange Rate Box */}
                <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950 uppercase tracking-wider font-sans">
                    <Globe className="w-4 h-4 text-indigo-600" />
                    <span>Cambodian Riel Exchange Standard</span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                    <p className="text-xs text-gray-500 leading-normal">
                      The official Cambodian Riel equivalent conversion per 1 USD during QR checkouts. NBC standard range is ៛4,000 - ៛4,150.
                    </p>
                    
                    <div className="relative">
                      <span className="text-xs font-bold text-slate-400 font-sans absolute left-3 top-2.5">៛ Riel per $1:</span>
                      <input
                        type="number"
                        required
                        min="100"
                        value={rate}
                        onChange={(e) => setRate(parseInt(e.target.value) || 0)}
                        className="w-full border bg-white rounded-lg pl-28 pr-3 py-2 text-xs font-extrabold font-mono focus:ring-1 focus:ring-orange-500 outline-none text-right text-slate-850"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={loadingAction !== null}
                    className="bg-orange-500 hover:bg-orange-600 font-bold text-xs text-white py-2.5 px-6 rounded-lg shadow inline-flex items-center gap-2 transition active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {loadingAction === "credentials" ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Applying Credentials...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Credentials</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            <div className="lg:col-span-4 bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest font-mono border-b pb-2">
                KHQR specs compliance
              </h3>
              <p className="text-xs text-slate-500 leading-normal">
                All QR parameters compiled dynamically on screen comply with the <strong>NBC (National Bank of Cambodia) KHQR specification</strong> standard to route payments cleanly.
              </p>
              <div className="p-3 bg-rose-50/50 rounded-lg text-[11px] leading-relaxed text-slate-600 border space-y-1.5">
                <span className="font-bold text-[#8B0E1E] uppercase tracking-wider block text-[10px]">Security Notice:</span>
                This app runs fully secure client-side sandbox emulation. No private keys or secret credentials will ever leave this environment.
              </div>
            </div>
          </>
        )}

               {/* ======================= TAB 2: SETUP CUSTOMERS (Name, Phone, Location, Note, Other) ======================= */}
        {activeTab === "customers" && (
          <>
            {/* Form Section */}
            <div className="lg:col-span-7 bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-5">
              <div className="border-b border-slate-100 pb-2.5 flex items-center justify-between">
                <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider font-sans flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-orange-500" />
                  {editingCustomer ? `Edit Customer Info: ${editingCustomer.name}` : `Register New Customer ("Customer or Other")`}
                </h2>
                <div className="flex items-center gap-2">
                  {editingCustomer && (
                    <button
                      type="button"
                      onClick={handleCancelEditCustomer}
                      className="text-[11px] bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 px-2 py-0.5 rounded font-bold"
                    >
                      Cancel Edit
                    </button>
                  )}
                  <span className="text-[10px] font-mono bg-orange-50 border border-orange-100 text-orange-700 px-2 py-0.5 rounded font-black font-bold">
                    User DB v1.2
                  </span>
                </div>
              </div>

              <form onSubmit={handleSaveCustomer} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block font-mono">Full Customer Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sophy Vann"
                      value={custName}
                      onChange={(e) => setCustName(e.target.value)}
                      className="w-full border bg-white rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-orange-500 outline-none mt-1.5 font-sans font-semibold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block font-mono">Phone Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 012 888 999"
                      value={custPhone}
                      onChange={(e) => setCustPhone(e.target.value)}
                      className="w-full border bg-white rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-orange-500 outline-none mt-1.5 font-mono text-slate-800 font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block font-mono">Email Address (Optional)</label>
                    <input
                      type="email"
                      placeholder="sophy.vann@example.com"
                      value={custEmail}
                      onChange={(e) => setCustEmail(e.target.value)}
                      className="w-full border bg-white rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-orange-500 outline-none mt-1.5 font-sans text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block font-mono">Location / Address</label>
                    <input
                      type="text"
                      placeholder="Phnom Penh, Toul Kork"
                      value={custLoc}
                      onChange={(e) => setCustLoc(e.target.value)}
                      className="w-full border bg-white rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-orange-500 outline-none mt-1.5 font-sans text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block font-mono">Notes / Directives</label>
                  <textarea
                    rows={2}
                    placeholder="Prefers hot dipping sauces + member points collector."
                    value={custNote}
                    onChange={(e) => setCustNote(e.target.value)}
                    className="w-full border bg-white rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-orange-500 outline-none mt-1.5 font-sans text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block font-mono">Customer Loyalty Points balance</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={custPoints}
                      onChange={(e) => setCustPoints(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full border bg-white rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-orange-500 outline-none mt-1.5 font-mono text-slate-800 font-bold"
                    />
                  </div>

                  <div>
                     <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block font-mono">Other / Miscellaneous Attributes</label>
                     <input
                       type="text"
                       placeholder="Company tax ID, alternate contact info, general tags"
                       value={custOther}
                       onChange={(e) => setCustOther(e.target.value)}
                       className="w-full border bg-white rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-orange-500 outline-none mt-1.5 font-sans text-slate-800"
                     />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2">
                  {editingCustomer && (
                    <button
                      type="button"
                      onClick={handleCancelEditCustomer}
                      className="border border-gray-300 hover:bg-gray-100 font-bold text-xs text-slate-700 py-2.5 px-4 rounded-lg transition active:scale-95 cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={loadingAction !== null}
                    className="bg-[#28a745] hover:bg-[#218838] font-bold text-xs text-white py-2.5 px-6 rounded-lg shadow inline-flex items-center gap-1.5 transition active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {loadingAction === "customer" ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Writing to SQLite cache...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>{editingCustomer ? "Save Customer Changes" : "Register Customer user"}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* List Section */}
            <div className="lg:col-span-5 bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
              <div className="border-b pb-2 flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest font-mono">
                  Saved Directory ({customers.length})
                </h3>
                <span className="text-[10px] text-gray-400">Walk-in is default</span>
              </div>

              {/* Simple Customer Search Box */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute text-gray-400 left-2.5 top-2.5 animate-pulse" />
                <input
                  type="text"
                  placeholder="Quick lookup by phone, name..."
                  value={custSearch}
                  onChange={(e) => setCustSearch(e.target.value)}
                  className="w-full bg-slate-50 border rounded-lg pl-8 pr-3 py-1.5 text-xs focus:ring-1 outline-none text-slate-800 font-sans"
                />
              </div>

              {/* Scrolling List */}
              <div className="space-y-2.5 max-h-[290px] overflow-y-auto scrollbar-thin pr-1 select-text">
                {filteredCustomers.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-6">No matching entries found.</p>
                ) : (
                  filteredCustomers.map(c => (
                    <div key={c.id} className="p-3 border rounded-lg bg-slate-50 hover:bg-slate-100 transition duration-150 flex items-start justify-between gap-1.5 relative group">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <strong className="text-xs text-slate-800 font-sans font-extrabold">{c.name}</strong>
                          {c.id === "cust-0" ? (
                            <span className="bg-slate-200 text-slate-600 text-[8px] font-mono font-bold uppercase tracking-wider px-1 rounded">DEFAULT</span>
                          ) : (
                            <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow-xs">
                              ★ {c.points || 0} pts
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] font-mono text-gray-500 flex items-center gap-1 leading-none font-bold">
                          📞 {c.phone} {c.email ? `• ✉️ ${c.email}` : ""}
                        </p>
                        {c.location && (
                          <p className="text-[9.5px] text-gray-500 font-sans leading-none">
                            📍 ID Location: <span className="font-semibold">{c.location}</span>
                          </p>
                        )}
                        {c.note && (
                          <div className="text-[9px] bg-amber-50/50 text-amber-900 border border-amber-100/50 p-1.5 rounded text-left mt-1.5 italic font-sans whitespace-normal leading-normal">
                             Note: {c.note}
                          </div>
                        )}
                        {c.other && (
                          <p className="text-[9px] text-emerald-800 font-mono">
                            Attributes: {c.other}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0 self-center">
                        <button
                          type="button"
                          onClick={() => handleStartEditCustomer(c)}
                          className="text-gray-400 hover:text-blue-600 p-1 rounded-full hover:bg-white transition opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
                          title="Edit user details"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {c.id !== "cust-0" && (
                          <button
                            type="button"
                            onClick={() => handleDeleteCustomer(c.id, c.name)}
                            className="text-gray-400 hover:text-rose-600 p-1 rounded-full hover:bg-white transition opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
                            title="Remove user"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}

        {/* ======================= TAB 3: SETUP CATEGORIES & PRODUCTS ======================= */}
        {activeTab === "catalog" && (
          <>
            {/* Left Col: Setup Categories */}
            <div className="lg:col-span-4 bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-2 flex items-center gap-1.5">
                <Tags className="w-4 h-4 text-orange-500" />
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest font-mono">
                  Categories Setup
                </h3>
              </div>

              {/* Add category list */}
              {editingCategory ? (
                <form onSubmit={handleSaveEditedCategory} className="space-y-1.5 p-2 bg-indigo-50/50 border border-indigo-100 rounded-lg">
                  <div className="flex justify-between items-center text-[10px] font-mono font-bold text-indigo-700">
                    <span>RENAME CATEGORY: {editingCategory}</span>
                    <button 
                      type="button" 
                      onClick={handleCancelEditCategory}
                      className="text-gray-400 hover:text-gray-600 font-bold"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      required
                      value={editCategoryVal}
                      onChange={(e) => setEditCategoryVal(e.target.value)}
                      className="flex-1 border bg-white rounded px-2 py-1 text-xs focus:ring-1 focus:ring-orange-500 outline-none font-sans font-bold text-slate-800"
                    />
                    <button
                      type="submit"
                      className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs px-2.5 py-1 rounded font-bold transition active:scale-95 shrink-0 cursor-pointer"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEditCategory}
                      className="bg-gray-200 hover:bg-gray-300 text-slate-700 text-xs px-2 py-1 rounded transition active:scale-95 shrink-0 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleSaveCategory} className="flex gap-1.5 mt-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Seafood, Soups"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="flex-1 border bg-white rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-orange-500 outline-none font-sans font-bold text-slate-800"
                  />
                  
                  <button
                    type="submit"
                    className="bg-orange-500 hover:bg-orange-600 text-white p-2 rounded-lg transition active:scale-95 cursor-pointer"
                    title="Submit Category"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </form>
              )}

              {/* Categories list tags */}
              <div className="space-y-1.5 pt-2 select-text">
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider font-mono">Active Categories</label>
                <div className="flex flex-wrap gap-1.5">
                  {categories.map(cat => {
                    const isSystem = ["Main Dishes", "Beverages", "Groceries", "Snacks"].includes(cat);
                    return (
                      <span 
                        key={cat} 
                        className={`text-xs font-bold font-sans px-2.5 py-1 rounded-full border inline-flex items-center gap-1 leading-none ${
                          isSystem 
                            ? "bg-slate-50 text-slate-600 border-slate-200" 
                            : "bg-indigo-50 text-indigo-700 border-indigo-200"
                        }`}
                      >
                        <span>{cat}</span>
                        <button
                          type="button"
                          onClick={() => handleStartEditCategory(cat)}
                          className="hover:text-indigo-900 text-slate-400 p-0.5 cursor-pointer"
                          title={`Rename category "${cat}"`}
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        {!isSystem && (
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat)}
                            className="bg-red-100 text-red-700 hover:bg-red-700 hover:text-white rounded-full w-3.5 h-3.5 text-[8.5px] flex items-center justify-center leading-none font-bold cursor-pointer"
                            title="Delete category tag"
                          >
                            ×
                          </button>
                        )}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Col: Setup Products */}
            <div className="lg:col-span-8 bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
              <div className="border-b border-gray-100 pb-2 flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider font-sans flex items-center gap-2">
                  <Plus className="w-4 h-4 text-orange-500" />
                  Add New Product Catalog ("Add New Products")
                </h3>
                <span className="text-[10px] font-mono text-gray-400">Total Items: {products.length}</span>
              </div>

              <form onSubmit={handleSaveProduct} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Name */}
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block font-mono">Product Name / Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Traditional Nom Banh Chok (នំបញ្ចុក)"
                      value={prodName}
                      onChange={(e) => setProdName(e.target.value)}
                      className="w-full border bg-white rounded-lg px-2.5 py-2 text-xs focus:ring-1 focus:ring-orange-500 outline-none mt-1.5 font-sans font-bold text-slate-800"
                    />
                  </div>

                  {/* Category Selection Dropdown */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block font-mono">Category Allocation</label>
                    <select
                      value={prodCat}
                      onChange={(e) => setProdCat(e.target.value)}
                      className="w-full border bg-white rounded-lg px-2 py-2 text-xs focus:ring-1 focus:ring-orange-500 outline-none mt-1.5 font-sans font-bold text-slate-800"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  {/* Currency pricing selections */}
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block font-mono">
                      Selling Price ({prodCurrency === "USD" ? "USA $" : "KHR ៛"}) *
                    </label>
                    
                    <div className="flex gap-1.5 mt-1.5">
                      {/* Currency selection switches */}
                      <div className="flex bg-slate-100 rounded-lg p-0.5 border shrink-0">
                        <button
                          type="button"
                          onClick={() => setProdCurrency("USD")}
                          className={`px-2 py-1 text-[10px] font-bold rounded-md leading-none ${
                            prodCurrency === "USD" ? "bg-white text-orange-500 shadow-sm" : "text-gray-500 hover:text-gray-900"
                          }`}
                        >
                          USD ($)
                        </button>
                        <button
                          type="button"
                          onClick={() => setProdCurrency("KHR")}
                          className={`px-2 py-1 text-[10px] font-bold rounded-md leading-none ${
                            prodCurrency === "KHR" ? "bg-white text-orange-500 shadow-sm" : "text-gray-500 hover:text-gray-900"
                          }`}
                        >
                          KHR (៛)
                        </button>
                      </div>

                      {/* Numerical input */}
                      <div className="relative flex-1">
                        <span className="text-[10px] text-gray-400 absolute left-2 top-2 font-black">
                          {prodCurrency === "USD" ? "$" : "៛"}
                        </span>
                        <input
                          type="number"
                          required
                          step="any"
                          min="0.01"
                          placeholder={prodCurrency === "USD" ? "4.50" : "18500"}
                          value={prodPriceInput}
                          onChange={(e) => setProdPriceInput(e.target.value)}
                          className="w-full border bg-white rounded-lg pl-6 pr-2.5 py-1.5 text-xs focus:ring-1 focus:ring-orange-500 outline-none font-mono font-extrabold text-[#E65100]"
                        />
                      </div>
                    </div>

                    {/* Show dynamic KHR helper equivalent */}
                    {prodCurrency === "KHR" && (
                      <p className="text-[9px] text-[#2c3e50] font-mono font-semibold mt-1">
                        💵 Equivalent: <strong className="text-orange-600">${(parseFloat(prodPriceInput) / settings.exchangeRate || 0).toFixed(2)} USD</strong> (Conversion rate: ៛{settings.exchangeRate.toLocaleString()})
                      </p>
                    )}
                    {prodCurrency === "USD" && (
                      <p className="text-[9px] text-gray-500 font-mono font-semibold mt-1">
                        ៛ Riel Equivalent: ៛{(parseFloat(prodPriceInput) * settings.exchangeRate || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} KHR
                      </p>
                    )}
                  </div>

                  {/* Quantity In Stock */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block font-mono">Inventory Qty / Stock</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={prodQty}
                      onChange={(e) => setProdQty(parseInt(e.target.value) || 0)}
                      className="w-full border bg-white rounded-lg px-2 py-2 text-xs focus:ring-1 focus:ring-orange-500 outline-none mt-1.5 font-mono font-extrabold text-blue-900"
                    />
                  </div>

                  {/* Cost Price */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block font-mono">Cost Price (USD)</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={prodCost}
                      onChange={(e) => setProdCost(e.target.value)}
                      className="w-full border bg-white rounded-lg px-2 py-2 text-xs focus:ring-1 focus:ring-orange-500 outline-none mt-1.5 font-mono text-gray-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* SKU prefix */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block font-mono">Product SKU Code (Blank = Auto)</label>
                    <input
                      type="text"
                      placeholder="e.g. FO-NOMCHOK-01"
                      value={prodSku}
                      onChange={(e) => setProdSku(e.target.value)}
                      className="w-full border bg-white rounded-lg px-2.5 py-2 text-xs focus:ring-1 focus:ring-orange-500 outline-none mt-1.5 font-mono text-slate-850"
                    />
                  </div>

                  {/* Barcode scanner */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block font-mono">UPC Barcode (Blank = Auto)</label>
                    <input
                      type="text"
                      placeholder="e.g. 884100100778"
                      value={prodBarcode}
                      onChange={(e) => setProdBarcode(e.target.value)}
                      className="w-full border bg-white rounded-lg px-2.5 py-2 text-xs focus:ring-1 focus:ring-orange-500 outline-none mt-1.5 font-mono text-slate-850"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Image URL link */}
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block font-mono">Image URL / Web Link</label>
                    <input
                      type="text"
                      placeholder="e.g. https://images.unsplash.com/photo-..."
                      value={prodImg}
                      onChange={(e) => setProdImg(e.target.value)}
                      className="w-full border bg-white rounded-lg px-2.5 py-2 text-xs focus:ring-1 focus:ring-orange-500 outline-none mt-1.5 font-sans text-slate-600"
                    />
                  </div>

                  {/* Other Specifications */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block font-mono">Other Specs (Other)</label>
                    <input
                      type="text"
                      placeholder="Weight 250g, spicy lever, box packing..."
                      value={prodOther}
                      onChange={(e) => setProdOther(e.target.value)}
                      className="w-full border bg-white rounded-lg px-2 py-2 text-xs focus:ring-1 focus:ring-orange-500 outline-none mt-1.5 font-sans"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end select-none">
                  <button
                    type="submit"
                    disabled={loadingAction !== null}
                    className="bg-[#ca5c0f] hover:bg-[#b0500b] font-bold text-xs text-white py-2 px-6 rounded-lg shadow inline-flex items-center gap-1.5 transition active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {loadingAction === "product" ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Injecting product nodes...</span>
                      </>
                    ) : (
                      <>
                        <FilePlus className="w-4 h-4" />
                        <span>Submit Product</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </>
        )}

        {/* ======================= TAB 4: GENERAL AND PRINT CONTROLS ======================= */}
        {activeTab === "general" && (
          <>
            <div className="lg:col-span-8 bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
              <div className="border-b border-gray-100 pb-2.5 flex items-center justify-between">
                <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider font-sans flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-orange-500" />
                  General Store Parameters & Styling Controls
                </h2>
                <span className="text-[10px] border px-2 py-0.5 rounded bg-slate-100 font-mono text-slate-500 font-bold leading-none">
                  Laravel POS Engine
                </span>
              </div>

              <form onSubmit={handleSaveGeneralControls} className="space-y-4">
                
                {/* Prefix & Tax rate row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block font-mono">Invoice Number Prefix (Invoice *)</label>
                    <input
                      type="text"
                      required
                      placeholder="INV"
                      value={invoicePrefix}
                      onChange={(e) => setInvoicePrefix(e.target.value)}
                      className="w-full border bg-white rounded-lg px-2.5 py-2 text-xs focus:ring-1 focus:ring-orange-500 mt-1.5 font-mono text-slate-800 font-extrabold text-left uppercase"
                    />
                    <span className="text-[9.5px] text-gray-400 mt-0.5 block font-mono">Output example: <strong>{invoicePrefix}-981240-512</strong></span>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block font-mono">Default VAT Tax Policy (%)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      max="100"
                      value={taxPercent}
                      onChange={(e) => setTaxPercent(parseInt(e.target.value) || 0)}
                      className="w-full border bg-white rounded-lg px-2.5 py-2 text-xs focus:ring-1 focus:ring-orange-500 mt-1.5 font-mono text-slate-800 font-extrabold text-right"
                    />
                    <span className="text-[9.5px] text-gray-400 mt-0.5 block">Cambodian Standard VAT is <strong>10%</strong>.</span>
                  </div>
                </div>

                {/* Receipt Custom Header */}
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block font-mono">Custom Receipt Header Text (Print *)</label>
                  <textarea
                    rows={2}
                    placeholder="Provide store address, phone numbers or corporate credentials"
                    value={receiptHeaderTxt}
                    onChange={(e) => setReceiptHeaderTxt(e.target.value)}
                    className="w-full border bg-white rounded-lg px-2.5 py-2 text-xs focus:ring-1 focus:ring-orange-500 mt-1.5 font-sans text-slate-800 leading-normal"
                  />
                  <span className="text-[9.5px] text-gray-400 mt-0.5 block">This aligns perfectly in the thermal invoice ticket header preview modal.</span>
                </div>

                {/* Receipt Custom Footer */}
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block font-mono">Custom Receipt Footer Text (Print *)</label>
                  <textarea
                    rows={2}
                    placeholder="Exchange terms, VAT notification message, custom thank you note..."
                    value={receiptFooterTxt}
                    onChange={(e) => setReceiptFooterTxt(e.target.value)}
                    className="w-full border bg-white rounded-lg px-2.5 py-2 text-xs focus:ring-1 focus:ring-orange-500 mt-1.5 font-sans text-slate-800 leading-normal"
                  />
                  <span className="text-[9.5px] text-gray-400 mt-0.5 block">Shown beneath local payment barcodes on physical thermal paper slips.</span>
                </div>

                {/* Audio simulation config */}
                <div className="flex items-center gap-2 bg-[#f8f9fa] border p-3 rounded-xl">
                  <input
                    type="checkbox"
                    id="soundAlertsCheckbox"
                    checked={enableSound}
                    onChange={(e) => setEnableSound(e.target.checked)}
                    className="w-4 h-4 cursor-pointer accent-orange-500"
                  />
                  <label htmlFor="soundAlertsCheckbox" className="text-xs font-semibold text-slate-700 cursor-pointer select-none">
                    🔊 Enable Sound effects on scans & order completions (Sound Alerts)
                  </label>
                </div>

                {/* Save button */}
                <div className="flex justify-end select-none">
                  <button
                    type="submit"
                    disabled={loadingAction !== null}
                    className="bg-[#343a40] hover:bg-[#23272b] font-bold text-xs text-white py-2 px-6 rounded-lg shadow inline-flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                  >
                    {loadingAction === "general" ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Applying system modifications...</span>
                      </>
                    ) : (
                      <>
                        <Sliders className="w-4 h-4" />
                        <span>Save General Controls</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* General help / printing documentation */}
            <div className="lg:col-span-4 bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
              <div className="border-b pb-2">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest font-mono flex items-center gap-1">
                  <Printer className="w-4 h-4 text-orange-500" />
                  Thermal Printer (Print Rules)
                </h3>
              </div>
              
              <p className="text-xs text-slate-500 leading-relaxed">
                The layout styles contain custom CSS <code>@media print</code> directives. This automatically formats receipts when pressing <strong>Print</strong> in the checkout page:
              </p>

              <div className="text-[11px] leading-tight text-gray-600 bg-slate-50 p-3 rounded-lg space-y-2 border">
                <div>
                  <strong className="text-gray-700 block">✓ Auto-hide margins</strong>
                  Hides background sidebars, navigation indicators, headers, and dashboard widgets when the browser print dialog launches.
                </div>
                <div>
                  <strong className="text-gray-700 block">✓ 80mm Custom fitting</strong>
                  Fits perfectly within a standard 80mm roll width. Avoids horizontal clipping.
                </div>
              </div>
            </div>
          </>
        )}

        {/* ======================= TAB 5: TELEGRAM NOTIFICATIONS & REPORTING ======================= */}
        {activeTab === "telegram" && (
          <>
            <div className="lg:col-span-8 bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
              <div className="border-b border-gray-100 pb-2.5 flex items-center justify-between">
                <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider font-sans flex items-center gap-2">
                  <Send className="w-4 h-4 text-[#0088cc]" />
                  Telegram Bot Notification Routing Engine
                </h2>
                <span className="text-[10px] border px-2 py-0.5 rounded bg-sky-50 font-mono text-sky-700 font-bold leading-none">
                  Telegram Bot API v3.0
                </span>
              </div>

              <form onSubmit={handleSaveTelegramSettings} className="space-y-4">
                
                {/* Bot Token & Chat ID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block font-mono">Telegram Bot Token *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 123456789:ABCdefGhIJKlm..."
                      value={tgBotToken}
                      onChange={(e) => setTgBotToken(e.target.value)}
                      className="w-full border bg-white rounded-lg px-2.5 py-2 text-xs font-mono focus:ring-1 focus:ring-orange-500 mt-1.5 text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block font-mono">Telegram Target Chat ID / Group ID *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 987654321 (-100... for groups)"
                      value={tgChatId}
                      onChange={(e) => setTgChatId(e.target.value)}
                      className="w-full border bg-white rounded-lg px-2.5 py-2 text-xs font-mono focus:ring-1 focus:ring-orange-500 mt-1.5 text-slate-800"
                    />
                  </div>
                </div>

                {/* Subheading for Automated Scheduling */}
                <div className="border-t border-dashed border-gray-100 pt-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-500" />
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider font-sans">Automated Daily Report Schedule</span>
                </div>

                <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-4 space-y-3">
                  {/* Enable Switch */}
                  <div className="flex items-center gap-2">
                    <input
                      id="bgTelegramScheduleCheckbox"
                      type="checkbox"
                      checked={tgEnable}
                      onChange={(e) => setTgEnable(e.target.checked)}
                      className="w-4 h-4 cursor-pointer accent-orange-500"
                    />
                    <label htmlFor="bgTelegramScheduleCheckbox" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                      📅 Enable Automated Daily Report Submission
                    </label>
                  </div>
                  
                  <p className="text-[10.5px] text-gray-400 font-sans leading-relaxed">
                    When enabled, the POS register will automatically generate today's sales breakdown, top items sold, and low-inventory notices, then route them to the specified Telegram ID once per day at the designated hour. (Triggers immediately upon admin activity at/after the scheduled hour).
                  </p>

                  {/* Scheduled Time Selects */}
                  {tgEnable && (
                    <div className="flex items-center gap-3 pt-1 select-none">
                      <span className="text-xs text-slate-500 font-semibold font-mono">Preferred Time (Every Day):</span>
                      <div className="flex items-center gap-1.5">
                        <select
                          value={tgHour || 18}
                          onChange={(e) => setTgHour(parseInt(e.target.value))}
                          className="border bg-white text-xs font-bold font-mono text-slate-700 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
                        >
                          {Array.from({ length: 24 }).map((_, h) => (
                            <option key={h} value={h}>
                              {String(h).padStart(2, "0")}
                            </option>
                          ))}
                        </select>
                        <span className="text-xs font-bold text-slate-400 font-mono">:</span>
                        <select
                          value={tgMinute || 0}
                          onChange={(e) => setTgMinute(parseInt(e.target.value))}
                          className="border bg-white text-xs font-bold font-mono text-slate-700 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
                        >
                          {Array.from({ length: 12 }).map((_, m) => {
                            const minVal = m * 5;
                            return (
                              <option key={minVal} value={minVal}>
                                {String(minVal).padStart(2, "0")}
                              </option>
                            );
                          })}
                        </select>
                        <span className="text-[10.5px] bg-orange-50 border border-orange-100 text-orange-700 px-2 py-0.5 rounded font-bold uppercase tracking-wider font-mono">
                          {tgHour >= 12 ? "PM" : "AM"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Save and Test trigger Buttons */}
                <div className="flex flex-wrap items-center justify-between border-t border-slate-100 pt-3 gap-2">
                  <button
                    type="button"
                    onClick={handleSendTestReport}
                    disabled={testSending || !tgBotToken.trim() || !tgChatId.trim()}
                    className="border border-blue-200 bg-blue-50/50 hover:bg-blue-50 text-blue-800 hover:text-blue-900 font-black text-xs py-2 px-4 rounded-lg flex items-center gap-1.5 transition active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {testSending ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                        <span>Fulfilling instant routing request...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5 text-[#0088cc]" />
                        <span>Send Today's Report Now</span>
                      </>
                    )}
                  </button>

                  <button
                    type="submit"
                    disabled={loadingAction !== null}
                    className="bg-emerald-600 hover:bg-emerald-700 font-bold text-xs text-white py-2 px-6 rounded-lg shadow inline-flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                  >
                    {loadingAction === "telegram" ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Synchronizing configurations...</span>
                      </>
                    ) : (
                      <>
                        <Sliders className="w-4 h-4" />
                        <span>Save Telegram Settings</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Telegram setup tutorial helper sidebar */}
            <div className="lg:col-span-4 bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
              <div className="border-b pb-2">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest font-mono flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-orange-500" />
                  Bot Setup Instructions
                </h3>
              </div>
              
              <div className="text-xs text-slate-500 space-y-3 leading-relaxed">
                <p>
                  To receive daily store summaries inside your Telegram account or channel, follow these straightforward steps:
                </p>

                <ol className="list-decimal list-inside space-y-2 border-l-2 border-slate-100 pl-2 text-slate-600">
                  <li>
                    Search for <strong>@BotFather</strong> on Telegram and send message: <code className="bg-slate-50 text-rose-600 px-1 py-0.5 rounded">/newbot</code>.
                  </li>
                  <li>
                    Proceed through the bot setup to generate your unique <strong>Bot Token</strong>.
                  </li>
                  <li>
                    Open your new bot in Telegram and hit <strong>Start</strong> to allow standard message reception.
                  </li>
                  <li>
                    Message <strong>@userinfobot</strong> to instantly fetch your exact <strong>Chat ID</strong> numeric integer.
                  </li>
                  <li>
                    For collective alerts, add your bot to a group/channel and input the group's ID (which generally starts with <code className="bg-slate-50 px-1 rounded">-100</code>).
                  </li>
                </ol>

                <div className="bg-emerald-50 border border-emerald-100 text-[11px] leading-relaxed text-emerald-800 p-3 rounded-lg flex items-start gap-1.5 font-sans font-medium">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    Once configured, you will receive real-time financial tracking, audit sheets, and critical low-stock alerts straight to your cellular or desktop device, every day!
                  </span>
                </div>
              </div>
            </div>
          </>
        )}

      </div>

    </div>
  );
}
