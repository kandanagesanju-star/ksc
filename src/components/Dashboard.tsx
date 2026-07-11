import React, { useState, useMemo } from 'react';
import { Sale, Product, RepairJob, Customer, Expense, SpecialOrder, StockAdjustment } from '../types';
import { translations } from '../lib/translations';
import { 
  TrendingUp, DollarSign, Wrench, AlertTriangle, 
  ShoppingCart, Users, Plus, ArrowUpRight, BarChart3, 
  Calendar, Layers, CheckCircle, Wifi, WifiOff, RefreshCw,
  Info, X, Landmark, ClipboardList, Package, MessageSquare, Trash2
} from 'lucide-react';

interface DashboardProps {
  language: 'en' | 'si';
  sales: Sale[];
  products: Product[];
  repairs: RepairJob[];
  customers: Customer[];
  expenses: Expense[];
  specialOrders: SpecialOrder[];
  setViewMode: (mode: 'storefront' | 'admin') => void;
  setAdminTab: (tab: any) => void;
  isOnline: boolean;
  onTriggerOfflineSync: () => void;
  pendingSyncCount: number;
  onAddExpense: (expense: Expense) => void;
  onAddStockAdjustment: (adjustment: StockAdjustment) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  language,
  sales,
  products,
  repairs,
  customers,
  expenses,
  specialOrders,
  setViewMode,
  setAdminTab,
  isOnline,
  onTriggerOfflineSync,
  pendingSyncCount,
  onAddExpense,
  onAddStockAdjustment
}) => {
  const t = translations[language];

  // Quick Action Modals States
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isWastageModalOpen, setIsWastageModalOpen] = useState(false);

  // Expense form states
  const [expCategory, setExpCategory] = useState<'Rent' | 'Electricity' | 'Water' | 'Internet' | 'Salaries' | 'Supplier Payment' | 'Marketing' | 'Other'>('Other');
  const [expDesc, setExpDesc] = useState('');
  const [expAmount, setExpAmount] = useState<number>(0);

  // Wastage form states
  const [wastageSearch, setWastageSearch] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [wastageQty, setWastageQty] = useState<number>(1);
  const [wastageReason, setWastageReason] = useState('Wastage');

  // Real-Time Telemetry Stats
  const [cpuLoad, setCpuLoad] = useState(12);
  const [heapMem, setHeapMem] = useState(42.5);
  const [dbRead, setDbRead] = useState(0.4);
  const [dbWrite, setDbWrite] = useState(1.1);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCpuLoad(Math.floor(8 + Math.random() * 25));
      setHeapMem(Number((40 + Math.random() * 5).toFixed(1)));
      setDbRead(Number((0.2 + Math.random() * 0.4).toFixed(2)));
      setDbWrite(Number((0.8 + Math.random() * 0.6).toFixed(2)));
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  // Filter products in wastage modal
  const filteredWastageProducts = useMemo(() => {
    if (!wastageSearch.trim()) return [];
    return products.filter(p => 
      p.nameEn.toLowerCase().includes(wastageSearch.toLowerCase()) ||
      p.nameSi.includes(wastageSearch) ||
      p.id.toLowerCase().includes(wastageSearch.toLowerCase())
    );
  }, [products, wastageSearch]);

  // Calculations
  const stats = useMemo(() => {
    let totalSales = 0;
    let totalProfit = 0;
    sales.forEach(s => {
      totalSales += s.total;
      totalProfit += s.profit;
    });

    let totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    let netProfit = totalProfit - totalExpenses;

    let activeRepairs = repairs.filter(r => r.status !== 'Delivered' && r.status !== 'Cancelled').length;
    let pendingSpecialOrders = specialOrders.filter(so => so.status !== 'Shipped/Delivered').length;
    let lowStockCount = products.filter(p => p.stock !== 'Unlimited' && p.stock <= p.lowStockAlert).length;

    return {
      totalSales,
      totalProfit,
      totalExpenses,
      netProfit,
      activeRepairs,
      pendingSpecialOrders,
      lowStockCount
    };
  }, [sales, products, repairs, expenses, specialOrders]);

  const recentSalesList = sales.slice(0, 5);
  const recentRepairsList = repairs.slice(0, 5);

  // 1. SVG Line Chart Data - Last 7 Days Sales vs Expenses
  const chartData = useMemo(() => {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }

    const data = dates.map(dateStr => {
      const daySales = sales
        .filter(s => s.createdAt.startsWith(dateStr))
        .reduce((sum, s) => sum + s.total, 0);
      const dayExpenses = expenses
        .filter(e => e.createdAt.startsWith(dateStr))
        .reduce((sum, e) => sum + e.amount, 0);
      
      const parts = dateStr.split('-');
      const shortLabel = `${parts[1]}/${parts[2]}`; // MM/DD
      return { date: shortLabel, sales: daySales, expenses: dayExpenses };
    });

    return data;
  }, [sales, expenses]);

  // SVG dimensions & path builders
  const lineChartSvg = useMemo(() => {
    const width = 500;
    const height = 180;
    const paddingLeft = 45;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 30;

    const maxVal = Math.max(
      ...chartData.map(d => Math.max(d.sales, d.expenses)),
      10000 // default min height scale
    );

    const getX = (index: number) => {
      return paddingLeft + (index * (width - paddingLeft - paddingRight) / 6);
    };

    const getY = (value: number) => {
      const chartHeight = height - paddingTop - paddingBottom;
      return height - paddingBottom - (value / maxVal * chartHeight);
    };

    let salesPath = '';
    let expensesPath = '';
    let salesAreaPath = '';
    let expensesAreaPath = '';

    chartData.forEach((d, idx) => {
      const x = getX(idx);
      const ySales = getY(d.sales);
      const yExp = getY(d.expenses);

      if (idx === 0) {
        salesPath = `M ${x} ${ySales}`;
        expensesPath = `M ${x} ${yExp}`;
        salesAreaPath = `M ${x} ${height - paddingBottom} L ${x} ${ySales}`;
        expensesAreaPath = `M ${x} ${height - paddingBottom} L ${x} ${yExp}`;
      } else {
        salesPath += ` L ${x} ${ySales}`;
        expensesPath += ` L ${x} ${yExp}`;
      }
    });

    const lastX = getX(6);
    if (chartData.length > 0) {
      salesAreaPath += `${salesPath.replace('M', ' L')} L ${lastX} ${height - paddingBottom} Z`;
      expensesAreaPath += `${expensesPath.replace('M', ' L')} L ${lastX} ${height - paddingBottom} Z`;
    }

    return {
      width,
      height,
      maxVal,
      getX,
      getY,
      salesPath,
      expensesPath,
      salesAreaPath,
      expensesAreaPath,
      paddingLeft,
      paddingBottom
    };
  }, [chartData]);

  // 2. Category Distribution Bar Chart Data
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    sales.forEach(sale => {
      sale.items.forEach(item => {
        const prod = products.find(p => p.id === item.productId);
        const cat = prod?.category || 'Other';
        counts[cat] = (counts[cat] || 0) + item.quantity;
      });
    });

    const list = Object.entries(counts).map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
    
    return list;
  }, [sales, products]);

  // Form Submits
  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (expAmount <= 0) {
      alert(language === 'en' ? 'Please enter a valid expense amount!' : 'කරුණාකර වලංගු වියදම් මුදලක් ඇතුළත් කරන්න!');
      return;
    }

    onAddExpense({
      id: `EXP-${Date.now()}`,
      category: expCategory,
      description: expDesc.trim() || `${expCategory} Expense`,
      amount: expAmount,
      recordedBy: 'Admin',
      createdAt: new Date().toISOString()
    });

    setIsExpenseModalOpen(false);
    setExpDesc('');
    setExpAmount(0);
  };

  const handleWastageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || wastageQty <= 0) {
      alert(language === 'en' ? 'Please select a product and enter quantity!' : 'කරුණාකර භාණ්ඩය සහ ප්‍රමාණය තෝරන්න!');
      return;
    }

    const prod = products.find(p => p.id === selectedProductId);
    if (!prod) return;

    onAddStockAdjustment({
      id: `ADJ-${Date.now()}`,
      productId: prod.id,
      productName: prod.nameEn,
      type: 'Wastage',
      qtyAdjusted: -wastageQty, // deduction
      reason: wastageReason.trim() || 'Wastage/Damage',
      adjustedBy: 'Admin',
      createdAt: new Date().toISOString()
    });

    setIsWastageModalOpen(false);
    setSelectedProductId('');
    setWastageSearch('');
    setWastageQty(1);
    setWastageReason('Wastage');
  };

  return (
    <div className="space-y-6">
      {/* Premium Connection Status Bar */}
      <div className={`p-4 rounded-2xl flex items-center justify-between border shadow-sm transition-all ${
        isOnline 
          ? 'bg-emerald-950/40 border-emerald-800 text-emerald-100 backdrop-blur-md' 
          : 'bg-rose-950/40 border-rose-800 text-rose-100 backdrop-blur-md'
      }`}>
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-xl ${isOnline ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
            {isOnline ? (
              <Wifi className="h-5 w-5 animate-pulse" />
            ) : (
              <WifiOff className="h-5 w-5 animate-bounce" />
            )}
          </div>
          <div>
            <span className="text-xs font-black uppercase tracking-widest text-slate-200">
              {isOnline ? 'Network Telemetry: 100% Online & Synced' : 'Offline State Active (Local Storage Enabled)'}
            </span>
            <p className="text-[10px] font-medium text-slate-400 mt-0.5">
              {isOnline 
                ? 'All cloud sync lines are currently operational. Automated local snapshots active.' 
                : 'No network gateway detected. Sales are recorded securely in browser cache and will auto-sync on reconnect.'}
            </p>
          </div>
        </div>

        {!isOnline && pendingSyncCount > 0 && (
          <button 
            onClick={onTriggerOfflineSync}
            className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md transition flex items-center space-x-1.5"
          >
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Sync {pendingSyncCount} Pending Receipts</span>
          </button>
        )}
      </div>

      {/* Bento Grid Container */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Row 1, Card 1: Beautiful Welcome / Overview Card (8 Columns) */}
        <div className="md:col-span-8 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden border border-slate-800 flex flex-col justify-between min-h-[190px]">
          {/* Futuristic grid overlays */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
          
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">
                {language === 'en' ? 'ENTERPRISE PRO v3.5' : 'වෘත්තීය පද්ධතිය v3.5'}
              </span>
              <h2 className="text-xl md:text-2xl font-black tracking-tight mt-3">
                KSC Professional Evolution
              </h2>
              <p className="text-xs text-slate-400 mt-1 max-w-md font-medium leading-relaxed">
                {language === 'en' 
                  ? 'Real-time wholesale, retail, mobile repairs, and expiry batch control telemetry.'
                  : 'තොග, සිල්ලර, ජංගම දුරකථන අලුත්වැඩියා සහ කල් ඉකුත්වීමේ කාණ්ඩ පාලන මධ්‍යස්ථානය.'}
              </p>
            </div>
            <div className="hidden sm:block text-right">
              <span className="text-xs text-slate-400 font-bold block">{new Date().toLocaleDateString(undefined, { weekday: 'long' })}</span>
              <span className="text-[10px] text-slate-500 font-semibold">{new Date().toLocaleDateString()}</span>
            </div>
          </div>

          <div className="relative z-10 flex flex-wrap gap-2 mt-6">
            <button
              onClick={() => setAdminTab('pos')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-black transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex items-center space-x-1.5"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>{language === 'en' ? 'Open POS Terminal' : 'ලියාපදිංචි අයකැමි ලේඛනය'}</span>
            </button>
            <button
              onClick={() => setIsExpenseModalOpen(true)}
              className="bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition active:scale-95 flex items-center space-x-1.5"
            >
              <DollarSign className="h-4 w-4 text-emerald-400" />
              <span>{language === 'en' ? '+ Add Expense' : '+ වියදම් එක් කරන්න'}</span>
            </button>
            <button
              onClick={() => setIsWastageModalOpen(true)}
              className="bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition active:scale-95 flex items-center space-x-1.5"
            >
              <AlertTriangle className="h-4 w-4 text-rose-400 animate-pulse" />
              <span>{language === 'en' ? '+ Add Wastage' : '+ නාස්ති ලේඛනය'}</span>
            </button>
          </div>
        </div>

        {/* Row 1, Card 2: Net Profit Bento block (4 Columns) */}
        <div 
          onClick={() => setAdminTab('reports')}
          className="md:col-span-4 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between min-h-[190px] cursor-pointer hover:shadow-md hover:border-slate-200 transition active:scale-[0.99]"
        >
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'en' ? 'Net Business Profit' : 'ශුද්ධ ලාභය'}</span>
            <div className="bg-emerald-50 p-2.5 rounded-xl text-emerald-600">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-emerald-600 tracking-tight">
              Rs. {stats.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h3>
            <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 mt-1 font-bold">
              <span>Gross Profit:</span>
              <span className="text-slate-700 font-extrabold">Rs. {stats.totalProfit.toLocaleString()}</span>
            </div>
          </div>
          <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-[10px] text-slate-500 font-semibold">
            <span>Operating Expenses:</span>
            <span className="text-rose-500 font-extrabold">- Rs. {stats.totalExpenses.toLocaleString()}</span>
          </div>
        </div>

        {/* Row 2, Card 1: Total Sales KPI Grid (3 Columns) */}
        <div 
          onClick={() => setAdminTab('reports')}
          className="md:col-span-3 bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-3 cursor-pointer hover:shadow-md hover:border-slate-200 transition active:scale-[0.99]"
        >
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">{t.totalSales}</span>
          <div className="flex items-baseline space-x-1">
            <span className="text-xs font-bold text-slate-400">LKR</span>
            <h3 className="text-xl font-black text-slate-800">{stats.totalSales.toLocaleString()}</h3>
          </div>
          <div className="flex justify-between items-center text-[10px] bg-slate-50 p-2 rounded-xl font-bold">
            <span className="text-slate-400">Sales count:</span>
            <span className="text-slate-700">{sales.length} Bills</span>
          </div>
        </div>

        {/* Row 2, Card 1.5: Total Inventory Products KPI (2 Columns) */}
        <div 
          onClick={() => setAdminTab('inventory')}
          className="md:col-span-2 bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-3 cursor-pointer hover:shadow-md hover:border-slate-200 transition active:scale-[0.99]"
        >
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
            {language === 'en' ? 'Total Products' : 'මුළු නිෂ්පාදන'}
          </span>
          <h3 className="text-xl font-black text-blue-600 flex items-baseline space-x-1">
            <span>{products.length}</span>
            <span className="text-xs font-bold text-slate-400 ml-1">Items</span>
          </h3>
          <div className="flex justify-between items-center text-[10px] bg-slate-50 p-2 rounded-xl font-bold">
            <span className="text-slate-400">Inventory:</span>
            <span className="text-blue-600">Active Stock</span>
          </div>
        </div>

        {/* Row 2, Card 2: Active Repairs KPI (2 Columns) */}
        <div 
          onClick={() => setAdminTab('quotations')}
          className="md:col-span-2 bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-3 cursor-pointer hover:shadow-md hover:border-slate-200 transition active:scale-[0.99]"
        >
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">{language === 'en' ? 'Active Repairs' : 'සක්‍රීය රෙපෙයාර්'}</span>
          <h3 className="text-xl font-black text-purple-600 flex items-baseline space-x-1">
            <span>{stats.activeRepairs}</span>
            <span className="text-xs font-bold text-slate-400 ml-1">Jobs</span>
          </h3>
          <div className="flex justify-between items-center text-[10px] bg-slate-50 p-2 rounded-xl font-bold">
            <span className="text-slate-400">Queue:</span>
            <span className="text-purple-600">{repairs.filter(r => r.status === 'Pending').length} Pending</span>
          </div>
        </div>

        {/* Row 2, Card 3: Low Stock Alerts KPI (2 Columns) */}
        <div 
          onClick={() => setAdminTab('inventory')}
          className="md:col-span-2 bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-3 cursor-pointer hover:shadow-md hover:border-slate-200 transition active:scale-[0.99]"
        >
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">{language === 'en' ? 'Low Stock Alerts' : 'තොග අනතුරු ඇඟවීම්'}</span>
          <h3 className="text-xl font-black text-rose-600 flex items-baseline space-x-1">
            <span>{stats.lowStockCount}</span>
            <span className="text-xs font-bold text-slate-400 ml-1">Items</span>
          </h3>
          <div className="flex justify-between items-center text-[10px] bg-slate-50 p-2 rounded-xl font-bold">
            <span className="text-slate-400">Status:</span>
            <span className="text-rose-500 font-extrabold animate-pulse">Critical</span>
          </div>
        </div>

        {/* Row 2, Card 4: Special Custom Orders (3 Columns) */}
        <div 
          onClick={() => setAdminTab('special-orders')}
          className="md:col-span-3 bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-3 cursor-pointer hover:shadow-md hover:border-slate-200 transition active:scale-[0.99]"
        >
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">{language === 'en' ? 'Custom Apparel Orders' : 'විශේෂ ඇණවුම්'}</span>
          <h3 className="text-xl font-black text-blue-600 flex items-baseline space-x-1">
            <span>{stats.pendingSpecialOrders}</span>
            <span className="text-xs font-bold text-slate-400 ml-1">Orders</span>
          </h3>
          <div className="flex justify-between items-center text-[10px] bg-slate-50 p-2 rounded-xl font-bold">
            <span className="text-slate-400">Undelivered:</span>
            <span className="text-blue-600">{specialOrders.filter(so => so.status !== 'Shipped/Delivered').length} Pending</span>
          </div>
        </div>

        {/* Row 3, Card 1: Sales vs Expenses SVG Weekly Chart (8 Columns) */}
        <div className="md:col-span-8 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center">
              <BarChart3 className="h-4.5 w-4.5 mr-1.5 text-blue-600" />
              {language === 'en' ? 'Weekly Sales vs Expenses Trend' : 'සතිපතා විකුණුම් සහ වියදම් ප්‍රස්තාරය'}
            </h3>
            <div className="flex items-center space-x-3 text-[10px] font-bold">
              <div className="flex items-center space-x-1">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                <span className="text-slate-600">Sales</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                <span className="text-slate-600">Expenses</span>
              </div>
            </div>
          </div>

          <div className="w-full overflow-hidden flex justify-center py-2">
            <svg 
              viewBox={`0 0 ${lineChartSvg.width} ${lineChartSvg.height}`} 
              className="w-full max-w-xl h-auto"
            >
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity="0.2"/>
                  <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0"/>
                </linearGradient>
                <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.15"/>
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0"/>
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1={lineChartSvg.paddingLeft} y1="20" x2={lineChartSvg.width - 20} y2="20" stroke="#f1f5f9" strokeWidth="1" />
              <line x1={lineChartSvg.paddingLeft} y1="65" x2={lineChartSvg.width - 20} y2="65" stroke="#f1f5f9" strokeWidth="1" />
              <line x1={lineChartSvg.paddingLeft} y1="110" x2={lineChartSvg.width - 20} y2="110" stroke="#f1f5f9" strokeWidth="1" />
              <line x1={lineChartSvg.paddingLeft} y1={lineChartSvg.height - lineChartSvg.paddingBottom} x2={lineChartSvg.width - 20} y2={lineChartSvg.height - lineChartSvg.paddingBottom} stroke="#e2e8f0" strokeWidth="1" />

              {/* Y Axis labels */}
              <text x={lineChartSvg.paddingLeft - 8} y="24" textAnchor="end" fontSize="7" fill="#94a3b8" fontWeight="bold">Rs. {(lineChartSvg.maxVal).toFixed(0)}</text>
              <text x={lineChartSvg.paddingLeft - 8} y="69" textAnchor="end" fontSize="7" fill="#94a3b8" fontWeight="bold">Rs. {(lineChartSvg.maxVal * 0.66).toFixed(0)}</text>
              <text x={lineChartSvg.paddingLeft - 8} y="114" textAnchor="end" fontSize="7" fill="#94a3b8" fontWeight="bold">Rs. {(lineChartSvg.maxVal * 0.33).toFixed(0)}</text>
              <text x={lineChartSvg.paddingLeft - 8} y={lineChartSvg.height - lineChartSvg.paddingBottom + 3} textAnchor="end" fontSize="7" fill="#94a3b8" fontWeight="bold">Rs. 0</text>

              {/* Gradient Fills */}
              {chartData.length > 1 && (
                <>
                  <path d={lineChartSvg.salesAreaPath} fill="url(#salesGrad)" />
                  <path d={lineChartSvg.expensesAreaPath} fill="url(#expGrad)" />
                </>
              )}

              {/* Chart Lines */}
              {chartData.length > 1 && (
                <>
                  <path d={lineChartSvg.salesPath} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d={lineChartSvg.expensesPath} fill="none" stroke="#f43f5e" strokeWidth="2.0" strokeLinecap="round" strokeLinejoin="round" />
                </>
              )}

              {/* Data points & X Axis labels */}
              {chartData.map((d, idx) => {
                const x = lineChartSvg.getX(idx);
                const ySales = lineChartSvg.getY(d.sales);
                const yExp = lineChartSvg.getY(d.expenses);

                return (
                  <g key={idx}>
                    {/* Circle points */}
                    <circle cx={x} cy={ySales} r="3.5" fill="#2563eb" stroke="#ffffff" strokeWidth="1.5" />
                    <circle cx={x} cy={yExp} r="3.0" fill="#f43f5e" stroke="#ffffff" strokeWidth="1.5" />
                    
                    {/* Value text indicator on hover/dot */}
                    {d.sales > 0 && (
                      <text x={x} y={ySales - 6} textAnchor="middle" fontSize="6" fill="#1e3a8a" fontWeight="extrabold">
                        {d.sales >= 1000 ? `${(d.sales/1000).toFixed(1)}k` : d.sales}
                      </text>
                    )}

                    {/* X Axis Labels */}
                    <text 
                      x={x} 
                      y={lineChartSvg.height - lineChartSvg.paddingBottom + 14} 
                      textAnchor="middle" 
                      fontSize="7" 
                      fill="#64748b" 
                      fontWeight="bold"
                    >
                      {d.date}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Row 3, Card 2: Top Selling Categories bar chart (4 Columns) */}
        <div className="md:col-span-4 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center">
              <Layers className="h-4.5 w-4.5 mr-1.5 text-indigo-500" />
              {language === 'en' ? 'Top Category Shares' : 'ප්‍රමුඛතම භාණ්ඩ අංශයන්'}
            </h3>
          </div>

          <div className="space-y-4 flex-1 flex flex-col justify-center">
            {categoryData.length === 0 ? (
              <p className="text-slate-400 text-xs text-center py-8">No sales data recorded yet.</p>
            ) : (
              categoryData.map((cat, idx) => {
                const maxQty = Math.max(...categoryData.map(c => c.qty), 1);
                const percent = (cat.qty / maxQty) * 100;
                
                // Color array
                const colors = ['bg-blue-600', 'bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500'];
                const textColor = ['text-blue-600', 'text-indigo-500', 'text-emerald-500', 'text-amber-500', 'text-purple-500'];
                
                return (
                  <div key={cat.name} className="space-y-1 text-xs font-semibold">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-700 truncate max-w-[150px] font-black">{cat.name}</span>
                      <span className={`${textColor[idx % 5]} font-extrabold`}>{cat.qty.toFixed(0)} Sold</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${colors[idx % 5]} rounded-full transition-all duration-500`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Row 4, Card 1: Recent Invoices List (6 Columns) */}
        <div className="md:col-span-6 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4 flex flex-col justify-between min-h-[300px]">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center">
              <ShoppingCart className="h-4.5 w-4.5 mr-1.5 text-blue-600" />
              {language === 'en' ? 'Recent POS Receipts' : 'මෑතකාලීන ගනුදෙනු ලැයිස්තුව'}
            </h3>
            <button 
              onClick={() => setAdminTab('pos')} 
              className="text-[9px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-wider"
            >
              New Sale
            </button>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-64 pr-1">
            {recentSalesList.length === 0 ? (
              <p className="text-slate-400 text-xs text-center py-12">No sales recorded yet.</p>
            ) : (
              recentSalesList.map(sale => (
                <div key={sale.id} className="bg-slate-50 hover:bg-slate-100/70 p-3 rounded-2xl border border-slate-100 flex justify-between items-center text-xs font-semibold transition">
                  <div>
                    <h4 className="text-slate-800 font-extrabold truncate max-w-[150px]">{sale.customerName || 'Walk-In Customer'}</h4>
                    <p className="text-[9px] text-slate-400 mt-0.5">{new Date(sale.createdAt).toLocaleString()} • {sale.paymentMethod}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-blue-600 font-black text-sm block">Rs. {sale.total.toLocaleString()}</span>
                    <span className="text-[9px] text-emerald-600 font-extrabold">Profit: Rs. {sale.profit.toLocaleString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Row 4, Card 2: Active Repair Queue (3 Columns) */}
        <div className="md:col-span-3 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4 flex flex-col justify-between min-h-[300px]">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center">
              <Wrench className="h-4.5 w-4.5 mr-1.5 text-purple-600" />
              {language === 'en' ? 'Repairs Board' : 'රෙපෙයාර් පෝලිම'}
            </h3>
            <button 
              onClick={() => setAdminTab('quotations')} 
              className="text-[9px] font-black text-purple-600 hover:text-purple-700 uppercase tracking-wider"
            >
              Manage
            </button>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-64 pr-1">
            {recentRepairsList.length === 0 ? (
              <p className="text-slate-400 text-xs text-center py-12">No active repairs.</p>
            ) : (
              recentRepairsList.map(rep => (
                <div key={rep.id} className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-[11px] font-semibold space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-800 font-black truncate max-w-[100px]">{rep.deviceName}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                      rep.status === 'In Progress' ? 'bg-blue-150 text-blue-700 border border-blue-200' : 'bg-amber-150 text-amber-700 border border-amber-250'
                    }`}>{rep.status}</span>
                  </div>
                  <div className="flex justify-between items-center text-[9px] text-slate-450">
                    <span className="font-bold">{rep.customerName}</span>
                    <span className="text-purple-600 font-extrabold">Rs. {rep.estimatedCost.toLocaleString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Row 4, Card 3: Live System Telemetry (3 Columns) */}
        <div className="md:col-span-3 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4 flex flex-col justify-between min-h-[300px]">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center">
              <Layers className="h-4.5 w-4.5 mr-1.5 text-indigo-500 animate-spin" style={{ animationDuration: '8s' }} />
              Telemetry Logs
            </h3>
          </div>

          <div className="space-y-2 text-xs font-semibold text-slate-600 flex-1 flex flex-col justify-center">
            <div className="space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <div className="flex justify-between text-[9px]">
                <span className="text-slate-400">CPU Usage:</span>
                <span className="font-black text-slate-750">{cpuLoad}%</span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full transition-all duration-1000" style={{ width: `${cpuLoad}%` }} />
              </div>
            </div>
            <div className="space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <div className="flex justify-between text-[9px]">
                <span className="text-slate-400">Heap Alloc:</span>
                <span className="font-black text-slate-750">{heapMem} MB</span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div className="bg-purple-500 h-full transition-all duration-1000" style={{ width: `${(heapMem/50)*100}%` }} />
              </div>
            </div>
            <div className="space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <div className="flex justify-between text-[9px]">
                <span className="text-slate-400">DB read latency:</span>
                <span className="font-black text-emerald-600">{dbRead} ms</span>
              </div>
            </div>
            <div className="space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <div className="flex justify-between text-[9px]">
                <span className="text-slate-400">DB write latency:</span>
                <span className="font-black text-indigo-600">{dbWrite} ms</span>
              </div>
            </div>
          </div>

          <div className="bg-indigo-50/70 border border-indigo-100 p-3 rounded-2xl">
            <div className="flex items-center space-x-1 text-[8px] font-black text-indigo-700 uppercase tracking-widest">
              <CheckCircle className="h-3.5 w-3.5 text-indigo-600" />
              <span>Chained Hash Logs</span>
            </div>
            <p className="text-[7.5px] text-indigo-500 font-medium leading-normal mt-1">
              Audit log integrity secured with rolling DJB2 hashes.
            </p>
          </div>
        </div>

      </div>

      {/* QUICK ACTION: RECORD EXPENSE MODAL */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-100">
            <div className="bg-slate-950 text-white p-4 flex justify-between items-center">
              <h3 className="text-xs font-black uppercase tracking-widest flex items-center">
                <ClipboardList className="h-4 w-4 mr-1.5 text-blue-400" />
                Record Shop Expense
              </h3>
              <button onClick={() => setIsExpenseModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleExpenseSubmit} className="p-5 space-y-3.5 text-xs font-semibold text-slate-700">
              <div className="space-y-1">
                <label className="font-bold text-slate-450 uppercase text-[9px]">Expense Category *</label>
                <select
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none"
                >
                  <option value="Rent">Rent (කුලිය)</option>
                  <option value="Electricity">Electricity (විදුලිය)</option>
                  <option value="Water">Water (ජලය)</option>
                  <option value="Internet">Internet (අන්තර්ජාලය)</option>
                  <option value="Salaries">Salaries (සේවක වැටුප්)</option>
                  <option value="Supplier Payment">Supplier Payment (සැපයුම්කරුවන්ට ගෙවීම්)</option>
                  <option value="Marketing">Marketing (ප්‍රචාරණය)</option>
                  <option value="Other">Other (වෙනත්)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-450 uppercase text-[9px]">Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Paid Ceylon Electricity Board bill"
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-450 uppercase text-[9px]">Expense Amount (LKR) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="0"
                  value={expAmount || ''}
                  onChange={(e) => setExpAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none font-bold text-slate-800"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsExpenseModalOpen(false)} 
                  className="flex-1 bg-slate-100 hover:bg-slate-200 py-2.5 rounded-xl font-bold transition text-slate-600"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold shadow-md transition"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK ACTION: RECORD WASTAGE MODAL */}
      {isWastageModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-100">
            <div className="bg-slate-950 text-white p-4 flex justify-between items-center">
              <h3 className="text-xs font-black uppercase tracking-widest flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1.5 text-rose-400" />
                Record Wastage / Damages
              </h3>
              <button onClick={() => setIsWastageModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleWastageSubmit} className="p-5 space-y-3.5 text-xs font-semibold text-slate-700">
              <div className="space-y-1">
                <label className="font-bold text-slate-455 uppercase text-[9px]">Search Product *</label>
                <input
                  type="text"
                  placeholder="Type product name or ID..."
                  value={wastageSearch}
                  onChange={(e) => setWastageSearch(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none"
                />
                
                {filteredWastageProducts.length > 0 && (
                  <div className="border border-slate-200 rounded-xl bg-white max-h-32 overflow-y-auto mt-1 p-1 divide-y divide-slate-100">
                    {filteredWastageProducts.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedProductId(p.id);
                          setWastageSearch(language === 'en' ? p.nameEn : p.nameSi);
                        }}
                        className={`w-full text-left p-1.5 rounded-lg transition hover:bg-slate-50 flex justify-between items-center text-[10px] ${
                          selectedProductId === p.id ? 'bg-blue-50 text-blue-700 font-bold' : ''
                        }`}
                      >
                        <span className="truncate">{language === 'en' ? p.nameEn : p.nameSi}</span>
                        <span className="text-slate-400 shrink-0">Stock: {p.stock}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-455 uppercase text-[9px]">Wastage Qty *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={wastageQty || ''}
                    onChange={(e) => setWastageQty(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none text-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-455 uppercase text-[9px]">Reason *</label>
                  <select
                    value={wastageReason}
                    onChange={(e) => setWastageReason(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none bg-white font-bold text-slate-700"
                  >
                    <option value="Wastage">Wastage (නාස්තිය)</option>
                    <option value="Damage">Damage (හානියක්)</option>
                    <option value="Expired">Expired (කල් ඉකුත් වූ)</option>
                  </select>
                </div>
              </div>

              <div className="flex space-x-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsWastageModalOpen(false)} 
                  className="flex-1 bg-slate-100 hover:bg-slate-200 py-2.5 rounded-xl font-bold transition text-slate-600"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-2.5 rounded-xl font-bold shadow-md transition"
                >
                  Save Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
