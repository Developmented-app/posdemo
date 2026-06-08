import React from "react";
import { 
  LayoutDashboard, 
  MonitorPlay, 
  Boxes, 
  FileSpreadsheet, 
  QrCode, 
  TrendingUp, 
  UserCircle 
} from "lucide-react";

interface SidebarProps {
  currentView: string;
  setView: (view: string) => void;
  collapsed: boolean;
}

export default function Sidebar({ currentView, setView, collapsed }: SidebarProps) {
  const menuItems = [
    { id: "dashboard", name: "Dashboard / Analytics", icon: LayoutDashboard },
    { id: "pos", name: "POS Cashier Terminal", icon: MonitorPlay },
    { id: "inventory", name: "Product & Inventory", icon: Boxes },
    { id: "reports", name: "Sales & Receipts Log", icon: FileSpreadsheet },
    { id: "laravel-routes", name: "Laravel Routes & Views", icon: TrendingUp },
    { id: "settings", name: "Bakong KHQR Config", icon: QrCode },
  ];

  return (
    <aside 
      className={`bg-[#343a40] text-gray-300 h-screen transition-all duration-300 flex flex-col z-20 shrink-0 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Brand Logo Wrapper */}
      <div className="h-14 border-b border-gray-700 flex items-center px-4 gap-3 bg-[#24292e] overflow-hidden">
        <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center font-bold text-white tracking-widest text-lg shrink-0">
          L
        </div>
        {!collapsed && (
          <div className="flex flex-col whitespace-nowrap leading-tight">
            <span className="font-semibold text-white tracking-wide text-sm font-sans">
              LARAVEL <span className="text-orange-500 font-extrabold text-xs">v12</span>
            </span>
            <span className="text-xs text-gray-400 font-mono">AdminLTE POS v4</span>
          </div>
        )}
      </div>

      {/* User Information Block */}
      <div className="px-3 py-4 border-b border-gray-700 flex items-center gap-3 bg-[#2a3035] overflow-hidden">
        <UserCircle className="w-8 h-8 text-gray-400 shrink-0" />
        {!collapsed && (
          <div className="truncate">
            <p className="text-sm font-medium text-white truncate">Administrator</p>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">Staff Terminal 01</span>
            </div>
          </div>
        )}
      </div>

      {/* Navigation list */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        <p className={`text-[10px] font-bold text-slate-500 uppercase px-3 tracking-widest pb-2 ${collapsed ? "text-center" : ""}`}>
          {collapsed ? "POS" : "Main Modules"}
        </p>

        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center rounded-lg transition-all duration-150 py-2.5 px-3 leading-5 group ${
                isActive
                  ? "bg-orange-500 text-white font-medium shadow-md shadow-orange-600/20"
                  : "text-gray-300 hover:bg-[#495057] hover:text-white"
              }`}
            >
              <IconComponent 
                className={`w-5 h-5 shrink-0 ${
                  isActive ? "text-white" : "text-gray-400 group-hover:text-white"
                } ${collapsed ? "mx-auto" : "mr-3"}`} 
              />
              {!collapsed && (
                <span className="text-sm font-sans truncate">{item.name}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Meta */}
      {!collapsed && (
        <div className="p-3 bg-[#24292e] text-center border-t border-gray-700">
          <p className="text-[10px] text-slate-500 font-mono">
            Powered by Bakong KHQR
          </p>
          <p className="text-[9px] text-slate-600 font-sans mt-0.5">
            AdminLTE Framework 3.2.0
          </p>
        </div>
      )}
    </aside>
  );
}
