import React, { useState } from "react";
import { 
  DollarSign, 
  ShoppingCart, 
  Package, 
  Smartphone, 
  ArrowUpRight, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Percent,
  TrendingUp,
  Award
} from "lucide-react";
import { Product, Order, BakongSettings } from "../types";

interface DashboardProps {
  orders: Order[];
  products: Product[];
  settings: BakongSettings;
  setView: (view: string) => void;
}

export default function Dashboard({ orders, products, settings, setView }: DashboardProps) {
  // 1. Core State managing report periods
  const [selectedPeriod, setSelectedPeriod] = useState<"daily" | "weekly" | "monthly" | "all">("all");

  const activeOrders = orders.filter(o => o.status === "Completed");

  // Filter orders based on the active report period
  const getFilteredOrders = () => {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = startOfToday - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = startOfToday - 30 * 24 * 60 * 60 * 1000;

    return activeOrders.filter(o => {
      const orderTime = new Date(o.date).getTime();
      
      if (selectedPeriod === "daily") {
        return o.date.startsWith(todayStr) || orderTime >= startOfToday;
      } else if (selectedPeriod === "weekly") {
        return orderTime >= sevenDaysAgo;
      } else if (selectedPeriod === "monthly") {
        return orderTime >= thirtyDaysAgo;
      }
      return true; // "all"
    });
  };

  const filteredActiveOrders = getFilteredOrders();
  
  // Total Revenue
  const totalRevenue = filteredActiveOrders.reduce((sum, o) => sum + o.total, 0);
  const totalRevenueKHR = totalRevenue * settings.exchangeRate;

  // Average ticket
  const averageTicket = filteredActiveOrders.length > 0 ? totalRevenue / filteredActiveOrders.length : 0;

  // Payment Breakdown
  const khqrOrders = filteredActiveOrders.filter(o => o.paymentMethod === "Bakong_KHQR");
  const cashOrders = filteredActiveOrders.filter(o => o.paymentMethod === "Cash");
  
  const khqrRevenue = khqrOrders.reduce((sum, o) => sum + o.total, 0);
  const cashRevenue = cashOrders.reduce((sum, o) => sum + o.total, 0);

  // Bakong payment count & ratio
  const khqrCount = khqrOrders.length;
  const cashCount = cashOrders.length;
  const totalCount = filteredActiveOrders.length;
  const khqrPercent = totalCount > 0 ? Math.round((khqrCount / totalCount) * 100) : 0;

  // Active items counts
  const totalInventoryCount = products.length;
  const lowStockItems = products.filter(p => p.stock <= p.lowStockThreshold);

  // Top selling products count Map
  const productSalesMap: Record<string, { name: string; quantity: number; revenue: number; category: string }> = {};
  
  // Initialize with all products
  products.forEach(p => {
    productSalesMap[p.id] = { name: p.name, quantity: 0, revenue: 0, category: p.category };
  });

  // Populate actual sales
  filteredActiveOrders.forEach(order => {
    order.items.forEach(item => {
      if (productSalesMap[item.productId]) {
        productSalesMap[item.productId].quantity += item.quantity;
        productSalesMap[item.productId].revenue += item.quantity * item.sellPrice * (1 - item.discountPercent / 100);
      }
    });
  });

  const sortedSales = Object.values(productSalesMap)
    .filter(item => item.quantity > 0)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  // 7-day Sales Revenue Helper
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split("T")[0];
  }).reverse();

  const salesTrend = last7Days.map(dateStr => {
    const dayOrders = activeOrders.filter(o => o.date.startsWith(dateStr));
    const dayTotal = dayOrders.reduce((sum, o) => sum + o.total, 0);
    const label = new Date(dateStr).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' });
    return { label, total: dayTotal, ordersCount: dayOrders.length };
  });

  // Chart computations (SVG scales)
  const maxSalesVal = Math.max(...salesTrend.map(t => t.total), 50);
  const chartHeight = 160;
  const chartWidth = 500;
  const points = salesTrend.map((t, idx) => {
    const x = (idx / (salesTrend.length - 1)) * (chartWidth - 60) + 30;
    const y = chartHeight - (t.total / maxSalesVal) * (chartHeight - 40) - 15;
    return { x, y, label: t.label, val: t.total };
  });

  const polylinePointsStr = points.map(p => `${p.x},${p.y}`).join(" ");

  return (
    <div className="space-y-6 select-none animate-fade-in">
      {/* Page Title & Breadcrumbs header style (AdminLTE style) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-200 pb-4 gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight font-sans">
            Operations Control Panel
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Realtime insights powered by high-speed local storage databases & Khmer QR standards.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-mono">
          <span className="hover:text-blue-600 cursor-pointer">AdminLTE</span>
          <span>&gt;</span>
          <span className="text-gray-400">Dashboard</span>
        </div>
      </div>

      {/* Period Selector Tabs (Daily, Weekly, Monthly, All-time) */}
      <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm max-w-max flex-wrap gap-1 leading-none select-none">
        {(["daily", "weekly", "monthly", "all"] as const).map((period) => (
          <button
            key={period}
            onClick={() => setSelectedPeriod(period)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all uppercase font-sans ${
              selectedPeriod === period
                ? "bg-orange-500 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-800 hover:bg-gray-50 cursor-pointer"
            }`}
          >
            {period === "daily" && "Daily (Today)"}
            {period === "weekly" && "Weekly (7-Day)"}
            {period === "monthly" && "Monthly (30-Day)"}
            {period === "all" && "All-Time Reports"}
          </button>
        ))}
        {/* Link to Laravel MVC Route Explorer directly as a quick shortcut! */}
        <button
          onClick={() => setView("laravel-routes")}
          className="ml-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded-lg border transition-all flex items-center gap-1 cursor-pointer font-sans"
        >
          <TrendingUp className="w-3 h-3 text-orange-500" />
          <span>Expose Laravel Routes</span>
        </button>
      </div>

      {/* AdminLTE style small cards (Info boxes) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Box 1: Total Revenue (Blue) */}
        <div className="bg-[#17a2b8] text-white rounded-lg shadow-md hover:shadow-lg transition relative overflow-hidden flex flex-col justify-between">
          <div className="p-4 z-10">
            <p className="text-xs font-bold uppercase tracking-wider opacity-90 font-mono">Total Revenue</p>
            <h3 className="text-2xl font-extrabold mt-1 font-mono">${totalRevenue.toFixed(2)}</h3>
            <p className="text-[10px] opacity-80 mt-1 font-mono">
              ≈ ៛ {totalRevenueKHR.toLocaleString(undefined, { maximumFractionDigits: 0 })} KHR
            </p>
          </div>
          <div className="absolute right-3 top-3 opacity-20 pointer-events-none">
            <DollarSign className="w-16 h-16" />
          </div>
          <button 
            onClick={() => setView("reports")}
            className="w-full bg-black/15 py-1.5 px-3 text-left text-xs font-medium flex items-center justify-between hover:bg-black/25 transition z-10"
          >
            <span>View detailed receipts</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Box 2: Total Orders (Green) */}
        <div className="bg-[#28a745] text-white rounded-lg shadow-md hover:shadow-lg transition relative overflow-hidden flex flex-col justify-between">
          <div className="p-4 z-10">
            <p className="text-xs font-bold uppercase tracking-wider opacity-90 font-mono">Completed Bills</p>
            <h3 className="text-2xl font-extrabold mt-1 font-mono">{activeOrders.length}</h3>
            <p className="text-[10px] opacity-80 mt-1">
              Avg ticket value: <span className="font-mono font-semibold">${averageTicket.toFixed(2)}</span>
            </p>
          </div>
          <div className="absolute right-3 top-3 opacity-20 pointer-events-none">
            <ShoppingCart className="w-16 h-16" />
          </div>
          <button 
            onClick={() => setView("pos")}
            className="w-full bg-black/15 py-1.5 px-3 text-left text-xs font-medium flex items-center justify-between hover:bg-black/25 transition z-10"
          >
            <span>Launch POS screen</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Box 3: Low Inventory items (Red) */}
        <div className="bg-[#dc3545] text-white rounded-lg shadow-md hover:shadow-lg transition relative overflow-hidden flex flex-col justify-between">
          <div className="p-4 z-10">
            <p className="text-xs font-bold uppercase tracking-wider opacity-90 font-mono">Low Stock Alerts</p>
            <h3 className="text-2xl font-extrabold mt-1 font-mono">{lowStockItems.length}</h3>
            <p className="text-[10px] opacity-80 mt-1">
              {lowStockItems.length > 0 ? "Action required to top up" : "Inventory healthy"}
            </p>
          </div>
          <div className="absolute right-3 top-3 opacity-20 pointer-events-none">
            <Package className="w-16 h-16" />
          </div>
          <button 
            onClick={() => setView("inventory")}
            className="w-full bg-black/15 py-1.5 px-3 text-left text-xs font-medium flex items-center justify-between hover:bg-black/25 transition z-10"
          >
            <span>Manage listings</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Box 4: Bakong Transactions % (Yellow/Gold) */}
        <div className="bg-[#ffc107] text-slate-900 rounded-lg shadow-md hover:shadow-lg transition relative overflow-hidden flex flex-col justify-between">
          <div className="p-4 z-10">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-800 font-mono">Bakong KHQR Utilization</p>
            <h3 className="text-2xl font-black mt-1 font-mono text-slate-900">{khqrPercent}%</h3>
            <p className="text-[10px] text-slate-800 mt-1 font-sans">
              <strong>{khqrCount}</strong> via KHQR, <strong>{cashCount}</strong> via Cash
            </p>
          </div>
          <div className="absolute right-3 top-3 opacity-15 pointer-events-none">
            <Smartphone className="w-16 h-16 text-slate-900" />
          </div>
          <button 
            onClick={() => setView("settings")}
            className="w-full bg-black/10 py-1.5 px-3 text-left text-xs font-semibold text-slate-900 flex items-center justify-between hover:bg-black/15 transition z-10"
          >
            <span>Review KHQR Settings</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Charts area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart (Left 2 cols) */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-800 flex items-center gap-1.5 font-sans">
                <TrendingUp className="w-4.5 h-4.5 text-blue-500" />
                Revenue Trend (Last 7 Days)
              </h2>
              <span className="text-[10px] text-slate-400 font-mono bg-slate-50 px-2 py-1 rounded">
                Updated in real-time
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Reflects sales checkout totals in USD.
            </p>
          </div>

          <div className="w-full my-4 overflow-x-auto min-h-[160px]">
            {/* Custom line chart using clean responsive SVG elements */}
            <svg 
              className="w-full min-w-[400px]" 
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Back grids */}
              <line x1="30" y1="15" x2="480" y2="15" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="30" y1="52.5" x2="480" y2="52.5" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="30" y1="90" x2="480" y2="90" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="30" y1="127.5" x2="480" y2="127.5" stroke="#e2e8f0" strokeWidth="1.5" />

              {/* Shaded Area */}
              {points.length > 1 && (
                <path
                  d={`M ${points[0].x} ${chartHeight - 15} L ${polylinePointsStr} L ${points[points.length-1].x} ${chartHeight - 15} Z`}
                  fill="url(#chartGradient)"
                />
              )}

              {/* Sparkline */}
              {points.length > 1 && (
                <polyline
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={polylinePointsStr}
                />
              )}

              {/* Data circles & text popups */}
              {points.map((p, idx) => (
                <g key={idx}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="4"
                    fill="#ffffff"
                    stroke="#3b82f6"
                    strokeWidth="2.5"
                    className="hover:r-6 hover:stroke-blue-700 transition cursor-help"
                  />
                  {/* Tooltip-like value above point if amount > 0 */}
                  {p.val > 0 && (
                    <text
                      x={p.x}
                      y={p.y - 8}
                      textAnchor="middle"
                      fill="#1e293b"
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      ${p.val.toFixed(0)}
                    </text>
                  )}
                  {/* Axis labels */}
                  <text
                    x={p.x}
                    y={chartHeight - 2}
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize="9.5"
                    fontFamily="sans-serif"
                  >
                    {p.label}
                  </text>
                </g>
              ))}

              {/* Gradients */}
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.00" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          
          <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs">
            <span className="text-gray-500 font-sans">Estimated conversion:</span>
            <span className="font-semibold text-slate-800 font-mono">
              ៛ {(totalRevenue * settings.exchangeRate).toLocaleString(undefined, { maximumFractionDigits: 0 })} KHR
            </span>
          </div>
        </div>

        {/* Payment Shares Donut Widget */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-800 flex items-center gap-1.5 heading-sans">
              <Award className="w-4.5 h-4.5 text-orange-600" />
              Checkout Split
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              KHQR Bakong blockchain vs Cash split.
            </p>
          </div>

          {/* Simple Visual Donut Representation */}
          <div className="flex flex-col items-center justify-center py-6 my-auto select-none">
            {totalCount === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm font-semibold text-gray-400 font-sans">No transactions yet today</p>
                <button 
                  onClick={() => setView("pos")}
                  className="mt-2 text-xs text-orange-500 hover:underline font-bold"
                >
                  Create first order
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                {/* Simulated circle indicator */}
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    {/* Background Circle */}
                    <circle
                      cx="18"
                      cy="18"
                      r="15.915"
                      fill="none"
                      stroke="#f1f5f9"
                      strokeWidth="3.5"
                    />
                    {/* KHQR Arc */}
                    <circle
                      cx="18"
                      cy="18"
                      r="15.915"
                      fill="none"
                      stroke="#4f46e5" // Indigo represent Bakong
                      strokeWidth="3.5"
                      strokeDasharray={`${khqrPercent} ${100 - khqrPercent}`}
                      strokeDashoffset="0"
                    />
                  </svg>
                  {/* Inside Text */}
                  <div className="absolute flex flex-col items-center leading-tight">
                    <span className="text-2xl font-black font-mono text-slate-800">{khqrPercent}%</span>
                    <span className="text-[9px] text-gray-400 font-sans uppercase font-bold tracking-widest">KHQR</span>
                  </div>
                </div>

                {/* Legend list */}
                <div className="grid grid-cols-2 gap-4 mt-5 text-center w-full">
                  <div className="bg-indigo-50 border border-indigo-100 p-1.5 rounded-lg">
                    <div className="flex items-center justify-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block"></span>
                      <span className="text-xs font-semibold text-indigo-950 font-mono">Bakong KHQR</span>
                    </div>
                    <p className="text-[10px] text-indigo-700 font-mono mt-0.5 font-bold">${khqrRevenue.toFixed(2)}</p>
                    <p className="text-[8px] text-indigo-400 font-mono font-bold">({khqrCount} bills)</p>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 p-1.5 rounded-lg">
                    <div className="flex items-center justify-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block"></span>
                      <span className="text-xs font-semibold text-slate-700 font-mono">Standard Cash</span>
                    </div>
                    <p className="text-[10px] text-slate-600 font-mono mt-0.5 font-bold">${cashRevenue.toFixed(2)}</p>
                    <p className="text-[8px] text-slate-400 font-mono font-bold">({cashCount} bills)</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="text-[11px] bg-sky-50 text-sky-800 p-2 border border-sky-100 rounded-lg text-center font-medium">
            Bakong KHQR reduces cash storage & speeds up cashouts.
          </div>
        </div>
      </div>

      {/* Grid for Stock Warnings + Top Selling Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Listing widget */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="text-base font-bold text-gray-800 flex items-center gap-1.5 heading-sans">
              <AlertTriangle className="w-4.5 h-4.5 text-rose-500" />
              Low Stock Warnings
            </h2>
            <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded uppercase tracking-wider font-mono">
              {lowStockItems.length} alerts
            </span>
          </div>

          <div className="mt-3 divide-y divide-gray-100 max-h-[240px] overflow-y-auto pr-1">
            {lowStockItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10">
                <CheckCircle className="w-10 h-10 text-emerald-500 opacity-60" />
                <p className="text-sm font-semibold text-gray-500 mt-2">All product stocks are healthy!</p>
              </div>
            ) : (
              lowStockItems.map(p => (
                <div key={p.id} className="py-2.5 flex items-center justify-between gap-3 text-sm">
                  <div className="flex items-center gap-3">
                    {p.image ? (
                      <img 
                        src={p.image} 
                        alt={p.name} 
                        className="w-10 h-10 object-cover rounded pointer-events-none"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center text-slate-500 text-xs font-mono">
                        N/A
                      </div>
                    )}
                    <div>
                      <h4 className="font-semibold text-gray-800 shrink-0 select-text leading-tight">{p.name}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-mono text-gray-400">SKU: {p.sku}</span>
                        <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                          {p.category}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <span className="font-bold text-rose-600 font-mono text-sm leading-none bg-rose-50 border border-rose-100 rounded px-2.5 py-1">
                      {p.stock} units left
                    </span>
                    <p className="text-[10px] text-gray-400 mt-1">
                      Threshold: <strong className="font-bold text-gray-600">{p.lowStockThreshold}</strong>
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Performing products list */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="text-base font-bold text-gray-800 flex items-center gap-1.5 heading-sans">
              <Award className="w-4.5 h-4.5 text-amber-500" />
              Top Selling Products
            </h2>
            <span className="text-[10px] text-gray-400 font-mono">
              Total volume rank
            </span>
          </div>

          <div className="mt-3 divide-y divide-gray-100 max-h-[240px] overflow-y-auto pr-1">
            {sortedSales.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10">
                <Clock className="w-10 h-10 text-slate-400 opacity-60" />
                <p className="text-sm font-semibold text-gray-400 mt-2">No sales recorded yet</p>
              </div>
            ) : (
              sortedSales.map((item, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-sm select-text">
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-slate-100 font-extrabold text-xs flex items-center justify-center text-slate-600 font-mono">
                      #{idx + 1}
                    </span>
                    <div>
                      <h4 className="font-semibold text-gray-800 leading-tight">{item.name}</h4>
                      <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                        {item.category}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono text-sm font-bold text-gray-900">${item.revenue.toFixed(2)}</span>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider font-mono">
                      {item.quantity} Qty sold
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
