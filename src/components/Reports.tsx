import React, { useState } from "react";
import { 
  FileSpreadsheet, 
  Search, 
  Printer, 
  Trash2, 
  ChevronDown, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  Cpu, 
  ShieldAlert,
  ArrowUpRight,
  RefreshCw,
  QrCode
} from "lucide-react";
import { Order, Product, BakongSettings } from "../types";

interface ReportsProps {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  settings: BakongSettings;
}

export default function Reports({ orders, setOrders, products, setProducts, settings }: ReportsProps) {
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPayment, setSelectedPayment] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);

  // void order logic
  const handleVoidOrder = (oid: string, invoiceNo: string) => {
    const confirmation = window.confirm(`Arent you sure you want to VOID receipt #${invoiceNo}? This cannot be undone, and stock inventory levels will be restored.`);
    if (!confirmation) return;

    // Void logic
    const matchedOrder = orders.find(o => o.id === oid);
    if (!matchedOrder) return;

    // Restock quantities
    if (matchedOrder.status !== "Voided") {
      setProducts(prev => {
        const updated = [...prev];
        matchedOrder.items.forEach(item => {
          const itemIdx = updated.findIndex(p => p.id === item.productId);
          if (itemIdx > -1) {
            updated[itemIdx] = {
              ...updated[itemIdx],
              stock: updated[itemIdx].stock + item.quantity
            };
          }
        });
        return updated;
      });
    }

    // Set order status to Voided
    setOrders(prev => prev.map(o => o.id === oid ? { ...o, status: "Voided" } : o));
    if (selectedOrderDetails?.id === oid) {
      setSelectedOrderDetails(prev => prev ? { ...prev, status: "Voided" } : null);
    }
  };

  // Filters
  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (o.customer?.name || "Walk-in Customer").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPayment = selectedPayment === "All" || o.paymentMethod === selectedPayment;
    const matchesStatus = selectedStatus === "All" || o.status === selectedStatus;
    
    return matchesSearch && matchesPayment && matchesStatus;
  });

  // Calculate high-level analytical indicators
  const completedOrders = orders.filter(o => o.status === "Completed");
  const voidedOrders = orders.filter(o => o.status === "Voided");

  const totalCalculatedRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0);
  const totalVoidedRevenue = voidedOrders.reduce((sum, o) => sum + o.total, 0);

  const khqrCount = completedOrders.filter(o => o.paymentMethod === "Bakong_KHQR").length;
  const cashCount = completedOrders.filter(o => o.paymentMethod === "Cash").length;

  return (
    <div className="space-y-6 select-none animate-fade-in text-left">
      
      {/* Page Title */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-800 tracking-tight font-sans flex items-center gap-2">
          <FileSpreadsheet className="w-6 h-6 text-orange-500" />
          Receipt logs & Audit Trails
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Review, analyze audit logs, view digital thermal receipts, and handle voided transactions.
        </p>
      </div>

      {/* Metrics overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 select-text">
        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-gray-400 font-mono tracking-wider">Net Sales Today</p>
          <h4 className="text-xl font-bold font-mono text-slate-800 mt-1">${totalCalculatedRevenue.toFixed(2)}</h4>
          <span className="text-[10px] text-gray-400">៛ {(totalCalculatedRevenue * settings.exchangeRate).toLocaleString(undefined, { maximumFractionDigits: 0 })} KHR</span>
        </div>

        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-gray-400 font-mono tracking-wider">Average Bill Value</p>
          <h4 className="text-xl font-bold font-mono text-slate-800 mt-1">
            ${completedOrders.length > 0 ? (totalCalculatedRevenue / completedOrders.length).toFixed(2) : "0.00"}
          </h4>
          <span className="text-[10px] text-gray-400">Across {completedOrders.length} receipts</span>
        </div>

        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-gray-400 font-mono tracking-wider">Bakong vs Cash share</p>
          <h4 className="text-sm font-bold text-slate-800 mt-2 flex items-center gap-1.5 flex-wrap">
            <span className="text-indigo-600 bg-indigo-50 border px-1.5 rounded">{khqrCount} KHQR</span>
            <span>vs</span>
            <span className="text-slate-600 bg-slate-50 border px-1.5 rounded">{cashCount} Cash</span>
          </h4>
          <p className="text-[9px] text-gray-400 mt-1">Volume allocation share</p>
        </div>

        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-gray-400 font-mono tracking-wider">Voided Bills Loss</p>
          <h4 className="text-xl font-bold font-mono text-rose-600 mt-1">${totalVoidedRevenue.toFixed(2)}</h4>
          <span className="text-[10px] text-rose-700 font-semibold uppercase tracking-wider">{voidedOrders.length} receipts voided</span>
        </div>
      </div>

      {/* Main filter list panel */}
      <div className="bg-white border text-xs text-slate-600 rounded-xl shadow-sm overflow-hidden flex flex-col">
        
        {/* Filters Top Bar */}
        <div className="p-4 border-b border-gray-100 flex flex-col lg:flex-row gap-3 bg-slate-50/50">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by Invoice No, Bill Reference, Customer Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white text-slate-800 text-xs border border-gray-200 pl-9 pr-4 py-2 rounded-lg focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 sm:flex sm:items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-gray-400 font-sans hidden sm:inline">Pay:</span>
              <select
                value={selectedPayment}
                onChange={(e) => setSelectedPayment(e.target.value)}
                className="bg-white border text-xs text-slate-700 px-2.5 py-1.5 rounded-lg focus:outline-none"
              >
                <option value="All">All Types</option>
                <option value="Bakong_KHQR">KHQR Bakong</option>
                <option value="Cash">Cash Drawer</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-gray-400 font-sans hidden sm:inline">Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-white border text-xs text-slate-700 px-2.5 py-1.5 rounded-lg focus:outline-none"
              >
                <option value="All">All Status</option>
                <option value="Completed">Completed</option>
                <option value="Voided">Voided</option>
              </select>
            </div>
          </div>
        </div>

        {/* Audit Table items list */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-slate-600">
            <thead className="bg-[#f8fafc] text-slate-500 uppercase tracking-widest text-[9.5px] border-b border-gray-250 select-none">
              <tr>
                <th className="py-3 px-4 font-bold">Invoice Ref</th>
                <th className="py-3 px-2 font-bold">Checkout stamp</th>
                <th className="py-3 px-2 font-bold">Staff / customer</th>
                <th className="py-3 px-2 font-bold select-none text-center">Qty Bought</th>
                <th className="py-3 px-2 font-bold text-center">Pay Method</th>
                <th className="py-3 px-2 font-bold text-right">Bill Total</th>
                <th className="py-3 px-2 font-bold text-center">Audit Code</th>
                <th className="py-3 px-4 font-bold text-center">Operation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-150">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400 font-sans">
                    No transactions recorded matching filters.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => {
                  const qtySum = order.items.reduce((sum, item) => sum + item.quantity, 0);
                  const isVoided = order.status === "Voided";
                  return (
                    <tr key={order.id} className={`hover:bg-slate-50 transition ${isVoided ? "bg-red-50/20" : ""}`}>
                      <td className="py-3 px-4 font-bold text-slate-800 select-all">
                        {order.invoiceNumber}
                      </td>

                      <td className="py-3 px-2 font-mono text-[11px] text-gray-500 select-all">
                        {new Date(order.date).toLocaleString()}
                      </td>

                      <td className="py-3 px-2 text-slate-700 select-text font-medium leading-none">
                        <p>{order.customer?.name || "Walk-in Customer"}</p>
                        {order.customer?.phone !== "N/A" && (
                          <span className="text-[9px] text-gray-400 font-mono mt-0.5 inline-block">{order.customer?.phone}</span>
                        )}
                      </td>

                      <td className="py-3 px-2 text-center font-mono font-semibold text-slate-700 select-text">
                        {qtySum}
                      </td>

                      <td className="py-3 px-2 text-center">
                        {order.paymentMethod === "Bakong_KHQR" ? (
                          <span className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold flex items-center justify-center gap-1 w-max mx-auto leading-none shrink-0 cursor-help" title="Cryptographically secure transaction via QR">
                            <QrCode className="w-3 h-3" />
                            <span>KHQR Sim</span>
                          </span>
                        ) : (
                          <span className="text-[10px] bg-emerald-50 border border-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold inline-block leading-none">
                            💵 Cash
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-2 text-right font-mono font-bold text-gray-900 select-text">
                        <span className={isVoided ? "line-through text-gray-400" : ""}>
                          ${order.total.toFixed(2)}
                        </span>
                        <span className="block text-[8.5px] text-gray-400 font-semibold font-sans">
                          ៛ {order.totalKHR.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </span>
                      </td>

                      <td className="py-3 px-2 text-center">
                        {isVoided ? (
                          <span className="bg-rose-100 font-bold border border-rose-200 text-rose-800 text-[10px] px-2 py-0.5 rounded uppercase leading-none">
                            Voided
                          </span>
                        ) : (
                          <span className="bg-green-150 font-bold text-green-850 text-[11px] px-2 py-0.5 rounded uppercase leading-none">
                            Success
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setSelectedOrderDetails(order)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 border font-bold text-[10.5px] py-1 px-2 rounded-lg transition"
                          >
                            Details
                          </button>
                          
                          {!isVoided && (
                            <button
                              onClick={() => handleVoidOrder(order.id, order.invoiceNumber)}
                              className="p-1 px-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-100 rounded-lg transition"
                              title="Void order register & return stocks"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
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

      {/* DETAILED DIGITAL INVOICE RECEIPT MODAL FRAME */}
      {selectedOrderDetails && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-40 overflow-y-auto">
          <div className="bg-white border rounded-2xl overflow-hidden shadow-2xl max-w-sm w-full p-5 space-y-4 text-left relative my-auto animate-scale-up">
            
            <div className="flex justify-between items-center border-b border-gray-100 pb-2 bg-white">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#dc3545] font-mono">
                {selectedOrderDetails.status === "Voided" ? "⛔ VOID AUDIT TICKET" : "🧾 INVOICE RECEIPT SHEET"}
              </span>
              <button 
                type="button" 
                onClick={() => setSelectedOrderDetails(null)}
                className="text-gray-400 hover:text-gray-600 font-extrabold"
              >
                ✕
              </button>
            </div>

            {/* Thermal Receipt Frame */}
            <div className={`bg-neutral-50 border rounded-lg p-4 font-mono text-xs text-neutral-800 space-y-1 relative max-h-[82vh] overflow-y-auto ${
              selectedOrderDetails.status === "Voided" ? "border-rose-450 bg-rose-50/10" : "border-slate-300"
            }`}>
              
              {/* Void sign watermark */}
              {selectedOrderDetails.status === "Voided" && (
                <div className="absolute inset-0 m-auto select-none pointer-events-none opacity-15 border-4 border-rose-600 text-rose-700 font-bold uppercase rotate-12 flex h-max py-2 text-center justify-center text-xl max-w-xs px-4">
                  VOID STAMPED
                </div>
              )}

              <div className="text-center space-y-0.5 pb-2 border-b border-dashed border-gray-300">
                <h4 className="font-bold text-sm uppercase leading-tight">{settings.merchantName}</h4>
                <p className="text-[10px] text-gray-500">{settings.merchantCity}, Cambodia</p>
                <p className="text-[10px] text-gray-400 font-semibold">Active Counter ID: {settings.storeLabel}</p>
              </div>

              <div className="py-2.5 space-y-0.5 text-[10px] border-b border-dashed border-gray-300">
                <div className="flex justify-between">
                  <span>Bill Key:</span>
                  <span className="font-bold">{selectedOrderDetails.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Customer:</span>
                  <span>{selectedOrderDetails.customer?.name || "Walk-in Customer"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Timestamp:</span>
                  <span>{new Date(selectedOrderDetails.date).toLocaleString()}</span>
                </div>
              </div>

              {/* Items list table */}
              <table className="w-full text-[10px] my-2 select-text text-left border-b border-dashed border-gray-300 pb-2">
                <thead>
                  <tr className="border-b border-dashed border-gray-300">
                    <th className="font-bold py-1">Item</th>
                    <th className="font-bold py-0.5 text-center">Qty</th>
                    <th className="font-bold py-0.5 text-right">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrderDetails.items.map((item, idx) => {
                    const priceWithDis = item.sellPrice * (1 - item.discountPercent / 100);
                    return (
                      <tr key={idx}>
                        <td className="py-1">
                          {item.productName}
                          {item.discountPercent > 0 && <span className="block text-[8px] text-rose-500">({item.discountPercent}% off)</span>}
                        </td>
                        <td className="py-1 text-center">{item.quantity}</td>
                        <td className="py-1 text-right">${(priceWithDis * item.quantity).toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* pricing details */}
              <div className="text-[10px] text-right space-y-0.5 border-b border-dashed border-gray-300 pb-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${selectedOrderDetails.subtotal.toFixed(2)}</span>
                </div>
                {selectedOrderDetails.discountPercent > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Discount ({selectedOrderDetails.discountPercent}%):</span>
                    <span>-${selectedOrderDetails.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>VAT ({selectedOrderDetails.taxPercent}%):</span>
                  <span>${selectedOrderDetails.taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-slate-900 border-t border-dashed border-gray-200 pt-1">
                  <span>Grand Total (USD):</span>
                  <span>${selectedOrderDetails.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 font-semibold">
                  <span>Grand Total (KHR):</span>
                  <span>៛ {selectedOrderDetails.totalKHR.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
              </div>

              {/* Settlement specifics */}
              <div className="text-[9.5px] font-sans font-bold py-2 bg-slate-50 text-center rounded border border-gray-100 select-all leading-tight">
                <p className="uppercase text-slate-800">
                  METHOD: {selectedOrderDetails.paymentMethod === "Bakong_KHQR" ? "KHQR BAKONG SCAN" : "CASH CHANGER"}
                </p>
                {selectedOrderDetails.bakongTxId && (
                  <p className="text-[8px] text-blue-800 mt-1">
                    Bakong ID: <strong className="font-mono">{selectedOrderDetails.bakongTxId}</strong>
                  </p>
                )}
              </div>

              <div className="text-center pt-2 select-none">
                <p className="text-[9px] font-extrabold uppercase">Audit entry success</p>
                <p className="text-[7.5px] text-gray-400 mt-0.5">Counter Terminal 01 - Cashier logs secured</p>
              </div>

            </div>

            {/* Receipt actions */}
            <div className="flex gap-2 justify-end pt-2 select-none bg-white">
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-2 px-4 rounded-lg flex items-center gap-1.5 transition"
              >
                <Printer className="w-4 h-4" />
                <span>Simulate Print</span>
              </button>
              
              <button
                type="button"
                onClick={() => setSelectedOrderDetails(null)}
                className="bg-orange-500 hover:bg-orange-600 font-extrabold text-xs py-2 px-5 rounded-lg text-white"
              >
                Close Sheets
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
