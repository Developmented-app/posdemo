import React, { useState } from "react";
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Save, 
  X, 
  AlertTriangle, 
  TrendingUp, 
  Package,
  ArrowUpDown
} from "lucide-react";
import { Product } from "../types";

interface ProductManagementProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  categories?: string[];
  setCategories?: React.Dispatch<React.SetStateAction<string[]>>;
}

export default function ProductManagement({ 
  products, 
  setProducts,
  categories = ["Main Dishes", "Beverages", "Groceries", "Snacks"],
  setCategories
}: ProductManagementProps) {
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  
  // Sorting options
  const [sortKey, setSortKey] = useState<"name" | "stock" | "sellPrice">("name");
  const [sortAsc, setSortAsc] = useState(true);

  // Editing state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Form states
  const [formName, setFormName] = useState("");
  const [formSku, setFormSku] = useState("");
  const [formBarcode, setFormBarcode] = useState("");
  const [formCategory, setFormCategory] = useState(categories[0] || "Main Dishes");
  const [formCostPrice, setFormCostPrice] = useState(0);
  const [formSellPrice, setFormSellPrice] = useState(0);
  const [formStock, setFormStock] = useState(0);
  const [formThreshold, setFormThreshold] = useState(5);
  const [formImage, setFormImage] = useState("");

  const categoriesList = categories;

  // Toggle sorting logic
  const handleSort = (key: "name" | "stock" | "sellPrice") => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  // Filter & sort products
  const processedProducts = products
    .filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            p.barcode === searchQuery;
      const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      let valA = a[sortKey];
      let valB = b[sortKey];

      if (typeof valA === "string" && typeof valB === "string") {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      if (typeof valA === "number" && typeof valB === "number") {
        return sortAsc ? valA - valB : valB - valA;
      }
      return 0;
    });

  // Open Edit form
  const handleStartEdit = (p: Product) => {
    setEditingProduct(p);
    setIsAdding(false);
    
    setFormName(p.name);
    setFormSku(p.sku);
    setFormBarcode(p.barcode);
    setFormCategory(p.category);
    setFormCostPrice(p.costPrice);
    setFormSellPrice(p.sellPrice);
    setFormStock(p.stock);
    setFormThreshold(p.lowStockThreshold);
    setFormImage(p.image || "");
  };

  // Open Add form
  const handleStartAdd = () => {
    setEditingProduct(null);
    setIsAdding(true);

    setFormName("");
    // Auto-generate sku & barcode
    setFormSku(`FO-${Math.floor(100 + Math.random() * 900)}`);
    setFormBarcode(`884100${Math.floor(100000 + Math.random() * 900000)}`);
    setFormCategory("Main Dishes");
    setFormCostPrice(0);
    setFormSellPrice(0);
    setFormStock(50);
    setFormThreshold(5);
    setFormImage("");
  };

  // Submit edits
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formSku.trim()) return;

    if (isAdding) {
      const newProduct: Product = {
        id: `prod-${Date.now()}`,
        name: formName,
        sku: formSku,
        barcode: formBarcode,
        category: formCategory,
        costPrice: Math.max(0, formCostPrice),
        sellPrice: Math.max(0, formSellPrice),
        stock: Math.max(0, formStock),
        lowStockThreshold: Math.max(0, formThreshold),
        image: formImage.trim() || undefined
      };
      setProducts(prev => [newProduct, ...prev]);
      setIsAdding(false);
    } else if (editingProduct) {
      setProducts(prev => prev.map(p => 
        p.id === editingProduct.id
          ? {
              ...p,
              name: formName,
              sku: formSku,
              barcode: formBarcode,
              category: formCategory,
              costPrice: Math.max(0, formCostPrice),
              sellPrice: Math.max(0, formSellPrice),
              stock: Math.max(0, formStock),
              lowStockThreshold: Math.max(0, formThreshold),
              image: formImage.trim() || undefined
            }
          : p
      ));
      setEditingProduct(null);
    }
  };

  // Delete product
  const handleDeleteProduct = (id: string, name: string) => {
    if (window.confirm(`Are you absolutely sure you want to delete "${name}" from listings?`)) {
      setProducts(prev => prev.filter(p => p.id !== id));
      if (editingProduct?.id === id) {
        setEditingProduct(null);
      }
    }
  };

  return (
    <div className="space-y-6 select-none animate-fade-in text-left">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200 pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight font-sans flex items-center gap-2">
            <Package className="w-6 h-6 text-orange-500" />
            Inventory & Catalog Management
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Track catalog items with profit margins, SKUs, and replenish depleted levels.
          </p>
        </div>
        <button
          onClick={handleStartAdd}
          className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs py-2 px-4 rounded-lg flex items-center gap-1.5 shadow"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Main Grid: Left is table list, right is sticky editor panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Product table list (7 or 8 columns) */}
        <div className="lg:col-span-8 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
          
          {/* Filters Bar */}
          <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3 bg-slate-50/50">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search products by Name or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white text-slate-800 text-xs border border-gray-200 pl-9 pr-4 py-2 rounded-lg focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-gray-400">Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-white border rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-orange-500 focus:outline-none text-slate-700"
              >
                <option value="All">All Categories</option>
                {categoriesList.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-widest text-[10px] border-b border-gray-200">
                <tr>
                  <th 
                    onClick={() => handleSort("name")}
                    className="py-3 px-4 font-bold cursor-pointer hover:bg-slate-100 select-none"
                  >
                    <div className="flex items-center gap-1">
                      <span>Article Details</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-2 font-bold select-none">SKU / Code</th>
                  <th 
                    onClick={() => handleSort("stock")}
                    className="py-3 px-2 font-bold cursor-pointer hover:bg-slate-100 select-none text-center"
                  >
                    <div className="flex items-center gap-1 justify-center">
                      <span>Stock</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-2 font-bold text-right">Cost</th>
                  <th 
                    onClick={() => handleSort("sellPrice")}
                    className="py-3 px-2 font-bold cursor-pointer hover:bg-slate-100 select-none text-right"
                  >
                    <div className="flex items-center gap-1 justify-end">
                      <span>Price</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-2 font-bold text-center">Margin %</th>
                  <th className="py-3 px-4 font-bold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {processedProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400">
                      No matching products in catalog database.
                    </td>
                  </tr>
                ) : (
                  processedProducts.map(p => {
                    const margin = p.sellPrice > 0 ? ((p.sellPrice - p.costPrice) / p.sellPrice) * 100 : 0;
                    const isLowStock = p.stock <= p.lowStockThreshold;
                    const isOutOfStock = p.stock <= 0;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-3 px-4 font-medium text-gray-900 select-text">
                          <div className="flex items-center gap-3">
                            {p.image ? (
                              <img 
                                src={p.image} 
                                alt={p.name} 
                                className="w-10 h-10 object-cover rounded pointer-events-none shrink-0"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center text-slate-400 font-mono text-[9px] shrink-0">
                                No Img
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-slate-800 line-clamp-1">{p.name}</p>
                              <span className="text-[10px] text-gray-400 bg-slate-100 rounded px-1.5 py-0.2">
                                {p.category}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-2 py-1 font-mono text-[11px] text-gray-500 select-all">
                          <p className="font-semibold text-slate-700">{p.sku}</p>
                          <p className="text-[9px] text-slate-400 mt-0.5">{p.barcode}</p>
                        </td>

                        <td className="py-3 px-2 text-center select-text">
                          {isOutOfStock ? (
                            <span className="px-2 py-0.5 bg-red-100 text-red-800 text-[10px] font-bold rounded uppercase">
                              Empty
                            </span>
                          ) : isLowStock ? (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded flex items-center gap-0.5 w-max mx-auto">
                              <AlertTriangle className="w-3 h-3 text-amber-700" />
                              <span>{p.stock} units</span>
                            </span>
                          ) : (
                            <span className="text-emerald-700 font-extrabold font-mono text-sm">
                              {p.stock}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-2 text-right font-mono text-gray-500 select-text">
                          ${p.costPrice.toFixed(2)}
                        </td>

                        <td className="py-3 px-2 text-right font-mono font-bold text-gray-900 select-text">
                          ${p.sellPrice.toFixed(2)}
                        </td>

                        <td className="py-3 px-2 text-center select-text">
                          <span className={`text-[11px] font-bold font-mono px-1.5 py-0.5 rounded leading-none ${
                            margin >= 40 
                              ? "bg-green-50 text-emerald-700" 
                              : margin >= 20 
                              ? "bg-sky-50 text-sky-700" 
                              : "bg-rose-50 text-rose-700"
                          }`}>
                            {margin.toFixed(0)}%
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleStartEdit(p)}
                              className="p-1 px-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded transition"
                              title="Edit product specs"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p.id, p.name)}
                              className="p-1 px-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-100 rounded transition-all"
                              title="Delete listing"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Dynamic Form Panel (Edit / Add) */}
        <div className="lg:col-span-4 bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
          
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider font-sans">
              {isAdding ? "Register New Entry" : editingProduct ? "Modify Details" : "Select Product"}
            </h3>
            {(isAdding || editingProduct) && (
              <button
                onClick={() => {
                  setIsAdding(false);
                  setEditingProduct(null);
                }}
                className="text-gray-400 hover:text-gray-600 text-xs font-bold"
              >
                Cancel
              </button>
            )}
          </div>

          {!isAdding && !editingProduct ? (
            <div className="text-center py-12 text-slate-400 select-text">
              <Package className="w-12 h-12 stroke-1 mx-auto opacity-30 animate-pulse" />
              <p className="text-xs font-bold mt-2">No product selected</p>
              <p className="text-[10px] text-gray-400 mt-1 max-w-xs mx-auto leading-normal">
                Click on the Edit icon <span className="bg-blue-50 text-blue-600 border px-1 rounded">✎</span> of any row, or tap "Add New Product" to populate details.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSaveProduct} className="space-y-4">
              {/* Product title */}
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block font-mono">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Traditional Khmer Beef Amok"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full border bg-white rounded-lg px-3 py-2 mt-1 text-xs focus:ring-1 focus:ring-orange-500 outline-none text-slate-800"
                />
              </div>

              {/* SKU & Barcode */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block font-mono">SKU (Stock ID) *</label>
                  <input
                    type="text"
                    required
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    className="w-full border bg-white rounded-lg px-3 py-2 mt-1 text-xs font-mono focus:ring-1 focus:ring-orange-500 outline-none text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block font-mono">Barcode</label>
                  <input
                    type="text"
                    value={formBarcode}
                    onChange={(e) => setFormBarcode(e.target.value)}
                    className="w-full border bg-white rounded-lg px-3 py-2 mt-1 text-xs font-mono focus:ring-1 focus:ring-orange-500 outline-none text-slate-800"
                  />
                </div>
              </div>

              {/* Category, Cost vs Price */}
              <div className="space-y-3.5 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block font-mono">Category</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full bg-white border rounded px-2 py-1.5 text-xs focus:ring-1 mt-1 outline-none text-slate-800"
                    >
                      {categoriesList.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block font-mono">Stock Quantity</label>
                    <input
                      type="number"
                      value={formStock}
                      min="0"
                      onChange={(e) => setFormStock(parseInt(e.target.value) || 0)}
                      className="w-full border bg-white rounded px-2 py-1.5 text-xs focus:ring-1 mt-1 outline-none text-slate-800 font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 uppercase block font-mono">Cost Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formCostPrice}
                      onChange={(e) => setFormCostPrice(parseFloat(e.target.value) || 0)}
                      className="w-full border bg-white rounded px-2 py-1.5 text-xs focus:ring-1 mt-1 outline-none text-slate-800 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block font-mono">Sell Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formSellPrice}
                      onChange={(e) => setFormSellPrice(parseFloat(e.target.value) || 0)}
                      className="w-full border bg-white rounded px-2 py-1.5 text-xs focus:ring-1 mt-1 outline-none text-slate-800 font-mono font-black"
                    />
                  </div>
                </div>

                {/* Profit markup overview */}
                {formSellPrice > 0 && (
                  <div className="text-[11px] leading-tight flex items-center justify-between text-slate-500 border-t border-dashed border-gray-200 pt-2 flex-wrap gap-1">
                    <span>Computed Profit Margin:</span>
                    <span className="font-extrabold text-emerald-700 font-mono">
                      +${(formSellPrice - formCostPrice).toFixed(2)} ({formSellPrice > 0 ? (((formSellPrice - formCostPrice) / formSellPrice) * 100).toFixed(0) : 0}%)
                    </span>
                  </div>
                )}
              </div>

              {/* Image and low stock thresholds */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block font-mono">Stock Trigger</label>
                  <input
                    type="number"
                    value={formThreshold}
                    min="0"
                    onChange={(e) => setFormThreshold(parseInt(e.target.value) || 0)}
                    className="w-full border bg-white rounded-lg px-3 py-2 mt-1 text-xs font-mono focus:ring-1 focus:ring-orange-500 outline-none text-slate-800"
                    title="Low stock notification value limit"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block font-mono">Image URL</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={formImage}
                    onChange={(e) => setFormImage(e.target.value)}
                    className="w-full border bg-white rounded-lg px-3 py-2 mt-1 text-xs focus:ring-1 focus:ring-orange-500 outline-none text-slate-800 text-ellipsis font-mono truncate"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <button
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600 font-bold py-2.5 rounded-lg text-xs text-white shadow-md flex items-center justify-center gap-1.5 mt-2 transition active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>Save Stock Changes</span>
              </button>
            </form>
          )}

        </div>

      </div>

    </div>
  );
}
