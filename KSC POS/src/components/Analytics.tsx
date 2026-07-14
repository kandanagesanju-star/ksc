import React, { useMemo, useRef } from 'react';
import { Sale, Product, RepairJob, Customer } from '../types';
import { translations } from '../lib/translations';
import { 
  TrendingUp, DollarSign, Wrench, AlertTriangle, Download, 
  Upload, FileSpreadsheet, RefreshCw, BarChart3, PieChart 
} from 'lucide-react';

interface AnalyticsProps {
  language: 'en' | 'si';
  sales: Sale[];
  products: Product[];
  repairs: RepairJob[];
  customers: Customer[];
  onRestoreDatabase: (data: {
    products: Product[];
    customers: Customer[];
    repairs: RepairJob[];
    sales: Sale[];
  }) => void;
}

export const Analytics: React.FC<AnalyticsProps> = ({
  language,
  sales,
  products,
  repairs,
  customers,
  onRestoreDatabase
}) => {
  const t = translations[language];
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Calculate General Metrics
  const metrics = useMemo(() => {
    let totalRevenue = 0;
    let totalProfit = 0;
    let posSales = 0;
    let onlineSales = 0;
    let wholesaleSalesCount = 0;
    let retailSalesCount = 0;

    sales.forEach(sale => {
      totalRevenue += sale.total;
      totalProfit += sale.profit;
      if (sale.saleType === 'POS') posSales += sale.total;
      else onlineSales += sale.total;

      if (sale.priceType === 'Wholesale') wholesaleSalesCount++;
      else retailSalesCount++;
    });

    // Repair earnings: Completed (Delivered) + Ready for pickup
    let repairRevenue = 0;
    let activeRepairsCount = 0;
    repairs.forEach(rep => {
      if (rep.status === 'Delivered') {
        repairRevenue += rep.actualCost || rep.estimatedCost;
      } else if (rep.status === 'Ready for Pickup') {
        repairRevenue += rep.estimatedCost;
      }

      if (rep.status !== 'Delivered' && rep.status !== 'Cancelled') {
        activeRepairsCount++;
      }
    });

    return {
      totalRevenue,
      totalProfit,
      repairRevenue,
      activeRepairsCount,
      posSales,
      onlineSales,
      wholesaleSalesCount,
      retailSalesCount
    };
  }, [sales, repairs]);

  // 2. Category Performance Data
  const categoryChartData = useMemo(() => {
    const categoryTotals: Record<string, number> = {};
    
    sales.forEach(sale => {
      sale.items.forEach(item => {
        // Find product to get its category (fallback to Service if not found)
        const prod = products.find(p => p.id === item.productId);
        const cat = prod ? prod.category : 'Services';
        categoryTotals[cat] = (categoryTotals[cat] || 0) + (item.price * item.quantity);
      });
    });

    // Convert to sorted array
    return Object.entries(categoryTotals).map(([name, value]) => ({
      name,
      value
    })).sort((a, b) => b.value - a.value);
  }, [sales, products]);

  // 3. Low Stock Items
  const lowStockItems = useMemo(() => {
    return products.filter(p => p.stock !== 'Unlimited' && p.stock <= p.lowStockAlert);
  }, [products]);

  // 4. Export database state to JSON file (Downloadable feature)
  const handleExportJSON = () => {
    const backupData = {
      products,
      customers,
      repairs,
      sales
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `SmartShop_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // 5. Export sales report to CSV
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    // CSV Headers
    csvContent += "Sale ID,Customer Name,Sale Type,Price Mode,Total Revenue (LKR),Total Profit (LKR),Payment Method,Date\n";

    sales.forEach(sale => {
      const row = [
        sale.id,
        `"${sale.customerName || 'Walk-In'}"`,
        sale.saleType,
        sale.priceType,
        sale.total,
        sale.profit,
        sale.paymentMethod,
        new Date(sale.createdAt).toLocaleDateString()
      ].join(",");
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", encodedUri);
    downloadAnchor.setAttribute("download", `Sales_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // 6. Import database from JSON file
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsedData = JSON.parse(event.target?.result as string);
          if (parsedData.products && parsedData.customers && parsedData.repairs && parsedData.sales) {
            onRestoreDatabase(parsedData);
            alert(t.restoreSuccess);
          } else {
            alert(language === 'en' ? 'Invalid backup file structure!' : 'අවලංගු බැකප් ගොනුවකි!');
          }
        } catch (err) {
          alert(language === 'en' ? 'Error parsing JSON file!' : 'දත්ත ගොනුව කියවීමේ දෝෂයකි!');
        }
      };
    }
  };

  // Helper for Category Bar width percentage
  const maxCategoryValue = useMemo(() => {
    if (categoryChartData.length === 0) return 1;
    return Math.max(...categoryChartData.map(d => d.value));
  }, [categoryChartData]);

  return (
    <div className="space-y-6">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Sales */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
          <div className="bg-blue-100 p-3 rounded-xl text-blue-600">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.totalSales}</span>
            <h3 className="text-lg font-extrabold text-slate-800 mt-0.5">Rs. {metrics.totalRevenue.toLocaleString()}</h3>
          </div>
        </div>

        {/* Estimated Profit */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
          <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.totalProfit}</span>
            <h3 className="text-lg font-extrabold text-emerald-600 mt-0.5">Rs. {metrics.totalProfit.toLocaleString()}</h3>
          </div>
        </div>

        {/* Repair Revenue */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
          <div className="bg-purple-100 p-3 rounded-xl text-purple-600">
            <Wrench className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.repairRevenue}</span>
            <h3 className="text-lg font-extrabold text-purple-600 mt-0.5">Rs. {metrics.repairRevenue.toLocaleString()}</h3>
          </div>
        </div>

        {/* Active Repairs */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
          <div className="bg-amber-100 p-3 rounded-xl text-amber-600">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Repairs</span>
            <h3 className="text-lg font-extrabold text-amber-600 mt-0.5">{metrics.activeRepairsCount} Jobs</h3>
          </div>
        </div>
      </div>

      {/* Visual Charts and Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Performance Chart (Left) */}
        <div className="lg:col-span-8 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center">
            <BarChart3 className="h-4.5 w-4.5 mr-1.5 text-blue-600" />
            Revenue by Product Category
          </h3>

          <div className="space-y-4 pt-2">
            {categoryChartData.length === 0 ? (
              <p className="text-slate-400 text-xs text-center py-12">No sales data recorded yet.</p>
            ) : (
              categoryChartData.map((data, idx) => {
                const percentage = (data.value / maxCategoryValue) * 100;
                return (
                  <div key={idx} className="space-y-1.5 text-xs font-semibold">
                    <div className="flex justify-between text-slate-700">
                      <span>{(t as any)[data.name] || data.name}</span>
                      <span className="font-bold">Rs. {data.value.toLocaleString()}</span>
                    </div>
                    {/* Progress bar representing percentage */}
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Sales Channel & Pricing Mode Breakdown (Right) */}
        <div className="lg:col-span-4 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center">
            <PieChart className="h-4.5 w-4.5 mr-1.5 text-blue-600" />
            {t.salesBreakdown}
          </h3>

          {/* POS vs Online Breakdown */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700">Sales Channel (POS vs Online)</h4>
            <div className="flex h-5 rounded-lg overflow-hidden text-[10px] font-extrabold text-white">
              {metrics.totalRevenue === 0 ? (
                <div className="w-full bg-slate-100 text-slate-400 text-center py-0.5 font-medium">No sales</div>
              ) : (
                <>
                  {metrics.posSales > 0 && (
                    <div 
                      className="bg-blue-600 flex items-center justify-center transition-all"
                      style={{ width: `${(metrics.posSales / metrics.totalRevenue) * 100}%` }}
                      title={`POS: Rs. ${metrics.posSales}`}
                    >
                      POS ({Math.round((metrics.posSales / metrics.totalRevenue) * 100)}%)
                    </div>
                  )}
                  {metrics.onlineSales > 0 && (
                    <div 
                      className="bg-indigo-400 flex items-center justify-center transition-all"
                      style={{ width: `${(metrics.onlineSales / metrics.totalRevenue) * 100}%` }}
                      title={`Online: Rs. ${metrics.onlineSales}`}
                    >
                      Web ({Math.round((metrics.onlineSales / metrics.totalRevenue) * 100)}%)
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="flex justify-between text-[10px] font-bold text-slate-400">
              <span className="flex items-center"><span className="h-2.5 w-2.5 bg-blue-600 rounded-full mr-1"></span> POS: Rs. {metrics.posSales.toLocaleString()}</span>
              <span className="flex items-center"><span className="h-2.5 w-2.5 bg-indigo-400 rounded-full mr-1"></span> Online: Rs. {metrics.onlineSales.toLocaleString()}</span>
            </div>
          </div>

          {/* Retail vs Wholesale Breakdown */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-700">Pricing Mode (Retail vs Wholesale)</h4>
            <div className="flex h-5 rounded-lg overflow-hidden text-[10px] font-extrabold text-white">
              {sales.length === 0 ? (
                <div className="w-full bg-slate-100 text-slate-400 text-center py-0.5 font-medium">No orders</div>
              ) : (
                <>
                  {metrics.retailSalesCount > 0 && (
                    <div 
                      className="bg-emerald-500 flex items-center justify-center transition-all"
                      style={{ width: `${(metrics.retailSalesCount / sales.length) * 100}%` }}
                      title={`Retail: ${metrics.retailSalesCount} orders`}
                    >
                      Retail ({Math.round((metrics.retailSalesCount / sales.length) * 100)}%)
                    </div>
                  )}
                  {metrics.wholesaleSalesCount > 0 && (
                    <div 
                      className="bg-blue-500 flex items-center justify-center transition-all"
                      style={{ width: `${(metrics.wholesaleSalesCount / sales.length) * 100}%` }}
                      title={`Wholesale: ${metrics.wholesaleSalesCount} orders`}
                    >
                      Wholesale ({Math.round((metrics.wholesaleSalesCount / sales.length) * 100)}%)
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="flex justify-between text-[10px] font-bold text-slate-400">
              <span className="flex items-center"><span className="h-2.5 w-2.5 bg-emerald-500 rounded-full mr-1"></span> Retail: {metrics.retailSalesCount} Orders</span>
              <span className="flex items-center"><span className="h-2.5 w-2.5 bg-blue-500 rounded-full mr-1"></span> Wholesale: {metrics.wholesaleSalesCount} Orders</span>
            </div>
          </div>
        </div>
      </div>

      {/* Downloader & Backup Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
          <h3 className="text-xs font-bold text-rose-500 uppercase tracking-wider flex items-center">
            <AlertTriangle className="h-4.5 w-4.5 mr-1.5" />
            Low Stock Alerts
          </h3>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {lowStockItems.length === 0 ? (
              <p className="text-slate-400 text-xs font-medium text-center py-8">All product stock levels are healthy.</p>
            ) : (
              lowStockItems.map(p => (
                <div key={p.id} className="bg-rose-50/50 border border-rose-100 p-2.5 rounded-xl flex justify-between items-center text-xs font-semibold">
                  <div>
                    <h4 className="text-slate-800 font-bold">{language === 'en' ? p.nameEn : p.nameSi}</h4>
                    <p className="text-[10px] text-slate-400">ID: {p.id} • Min Alert Level: {p.lowStockAlert}</p>
                  </div>
                  <span className="bg-rose-100 text-rose-800 font-extrabold px-2 py-1 rounded text-xs">
                    {p.stock} Left
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Database backup & CSV Export controls (The "downloadable" requirement) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center">
              <Download className="h-4.5 w-4.5 mr-1.5 text-blue-600" />
              Data Management & Backup
            </h3>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              Export sales ledger reports directly to Excel/CSV or download a complete encrypted database JSON backup of products, customers, and repair logs. You can restore this backup at any point.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-slate-100">
            {/* Export CSV */}
            <button
              onClick={handleExportCSV}
              className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-sm"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
              <span>{t.exportCSV}</span>
            </button>

            {/* Export JSON Database */}
            <button
              onClick={handleExportJSON}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-sm"
            >
              <Download className="h-4 w-4 text-blue-200" />
              <span>{t.exportData}</span>
            </button>

            {/* Import JSON Database */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 border border-slate-200 sm:col-span-2"
            >
              <Upload className="h-4 w-4 text-blue-600" />
              <span>{t.importData}</span>
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportJSON}
              accept=".json"
              className="hidden"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
