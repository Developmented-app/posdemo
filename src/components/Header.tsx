import React, { useState, useEffect } from "react";
import { Menu, ShieldCheck, RefreshCw, Smartphone, QrCode, Globe } from "lucide-react";
import { BakongSettings } from "../types";

interface HeaderProps {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  settings: BakongSettings;
  setOpenSimulator: (open: boolean) => void;
  onResetDatabase: () => void;
}

export default function Header({ 
  sidebarCollapsed, 
  toggleSidebar, 
  settings, 
  setOpenSimulator,
  onResetDatabase 
}: HeaderProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-10 shrink-0 select-none">
      {/* Left items - Hamburger / Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
          title="Toggle Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Brand / Title Indicator */}
        <div className="hidden sm:flex items-center gap-2">
          <span className="px-2 py-0.5 bg-orange-100 text-orange-800 text-[11px] font-bold uppercase rounded tracking-wide">
            HQ Node
          </span>
          <span className="text-gray-300">|</span>
          <p className="text-xs text-gray-500 font-sans">
            Bakong KHQR Payment Router: <strong className="text-slate-800 font-medium">Auto-Webhook Enabled</strong>
          </p>
        </div>
      </div>

      {/* Right items - Settings & Live System Stats */}
      <div className="flex items-center gap-3 lg:gap-5">
        {/* Real-time Exchange Rate Widget */}
        <div className="hidden md:flex items-center gap-2 px-2.5 py-1 bg-sky-50 rounded-lg border border-sky-100 text-[11px]">
          <Globe className="w-3.5 h-3.5 text-sky-600" />
          <span className="text-sky-800 font-medium font-sans">
            Rate: 1 USD = <strong className="font-semibold">{settings.exchangeRate} KHR</strong>
          </span>
        </div>

        {/* Blockchain Status / Ledger Connected Indicator */}
        <div className="flex items-center gap-1.5 text-xs text-green-600 font-sans font-medium px-2 py-1 bg-green-50 rounded-lg border border-green-100">
          <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
          <span className="hidden sm:inline">Ledger Status:</span>
          <span className="text-[10px] font-mono tracking-wider font-extrabold text-green-700 bg-green-200/50 px-1.5 py-0.5 rounded">
            ONLINE
          </span>
        </div>

        {/* Simulated Bakong App shortcut */}
        <button
          onClick={() => setOpenSimulator(true)}
          className="flex items-center gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-1 px-3 rounded-lg shadow-sm transition active:scale-95"
          title="Open Bakong Wallet Scanner Simulator"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Bakong Wallet Sim</span>
        </button>

        {/* Quick Database Reset */}
        <button
          onClick={() => {
            if (window.confirm("Restore default POS items, default categories, and wipe transaction logs?")) {
              onResetDatabase();
            }
          }}
          className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition"
          title="Reset Database to Defaults"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        {/* Live Active Clock */}
        <div className="hidden lg:flex flex-col text-right leading-tight select-all">
          <span className="text-xs font-semibold text-slate-800 font-mono">
            {time.toLocaleTimeString()}
          </span>
          <span className="text-[10px] text-gray-400 font-sans">
            {time.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>
    </header>
  );
}
