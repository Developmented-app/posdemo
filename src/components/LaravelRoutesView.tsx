import React, { useState } from "react";
import { 
  Globe, 
  FileCode, 
  Terminal, 
  Layout, 
  Play, 
  ArrowRight, 
  CornerDownRight, 
  Check, 
  Code,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Package,
  Award,
  QrCode,
  Server
} from "lucide-react";
import { Order, Product, BakongSettings } from "../types";

interface LaravelRoutesViewProps {
  orders: Order[];
  products: Product[];
  settings: BakongSettings;
}

type ActiveRoute = "dashboard" | "daily" | "weekly" | "monthly" | "products";

export default function LaravelRoutesView({ orders, products, settings }: LaravelRoutesViewProps) {
  const [activeRoute, setActiveRoute] = useState<ActiveRoute>("daily");
  const [activeCodeTab, setActiveCodeTab] = useState<"routes" | "controller" | "blade">("controller");
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Calculations based on actual app state
  const completedOrders = orders.filter(o => o.status === "Completed");
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const sevenDaysAgo = startOfToday - 7 * 24 * 60 * 60 * 1000;
  const thirtyDaysAgo = startOfToday - 30 * 24 * 60 * 60 * 1000;

  // Filter actual orders for render boxes
  const dailyOrders = completedOrders.filter(o => o.date.startsWith(todayStr) || new Date(o.date).getTime() >= startOfToday);
  const weeklyOrders = completedOrders.filter(o => new Date(o.date).getTime() >= sevenDaysAgo);
  const monthlyOrders = completedOrders.filter(o => new Date(o.date).getTime() >= thirtyDaysAgo);

  const dailySalesTotal = dailyOrders.reduce((sum, o) => sum + o.total, 0);
  const weeklySalesTotal = weeklyOrders.reduce((sum, o) => sum + o.total, 0);
  const monthlySalesTotal = monthlyOrders.reduce((sum, o) => sum + o.total, 0);

  // Helper top selling products
  const getTopProductsForPeriod = (periodOrders: Order[]) => {
    const list: Record<string, { name: string; sku: string; quantity: number; revenue: number }> = {};
    products.forEach(p => {
      list[p.id] = { name: p.name, sku: p.sku, quantity: 0, revenue: 0 };
    });
    periodOrders.forEach(o => {
      o.items.forEach(item => {
        if (list[item.productId]) {
          list[item.productId].quantity += item.quantity;
          list[item.productId].revenue += item.quantity * item.sellPrice * (1 - item.discountPercent / 100);
        }
      });
    });
    return Object.values(list)
      .filter(p => p.quantity > 0)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  };

  const topProductsDaily = getTopProductsForPeriod(dailyOrders);
  const topProductsWeekly = getTopProductsForPeriod(weeklyOrders);
  const topProductsMonthly = getTopProductsForPeriod(monthlyOrders);
  const topProductsAllTime = getTopProductsForPeriod(completedOrders);

  const triggerCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Laravel Route Configurations
  const routeDefinitions = {
    dashboard: {
      path: "/admin/dashboard",
      name: "admin.dashboard",
      method: "GET",
      action: "DashboardController@index",
      url: "http://localhost:8000/admin/dashboard",
      description: "AdminLTE main control panel index with quick visual metrics and widgets."
    },
    daily: {
      path: "/admin/reports/sales/daily",
      name: "admin.reports.daily",
      method: "GET",
      action: "ReportController@dailySales",
      url: "http://localhost:8000/admin/reports/sales/daily",
      description: "Laravel route compiling real-time hourly transaction logs and cash drawer metrics for today."
    },
    weekly: {
      path: "/admin/reports/sales/weekly",
      name: "admin.reports.weekly",
      method: "GET",
      action: "ReportController@weeklySales",
      url: "http://localhost:8000/admin/reports/sales/weekly",
      description: "Analytical overview showing weekly total revenue trends, weekdays performance, and orders."
    },
    monthly: {
      path: "/admin/reports/sales/monthly",
      name: "admin.reports.monthly",
      method: "GET",
      action: "ReportController@monthlySales",
      url: "http://localhost:8000/admin/reports/sales/monthly",
      description: "Advanced monthly statistics compiling month-to-date category distribution and peak times."
    },
    products: {
      path: "/admin/reports/top-products",
      name: "admin.reports.products",
      method: "GET",
      action: "ReportController@topProducts",
      url: "http://localhost:8000/admin/reports/top-products",
      description: "Reports mapping top-selling food catalog items ranked by absolute quantity and revenue share."
    }
  };

  // Raw web.php code
  const rawRoutesCode = `<?php
// routes/web.php
use Illuminate\\Support\\Facades\\Route;
use App\\Http\\Controllers\\Admin\\DashboardController;
use App\\Http\\Controllers\\Admin\\ReportController;

Route::middleware(['auth', 'verified', 'role:admin'])->prefix('admin')->group(function () {
    
    // Admin Dashboard Index View
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('admin.dashboard');
    
    // POS Business Intelligence Reports
    Route::prefix('reports')->group(function() {
        Route::get('/sales/daily', [ReportController::class, 'dailySales'])->name('admin.reports.daily');
        Route::get('/sales/weekly', [ReportController::class, 'weeklySales'])->name('admin.reports.weekly');
        Route::get('/sales/monthly', [ReportController::class, 'monthlySales'])->name('admin.reports.monthly');
        Route::get('/top-products', [ReportController::class, 'topProducts'])->name('admin.reports.products');
    });
});`;

  // Raw PHP Controller Code based on active route
  const getControllerCode = () => {
    switch (activeRoute) {
      case "dashboard":
        return `<?php
namespace App\\Http\\Controllers\\Admin;

use App\\Http\\Controllers\\Controller;
use App\\Models\\Order;
use App\\Models\\Product;
use Carbon\\Carbon;

class DashboardController extends Controller
{
    public function index()
    {
        // Compute live metrics for operations panel
        $totalRevenue = Order::where('status', 'Completed')->sum('total');
        $ordersCount = Order::where('status', 'Completed')->count();
        $lowStockCount = Product::whereColumn('stock', '<=', 'low_stock_threshold')->count();
        
        // Feed trend line (last 7 days)
        $salesTrend = collect(range(0, 6))->map(function($daysAgo) {
            $date = Carbon::today()->subDays($daysAgo);
            return [
                'day' => $date->format('D, M d'),
                'total' => Order::where('status', 'Completed')
                    ->whereDate('created_at', $date)
                    ->sum('total')
            ];
        })->reverse();

        return view('admin.dashboard', compact(
            'totalRevenue', 
            'ordersCount', 
            'lowStockCount', 
            'salesTrend'
        ));
    }
}`;
      case "daily":
        return `<?php
namespace App\\Http\\Controllers\\Admin;

use App\\Http\\Controllers\\Controller;
use App\\Models\\Order;
use Carbon\\Carbon;

class ReportController extends Controller
{
    public function dailySales()
    {
        // Daily Report Eloquent Query
        $today = Carbon::today();
        
        $orders = Order::where('status', 'Completed')
            ->whereDate('created_at', $today)
            ->with('customer')
            ->orderBy('created_at', 'desc')
            ->get();
            
        $totalSales = $orders->sum('total');
        $ordersCount = $orders->count();
        
        // Payment split calculations
        $khqrSales = $orders->where('payment_method', 'Bakong_KHQR')->sum('total');
        $cashSales = $orders->where('payment_method', 'Cash')->sum('total');

        return view('admin.reports.sales_daily', compact(
            'orders',
            'totalSales',
            'ordersCount',
            'khqrSales',
            'cashSales',
            'today'
        ));
    }
}`;
      case "weekly":
        return `<?php
namespace App\\Http\\Controllers\\Admin;

use App\\Http\\Controllers\\Controller;
use App\\Models\\Order;
use Carbon\\Carbon;

class ReportController extends Controller
{
    public function weeklySales()
    {
        // Weekly Report (Start of week to now)
        $startOfWeek = Carbon::now()->subDays(7)->startOfDay();
        
        $orders = Order::where('status', 'Completed')
            ->where('created_at', '>=', $startOfWeek)
            ->orderBy('created_at', 'desc')
            ->get();
            
        $totalSales = $orders->sum('total');
        $ordersCount = $orders->count();
        $averageTicket = $ordersCount > 0 ? $totalSales / $ordersCount : 0;

        // Group sales by day of week for progress metrics
        $dailyDistribution = $orders->groupBy(function($order) {
            return Carbon::parse($order->created_at)->format('l');
        })->map(fn($dayGroup) => $dayGroup->sum('total'));

        return view('admin.reports.sales_weekly', compact(
            'orders',
            'totalSales',
            'ordersCount',
            'averageTicket',
            'dailyDistribution',
            'startOfWeek'
        ));
    }
}`;
      case "monthly":
        return `<?php
namespace App\\Http\\Controllers\\Admin;

use App\\Http\\Controllers\\Controller;
use App\\Models\\Order;
use Carbon\\Carbon;

class ReportController extends Controller
{
    public function monthlySales()
    {
        // Monthly Report (Last 30 Days)
        $startOfMonth = Carbon::now()->subDays(30)->startOfDay();
        
        $orders = Order::where('status', 'Completed')
            ->where('created_at', '>=', $startOfMonth)
            ->orderBy('created_at', 'desc')
            ->get();
            
        $totalSales = $orders->sum('total');
        $ordersCount = $orders->count();
        
        // Category representation stats
        $categorySales = \\DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->where('orders.status', 'Completed')
            ->where('orders.created_at', '>=', $startOfMonth)
            ->select('products.category', \\DB::raw('SUM(order_items.quantity * order_items.sell_price) as revenue'))
            ->groupBy('products.category')
            ->get();

        return view('admin.reports.sales_monthly', compact(
            'orders',
            'totalSales',
            'ordersCount',
            'categorySales',
            'startOfMonth'
        ));
    }
}`;
      case "products":
        return `<?php
namespace App\\Http\\Controllers\\Admin;

use App\\Http\\Controllers\\Controller;
use Illuminate\\Support\\Facades\\DB;
use App\\Models\\Order;
use Carbon\\Carbon;

class ReportController extends Controller
{
    public function topProducts()
    {
        // Eloquent & DB Raw Rank Calculation
        $topProducts = DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('orders.status', 'Completed')
            ->select(
                'order_items.product_name',
                'order_items.sku',
                DB::raw('SUM(order_items.quantity) as total_qty'),
                DB::raw('SUM(order_items.quantity * order_items.sell_price) as total_revenue')
            )
            ->groupBy('order_items.product_name', 'order_items.sku')
            ->orderBy('total_qty', 'desc')
            ->limit(10)
            ->get();

        return view('admin.reports.top_products', compact('topProducts'));
    }
}`;
    }
  };

  // Raw HTML Blade code
  const getBladeCode = () => {
    switch (activeRoute) {
      case "dashboard":
        return `@extends('adminlte::page')

@section('title', 'Laravel 12 Dashboard')

@section('content_header')
    <h1>Laravel 12 POS Operational Dashboard</h1>
@stop

@section('content')
    <div class="row">
        <!-- Revenue Card (AdminLTE Box) -->
        <div class="col-lg-3 col-6">
            <div class="small-box bg-info">
                <div class="inner">
                    <h3>\${{ number_format($totalRevenue, 2) }}</h3>
                    <p>Total Revenue Register</p>
                </div>
                <div class="icon">
                    <i class="fas fa-dollar-sign"></i>
                </div>
                <a href="{{ route('admin.reports.daily') }}" class="small-box-footer">
                    More info <i class="fas fa-arrow-circle-right"></i>
                </a>
            </div>
        </div>
        
        <!-- Orders Card -->
        <div class="col-lg-3 col-6">
            <div class="small-box bg-success">
                <div class="inner">
                    <h3>{{ $ordersCount }}</h3>
                    <p>Completed Bills</p>
                </div>
                <div class="icon">
                    <i class="fas fa-shopping-cart"></i>
                </div>
                <a href="#" class="small-box-footer">
                    Details <i class="fas fa-arrow-circle-right"></i>
                </a>
            </div>
        </div>
    </div>
@stop`;
      case "daily":
        return `@extends('adminlte::page')

@section('title', 'Daily Sales Report')

@section('content_header')
    <h1>Daily POS Receipt Logs</h1>
    <p class="text-muted">Generated for: {{ $today->format('F d, Y') }}</p>
@stop

@section('content')
    <div class="card card-outline card-primary">
        <div class="card-header">
            <h3 class="card-title">Daily Financial Overview</h3>
        </div>
        <div class="card-body">
            <div class="row">
                <div class="col-md-6 border-right">
                    <h5 class="text-secondary font-weight-bold">Daily Receipts Log: \${{ number_format($totalSales, 2) }}</h5>
                    <p>Total Completed Orders today: <strong>{{ $ordersCount }}</strong></p>
                </div>
                <div class="col-md-6 text-center">
                    <div className="btn-group">
                        <span class="badge badge-info p-2">Bakong KHQR: \${{ number_format($khqrSales, 2) }}</span>
                        <span class="badge badge-success p-2">Cash: \${{ number_format($cashSales, 2) }}</span>
                    </div>
                </div>
            </div>
            
            <table class="table table-striped table-hover mt-4">
                <thead>
                    <tr>
                        <th>Invoice Ref</th>
                        <th>Bought At</th>
                        <th>Customer</th>
                        <th class="text-right">Total Price</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($orders as $order)
                        <tr>
                            <td><strong>{{ $order->invoice_number }}</strong></td>
                            <td>{{ $order->created_at->format('h:i A') }}</td>
                            <td>{{ $order->customer->name ?? 'Walk-In' }}</td>
                            <td class="text-right font-weight-bold">\${{ number_format($order->total, 2) }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    </div>
@stop`;
      case "weekly":
        return `@extends('adminlte::page')

@section('title', 'Weekly Sales Performance')

@section('content_header')
    <h1>Weekly Control Panel Analytics</h1>
@stop

@section('content')
    <div class="card card-warning">
        <div class="card-header text-white">
            <h3 class="card-title">Weekly Revenue Breakdown (\${{ number_format($totalSales, 2) }})</h3>
        </div>
        <div class="card-body">
            <p>Average Completed Ticket Size: <strong>\${{ number_format($averageTicket, 2) }}</strong></p>
            
            <div class="row mt-4">
                @foreach($dailyDistribution as $day => $total)
                    <div class="col-md-3">
                        <div class="info-box bg-light">
                            <div class="info-box-content">
                                <span class="info-box-text">{{ $day }}</span>
                                <span class="info-box-number">\${{ number_format($total, 2) }}</span>
                            </div>
                        </div>
                    </div>
                @endforeach
            </div>
        </div>
    </div>
@stop`;
      case "monthly":
        return `@extends('adminlte::page')

@section('title', 'Monthly Sales Report')

@section('content_header')
    <h1>Monthly Audit & Category Breakdown</h1>
@stop

@section('content')
    <div class="card card-primary card-outline">
        <div class="card-body">
            <h3>Month-to-Date Volume: \${{ number_format($totalSales, 2) }} USD</h3>
            <p className="text-muted">Aggregating last 30 days of active POS sales.</p>
            
            <h4 class="mt-4">Category Profit Allocations:</h4>
            <div class="row">
                @foreach($categorySales as $cat)
                    <div class="col-sm-6">
                        <div class="progress-group">
                            {{ $cat->category }}
                            <span class="float-right font-weight-bold">\${{ number_format($cat->revenue, 2) }}</span>
                            <div class="progress progress-sm">
                                <div class="progress-bar bg-primary" style="width: 75%"></div>
                            </div>
                        </div>
                    </div>
                @endforeach
            </div>
        </div>
    </div>
@stop`;
      case "products":
        return `@extends('adminlte::page')

@section('title', 'Top Products Rank')

@section('content_header')
    <h1>Merchandise Leaderboards</h1>
@stop

@section('content')
    <div class="card card-dark">
        <div class="card-header">
            <h3 class="card-title font-weight-bold"><i class="fas fa-crown text-warning"></i> Rank of Top Selling Food Items</h3>
        </div>
        <div class="card-body p-0">
            <table class="table table-hover table-head-fixed mb-0">
                <thead>
                    <tr>
                        <th width="80">Index</th>
                        <th>Menu Product Item</th>
                        <th>SKU Identification</th>
                        <th class="text-center">Total Quantity Sold</th>
                        <th class="text-right">Revenue Register</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($topProducts as $idx => $prod)
                        <tr>
                            <td><span class="badge bg-secondary p-1 font-weight-extrabold font-mono">#{{ $idx + 1 }}</span></td>
                            <td class="font-weight-600">{{ $prod->product_name }}</td>
                            <td><code class="text-indigo">{{ $prod->sku }}</code></td>
                            <td class="text-center font-weight-bold text-success">{{ $prod->total_qty }} units</td>
                            <td class="text-right font-mono font-weight-bold text-dark">\${{ number_format($prod->total_revenue, 2) }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    </div>
@stop`;
    }
  };

  return (
    <div className="space-y-6 text-left animate-fade-in select-none">
      
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-200 pb-4 gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-850 tracking-tight font-sans flex items-center gap-2">
            <Server className="w-6 h-6 text-orange-500" />
            Laravel 12 Route & MVC Simulator
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Exposing standard PHP web routes, Controllers, and AdminLTE Blade views linked directly to live client state calculations.
          </p>
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-500 font-mono">
          <span className="text-orange-500 font-bold">routes/web.php</span>
          <span>&gt;</span>
          <span className="text-gray-450 hover:text-orange-500">Blade Rendering</span>
        </div>
      </div>

      {/* Main Grid: Left is Router Panel, Right is Code & Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Registered Routes List (3 cols) */}
        <div className="lg:col-span-4 bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-4">
          <div className="flex items-center gap-2 py-1 border-b border-gray-100">
            <Globe className="w-4 h-4 text-blue-500" />
            <h3 className="font-bold text-sm text-gray-800">Laravel Route Registry</h3>
          </div>
          
          <p className="text-xs text-gray-400">
            Click on a Laravel route below to simulate the backend query dispatch and render the specific Blade view:
          </p>

          <div className="space-y-2.5">
            {Object.entries(routeDefinitions).map(([key, value]) => {
              const active = activeRoute === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveRoute(key as ActiveRoute)}
                  className={`w-full text-left p-3 rounded-lg border transition text-xs relative ${
                    active 
                      ? "bg-slate-50 border-orange-400 shadow-sm" 
                      : "bg-white border-gray-100 hover:border-gray-300 hover:bg-slate-50/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] bg-slate-100 font-bold px-1.5 py-0.5 rounded text-gray-600 uppercase border">
                      {value.method}
                    </span>
                    <span className="text-[10px] text-orange-600 font-mono font-semibold truncate max-w-[150px]">
                      {value.name}
                    </span>
                  </div>
                  <h4 className="font-mono font-bold text-gray-800 mt-2 text-[11px] truncate">
                    {value.path}
                  </h4>
                  <p className="text-[10px] text-gray-400 mt-1 line-clamp-2">
                    {value.description}
                  </p>
                  
                  {active && (
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                      <Play className="w-3.5 h-3.5 text-orange-500 fill-orange-500 absolute -right-0.5" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="bg-orange-50/50 border border-orange-100 p-3 rounded-lg text-xs mt-2">
            <p className="font-bold text-orange-800 font-sans flex items-center gap-1.5 mb-1">
              <Terminal className="w-3.5 h-3.5" />
              Laravel Artisan Env
            </p>
            <span className="text-[10px] font-mono text-orange-700 block">
              PHP v8.3.0 · Laravel v12.0.1
            </span>
            <span className="text-[10px] font-mono text-orange-600 mt-0.5 block">
              Theme: AdminLTE v4
            </span>
          </div>
        </div>

        {/* Right Column: Code and Visual Renderer (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Mock Browser URL Bar */}
          <div className="bg-[#1e1e1e] rounded-xl overflow-hidden shadow-md border border-neutral-800">
            <div className="bg-neutral-800/80 p-3 px-4 flex items-center gap-2 border-b border-neutral-900 select-none">
              {/* Traffic lights */}
              <div className="flex gap-1.5 mr-2">
                <span className="w-3 h-3 bg-red-500 rounded-full inline-block"></span>
                <span className="w-3 h-3 bg-yellow-500 rounded-full inline-block"></span>
                <span className="w-3 h-3 bg-green-500 rounded-full inline-block"></span>
              </div>
              
              {/* Browser Address Input */}
              <div className="flex-1 bg-neutral-950 px-3 py-1 rounded-md text-[11px] font-mono text-gray-400 flex items-center justify-between overflow-hidden select-all whitespace-nowrap">
                <span className="flex items-center gap-1 border-r border-neutral-900 pr-2">
                  <span className="text-emerald-500 text-[10px] font-bold">🔒 Secure</span>
                </span>
                <span className="flex-1 px-2.5 truncate text-left text-neutral-300">
                  {routeDefinitions[activeRoute].url}
                </span>
                <span className="text-[9.5px] text-gray-600 font-bold shrink-0">PHP Router v12</span>
              </div>
            </div>

            {/* Simulated Live Renderer Component: Inside the Browser! */}
            <div className="bg-[#f4f6f9] p-4 text-slate-800 min-h-[300px] border-b border-neutral-900 max-h-[500px] overflow-y-auto">
              
              {/* Simulated AdminLTE v4 Master Frame */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden font-sans">
                
                {/* AdminLTE header banner mock */}
                <div className="bg-[#343a40] text-gray-200 p-2.5 font-sans flex items-center justify-between text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <span className="text-orange-500 font-extrabold">PRASIDH ADMINPOS</span>
                    <span className="text-slate-400">|</span>
                    <span className="text-slate-300 font-normal">Laravel 12 Controller Response View</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span className="text-[10px] text-gray-400">Active Controller: <span className="font-mono text-emerald-400">{routeDefinitions[activeRoute].action}</span></span>
                  </div>
                </div>

                {/* Simulated Content Body */}
                <div className="p-4 bg-gray-50 text-slate-800">
                  
                  {/* Dynamic Rendering for Active Laravel Route */}
                  {activeRoute === "dashboard" && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center pb-2 border-b">
                        <h2 className="text-md font-bold text-slate-800">AdminLTE Dashboard Main Page</h2>
                        <span className="text-[9.5px] font-mono bg-sky-100 text-sky-800 font-bold p-1 rounded">Blade Controller Index</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-[#17a2b8] text-white p-3 rounded shadow-sm">
                          <p className="text-[10px] font-mono uppercase opacity-90">Total Revenue</p>
                          <h3 className="text-lg font-black font-mono">${completedOrders.reduce((sum, o) => sum + o.total, 0).toFixed(2)}</h3>
                          <p className="text-[9px] opacity-75">Mapped Laravel Model Order::sum()</p>
                        </div>
                        <div className="bg-[#28a745] text-white p-3 rounded shadow-sm">
                          <p className="text-[10px] font-mono uppercase opacity-90">Completed Bills</p>
                          <h3 className="text-lg font-black font-mono">{completedOrders.length}</h3>
                          <p className="text-[9px] opacity-75">Equivalent to count($orders)</p>
                        </div>
                      </div>

                      <div className="bg-white p-3 border rounded">
                        <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wide">Live Trend Array Passed</h4>
                        <div className="flex gap-2 items-end mt-3 h-12">
                          {completedOrders.slice(-5).map((o, idx) => (
                            <div key={idx} className="flex-1 flex flex-col items-center">
                              <div className="bg-blue-400 w-full rounded-t" style={{ height: `${Math.max(10, Math.min(48, (o.total / 30) * 48))}px` }}></div>
                              <span className="text-[8px] font-mono shrink-0 mt-1">${o.total.toFixed(0)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeRoute === "daily" && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center pb-2 border-b">
                        <div>
                          <h2 className="text-md font-bold text-slate-800">Daily Sales Receipts Index</h2>
                          <p className="text-[10px] text-gray-400">Generated for Today carbon clock: {todayStr}</p>
                        </div>
                        <span className="text-[9.5px] font-mono bg-[#4f46e5]/10 text-[#4f46e5] font-bold p-1 px-1.5 rounded border border-[#4f46e5]/20">Daily Report</span>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-white border rounded p-2 text-center">
                          <p className="text-[9px] text-gray-400 font-mono lowercase">total_sales</p>
                          <h4 className="text-base font-bold font-mono text-gray-800">${dailySalesTotal.toFixed(2)}</h4>
                        </div>
                        <div className="bg-white border rounded p-2 text-center">
                          <p className="text-[9px] text-gray-400 font-mono lowercase">orders_count</p>
                          <h4 className="text-base font-bold font-mono text-gray-800">{dailyOrders.length} bills</h4>
                        </div>
                        <div className="bg-white border rounded p-2 text-center">
                          <p className="text-[9px] text-gray-400 font-mono lowercase">exchange_riel</p>
                          <h4 className="text-[10px] font-bold font-mono text-gray-800">៛ {(dailySalesTotal * settings.exchangeRate).toLocaleString()} KHR</h4>
                        </div>
                      </div>

                      <div className="bg-white rounded border overflow-hidden">
                        <div className="bg-slate-50 p-1.5 border-b text-[10px] font-bold text-gray-500">Live Eloquent Database Result Collection:</div>
                        <div className="overflow-x-auto max-h-[160px]">
                          <table className="w-full text-left text-[11px] text-slate-600">
                            <thead className="bg-[#f8fafc] text-[9px] border-b text-slate-500">
                              <tr>
                                <th className="p-1 px-2 font-bold">Invoice ID</th>
                                <th className="p-1 px-2 font-bold text-center">Payment</th>
                                <th className="p-1 px-2 font-bold text-right">Sum</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y font-mono">
                              {dailyOrders.length === 0 ? (
                                <tr>
                                  <td colSpan={3} className="py-4 text-center text-gray-400 text-xs">No orders created today. Check POS to checkout some orders!</td>
                                </tr>
                              ) : (
                                dailyOrders.map(o => (
                                  <tr key={o.id}>
                                    <td className="p-1 px-2 font-bold">{o.invoiceNumber}</td>
                                    <td className="p-1 px-2 text-center text-[10px]">{o.paymentMethod}</td>
                                    <td className="p-1 px-2 text-right font-bold text-black">${o.total.toFixed(2)}</td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeRoute === "weekly" && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center pb-2 border-b">
                        <div>
                          <h2 className="text-md font-bold text-slate-800">Weekly Performance Report</h2>
                          <p className="text-[10px] text-gray-400">Sum spanning last 7 calendar days</p>
                        </div>
                        <span className="text-[9.5px] font-mono bg-green-100 text-green-800 font-bold p-1 px-1.5 rounded">Weekly Report</span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-100 border p-2.5 rounded flex items-center justify-between">
                          <div>
                            <p className="text-[9px] font-mono text-gray-400">WEEKLY REVENUE</p>
                            <h4 className="text-base font-extrabold font-mono text-[#28a745]">${weeklySalesTotal.toFixed(2)}</h4>
                          </div>
                          <DollarSign className="w-8 h-8 text-slate-300 shrink-0" />
                        </div>
                        <div className="bg-slate-100 border p-2.5 rounded flex items-center justify-between">
                          <div>
                            <p className="text-[9px] font-mono text-gray-400">WEEKLY COMPLETED BILLS</p>
                            <h4 className="text-base font-extrabold font-mono text-slate-800">{weeklyOrders.length} receipts</h4>
                          </div>
                          <ShoppingCart className="w-8 h-8 text-slate-300 shrink-0" />
                        </div>
                      </div>

                      {/* Display daily average comparisons */}
                      <div className="bg-white p-3 border rounded text-[11px]">
                        <h4 className="font-bold text-gray-600 uppercase tracking-tight text-[10px] mb-2">Weekly Average Ticket Size</h4>
                        <p className="text-slate-700">Calculated view query: <strong>${weeklyOrders.length > 0 ? (weeklySalesTotal / weeklyOrders.length).toFixed(2) : "0.00"} USD</strong></p>
                        
                        <div className="mt-3 space-y-1.5">
                          <p className="text-[10px] text-gray-400 font-mono">Simulating distribution of top products this week:</p>
                          {topProductsWeekly.slice(0, 3).map((tp, idx) => (
                            <div key={idx} className="flex justify-between items-center">
                              <span className="truncate max-w-[150px]">{tp.name}</span>
                              <span className="font-mono text-gray-500">{tp.quantity} sold</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeRoute === "monthly" && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center pb-2 border-b">
                        <div>
                          <h2 className="text-md font-bold text-slate-800">Monthly Audit Report Page</h2>
                          <p className="text-[10px] text-gray-400">Consolidated analytics spanning trailing 30 days</p>
                        </div>
                        <span className="text-[9.5px] font-mono bg-orange-100 text-orange-850 font-bold p-1 px-1.5 rounded">Monthly Report</span>
                      </div>

                      <div className="bg-white p-3 rounded border text-center font-mono">
                        <p className="text-[9px] text-gray-450 uppercase font-sans tracking-wide">Month-to-Date Volume total_sales:</p>
                        <h3 className="text-2xl font-black text-[#17a2b8]">${monthlySalesTotal.toFixed(2)} USD</h3>
                        <p className="text-[10px] text-gray-400 mt-1">Summed across {monthlyOrders.length} completed transactions</p>
                      </div>

                      {/* category split */}
                      <div className="bg-white p-3 rounded border text-[11px] space-y-2">
                        <h4 className="font-bold text-gray-600 block text-[10px] uppercase">Calculated Sales By Category (Last 30 Days)</h4>
                        
                        <div className="space-y-2">
                          {["Main Dishes", "Beverages", "Groceries", "Snacks"].map(category => {
                            // Compute sales of category inside monthly orders
                            let catSum = 0;
                            monthlyOrders.forEach(mo => {
                              mo.items.forEach(item => {
                                const matchedP = products.find(p => p.id === item.productId);
                                if (matchedP && matchedP.category === category) {
                                  catSum += item.quantity * item.sellPrice * (1 - item.discountPercent / 100);
                                }
                              });
                            });
                            
                            const percent = monthlySalesTotal > 0 ? (catSum / monthlySalesTotal) * 100 : 0;
                            
                            return (
                              <div key={category}>
                                <div className="flex justify-between text-[11px]">
                                  <span className="font-semibold text-slate-800">{category}</span>
                                  <span className="font-mono text-slate-600">${catSum.toFixed(2)} ({Math.round(percent)}%)</span>
                                </div>
                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-0.5">
                                  <div className="bg-sky-500 h-full" style={{ width: `${percent}%` }}></div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeRoute === "products" && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center pb-2 border-b">
                        <div>
                          <h2 className="text-md font-bold text-slate-800">Merchandise Performance Rankings</h2>
                          <p className="text-[10px] text-gray-400">Rank of menu product sales sorted by volume quantity</p>
                        </div>
                        <span className="text-[9.5px] font-mono bg-purple-100 text-purple-800 font-bold p-1 px-1.5 rounded">All-Time Products</span>
                      </div>

                      <div className="bg-white border rounded overflow-hidden">
                        <table className="w-full text-[11px] text-left text-slate-600 font-sans">
                          <thead className="bg-[#f8fafc] text-slate-500 uppercase tracking-wider text-[9px] border-b">
                            <tr>
                              <th className="p-1.5 px-3 font-bold">Rank</th>
                              <th className="p-1.5 px-2 font-bold">Item Name</th>
                              <th className="p-1.5 px-2 font-bold text-center">Qty Sold</th>
                              <th className="p-1.5 px-3 font-bold text-right">Revenue</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y font-medium text-slate-700">
                            {topProductsAllTime.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="py-4 text-center text-gray-400 text-xs text-sans">No product sales logged yet. Place orders inside POSTerminal!</td>
                              </tr>
                            ) : (
                              topProductsAllTime.map((tp, idx) => (
                                <tr key={idx}>
                                  <td className="p-1.5 px-3"><span className="badge bg-secondary text-white px-1.5 rounded font-mono font-bold text-[9px]">#{idx + 1}</span></td>
                                  <td className="p-1.5 px-2 font-bold">{tp.name}</td>
                                  <td className="p-1.5 px-2 text-center text-emerald-600 font-mono font-bold">{tp.quantity} units</td>
                                  <td className="p-1.5 px-3 text-right font-mono text-black font-extrabold">${tp.revenue.toFixed(2)}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                </div>
              </div>

            </div>
          </div>

          {/* Interactive Source Code Tabs */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-slate-950 p-2 border-b border-slate-800 flex items-center justify-between">
              
              <div className="flex gap-1">
                <button
                  onClick={() => setActiveCodeTab("routes")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition font-medium ${
                    activeCodeTab === "routes"
                      ? "bg-orange-500 text-white"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>routes/web.php</span>
                </button>

                <button
                  onClick={() => setActiveCodeTab("controller")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition font-medium ${
                    activeCodeTab === "controller"
                      ? "bg-orange-500 text-white"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>ReportController.php</span>
                </button>

                <button
                  onClick={() => setActiveCodeTab("blade")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition font-medium ${
                    activeCodeTab === "blade"
                      ? "bg-orange-500 text-white"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <Layout className="w-3.5 h-3.5" />
                  <span>*.blade.php View</span>
                </button>
              </div>

              {/* Copy code button */}
              <button
                onClick={() => {
                  const code = activeCodeTab === "routes" 
                    ? rawRoutesCode 
                    : activeCodeTab === "controller" 
                      ? getControllerCode() 
                      : getBladeCode();
                  triggerCopy(code, activeCodeTab);
                }}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-gray-300 font-bold py-1 px-2.5 rounded-lg border border-slate-700 flex items-center gap-1 transition"
              >
                {copiedText === activeCodeTab ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-semibold font-mono">Copied!</span>
                  </>
                ) : (
                  <>
                    <Code className="w-3.5 h-3.5 text-orange-400" />
                    <span>Copy Snippet</span>
                  </>
                )}
              </button>

            </div>

            {/* Code Body */}
            <div className="p-4 bg-[#0d1117] overflow-x-auto select-all max-h-[350px] overflow-y-auto">
              <pre className="text-[11px] font-mono leading-relaxed text-gray-300 text-left tab-size-4">
                <code>
                  {activeCodeTab === "routes" && rawRoutesCode}
                  {activeCodeTab === "controller" && getControllerCode()}
                  {activeCodeTab === "blade" && getBladeCode()}
                </code>
              </pre>
            </div>
            
            <div className="bg-slate-950 px-4 py-2 border-t border-slate-800 text-[10px] text-gray-500 font-mono flex justify-between">
              <span>Laravel Eloquent ORM mapping active states</span>
              <span className="text-orange-600 font-bold">100% Native Code Spec</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
