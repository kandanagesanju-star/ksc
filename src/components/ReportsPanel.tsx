import React, { useState, useMemo } from 'react';
import { generateQrCodeDataUrl } from '../lib/qr';
import { Sale, SaleItem, Expense, RepairJob, Customer, Product, Quotation, RegisterShift, StockAdjustment, ShopSettings, WarrantyReplacement, StockReturn } from '../types';
import { translations } from '../lib/translations';
import { 
  BarChart3, DollarSign, TrendingUp, AlertTriangle, Download, 
  FileSpreadsheet, ClipboardList, PieChart, ShieldAlert, CheckCircle,
  Clock, Award, Layers, Percent, Calendar, Heart, Shield, Package, UserX, UserCheck,
  Printer, Receipt, ChevronDown, Filter, RefreshCw, Eye, X, ArrowRightLeft, Plus, Search
} from 'lucide-react';

interface ReportsPanelProps {
  language: 'en' | 'si';
  sales: Sale[];
  expenses: Expense[];
  repairs: RepairJob[];
  customers: Customer[];
  products: Product[];
  quotations: Quotation[];
  shifts: RegisterShift[];
  stockAdjustments: StockAdjustment[];
  settings: ShopSettings;
  warrantyReplacements?: WarrantyReplacement[];
  onWarrantyReplacement?: (r: WarrantyReplacement) => void;
  onAddStockReturn?: (ret: StockReturn) => void;
  onUpdateSale?: (sale: Sale) => void;
}

export const ReportsPanel: React.FC<ReportsPanelProps> = ({
  language,
  sales,
  expenses,
  repairs,
  customers,
  products,
  quotations,
  shifts,
  stockAdjustments,
  settings,
  warrantyReplacements = [],
  onWarrantyReplacement,
  onAddStockReturn,
  onUpdateSale
}) => {
  const t = translations[language];

  // Report type state
  const [reportType, setReportType] = useState<
    'sales' | 'tax' | 'expenses' | 'profit-loss' | 'stock' | 'dues' | 'estimates' | 'warranty' | 'turnover' | 'shifts' | 'wastage'
  >('sales');

  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [globalStartDate, setGlobalStartDate] = useState('');
  const [globalEndDate, setGlobalEndDate] = useState('');

  const handleReportTypeChange = (key: typeof reportType) => {
    setReportType(key);
    setGlobalSearchTerm('');
    setGlobalStartDate('');
    setGlobalEndDate('');
  };

  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [qrScanInput, setQrScanInput] = useState('');

  // Warranty replacement modal state
  const [showReplacementModal, setShowReplacementModal] = useState(false);
  const [replacementSaleId, setReplacementSaleId] = useState('');
  const [replacementCustomer, setReplacementCustomer] = useState('');
  const [replacementCustomerPhone, setReplacementCustomerPhone] = useState('');
  const [replacementOrigProduct, setReplacementOrigProduct] = useState('');
  const [replacementNewProductId, setReplacementNewProductId] = useState('');
  const [replacementQty, setReplacementQty] = useState(1);
  const [replacementReason, setReplacementReason] = useState('');
  const [replacementHandledBy, setReplacementHandledBy] = useState('Admin');
  const [replacementNotes, setReplacementNotes] = useState('');

  const handleReturnItem = (sale: Sale, item: SaleItem, qty: number) => {
    if (qty <= 0 || qty > item.quantity) {
      alert('Invalid return quantity.');
      return;
    }

    const confirmReturn = confirm(
      language === 'en' 
        ? `Are you sure you want to return ${qty}x "${item.productNameEn}"?\nThis will restore stock and adjust the invoice.` 
        : `මෙම භාණ්ඩයෙන් ${qty} ක් ආපසු ලබා ගැනීමට අවශ්‍යද?\nමෙය තොගය යාවත්කාලීන කර බිල්පත සංශෝධනය කරනු ඇත.`
    );
    if (!confirmReturn) return;

    // 1. Create StockReturn record
    const newRet: StockReturn = {
      id: `RET-SL-${Date.now()}`,
      type: 'Sales Return',
      relatedId: sale.id,
      customerOrSupplierName: sale.customerName || 'Walk-In Customer',
      items: [{
        productId: item.productId,
        productName: item.productNameEn,
        qty: qty,
        refundAmount: item.price * qty
      }],
      totalRefund: item.price * qty,
      reason: `Returned via Invoice Details Scanner — ${sale.id}`,
      createdAt: new Date().toISOString()
    };

    if (onAddStockReturn) {
      onAddStockReturn(newRet);
    }

    // 2. Recalculate sale items
    const updatedItems = sale.items.map(it => {
      if (it.productId === item.productId) {
        return { ...it, quantity: it.quantity - qty };
      }
      return it;
    }).filter(it => it.quantity > 0);

    const subtotal = updatedItems.reduce((acc, it) => acc + (it.price * it.quantity), 0);
    
    // Tax rates from settings
    const vatTotal = sale.vatTotal && sale.vatTotal > 0 ? (subtotal * (settings.vatRate || 15) / 100) : 0;
    const ssclTotal = sale.ssclTotal && sale.ssclTotal > 0 ? (subtotal * (settings.ssclRate || 2.5) / 100) : 0;
    const totalTax = vatTotal + ssclTotal;
    
    const total = Math.max(0, subtotal + totalTax - sale.discount);
    const totalCost = updatedItems.reduce((acc, it) => acc + (it.cost * it.quantity), 0);
    const profit = total - totalCost - totalTax;

    const updatedSale: Sale = {
      ...sale,
      items: updatedItems,
      subtotal,
      vatTotal,
      ssclTotal,
      totalTax,
      total,
      totalCost,
      profit
    };

    if (onUpdateSale) {
      onUpdateSale(updatedSale);
      setSelectedSale(updatedSale);
    }
  };

  const handleReprintReceipt = async (sale: Sale) => {
    const qrUrl = await generateQrCodeDataUrl(`BILL:${sale.id}`);
    const printContent = `
      <!DOCTYPE html><html><head><title>Receipt - ${sale.id}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 11px; width: 80mm; padding: 8px; color: #000; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px; }
        .shop-info { flex: 1; text-align: left; }
        .shop-name { font-size: 13px; font-weight: bold; text-transform: uppercase; margin-bottom: 2px; text-align: left; }
        .shop-detail { font-size: 9px; color: #333; line-height: 1.5; text-align: left; }
        .qr-wrap { flex-shrink: 0; text-align: center; margin-left: 6px; }
        .qr-wrap img { width: 80px; height: 80px; display: block; image-rendering: pixelated; }
        .qr-label { font-size: 7px; color: #666; margin-top: 2px; text-align: center; }
        .bold { font-weight: bold; }
        .sep { border-top: 1px dashed #000; margin: 6px 0; }
        .row { display: flex; justify-content: space-between; margin: 2px 0; }
        .total-row { font-size: 13px; font-weight: bold; border-top: 1px solid #000; padding-top: 4px; margin-top: 4px; }
        .footer { text-align: center; font-size: 9px; color: #333; margin-top: 8px; line-height: 1.3; }
      </style></head><body>
      <div class="header">
        <div class="shop-info">
          <div class="shop-name">${settings.shopName || 'SmartShop'}</div>
          ${settings.shopAddress ? `<div class="shop-detail">${settings.shopAddress}</div>` : ''}
          ${settings.shopPhone ? `<div class="shop-detail">Tel: ${settings.shopPhone}</div>` : ''}
          ${settings.shopEmail ? `<div class="shop-detail">${settings.shopEmail}</div>` : ''}
          ${settings.taxRegistrationNo ? `<div class="shop-detail">Tax Reg: ${settings.taxRegistrationNo}</div>` : ''}
        </div>
        <div class="qr-wrap">
          <img src="${qrUrl}" alt="QR" />
          <div class="qr-label">Scan to verify</div>
        </div>
      </div>
      <div class="sep"></div>
      <div class="row"><span>Bill #:</span><span>${sale.id}</span></div>
      <div class="row"><span>Date:</span><span>${new Date(sale.createdAt).toLocaleString()}</span></div>
      <div class="row"><span>Customer:</span><span>${sale.customerName || 'Walk-In'}</span></div>
      ${sale.cashierName ? `<div class="row"><span>Cashier:</span><span>${sale.cashierName}</span></div>` : ''}
      <div class="row"><span>Payment:</span><span>${sale.paymentMethod === 'Pending' ? 'CREDIT (Unpaid)' : sale.paymentMethod}</span></div>
      <div class="sep"></div>
      <div class="row bold"><span style="flex:2">Item</span><span>Qty</span><span>Amount</span></div>
      <div class="sep"></div>
      ${sale.items.map(item => `
        <div class="row"><span style="flex:2">${language === 'en' ? item.productNameEn : item.productNameSi}</span>
        <span>${item.quantity}${item.isWeighted ? 'kg' : ''}</span>
        <span>Rs.${(item.price * item.quantity).toLocaleString(undefined, {maximumFractionDigits:2})}</span></div>`).join('')}
      <div class="sep"></div>
      <div class="row"><span>Subtotal:</span><span>Rs.${sale.subtotal.toLocaleString()}</span></div>
      ${sale.vatTotal && sale.vatTotal > 0 ? `<div class="row"><span>VAT (${settings.vatRate || 15}%):</span><span>Rs.${sale.vatTotal.toLocaleString(undefined,{maximumFractionDigits:2})}</span></div>` : ''}
      ${sale.ssclTotal && sale.ssclTotal > 0 ? `<div class="row"><span>SSCL (${settings.ssclRate || 2.5}%):</span><span>Rs.${sale.ssclTotal.toLocaleString(undefined,{maximumFractionDigits:2})}</span></div>` : ''}
      ${sale.discount > 0 ? `<div class="row"><span>Discount:</span><span>-Rs.${sale.discount.toLocaleString()}</span></div>` : ''}
      <div class="total-row row"><span>TOTAL:</span><span>Rs.${sale.total.toLocaleString(undefined,{maximumFractionDigits:2})}</span></div>
      <div class="sep"></div>
      <div class="footer">${settings.receiptFooterMessage ? settings.receiptFooterMessage.replace(/\n/g, '<br/>') : 'Thank You! Come Again.<br/>ඔබට ස්තුතියි! නැවත පැමිණෙන්න.'}</div>
      </body></html>`;
    const w = window.open('', '_blank', 'width=420,height=650');
    if (w) { w.document.write(printContent); w.document.close(); w.focus(); setTimeout(() => w.print(), 500); }
  };

  // Calculations
  const metrics = useMemo(() => {
    let totalSales = 0;
    let totalCost = 0;
    let totalProfit = 0;
    let totalTaxCollected = 0;

    sales.forEach(sale => {
      totalSales += sale.total;
      totalCost += sale.totalCost;
      totalProfit += sale.profit;
      totalTaxCollected += sale.totalTax || 0; // Live actual tax
    });

    let totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    let netProfit = totalProfit - totalExpenses;

    return {
      totalSales,
      totalCost,
      totalProfit,
      totalTaxCollected,
      totalExpenses,
      netProfit
    };
  }, [sales, expenses]);

  // 1. Daily Sales
  const dailySales = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todaySales = sales.filter(s => s.createdAt.startsWith(today));
    const total = todaySales.reduce((acc, curr) => acc + curr.total, 0);
    const profit = todaySales.reduce((acc, curr) => acc + curr.profit, 0);
    return {
      count: todaySales.length,
      total,
      profit,
      items: todaySales
    };
  }, [sales]);

  // 2. Stock Levels Report
  const stockMetrics = useMemo(() => {
    const currentLevels = products.map(p => ({
      id: p.id,
      name: p.nameEn,
      nameSi: p.nameSi,
      category: p.category,
      brand: p.brand || 'Generic',
      rack: p.rackLocation || 'Counter',
      stock: p.stock,
      lowAlert: p.lowStockAlert
    }));

    const lowStock = products.filter(p => p.stock !== 'Unlimited' && p.stock <= p.lowStockAlert);

    return {
      currentLevels,
      lowStock
    };
  }, [products]);

  // 3. Debt Management / Customer Dues (Unpaid/Pending sales)
  const customerDues = useMemo(() => {
    const pendingSales = sales.filter(s => s.paymentMethod === 'Pending');
    const totalDues = pendingSales.reduce((acc, curr) => acc + curr.total, 0);
    return {
      totalDues,
      pendingSales
    };
  }, [sales]);

  // 4. Quotations / Issued Estimates
  const quotesMetrics = useMemo(() => {
    const totalValue = quotations.reduce((acc, curr) => acc + curr.total, 0);
    return {
      totalValue,
      list: quotations
    };
  }, [quotations]);

  // 5. Warranty & Item Expiry simulation
  const warrantyMetrics = useMemo(() => {
    const activeWarrantyItems: { saleId: string; customer: string; item: string; expiryDate: string; status: 'Active' | 'Expired' }[] = [];
    
    sales.forEach(sale => {
      sale.items.forEach(item => {
        const prod = products.find(p => p.id === item.productId);
        if (prod && (prod.category === 'Computer Parts' || prod.category === 'Phone Accessories' || prod.category === 'Electric Items')) {
          const purchaseDate = new Date(sale.createdAt);
          const expiryDate = new Date(purchaseDate.setMonth(purchaseDate.getMonth() + 6));
          const isExpired = expiryDate < new Date();
          
          activeWarrantyItems.push({
            saleId: sale.id,
            customer: sale.customerName || 'Walk-In',
            item: item.productNameEn,
            expiryDate: expiryDate.toISOString().split('T')[0],
            status: isExpired ? 'Expired' : 'Active'
          });
        }
      });
    });

    const active = activeWarrantyItems.filter(w => w.status === 'Active');
    const expired = activeWarrantyItems.filter(w => w.status === 'Expired');

    return {
      all: activeWarrantyItems,
      active,
      expired
    };
  }, [sales, products]);

  // 6. Slow Moving vs Top Selling Items
  const turnoverMetrics = useMemo(() => {
    const itemSalesCount: Record<string, { name: string; qty: number; totalRev: number }> = {};
    
    products.forEach(p => {
      itemSalesCount[p.id] = { name: p.nameEn, qty: 0, totalRev: 0 };
    });

    sales.forEach(sale => {
      sale.items.forEach(item => {
        if (itemSalesCount[item.productId]) {
          itemSalesCount[item.productId].qty += item.quantity;
          itemSalesCount[item.productId].totalRev += (item.price * item.quantity);
        } else {
          itemSalesCount[item.productId] = { name: item.productNameEn, qty: item.quantity, totalRev: item.price * item.quantity };
        }
      });
    });

    const list = Object.entries(itemSalesCount).map(([id, val]) => ({
      id,
      ...val
    })).sort((a, b) => b.qty - a.qty);

    const topSelling = list.filter(item => item.qty > 0).slice(0, 5);
    const slowMoving = list.filter(item => item.qty === 0).slice(0, 5);

    return {
      topSelling,
      slowMoving
    };
  }, [sales, products]);

  // Filtered lists for Reports
  const filteredSalesList = useMemo(() => {
    return sales.filter(sale => {
      const idMatch = sale.id.toLowerCase().includes(globalSearchTerm.toLowerCase());
      const customerMatch = (sale.customerName || 'Walk-In Customer').toLowerCase().includes(globalSearchTerm.toLowerCase());
      const custObj = customers.find(c => c.id === sale.customerId || (sale.customerName && c.name === sale.customerName));
      const phoneMatch = custObj ? custObj.phone.includes(globalSearchTerm) : false;
      const cashierMatch = sale.cashierName ? sale.cashierName.toLowerCase().includes(globalSearchTerm.toLowerCase()) : false;
      const itemsMatch = sale.items.some(item => {
        const nMatch = item.productNameEn.toLowerCase().includes(globalSearchTerm.toLowerCase()) || 
                      item.productNameSi.toLowerCase().includes(globalSearchTerm.toLowerCase());
        const idMatch = item.productId.toLowerCase().includes(globalSearchTerm.toLowerCase());
        return nMatch || idMatch;
      });

      const textMatch = idMatch || customerMatch || phoneMatch || cashierMatch || itemsMatch;
      if (!textMatch && globalSearchTerm) return false;

      if (globalStartDate) {
        const sDate = new Date(sale.createdAt).toISOString().split('T')[0];
        if (sDate < globalStartDate) return false;
      }
      if (globalEndDate) {
        const sDate = new Date(sale.createdAt).toISOString().split('T')[0];
        if (sDate > globalEndDate) return false;
      }
      return true;
    });
  }, [sales, customers, globalSearchTerm, globalStartDate, globalEndDate]);

  const filteredExpensesList = useMemo(() => {
    return expenses.filter(exp => {
      const idMatch = exp.id.toLowerCase().includes(globalSearchTerm.toLowerCase());
      const categoryMatch = exp.category.toLowerCase().includes(globalSearchTerm.toLowerCase());
      const descMatch = exp.description.toLowerCase().includes(globalSearchTerm.toLowerCase());
      const textMatch = idMatch || categoryMatch || descMatch;
      if (!textMatch && globalSearchTerm) return false;

      if (globalStartDate) {
        const eDate = new Date(exp.createdAt).toISOString().split('T')[0];
        if (eDate < globalStartDate) return false;
      }
      if (globalEndDate) {
        const eDate = new Date(exp.createdAt).toISOString().split('T')[0];
        if (eDate > globalEndDate) return false;
      }
      return true;
    });
  }, [expenses, globalSearchTerm, globalStartDate, globalEndDate]);

  const filteredPLMetrics = useMemo(() => {
    let salesCount = 0;
    let totalSales = 0;
    let totalCost = 0;
    let totalProfit = 0;
    let totalTaxCollected = 0;

    filteredSalesList.forEach(sale => {
      salesCount++;
      totalSales += sale.total;
      totalCost += sale.totalCost;
      totalProfit += sale.profit;
      totalTaxCollected += sale.totalTax || 0;
    });

    let totalExpenses = filteredExpensesList.reduce((acc, curr) => acc + curr.amount, 0);
    let netProfit = totalProfit - totalExpenses;

    return {
      salesCount,
      totalSales,
      totalCost,
      totalProfit,
      totalTaxCollected,
      totalExpenses,
      netProfit
    };
  }, [filteredSalesList, filteredExpensesList]);

  const filteredStockLevels = useMemo(() => {
    return stockMetrics.currentLevels.filter(item => {
      const idMatch = item.id.toLowerCase().includes(globalSearchTerm.toLowerCase());
      const nameMatch = item.name.toLowerCase().includes(globalSearchTerm.toLowerCase()) || 
                        item.nameSi.toLowerCase().includes(globalSearchTerm.toLowerCase());
      const categoryMatch = item.category.toLowerCase().includes(globalSearchTerm.toLowerCase());
      const brandMatch = item.brand.toLowerCase().includes(globalSearchTerm.toLowerCase());
      const rackMatch = item.rack.toLowerCase().includes(globalSearchTerm.toLowerCase());

      const textMatch = idMatch || nameMatch || categoryMatch || brandMatch || rackMatch;
      if (!textMatch && globalSearchTerm) return false;
      return true;
    });
  }, [stockMetrics.currentLevels, globalSearchTerm]);

  const filteredCustomerDuesList = useMemo(() => {
    return customerDues.pendingSales.filter(sale => {
      const idMatch = sale.id.toLowerCase().includes(globalSearchTerm.toLowerCase());
      const customerMatch = (sale.customerName || 'Walk-In Customer').toLowerCase().includes(globalSearchTerm.toLowerCase());
      const custObj = customers.find(c => c.id === sale.customerId || (sale.customerName && c.name === sale.customerName));
      const phoneMatch = custObj ? custObj.phone.includes(globalSearchTerm) : false;
      const textMatch = idMatch || customerMatch || phoneMatch;
      if (!textMatch && globalSearchTerm) return false;

      if (globalStartDate) {
        const sDate = new Date(sale.createdAt).toISOString().split('T')[0];
        if (sDate < globalStartDate) return false;
      }
      if (globalEndDate) {
        const sDate = new Date(sale.createdAt).toISOString().split('T')[0];
        if (sDate > globalEndDate) return false;
      }
      return true;
    });
  }, [customerDues.pendingSales, customers, globalSearchTerm, globalStartDate, globalEndDate]);

  const filteredEstimatesList = useMemo(() => {
    return quotesMetrics.list.filter(quote => {
      const idMatch = quote.id.toLowerCase().includes(globalSearchTerm.toLowerCase());
      const customerMatch = quote.customerName.toLowerCase().includes(globalSearchTerm.toLowerCase());
      const phoneMatch = quote.customerPhone ? quote.customerPhone.includes(globalSearchTerm) : false;
      const itemsMatch = quote.items.some(item => {
        return item.description.toLowerCase().includes(globalSearchTerm.toLowerCase());
      });

      const textMatch = idMatch || customerMatch || phoneMatch || itemsMatch;
      if (!textMatch && globalSearchTerm) return false;

      if (globalStartDate) {
        const qDate = new Date(quote.createdAt).toISOString().split('T')[0];
        if (qDate < globalStartDate) return false;
      }
      if (globalEndDate) {
        const qDate = new Date(quote.createdAt).toISOString().split('T')[0];
        if (qDate > globalEndDate) return false;
      }
      return true;
    });
  }, [quotesMetrics.list, globalSearchTerm, globalStartDate, globalEndDate]);

  const filteredWarrantyItems = useMemo(() => {
    return warrantyMetrics.all.filter(w => {
      const saleIdMatch = w.saleId.toLowerCase().includes(globalSearchTerm.toLowerCase());
      const customerMatch = w.customer.toLowerCase().includes(globalSearchTerm.toLowerCase());
      const itemMatch = w.item.toLowerCase().includes(globalSearchTerm.toLowerCase());
      const textMatch = saleIdMatch || customerMatch || itemMatch;
      if (!textMatch && globalSearchTerm) return false;

      if (globalStartDate && w.expiryDate < globalStartDate) return false;
      if (globalEndDate && w.expiryDate > globalEndDate) return false;
      return true;
    });
  }, [warrantyMetrics.all, globalSearchTerm, globalStartDate, globalEndDate]);

  const filteredReplacements = useMemo(() => {
    return warrantyReplacements.filter(r => {
      const idMatch = r.originalSaleId.toLowerCase().includes(globalSearchTerm.toLowerCase());
      const customerMatch = r.customerName.toLowerCase().includes(globalSearchTerm.toLowerCase());
      const phoneMatch = r.customerPhone ? r.customerPhone.includes(globalSearchTerm) : false;
      const itemMatch = r.originalProductName.toLowerCase().includes(globalSearchTerm.toLowerCase()) || 
                        r.replacementProductName.toLowerCase().includes(globalSearchTerm.toLowerCase());
      const reasonMatch = r.reason.toLowerCase().includes(globalSearchTerm.toLowerCase());

      const textMatch = idMatch || customerMatch || phoneMatch || itemMatch || reasonMatch;
      if (!textMatch && globalSearchTerm) return false;

      if (globalStartDate) {
        const rDate = new Date(r.createdAt).toISOString().split('T')[0];
        if (rDate < globalStartDate) return false;
      }
      if (globalEndDate) {
        const rDate = new Date(r.createdAt).toISOString().split('T')[0];
        if (rDate > globalEndDate) return false;
      }
      return true;
    });
  }, [warrantyReplacements, globalSearchTerm, globalStartDate, globalEndDate]);

  const filteredTurnoverMetrics = useMemo(() => {
    const itemSalesCount: Record<string, { name: string; qty: number; totalRev: number }> = {};
    products.forEach(p => {
      itemSalesCount[p.id] = { name: p.nameEn, qty: 0, totalRev: 0 };
    });

    filteredSalesList.forEach(sale => {
      sale.items.forEach(item => {
        if (itemSalesCount[item.productId]) {
          itemSalesCount[item.productId].qty += item.quantity;
          itemSalesCount[item.productId].totalRev += (item.price * item.quantity);
        } else {
          itemSalesCount[item.productId] = { name: item.productNameEn, qty: item.quantity, totalRev: item.price * item.quantity };
        }
      });
    });

    const list = Object.entries(itemSalesCount).map(([id, val]) => ({
      id,
      ...val
    })).sort((a, b) => b.qty - a.qty);

    const searchedList = list.filter(item => {
      if (!globalSearchTerm) return true;
      return item.id.toLowerCase().includes(globalSearchTerm.toLowerCase()) || 
             item.name.toLowerCase().includes(globalSearchTerm.toLowerCase());
    });

    const topSelling = searchedList.filter(item => item.qty > 0).slice(0, 5);
    const slowMoving = searchedList.filter(item => item.qty === 0).slice(0, 5);

    return {
      topSelling,
      slowMoving
    };
  }, [filteredSalesList, products, globalSearchTerm]);

  const filteredShiftsList = useMemo(() => {
    return shifts.filter(s => {
      const idMatch = s.id.toLowerCase().includes(globalSearchTerm.toLowerCase());
      const cashierMatch = s.cashierName.toLowerCase().includes(globalSearchTerm.toLowerCase());
      const statusMatch = s.status.toLowerCase().includes(globalSearchTerm.toLowerCase());
      const textMatch = idMatch || cashierMatch || statusMatch;
      if (!textMatch && globalSearchTerm) return false;

      if (globalStartDate) {
        const sDate = new Date(s.openedAt).toISOString().split('T')[0];
        if (sDate < globalStartDate) return false;
      }
      if (globalEndDate) {
        const sDate = new Date(s.openedAt).toISOString().split('T')[0];
        if (sDate > globalEndDate) return false;
      }
      return true;
    });
  }, [shifts, globalSearchTerm, globalStartDate, globalEndDate]);

  const filteredWastageList = useMemo(() => {
    const baseWastage = stockAdjustments.filter(adj => adj.type === 'Wastage');
    return baseWastage.filter(adj => {
      const idMatch = adj.id.toLowerCase().includes(globalSearchTerm.toLowerCase());
      const prodNameMatch = adj.productName.toLowerCase().includes(globalSearchTerm.toLowerCase());
      const prodIdMatch = adj.productId.toLowerCase().includes(globalSearchTerm.toLowerCase());
      const reasonMatch = adj.reason.toLowerCase().includes(globalSearchTerm.toLowerCase());
      const textMatch = idMatch || prodNameMatch || prodIdMatch || reasonMatch;
      if (!textMatch && globalSearchTerm) return false;

      if (globalStartDate) {
        const adjDate = new Date(adj.createdAt).toISOString().split('T')[0];
        if (adjDate < globalStartDate) return false;
      }
      if (globalEndDate) {
        const adjDate = new Date(adj.createdAt).toISOString().split('T')[0];
        if (adjDate > globalEndDate) return false;
      }
      return true;
    });
  }, [stockAdjustments, globalSearchTerm, globalStartDate, globalEndDate]);

  // Sri Lankan Live Taxable Sales Filter
  const taxableSales = useMemo(() => {
    return sales.filter(s => s.totalTax > 0);
  }, [sales]);

  // Tax period filter state
  const [taxPeriod, setTaxPeriod] = useState<'current-month' | 'last-month' | 'quarter' | 'all'>('current-month');

  // Filtered taxable sales by period and global search filters
  const filteredTaxSales = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed

    return taxableSales.filter(s => {
      const saleDate = new Date(s.createdAt);
      
      // 1. Period filter
      let periodMatch = true;
      if (taxPeriod === 'current-month') {
        periodMatch = saleDate.getFullYear() === currentYear && saleDate.getMonth() === currentMonth;
      } else if (taxPeriod === 'last-month') {
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        periodMatch = saleDate.getFullYear() === lastMonthYear && saleDate.getMonth() === lastMonth;
      } else if (taxPeriod === 'quarter') {
        const quarterStart = new Date(currentYear, Math.floor(currentMonth / 3) * 3, 1);
        periodMatch = saleDate >= quarterStart;
      }
      if (!periodMatch) return false;

      // 2. Global search match
      const idMatch = s.id.toLowerCase().includes(globalSearchTerm.toLowerCase());
      const customerMatch = (s.customerName || 'Walk-In Customer').toLowerCase().includes(globalSearchTerm.toLowerCase());
      const custObj = customers.find(c => c.id === s.customerId || (s.customerName && c.name === s.customerName));
      const phoneMatch = custObj ? custObj.phone.includes(globalSearchTerm) : false;
      const itemsMatch = s.items.some(item => {
        const nMatch = item.productNameEn.toLowerCase().includes(globalSearchTerm.toLowerCase()) || 
                      item.productNameSi.toLowerCase().includes(globalSearchTerm.toLowerCase());
        const idMatch = item.productId.toLowerCase().includes(globalSearchTerm.toLowerCase());
        return nMatch || idMatch;
      });

      const textMatch = idMatch || customerMatch || phoneMatch || itemsMatch;
      if (!textMatch && globalSearchTerm) return false;

      // 3. Date range match
      if (globalStartDate) {
        const sDate = saleDate.toISOString().split('T')[0];
        if (sDate < globalStartDate) return false;
      }
      if (globalEndDate) {
        const sDate = saleDate.toISOString().split('T')[0];
        if (sDate > globalEndDate) return false;
      }

      return true;
    });
  }, [taxableSales, taxPeriod, customers, globalSearchTerm, globalStartDate, globalEndDate]);

  // Tax summary metrics
  const taxSummary = useMemo(() => {
    const totalVAT = filteredTaxSales.reduce((acc, s) => acc + (s.vatTotal || 0), 0);
    const totalSSCL = filteredTaxSales.reduce((acc, s) => acc + (s.ssclTotal || 0), 0);
    const totalTax = filteredTaxSales.reduce((acc, s) => acc + (s.totalTax || 0), 0);
    const taxableRevenue = filteredTaxSales.reduce((acc, s) => acc + s.total, 0);
    const invoiceCount = filteredTaxSales.length;

    // Group by month for monthly breakdown
    const monthlyBreakdown: Record<string, { vatTotal: number; ssclTotal: number; combinedTax: number; invoices: number; revenue: number }> = {};
    filteredTaxSales.forEach(s => {
      const d = new Date(s.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('default', { month: 'long', year: 'numeric' });
      if (!monthlyBreakdown[key]) {
        monthlyBreakdown[key] = { vatTotal: 0, ssclTotal: 0, combinedTax: 0, invoices: 0, revenue: 0 };
      }
      monthlyBreakdown[key].vatTotal += (s.vatTotal || 0);
      monthlyBreakdown[key].ssclTotal += (s.ssclTotal || 0);
      monthlyBreakdown[key].combinedTax += (s.totalTax || 0);
      monthlyBreakdown[key].invoices += 1;
      monthlyBreakdown[key].revenue += s.total;
    });

    const monthlyList = Object.entries(monthlyBreakdown)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, data]) => {
        const [year, month] = key.split('-');
        const label = new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
        return { key, label, ...data };
      });

    return { totalVAT, totalSSCL, totalTax, taxableRevenue, invoiceCount, monthlyList };
  }, [filteredTaxSales]);

  const taxPeriodLabel = () => {
    const now = new Date();
    if (taxPeriod === 'current-month') return now.toLocaleString('default', { month: 'long', year: 'numeric' });
    if (taxPeriod === 'last-month') {
      const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return lm.toLocaleString('default', { month: 'long', year: 'numeric' });
    }
    if (taxPeriod === 'quarter') {
      const qStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      return `Q${Math.floor(now.getMonth() / 3) + 1} ${now.getFullYear()} (from ${qStart.toLocaleDateString()})`;
    }
    return 'All Time';
  };

  // Export reports to CSV helper
  const handleExportCSV = (type: string) => {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    if (type === 'sales') {
      csvContent += "Invoice ID,Customer,Total (LKR),Profit (LKR),Type,Date\n";
      sales.forEach(s => {
        csvContent += `${s.id},"${s.customerName || 'Walk-In'}",${s.total},${s.profit},${s.saleType},${new Date(s.createdAt).toLocaleDateString()}\n`;
      });
    } else if (type === 'expenses') {
      csvContent += "Expense ID,Category,Description,Amount (LKR),Date\n";
      expenses.forEach(e => {
        csvContent += `${e.id},${e.category},"${e.description}",${e.amount},${new Date(e.createdAt).toLocaleDateString()}\n`;
      });
    } else if (type === 'tax') {
      csvContent += "Invoice No,Date,Customer,Taxable Value (LKR),VAT 15% (LKR),SSCL 2.5% (LKR),Total Tax (LKR),Invoice Total (LKR)\n";
      filteredTaxSales.forEach(s => {
        const taxableValue = s.total - (s.totalTax || 0);
        csvContent += `${s.id},${new Date(s.createdAt).toLocaleDateString()},"${s.customerName || 'Walk-In Customer'}",${taxableValue.toFixed(2)},${(s.vatTotal || 0).toFixed(2)},${(s.ssclTotal || 0).toFixed(2)},${(s.totalTax || 0).toFixed(2)},${s.total.toFixed(2)}\n`;
      });
      // Add summary rows
      csvContent += `\n,,TOTAL,${(taxSummary.taxableRevenue - taxSummary.totalTax).toFixed(2)},${taxSummary.totalVAT.toFixed(2)},${taxSummary.totalSSCL.toFixed(2)},${taxSummary.totalTax.toFixed(2)},${taxSummary.taxableRevenue.toFixed(2)}\n`;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${type}_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handlePrintTaxReport = () => {
    const periodLabel = taxPeriodLabel();
    const now = new Date();
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Tax Report - ${periodLabel}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; font-size: 11px; color: #111; padding: 20px; }
          h1 { font-size: 16px; font-weight: bold; text-align: center; margin-bottom: 2px; }
          h2 { font-size: 13px; text-align: center; margin-bottom: 2px; color: #333; }
          .meta { font-size: 10px; text-align: center; color: #666; margin-bottom: 16px; }
          .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 14px 0; }
          .summary-card { border: 1px solid #ccc; padding: 10px; border-radius: 6px; text-align: center; }
          .summary-card .label { font-size: 9px; text-transform: uppercase; color: #666; letter-spacing: 0.5px; }
          .summary-card .value { font-size: 14px; font-weight: bold; margin-top: 3px; }
          .summary-card.vat .value { color: #1d4ed8; }
          .summary-card.sscl .value { color: #7c3aed; }
          .summary-card.total .value { color: #b45309; }
          .summary-card.revenue .value { color: #065f46; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 10px; }
          th { background: #1e293b; color: white; padding: 7px 8px; text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; }
          th.right, td.right { text-align: right; }
          td { padding: 6px 8px; border-bottom: 1px solid #e5e7eb; }
          tr:nth-child(even) td { background: #f8fafc; }
          .tfoot td { font-weight: bold; background: #f1f5f9; border-top: 2px solid #334155; }
          .monthly-section { margin-top: 20px; }
          .monthly-section h3 { font-size: 11px; font-weight: bold; color: #334155; margin-bottom: 6px; padding-bottom: 4px; border-bottom: 1px solid #cbd5e1; }
          .note { font-size: 9px; color: #666; margin-top: 14px; padding-top: 10px; border-top: 1px dashed #ccc; }
          @media print { body { padding: 10px; } }
        </style>
      </head>
      <body>
        <h1>VAT & SSCL Tax Report</h1>
        <h2>Period: ${periodLabel}</h2>
        <div class="meta">Generated on: ${now.toLocaleString()} &nbsp;|&nbsp; Total Taxable Invoices: ${taxSummary.invoiceCount}</div>

        <div class="summary-grid">
          <div class="summary-card vat">
            <div class="label">VAT Collected (15%)</div>
            <div class="value">Rs. ${taxSummary.totalVAT.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
          <div class="summary-card sscl">
            <div class="label">SSCL Collected (2.5%)</div>
            <div class="value">Rs. ${taxSummary.totalSSCL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
          <div class="summary-card total">
            <div class="label">Total Tax Liability</div>
            <div class="value">Rs. ${taxSummary.totalTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
          <div class="summary-card revenue">
            <div class="label">Taxable Revenue</div>
            <div class="value">Rs. ${taxSummary.taxableRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
        </div>

        ${taxSummary.monthlyList.length > 1 ? `
        <div class="monthly-section">
          <h3>Monthly Tax Breakdown</h3>
          <table>
            <thead>
              <tr>
                <th>Month</th>
                <th>Invoices</th>
                <th class="right">Taxable Revenue (LKR)</th>
                <th class="right">VAT 15% (LKR)</th>
                <th class="right">SSCL 2.5% (LKR)</th>
                <th class="right">Combined Tax (LKR)</th>
              </tr>
            </thead>
            <tbody>
              ${taxSummary.monthlyList.map(m => `
              <tr>
                <td>${m.label}</td>
                <td>${m.invoices}</td>
                <td class="right">${m.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td class="right">${m.vatTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td class="right">${m.ssclTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td class="right">${m.combinedTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>` : ''}

        <div class="monthly-section">
          <h3>Taxable Transaction Ledger</h3>
          <table>
            <thead>
              <tr>
                <th>Invoice No.</th>
                <th>Date</th>
                <th>Customer</th>
                <th class="right">Taxable Value (LKR)</th>
                <th class="right">VAT 15% (LKR)</th>
                <th class="right">SSCL 2.5% (LKR)</th>
                <th class="right">Total Tax (LKR)</th>
                <th class="right">Invoice Total (LKR)</th>
              </tr>
            </thead>
            <tbody>
              ${filteredTaxSales.map(s => {
                const taxableVal = s.total - (s.totalTax || 0);
                return `
              <tr>
                <td>${s.id}</td>
                <td>${new Date(s.createdAt).toLocaleDateString()}</td>
                <td>${s.customerName || 'Walk-In Customer'}</td>
                <td class="right">${taxableVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td class="right">${(s.vatTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td class="right">${(s.ssclTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td class="right">${(s.totalTax || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td class="right">${s.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>`;
              }).join('')}
            </tbody>
            <tfoot>
              <tr class="tfoot">
                <td colspan="3">TOTAL</td>
                <td class="right">${(taxSummary.taxableRevenue - taxSummary.totalTax).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td class="right">${taxSummary.totalVAT.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td class="right">${taxSummary.totalSSCL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td class="right">${taxSummary.totalTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td class="right">${taxSummary.taxableRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div class="note">
          <b>Note:</b> This report is prepared based on recorded sales transactions. VAT is levied at 15% and SSCL (Social Security Contribution Levy) at 2.5% on eligible goods and services as per Sri Lanka IRD regulations.<br/>
          Please verify with your tax consultant before filing with the Inland Revenue Department.
        </div>
      </body>
      </html>
    `;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 500);
    }
  };

  const reportTabs = [
    { key: 'sales' as const,       label: 'Sales Reports',            labelSi: 'විකුණුම් වාර්තා',     icon: TrendingUp,    color: 'text-blue-600',   bg: 'bg-blue-50' },
    { key: 'tax' as const,         label: 'Tax Reports (SSCL/VAT)',   labelSi: 'බදු වාර්තා',           icon: ShieldAlert,   color: 'text-violet-600', bg: 'bg-violet-50' },
    { key: 'expenses' as const,    label: 'Expenses',                 labelSi: 'වියදම්',               icon: ClipboardList, color: 'text-rose-600',   bg: 'bg-rose-50' },
    { key: 'profit-loss' as const, label: 'Profit & Loss Statement',  labelSi: 'ලාභ සහ අලාභ',          icon: DollarSign,    color: 'text-emerald-600',bg: 'bg-emerald-50' },
    { key: 'stock' as const,       label: 'Stock Report',             labelSi: 'තොග වාර්තාව',          icon: Package,       color: 'text-amber-600',  bg: 'bg-amber-50' },
    { key: 'dues' as const,        label: 'Customer Dues',            labelSi: 'ණය කළමනාකරණය',        icon: UserX,         color: 'text-red-600',    bg: 'bg-red-50' },
    { key: 'estimates' as const,   label: 'Issued Estimates',         labelSi: 'නිකුත් කළ ඇස්තමේන්තු', icon: FileSpreadsheet,color: 'text-cyan-600',  bg: 'bg-cyan-50' },
    { key: 'warranty' as const,    label: 'Warranty Tracking',        labelSi: 'වගකීම් නිරීක්ෂණය',    icon: Shield,        color: 'text-teal-600',   bg: 'bg-teal-50' },
    { key: 'turnover' as const,    label: 'Turnover Analysis',        labelSi: 'පිරිවැටුම් විශ්ලේෂණය', icon: PieChart,      color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { key: 'shifts' as const,      label: 'Z-Reports (Shifts)',       labelSi: 'Z-වාර්තා',             icon: Clock,         color: 'text-slate-600',  bg: 'bg-slate-100' },
    { key: 'wastage' as const,     label: 'Wastage Loss Report',      labelSi: 'නාස්ති වාර්තාව',       icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  const activeTab = reportTabs.find(t => t.key === reportType)!;

  return (
    <div className="flex flex-col md:flex-row gap-0 min-h-[70vh]">
      {/* ── LEFT SIDEBAR NAV ── */}
      <aside className="w-full md:w-52 shrink-0 bg-white border-b md:border-b-0 md:border-r border-slate-100 rounded-t-2xl md:rounded-t-none md:rounded-l-2xl shadow-sm flex flex-col">
        <div className="px-4 pt-4 pb-2">
          <p className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400">
            {language === 'en' ? 'Report Modules' : 'වාර්තා මොඩියුල'}
          </p>
        </div>
        <nav className="flex flex-row md:flex-col overflow-x-auto md:overflow-y-auto whitespace-nowrap px-4 py-3 md:px-2 md:pb-4 space-x-2 md:space-x-0 md:space-y-0.5 scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {reportTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = reportType === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => handleReportTypeChange(tab.key)}
                className={`shrink-0 w-auto md:w-full flex items-center gap-2.5 px-3 py-2 md:py-2.5 rounded-xl text-left transition-all duration-150 group ${
                  isActive
                    ? `${tab.bg} ${tab.color} shadow-sm font-extrabold`
                    : 'text-slate-600 hover:bg-slate-50 font-semibold hover:text-slate-800'
                }`}
              >
                <span className={`shrink-0 p-1 rounded-lg transition-colors ${
                  isActive ? `${tab.bg} ${tab.color}` : 'text-slate-400 group-hover:text-slate-600'
                }`}>
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span className="text-[11px] leading-tight">
                  {language === 'en' ? tab.label : tab.labelSi}
                </span>
                {isActive && (
                  <span className="ml-auto w-1 h-4 rounded-full bg-current opacity-60 hidden md:inline-block" />
                )}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* ── RIGHT CONTENT AREA ── */}
      <div className="flex-1 min-w-0 bg-slate-50/50 rounded-r-2xl overflow-hidden">
        {/* Top title bar */}
        <div className="bg-white border-b border-slate-100 px-6 py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className={`p-1.5 rounded-lg ${activeTab.bg} ${activeTab.color}`}>
              <activeTab.icon className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-sm font-extrabold text-slate-800">
                {language === 'en' ? activeTab.label : activeTab.labelSi}
              </h3>
              <p className="text-[10px] text-slate-400 font-medium">
                {language === 'en' ? 'Live data from your store records' : 'ඔබේ ගබඩා වාර්තාවලින් සජීවී දත්ත'}
              </p>
            </div>
          </div>
          
          {/* Universal Search & Date Filter Bar inside the Top Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full lg:w-auto">
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder={language === 'en' ? 'Search by phone, name, bill #, barcode...' : 'නම, අංකය, බිල් අංකය, බාකෝඩ් මගින් සොයන්න...'}
                value={globalSearchTerm}
                onChange={(e) => setGlobalSearchTerm(e.target.value)}
                className="w-full pl-8 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 text-[11px] font-semibold text-slate-500">
                <Calendar className="h-3 w-3 text-slate-450" />
                <span>{language === 'en' ? 'From' : 'සිට'}:</span>
                <input
                  type="date"
                  value={globalStartDate}
                  onChange={(e) => setGlobalStartDate(e.target.value)}
                  className="bg-transparent border-none p-0 focus:outline-none text-[11px] font-bold text-slate-700 cursor-pointer text-xs"
                />
              </div>
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 text-[11px] font-semibold text-slate-500">
                <Calendar className="h-3 w-3 text-slate-450" />
                <span>{language === 'en' ? 'To' : 'දක්වා'}:</span>
                <input
                  type="date"
                  value={globalEndDate}
                  onChange={(e) => setGlobalEndDate(e.target.value)}
                  className="bg-transparent border-none p-0 focus:outline-none text-[11px] font-bold text-slate-700 cursor-pointer text-xs"
                />
              </div>
              {(globalSearchTerm || globalStartDate || globalEndDate) && (
                <button
                  onClick={() => {
                    setGlobalSearchTerm('');
                    setGlobalStartDate('');
                    setGlobalEndDate('');
                  }}
                  className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-[11px] font-extrabold transition cursor-pointer"
                  title="Reset Filters"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="p-5 space-y-6">

      {/* SALES REPORTS */}
      {reportType === 'sales' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Daily Sales Count</span>
              <h3 className="text-xl font-extrabold text-slate-800">{dailySales.count} Invoices</h3>
              <p className="text-[10px] text-slate-400 font-medium">Invoices generated today.</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-100 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Daily Revenue</span>
              <h3 className="text-xl font-extrabold text-blue-600">Rs. {dailySales.total.toLocaleString()}</h3>
              <p className="text-[10px] text-slate-400 font-medium">Total sales revenue collected today.</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-100 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Daily Net Profit</span>
              <h3 className="text-xl font-extrabold text-emerald-600">Rs. {dailySales.profit.toLocaleString()}</h3>
              <p className="text-[10px] text-slate-400 font-medium">Estimated daily net profit.</p>
            </div>
          </div>

          {/* Quick Scan Invoice Bar */}
          <div className="bg-gradient-to-r from-blue-950 to-indigo-950 p-4 rounded-2xl border border-blue-800/40 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg shadow-blue-900/10 mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500/20 p-2.5 rounded-xl border border-blue-400/20 text-blue-400">
                <Receipt className="h-5 w-5 animate-pulse" />
              </div>
              <div className="text-left">
                <h4 className="text-xs font-black uppercase tracking-wider text-blue-300">
                  {language === 'en' ? 'Quick POS Invoice Scanner' : 'ඉක්මන් POS බිල්පත් ස්කෑනරය'}
                </h4>
                <p className="text-[10px] text-slate-300 font-medium">
                  {language === 'en' ? 'Scan receipt QR code or type Bill ID to view details, returns or replacements.' : 'විස්තර බැලීමට හෝ මාරු කිරීමට රිසිට් පතේ QR කේතය ස්කෑන් කරන්න.'}
                </p>
              </div>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                let cleanId = qrScanInput.trim();
                if (cleanId.toUpperCase().startsWith('BILL:')) {
                  cleanId = cleanId.substring(5);
                }
                const foundSale = sales.find(s => s.id.toLowerCase() === cleanId.toLowerCase());
                if (foundSale) {
                  setSelectedSale(foundSale);
                  setQrScanInput('');
                } else {
                  alert(language === 'en' ? `Invoice ID "${cleanId}" not found in system.` : `බිල්පත් අංකය "${cleanId}" පද්ධතියේ හමු නොවිය.`);
                }
              }}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder={language === 'en' ? 'Scan QR or Enter Bill ID...' : 'QR හෝ බිල්පත් අංකය ඇතුළත් කරන්න...'}
                  value={qrScanInput}
                  onChange={(e) => setQrScanInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-900/90 border border-blue-800 rounded-xl text-xs font-extrabold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-750 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-md whitespace-nowrap active:scale-95 cursor-pointer"
              >
                {language === 'en' ? 'Find Invoice' : 'බිල සොයන්න'}
              </button>
            </form>
          </div>

          <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center">
              <TrendingUp className="h-4.5 w-4.5 mr-1.5 text-blue-600" />
              Sales History Ledger
            </h3>
            <button
              onClick={() => handleExportCSV('sales')}
              className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow flex items-center space-x-1.5"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-extrabold text-[10px] tracking-wider border-b border-slate-100">
                    <th className="py-4 px-6">INVOICE ID</th>
                    <th className="py-4 px-6">CUSTOMER</th>
                    <th className="py-4 px-6">CHANNEL</th>
                    <th className="py-4 px-6 text-right">TOTAL AMOUNT</th>
                    <th className="py-4 px-6 text-right">PROFIT</th>
                    <th className="py-4 px-6 text-center">DATE</th>
                    <th className="py-4 px-6 text-center">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                  {filteredSalesList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">No matching sales records found.</td>
                    </tr>
                  ) : (
                    filteredSalesList.map(sale => (
                      <tr key={sale.id} className="hover:bg-slate-50/50">
                      <td className="py-4 px-6 text-slate-400 font-bold">{sale.id}</td>
                      <td className="py-4 px-6 font-bold text-slate-800">{sale.customerName || 'Walk-In Customer'}</td>
                      <td className="py-4 px-6">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          sale.saleType === 'POS' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {sale.saleType}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right font-extrabold text-slate-800">Rs. {sale.total.toLocaleString()}</td>
                      <td className="py-4 px-6 text-right text-emerald-600 font-extrabold">Rs. {sale.profit.toLocaleString()}</td>
                      <td className="py-4 px-6 text-center text-slate-400 font-medium">{new Date(sale.createdAt).toLocaleDateString()}</td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex justify-center items-center gap-1.5">
                          <button
                            onClick={() => setSelectedSale(sale)}
                            className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition"
                            title={language === 'en' ? 'View Details' : 'විස්තර බලන්න'}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleReprintReceipt(sale)}
                            className="p-1 bg-blue-50 hover:bg-blue-105 text-blue-600 rounded-lg transition"
                            title={language === 'en' ? 'Reprint Receipt' : 'බිල නැවත ප්‍රින්ට් කරන්න'}
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAX REPORTS (LIVE VAT / SSCL) — IRD-Style */}
      {reportType === 'tax' && (
        <div className="space-y-5">

          {/* Header toolbar */}
          <div className="flex flex-wrap gap-3 items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-blue-700" />
              <div>
                <h3 className="text-sm font-extrabold text-slate-800">VAT & SSCL Tax Report</h3>
                <p className="text-[10px] text-slate-400 font-medium">Period: {taxPeriodLabel()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Period Selector */}
              <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
                {(['current-month', 'last-month', 'quarter', 'all'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setTaxPeriod(p)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition whitespace-nowrap ${
                      taxPeriod === p ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-white hover:shadow-sm'
                    }`}
                  >
                    {p === 'current-month' ? 'This Month' : p === 'last-month' ? 'Last Month' : p === 'quarter' ? 'This Quarter' : 'All Time'}
                  </button>
                ))}
              </div>
              <button
                onClick={handlePrintTaxReport}
                className="bg-slate-700 hover:bg-slate-900 text-white px-3 py-2 rounded-xl text-xs font-bold transition shadow flex items-center gap-1.5"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print</span>
              </button>
              <button
                onClick={() => handleExportCSV('tax')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl text-xs font-bold transition shadow flex items-center gap-1.5"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-4 rounded-2xl shadow space-y-1">
              <p className="text-[9px] font-bold uppercase tracking-wider opacity-80">VAT Collected (15%)</p>
              <p className="text-lg font-extrabold">Rs. {taxSummary.totalVAT.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <p className="text-[9px] opacity-70">{taxSummary.invoiceCount} taxable invoices</p>
            </div>
            <div className="bg-gradient-to-br from-violet-600 to-violet-700 text-white p-4 rounded-2xl shadow space-y-1">
              <p className="text-[9px] font-bold uppercase tracking-wider opacity-80">SSCL Collected (2.5%)</p>
              <p className="text-lg font-extrabold">Rs. {taxSummary.totalSSCL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <p className="text-[9px] opacity-70">Social Security Contribution Levy</p>
            </div>
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white p-4 rounded-2xl shadow space-y-1">
              <p className="text-[9px] font-bold uppercase tracking-wider opacity-80">Total Tax Liability</p>
              <p className="text-lg font-extrabold">Rs. {taxSummary.totalTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <p className="text-[9px] opacity-70">VAT + SSCL combined</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-600 to-teal-600 text-white p-4 rounded-2xl shadow space-y-1">
              <p className="text-[9px] font-bold uppercase tracking-wider opacity-80">Taxable Revenue</p>
              <p className="text-lg font-extrabold">Rs. {taxSummary.taxableRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <p className="text-[9px] opacity-70">Gross revenue incl. tax</p>
            </div>
          </div>

          {/* Monthly Breakdown */}
          {taxSummary.monthlyList.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 bg-slate-50 border-b border-slate-100">
                <Calendar className="h-4 w-4 text-slate-400" />
                <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wide">Monthly Tax Breakdown</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-800 text-white font-bold text-[10px] tracking-wider">
                      <th className="py-3 px-5">MONTH</th>
                      <th className="py-3 px-5 text-center">INVOICES</th>
                      <th className="py-3 px-5 text-right">TAXABLE REVENUE (LKR)</th>
                      <th className="py-3 px-5 text-right">VAT 15% (LKR)</th>
                      <th className="py-3 px-5 text-right">SSCL 2.5% (LKR)</th>
                      <th className="py-3 px-5 text-right">COMBINED TAX (LKR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                    {taxSummary.monthlyList.map((m, idx) => (
                      <tr key={m.key} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                        <td className="py-3.5 px-5 font-bold text-slate-800">{m.label}</td>
                        <td className="py-3.5 px-5 text-center">
                          <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">{m.invoices}</span>
                        </td>
                        <td className="py-3.5 px-5 text-right font-bold text-slate-700">Rs. {m.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="py-3.5 px-5 text-right text-blue-700 font-bold">Rs. {m.vatTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="py-3.5 px-5 text-right text-violet-700 font-bold">Rs. {m.ssclTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="py-3.5 px-5 text-right font-extrabold text-amber-700">Rs. {m.combinedTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                  {taxSummary.monthlyList.length > 1 && (
                    <tfoot>
                      <tr className="bg-slate-800 text-white font-extrabold text-xs">
                        <td className="py-3.5 px-5" colSpan={2}>TOTAL</td>
                        <td className="py-3.5 px-5 text-right">Rs. {taxSummary.taxableRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="py-3.5 px-5 text-right">Rs. {taxSummary.totalVAT.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="py-3.5 px-5 text-right">Rs. {taxSummary.totalSSCL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="py-3.5 px-5 text-right">Rs. {taxSummary.totalTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          )}

          {/* Transaction Ledger */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 bg-slate-50 border-b border-slate-100">
              <Receipt className="h-4 w-4 text-slate-400" />
              <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wide">Taxable Transaction Ledger</h4>
              <span className="ml-auto text-[10px] font-bold text-slate-400">{filteredTaxSales.length} record(s)</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-800 text-white font-bold text-[10px] tracking-wider">
                    <th className="py-3 px-4">INVOICE NO.</th>
                    <th className="py-3 px-4">DATE</th>
                    <th className="py-3 px-4">CUSTOMER</th>
                    <th className="py-3 px-4 text-right">TAXABLE VALUE</th>
                    <th className="py-3 px-4 text-right">VAT 15%</th>
                    <th className="py-3 px-4 text-right">SSCL 2.5%</th>
                    <th className="py-3 px-4 text-right">TOTAL TAX</th>
                    <th className="py-3 px-4 text-right">INVOICE TOTAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                  {filteredTaxSales.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center">
                        <div className="flex flex-col items-center gap-2 text-slate-400">
                          <ShieldAlert className="h-8 w-8 opacity-30" />
                          <p className="font-medium">No taxable sales for the selected period.</p>
                          <p className="text-[10px]">Enable VAT or SSCL on a sale to see tax records here.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredTaxSales.map((sale, idx) => {
                      const taxableValue = sale.total - (sale.totalTax || 0);
                      return (
                        <tr key={sale.id} className={idx % 2 === 0 ? 'bg-white hover:bg-blue-50/40 transition' : 'bg-slate-50/50 hover:bg-blue-50/40 transition'}>
                          <td className="py-3 px-4 font-mono text-[10px] text-slate-500 font-bold">{sale.id}</td>
                          <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{new Date(sale.createdAt).toLocaleDateString()}</td>
                          <td className="py-3 px-4 font-bold text-slate-800 max-w-[120px] truncate">{sale.customerName || 'Walk-In Customer'}</td>
                          <td className="py-3 px-4 text-right font-bold text-slate-700">Rs. {taxableValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="py-3 px-4 text-right font-bold text-blue-700">Rs. {(sale.vatTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="py-3 px-4 text-right font-bold text-violet-700">Rs. {(sale.ssclTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="py-3 px-4 text-right font-extrabold text-amber-700">Rs. {(sale.totalTax || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="py-3 px-4 text-right font-extrabold text-slate-800">Rs. {sale.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {filteredTaxSales.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-800 text-white font-extrabold text-xs">
                      <td className="py-3.5 px-4" colSpan={3}>TOTAL ({filteredTaxSales.length} invoices)</td>
                      <td className="py-3.5 px-4 text-right">Rs. {(taxSummary.taxableRevenue - taxSummary.totalTax).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="py-3.5 px-4 text-right">Rs. {taxSummary.totalVAT.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="py-3.5 px-4 text-right">Rs. {taxSummary.totalSSCL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="py-3.5 px-4 text-right">Rs. {taxSummary.totalTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="py-3.5 px-4 text-right">Rs. {taxSummary.taxableRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* IRD Filing Note */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 items-start">
            <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
            <div className="text-[10px] text-amber-800 leading-relaxed">
              <b>IRD Filing Reminder:</b> VAT returns must be filed on a monthly basis (due by the 20th of the following month). SSCL returns are filed quarterly. Please cross-check these figures with your accountant before submission to the Inland Revenue Department of Sri Lanka.
            </div>
          </div>
        </div>
      )}

      {/* EXPENSE REPORTS */}
      {reportType === 'expenses' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center">
              <ClipboardList className="h-4.5 w-4.5 mr-1.5 text-blue-600" />
              Business Expenses Ledger
            </h3>
            <button
              onClick={() => handleExportCSV('expenses')}
              className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow flex items-center space-x-1.5"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-extrabold text-[10px] tracking-wider border-b border-slate-100">
                    <th className="py-4 px-6">EXP ID</th>
                    <th className="py-4 px-6">CATEGORY</th>
                    <th className="py-4 px-6">DESCRIPTION</th>
                    <th className="py-4 px-6 text-right">AMOUNT</th>
                    <th className="py-4 px-6 text-center">RECORDED BY</th>
                    <th className="py-4 px-6 text-center">DATE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                  {filteredExpensesList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">No matching expenses found.</td>
                    </tr>
                  ) : (
                    filteredExpensesList.map(e => (
                      <tr key={e.id} className="hover:bg-slate-50/50">
                        <td className="py-4 px-6 text-slate-400 font-bold">{e.id}</td>
                      <td className="py-4 px-6">
                        <span className="bg-slate-100 px-2.5 py-1 rounded text-[10px] font-bold">
                          {e.category}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-700 font-medium">{e.description}</td>
                      <td className="py-4 px-6 text-right font-extrabold text-rose-600">Rs. {e.amount.toLocaleString()}</td>
                      <td className="py-4 px-6 text-center text-slate-500 font-medium">{e.recordedBy}</td>
                      <td className="py-4 px-6 text-center text-slate-400 font-medium">{new Date(e.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PROFIT & LOSS STATEMENT */}
      {reportType === 'profit-loss' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-sm font-bold text-slate-800">Income Statement (Profit & Loss)</h3>
            <p className="text-[10px] text-slate-400 font-medium">Generated for the current business billing period.</p>
          </div>

          <div className="space-y-3.5 text-xs font-semibold text-slate-700">
            <div className="flex justify-between pb-1.5 border-b border-slate-100 text-slate-400 uppercase tracking-wider text-[10px] font-extrabold">
              <span>Account Description</span>
              <span>Amount (LKR)</span>
            </div>

            <div className="flex justify-between">
              <span>Gross Sales Revenue (Retail & Wholesale)</span>
              <span className="font-bold text-slate-800">Rs. {filteredPLMetrics.totalSales.toLocaleString()}</span>
            </div>

            <div className="flex justify-between text-rose-600">
              <span>Cost of Goods Sold (COGS)</span>
              <span>- Rs. {filteredPLMetrics.totalCost.toLocaleString()}</span>
            </div>

            <div className="flex justify-between border-t border-slate-100 pt-2 font-extrabold text-slate-800">
              <span>Gross Profit Margin</span>
              <span>Rs. {filteredPLMetrics.totalProfit.toLocaleString()}</span>
            </div>

            <div className="flex justify-between text-rose-600">
              <span>Operating Expenses (Rent, Utilities, Salaries, etc.)</span>
              <span>- Rs. {filteredPLMetrics.totalExpenses.toLocaleString()}</span>
            </div>

            <div className="flex justify-between border-t-2 border-double border-slate-200 pt-3 text-base font-extrabold">
              <span>Net Profit / Loss</span>
              <span className={filteredPLMetrics.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                Rs. {filteredPLMetrics.netProfit.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* STOCK REPORT */}
      {reportType === 'stock' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total Items Monitored</span>
              <h3 className="text-xl font-extrabold text-slate-800">{stockMetrics.currentLevels.length} Products</h3>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-100 space-y-2">
              <span className="text-[10px] font-bold text-rose-500 uppercase">Low Stock Alerts</span>
              <h3 className="text-xl font-extrabold text-rose-600">{stockMetrics.lowStock.length} Items</h3>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100">
              <h4 className="text-xs font-bold text-slate-700">Current Stock Levels & Storage Locations</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-extrabold text-[10px] tracking-wider border-b border-slate-100">
                    <th className="py-4 px-6">PRODUCT ID</th>
                    <th className="py-4 px-6">PRODUCT NAME</th>
                    <th className="py-4 px-6">BRAND</th>
                    <th className="py-4 px-6">RACK / CABINET</th>
                    <th className="py-4 px-6 text-center">CURRENT STOCK</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                  {filteredStockLevels.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">No products found matching the search criteria.</td>
                    </tr>
                  ) : (
                    filteredStockLevels.map(p => (
                      <tr key={p.id}>
                        <td className="py-4 px-6 text-slate-400 font-bold">{p.id}</td>
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-800">{p.name}</div>
                        <div className="text-[10px] text-slate-400">{p.nameSi}</div>
                      </td>
                      <td className="py-4 px-6 text-slate-500">{p.brand}</td>
                      <td className="py-4 px-6 text-slate-500">{p.rack}</td>
                      <td className="py-4 px-6 text-center">
                        {p.stock === 'Unlimited' ? (
                          <span className="text-purple-600 font-bold">Unlimited</span>
                        ) : (
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            p.stock <= p.lowAlert ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-800'
                          }`}>
                            {p.stock} Qty
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOMER DUES (DEBT MGMT) */}
      {reportType === 'dues' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 space-y-2">
            <span className="text-[10px] font-bold text-rose-500 uppercase">Total Unpaid Customer Dues</span>
            <h3 className="text-xl font-extrabold text-rose-600">
              Rs. {filteredCustomerDuesList.reduce((acc, curr) => acc + curr.total, 0).toLocaleString()}
            </h3>
            <p className="text-[10px] text-slate-400 font-medium">Accumulated credit sales pending recovery.</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100">
              <h4 className="text-xs font-bold text-slate-700">Active Debtors & Unpaid Invoices</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-extrabold text-[10px] tracking-wider border-b border-slate-100">
                    <th className="py-4 px-6">INVOICE ID</th>
                    <th className="py-4 px-6">CUSTOMER NAME</th>
                    <th className="py-4 px-6 text-right">UNPAID AMOUNT</th>
                    <th className="py-4 px-6 text-center">DATE ISSUED</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                  {filteredCustomerDuesList.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400">No outstanding customer dues found.</td>
                    </tr>
                  ) : (
                    filteredCustomerDuesList.map(sale => (
                      <tr key={sale.id}>
                        <td className="py-4 px-6 text-slate-400 font-bold">{sale.id}</td>
                        <td className="py-4 px-6 font-bold text-slate-800">{sale.customerName}</td>
                        <td className="py-4 px-6 text-right font-extrabold text-rose-600">Rs. {sale.total.toLocaleString()}</td>
                        <td className="py-4 px-6 text-center text-slate-400 font-medium">{new Date(sale.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ISSUED ESTIMATES / QUOTATIONS */}
      {reportType === 'estimates' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Total Issued Quotations Value</span>
            <h3 className="text-xl font-extrabold text-blue-600">
              Rs. {filteredEstimatesList.reduce((acc, curr) => acc + curr.total, 0).toLocaleString()}
            </h3>
            <p className="text-[10px] text-slate-400 font-medium">Total estimated value of all active price quotations.</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100">
              <h4 className="text-xs font-bold text-slate-700">Issued Estimates & Validity Periods</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-extrabold text-[10px] tracking-wider border-b border-slate-100">
                    <th className="py-4 px-6">QUOTATION ID</th>
                    <th className="py-4 px-6">CUSTOMER NAME</th>
                    <th className="py-4 px-6 text-right">ESTIMATED TOTAL</th>
                    <th className="py-4 px-6 text-center">VALID UNTIL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                  {filteredEstimatesList.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400">No active quotations found.</td>
                    </tr>
                  ) : (
                    filteredEstimatesList.map(quote => (
                      <tr key={quote.id}>
                        <td className="py-4 px-6 text-slate-400 font-bold">{quote.id}</td>
                        <td className="py-4 px-6 font-bold text-slate-800">{quote.customerName}</td>
                        <td className="py-4 px-6 text-right font-extrabold text-blue-600">Rs. {quote.total.toLocaleString()}</td>
                        <td className="py-4 px-6 text-center text-slate-400 font-medium">{quote.validUntil}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* WARRANTY TRACKING */}
      {reportType === 'warranty' && (
        <div className="space-y-6">
          {/* Stats row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 space-y-2">
              <span className="text-[10px] font-bold text-emerald-500 uppercase">Active Warranties</span>
              <h3 className="text-xl font-extrabold text-emerald-600">{warrantyMetrics.active.length} Items</h3>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-100 space-y-2">
              <span className="text-[10px] font-bold text-rose-500 uppercase">Expired Warranties</span>
              <h3 className="text-xl font-extrabold text-rose-600">{warrantyMetrics.expired.length} Items</h3>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-100 space-y-2">
              <span className="text-[10px] font-bold text-violet-500 uppercase">Replacements Issued</span>
              <h3 className="text-xl font-extrabold text-violet-600">{warrantyReplacements.length} Records</h3>
            </div>
          </div>

          {/* Record New Replacement button */}
          {onWarrantyReplacement && (
            <div className="flex justify-end">
              <button
                onClick={() => setShowReplacementModal(true)}
                className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5 active:scale-95"
              >
                <ArrowRightLeft className="h-3.5 w-3.5" />
                {language === 'en' ? 'Record Warranty Replacement' : 'වගකීම් ප්‍රතිස්ථාපනයක් ලියාපදිංචි කරන්න'}
              </button>
            </div>
          )}

          {/* Warranty Status Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100">
              <h4 className="text-xs font-bold text-slate-700">Warranty Status Ledger (Phone &amp; Computer Parts)</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-extrabold text-[10px] tracking-wider border-b border-slate-100">
                    <th className="py-4 px-6">SALE ID</th>
                    <th className="py-4 px-6">CUSTOMER</th>
                    <th className="py-4 px-6">ITEM NAME</th>
                    <th className="py-4 px-6 text-center">WARRANTY EXPIRY</th>
                    <th className="py-4 px-6 text-center">STATUS</th>
                    <th className="py-4 px-6 text-center">REPLACEMENT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                  {filteredWarrantyItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">No warranty records found.</td>
                    </tr>
                  ) : (
                    filteredWarrantyItems.map((item, idx) => {
                      // Find any replacements linked to this sale+item
                      const replacements = warrantyReplacements.filter(
                        r => r.originalSaleId === item.saleId && r.originalProductName === item.item
                      );
                      return (
                        <tr key={idx} className={replacements.length > 0 ? 'bg-violet-50/40' : ''}>
                          <td className="py-4 px-6 text-slate-400 font-bold">{item.saleId}</td>
                          <td className="py-4 px-6 font-bold text-slate-800">{item.customer}</td>
                          <td className="py-4 px-6 text-slate-700">{item.item}</td>
                          <td className="py-4 px-6 text-center text-slate-500">{item.expiryDate}</td>
                          <td className="py-4 px-6 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              item.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-center">
                            {replacements.length > 0 ? (
                              <div className="space-y-1 flex flex-col items-center">
                                {replacements.map((r, ri) => (
                                  <div key={ri} className="flex flex-col items-center gap-0.5 bg-violet-100/85 text-violet-900 px-2.5 py-1 rounded-xl border border-violet-200">
                                    <span className="text-[8px] font-black uppercase tracking-wider text-violet-700 flex items-center gap-1">
                                      <ArrowRightLeft className="h-2.5 w-2.5 animate-pulse" />
                                      {language === 'en' ? 'Replacement Given' : 'නැවත එකක් ලබාදුන්නා'}
                                    </span>
                                    <span className="text-[9px] font-bold">
                                      {r.replacementProductName} ({r.quantity}x)
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-300 text-[10px]">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Replacement History Table */}
          {filteredReplacements.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-violet-100 overflow-hidden">
              <div className="p-4 bg-violet-50 border-b border-violet-100 flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4 text-violet-600" />
                <h4 className="text-xs font-bold text-violet-700">Warranty Replacement History</h4>
                <span className="ml-auto text-[9px] text-violet-500 font-bold bg-violet-100 px-2 py-0.5 rounded-full">{filteredReplacements.length} records</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-violet-50/60 text-violet-400 font-extrabold text-[10px] tracking-wider border-b border-violet-100">
                      <th className="py-3 px-5">DATE</th>
                      <th className="py-3 px-5">ORIG. SALE</th>
                      <th className="py-3 px-5">CUSTOMER</th>
                      <th className="py-3 px-5">ORIGINAL ITEM</th>
                      <th className="py-3 px-5">REPLACED WITH</th>
                      <th className="py-3 px-5 text-center">QTY</th>
                      <th className="py-3 px-5">REASON</th>
                      <th className="py-3 px-5">HANDLED BY</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-violet-50 text-xs font-semibold text-slate-700">
                    {filteredReplacements.map((r, idx) => (
                      <tr key={idx} className="hover:bg-violet-50/30 transition">
                        <td className="py-3 px-5 text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</td>
                        <td className="py-3 px-5 font-bold text-slate-500">{r.originalSaleId}</td>
                        <td className="py-3 px-5 font-bold text-slate-800">{r.customerName}{r.customerPhone ? <span className="text-[9px] text-slate-400 block">{r.customerPhone}</span> : null}</td>
                        <td className="py-3 px-5 text-slate-600">{r.originalProductName}</td>
                        <td className="py-3 px-5">
                          <span className="inline-flex items-center gap-1 bg-violet-100 text-violet-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            <ArrowRightLeft className="h-2.5 w-2.5" />{r.replacementProductName}
                          </span>
                        </td>
                        <td className="py-3 px-5 text-center font-extrabold">{r.quantity}</td>
                        <td className="py-3 px-5 text-slate-500 max-w-[120px] truncate" title={r.reason}>{r.reason}</td>
                        <td className="py-3 px-5 text-slate-500">{r.handledBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* WARRANTY REPLACEMENT MODAL */}
      {showReplacementModal && onWarrantyReplacement && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-gradient-to-r from-violet-700 to-purple-600 text-white p-5 flex justify-between items-center">
              <h3 className="text-sm font-extrabold flex items-center gap-2">
                <ArrowRightLeft className="h-4.5 w-4.5" />
                {language === 'en' ? 'Record Warranty Replacement' : 'වගකීම් ප්‍රතිස්ථාපනය සටහන් කරන්න'}
              </h3>
              <button onClick={() => setShowReplacementModal(false)} className="text-violet-200 hover:text-white transition"><X className="h-5 w-5" /></button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const newProd = products.find(p => p.id === replacementNewProductId);
                if (!newProd) return;
                const replacement: WarrantyReplacement = {
                  id: `WR-${Date.now()}`,
                  originalSaleId: replacementSaleId,
                  customerName: replacementCustomer,
                  customerPhone: replacementCustomerPhone || undefined,
                  originalProductId: '',
                  originalProductName: replacementOrigProduct,
                  replacementProductId: newProd.id,
                  replacementProductName: language === 'en' ? newProd.nameEn : newProd.nameSi,
                  quantity: replacementQty,
                  reason: replacementReason,
                  handledBy: replacementHandledBy,
                  createdAt: new Date().toISOString(),
                  notes: replacementNotes || undefined,
                };
                onWarrantyReplacement(replacement);
                // Reset form
                setReplacementSaleId('');
                setReplacementCustomer('');
                setReplacementCustomerPhone('');
                setReplacementOrigProduct('');
                setReplacementNewProductId('');
                setReplacementQty(1);
                setReplacementReason('');
                setReplacementHandledBy('Admin');
                setReplacementNotes('');
                setShowReplacementModal(false);
              }}
              className="p-6 space-y-4 max-h-[65vh] overflow-y-auto text-xs font-semibold"
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold">{language === 'en' ? 'Original Sale ID *' : ' මුල් බිල් අංකය *'}</label>
                  <input required value={replacementSaleId} onChange={e => setReplacementSaleId(e.target.value)}
                    placeholder="e.g. S-POS-1234"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-bold focus:ring-2 focus:ring-violet-500 focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold">{language === 'en' ? 'Handled By *' : 'හැසිරවූ කාර්මිකයා *'}</label>
                  <input required value={replacementHandledBy} onChange={e => setReplacementHandledBy(e.target.value)}
                    placeholder="Admin / Technician name"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-bold focus:ring-2 focus:ring-violet-500 focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold">{language === 'en' ? 'Customer Name *' : 'ගනුදෙනුකරු නම *'}</label>
                  <input required value={replacementCustomer} onChange={e => setReplacementCustomer(e.target.value)}
                    placeholder="e.g. Kamal"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-bold focus:ring-2 focus:ring-violet-500 focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold">{language === 'en' ? 'Customer Phone' : 'දුරකථන අංකය'}</label>
                  <input value={replacementCustomerPhone} onChange={e => setReplacementCustomerPhone(e.target.value)}
                    placeholder="07XXXXXXXX"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-bold focus:ring-2 focus:ring-violet-500 focus:outline-none" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-slate-500 font-bold">{language === 'en' ? 'Original (Defective) Item Name *' : 'දෝෂ සහිත මුල් භාණ්ඩය *'}</label>
                <input required value={replacementOrigProduct} onChange={e => setReplacementOrigProduct(e.target.value)}
                  placeholder="e.g. Samsung Galaxy A15 Battery"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-bold focus:ring-2 focus:ring-violet-500 focus:outline-none" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className="text-slate-500 font-bold">{language === 'en' ? 'Replacement Product *' : 'ලබාදෙන නව භාණ්ඩය *'}</label>
                  <select required value={replacementNewProductId} onChange={e => setReplacementNewProductId(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-bold focus:ring-2 focus:ring-violet-500 focus:outline-none">
                    <option value="">{language === 'en' ? '-- Select product --' : '-- භාණ්ඩය තෝරන්න --'}</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {language === 'en' ? p.nameEn : p.nameSi} ({p.id}) — Stock: {p.stock}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold">{language === 'en' ? 'Qty *' : 'ප්‍රමාණය *'}</label>
                  <input type="number" required min={1} value={replacementQty} onChange={e => setReplacementQty(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-bold focus:ring-2 focus:ring-violet-500 focus:outline-none" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-slate-500 font-bold">{language === 'en' ? 'Reason for Replacement *' : 'ප්‍රතිස්ථාපනය කිරීමේ හේතුව *'}</label>
                <input required value={replacementReason} onChange={e => setReplacementReason(e.target.value)}
                  placeholder="e.g. Manufacturing defect / Dead on arrival"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-bold focus:ring-2 focus:ring-violet-500 focus:outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-slate-500 font-bold">{language === 'en' ? 'Additional Notes' : 'අමතර සටහන්'}</label>
                <textarea value={replacementNotes} onChange={e => setReplacementNotes(e.target.value)}
                  rows={2} placeholder="Optional notes..."
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-violet-500 focus:outline-none resize-none" />
              </div>

              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-[10px] text-amber-700 font-semibold">
                ⚠️ {language === 'en'
                  ? 'Stock of the replacement product will be deducted automatically. This transaction does NOT affect daily sales revenue or cash totals.'
                  : 'ප්‍රතිස්ථාපන භාණ්ඩයේ ස්ටොක් ස්වයංක්‍රීයව අඩු වේ. මෙය දෛනික විකුණුම් ආදායමට හෝ මුදල් සාරාංශයට බලපාන්නේ නැත.'}
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowReplacementModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-2.5 rounded-xl font-bold transition">
                  {language === 'en' ? 'Cancel' : 'අවලංගු'}
                </button>
                <button type="submit"
                  className="flex-1 bg-violet-600 hover:bg-violet-700 text-white py-2.5 rounded-xl font-bold shadow-lg shadow-violet-600/20 transition active:scale-95">
                  {language === 'en' ? 'Record Replacement' : 'ප්‍රතිස්ථාපනය ලියාපදිංචි කරන්න'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TURNOVER ANALYSIS */}
      {reportType === 'turnover' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top Selling */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4">
            <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center border-b border-slate-100 pb-3">
              <TrendingUp className="h-4.5 w-4.5 mr-1.5" />
              Top Selling Products (Best Performance)
            </h3>
            <div className="space-y-3">
              {filteredTurnoverMetrics.topSelling.length === 0 ? (
                <p className="text-slate-400 text-xs text-center py-8">No sales turnover recorded.</p>
              ) : (
                filteredTurnoverMetrics.topSelling.map(item => (
                  <div key={item.id} className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center text-xs font-semibold">
                    <div>
                      <h4 className="text-slate-800 font-bold">{item.name}</h4>
                      <p className="text-[10px] text-slate-400">ID: {item.id} • Sold: {item.qty} Qty</p>
                    </div>
                    <span className="text-blue-600 font-extrabold">Rs. {item.totalRev.toLocaleString()}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Slow Moving */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4">
            <h3 className="text-xs font-bold text-rose-500 uppercase tracking-wider flex items-center border-b border-slate-100 pb-3">
              <AlertTriangle className="h-4.5 w-4.5 mr-1.5" />
              Slow Moving Products (Low Turnover)
            </h3>
            <div className="space-y-3">
              {filteredTurnoverMetrics.slowMoving.length === 0 ? (
                <p className="text-slate-400 text-xs text-center py-8">All items have active sales turnover.</p>
              ) : (
                filteredTurnoverMetrics.slowMoving.map(item => (
                  <div key={item.id} className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center text-xs font-semibold">
                    <div>
                      <h4 className="text-slate-800 font-bold">{item.name}</h4>
                      <p className="text-[10px] text-slate-400">ID: {item.id} • Sold: {item.qty} Qty</p>
                    </div>
                    <span className="text-slate-400 font-bold">No sales</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Z-REPORTS SHIFT HISTORY */}
      {reportType === 'shifts' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100">
              <h4 className="text-xs font-bold text-slate-700">Cash Register Z-Reports Shift History</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-extrabold text-[10px] tracking-wider border-b border-slate-100">
                    <th className="py-4 px-6">SHIFT ID</th>
                    <th className="py-4 px-6">CASHIER</th>
                    <th className="py-4 px-6 text-right">OPENING FLOAT</th>
                    <th className="py-4 px-6 text-right">EXPECTED CASH</th>
                    <th className="py-4 px-6 text-right">ACTUAL CASH</th>
                    <th className="py-4 px-6 text-right">DISCREPANCY</th>
                    <th className="py-4 px-6 text-center">OPENED AT</th>
                    <th className="py-4 px-6 text-center">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                  {(!filteredShiftsList || filteredShiftsList.length === 0) ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">No register shifts found.</td>
                    </tr>
                  ) : (
                    filteredShiftsList.map(shift => {
                      const discrepancy = shift.actualCash - shift.expectedCash;
                      return (
                        <tr key={shift.id} className="hover:bg-slate-50/50">
                          <td className="py-4 px-6 text-slate-400 font-bold">{shift.id}</td>
                          <td className="py-4 px-6 font-bold text-slate-800">{shift.cashierName}</td>
                          <td className="py-4 px-6 text-right">Rs. {shift.floatCash.toLocaleString()}</td>
                          <td className="py-4 px-6 text-right">Rs. {shift.expectedCash.toLocaleString()}</td>
                          <td className="py-4 px-6 text-right font-extrabold text-blue-600">
                            {shift.status === 'Open' ? '-' : `Rs. ${shift.actualCash.toLocaleString()}`}
                          </td>
                          <td className={`py-4 px-6 text-right font-black ${
                            shift.status === 'Open' ? 'text-slate-405' :
                            discrepancy === 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}>
                            {shift.status === 'Open' ? '-' : `Rs. ${discrepancy.toLocaleString()}`}
                          </td>
                          <td className="py-4 px-6 text-center text-slate-400 font-medium">
                            {new Date(shift.openedAt).toLocaleString()}
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              shift.status === 'Open' ? 'bg-blue-100 text-blue-800' : 'bg-slate-150 text-slate-800'
                            }`}>
                              {shift.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* WASTAGE LOSS REPORT */}
      {reportType === 'wastage' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100">
              <h4 className="text-xs font-bold text-slate-700">Wastage, Damages & Financial Loss Report</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-extrabold text-[10px] tracking-wider border-b border-slate-100">
                    <th className="py-4 px-6">ADJUSTMENT ID</th>
                    <th className="py-4 px-6">PRODUCT</th>
                    <th className="py-4 px-6 text-center">QUANTITY WASTED</th>
                    <th className="py-4 px-6 text-right">COST PRICE</th>
                    <th className="py-4 px-6 text-right">FINANCIAL LOSS (LKR)</th>
                    <th className="py-4 px-6">REASON</th>
                    <th className="py-4 px-6 text-center">DATE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                  {(() => {
                    const wastageList = filteredWastageList;
                    if (wastageList.length === 0) {
                      return (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400">No wastage or damage logs recorded.</td>
                        </tr>
                      );
                    }
                    return wastageList.map(adj => {
                      const prod = products.find(p => p.id === adj.productId);
                      const cost = prod ? prod.costPrice : 0;
                      const qty = Math.abs(adj.qtyAdjusted);
                      const loss = qty * cost;

                      return (
                        <tr key={adj.id} className="hover:bg-slate-50/50">
                          <td className="py-4 px-6 text-slate-400 font-bold">{adj.id}</td>
                          <td className="py-4 px-6 font-bold text-slate-800">
                            {adj.productName} <span className="text-[10px] font-mono text-slate-400">({adj.productId})</span>
                          </td>
                          <td className="py-4 px-6 text-center font-bold text-slate-700">{qty}</td>
                          <td className="py-4 px-6 text-right">Rs. {cost.toLocaleString()}</td>
                          <td className="py-4 px-6 text-right font-black text-rose-600">Rs. {loss.toLocaleString()}</td>
                          <td className="py-4 px-6 font-medium text-slate-500">{adj.reason}</td>
                          <td className="py-4 px-6 text-center text-slate-400 font-medium">
                            {new Date(adj.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {selectedSale && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="bg-slate-950 text-white p-5 flex justify-between items-center">
              <h3 className="text-sm font-bold flex items-center gap-1.5">
                <Receipt className="h-4.5 w-4.5 text-blue-400" />
                <span>{language === 'en' ? `Invoice Details - ${selectedSale.id}` : `බිල්පත් විස්තර - ${selectedSale.id}`}</span>
              </h3>
              <button onClick={() => setSelectedSale(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto text-xs font-semibold text-slate-700">
              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-150">
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-450 uppercase font-bold tracking-wider">{language === 'en' ? 'Customer' : 'පාරිභෝගිකයා'}</p>
                  <p className="text-xs font-bold text-slate-800">{selectedSale.customerName || 'Walk-In Customer'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-450 uppercase font-bold tracking-wider">{language === 'en' ? 'Date & Time' : 'දිනය සහ වේලාව'}</p>
                  <p className="text-xs font-bold text-slate-800">{new Date(selectedSale.createdAt).toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-450 uppercase font-bold tracking-wider">{language === 'en' ? 'Payment Method' : 'ගෙවීම් ක්‍රමය'}</p>
                  <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                    selectedSale.paymentMethod === 'Pending' ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-800'
                  }`}>
                    {selectedSale.paymentMethod === 'Pending' ? '⚠️ CREDIT (Unpaid)' : selectedSale.paymentMethod}
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-450 uppercase font-bold tracking-wider">{language === 'en' ? 'Cashier / Seller' : 'විකුණුම්කරු'}</p>
                  <p className="text-xs font-bold text-slate-800">{selectedSale.cashierName || 'Not recorded'}</p>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <p className="text-[10px] text-slate-450 uppercase font-bold tracking-wider">{language === 'en' ? 'Billed Items' : 'විකුණන ලද භාණ්ඩ'}</p>
                <div className="border border-slate-150 rounded-2xl overflow-hidden">
                  <table className="w-full border-collapse text-left text-[11px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-150 text-[9px] text-slate-400 font-extrabold uppercase">
                        <th className="py-2.5 px-4">Item</th>
                        <th className="py-2.5 px-4 text-center">Qty</th>
                        <th className="py-2.5 px-4 text-right">Price</th>
                        <th className="py-2.5 px-4 text-right">Total</th>
                        <th className="py-2.5 px-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-650">
                      {selectedSale.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-4">
                            <p className="font-bold text-slate-800">{language === 'en' ? item.productNameEn : item.productNameSi}</p>
                            <p className="text-[8.5px] font-mono text-slate-400 mt-0.5">{item.productId}</p>
                          </td>
                          <td className="py-2.5 px-4 text-center font-bold">{item.quantity}{item.isWeighted ? 'kg' : ''}</td>
                          <td className="py-2.5 px-4 text-right">Rs. {item.price.toLocaleString()}</td>
                          <td className="py-2.5 px-4 text-right font-bold text-slate-800">Rs. {(item.price * item.quantity).toLocaleString()}</td>
                          <td className="py-2.5 px-4">
                            <div className="flex items-center justify-center gap-1">
                              {/* Replace button (Warranty) */}
                              <button
                                onClick={() => {
                                  setSelectedSale(null);
                                  setReplacementSaleId(selectedSale.id);
                                  setReplacementCustomer(selectedSale.customerName || 'Walk-In');
                                  const cust = customers.find(c => c.id === selectedSale.customerId || c.name === selectedSale.customerName);
                                  setReplacementCustomerPhone(cust?.phone || '');
                                  setReplacementOrigProduct(language === 'en' ? item.productNameEn : item.productNameSi);
                                  setReplacementNewProductId(item.productId);
                                  setReplacementQty(item.quantity);
                                  setReplacementReason(language === 'en' ? 'Warranty Claim Replacement' : 'වගකීම් හිමිකම් ප්‍රතිස්ථාපනය');
                                  setReportType('warranty');
                                  setShowReplacementModal(true);
                                }}
                                className="px-2 py-0.5 bg-violet-100 hover:bg-violet-200 text-violet-750 rounded text-[9px] font-bold transition whitespace-nowrap cursor-pointer"
                                title={language === 'en' ? 'Replace defective item under warranty' : 'දෝෂ සහිත භාණ්ඩය වගකීම් යටතේ මාරු කරන්න'}
                              >
                                {language === 'en' ? 'Replace' : 'මාරු'}
                              </button>
                              
                              {/* Return button */}
                              <button
                                onClick={() => {
                                  const qtyStr = prompt(
                                    language === 'en' 
                                      ? `Enter quantity of "${item.productNameEn}" to return (max ${item.quantity}):` 
                                      : `ආපසු භාරදෙන "${item.productNameSi}" ප්‍රමාණය ඇතුළත් කරන්න (උපරිම ${item.quantity}):`,
                                    String(item.quantity)
                                  );
                                  if (qtyStr === null) return;
                                  const qty = parseInt(qtyStr);
                                  if (isNaN(qty) || qty <= 0 || qty > item.quantity) {
                                    alert(language === 'en' ? 'Invalid return quantity.' : 'වැරදි ප්‍රමාණයකි.');
                                    return;
                                  }
                                  handleReturnItem(selectedSale, item, qty);
                                }}
                                className="px-2 py-0.5 bg-rose-100 hover:bg-rose-200 text-rose-750 rounded text-[9px] font-bold transition whitespace-nowrap cursor-pointer"
                                title={language === 'en' ? 'Return this item' : 'මෙම භාණ්ඩය ආපසු භාරගන්න'}
                              >
                                {language === 'en' ? 'Return' : 'ආපසු'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals Summary */}
              <div className="border-t border-slate-200 pt-3 space-y-1.5 text-xs text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-450">{language === 'en' ? 'Subtotal' : 'උප එකතුව'}:</span>
                  <span>Rs. {selectedSale.subtotal.toLocaleString()}</span>
                </div>
                {selectedSale.vatTotal && selectedSale.vatTotal > 0 && (
                  <div className="flex justify-between text-blue-600 font-semibold">
                    <span>VAT ({settings.vatRate || 15}%):</span>
                    <span>Rs. {selectedSale.vatTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  </div>
                )}
                {selectedSale.ssclTotal && selectedSale.ssclTotal > 0 && (
                  <div className="flex justify-between text-indigo-600 font-semibold">
                    <span>SSCL ({settings.ssclRate || 2.5}%):</span>
                    <span>Rs. {selectedSale.ssclTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  </div>
                )}
                {selectedSale.discount > 0 && (
                  <div className="flex justify-between text-rose-500">
                    <span>{language === 'en' ? 'Discount' : 'වට්ටම'}:</span>
                    <span>- Rs. {selectedSale.discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-slate-900 border-t border-slate-100 pt-2 text-sm">
                  <span>{language === 'en' ? 'GRAND TOTAL' : 'මුළු එකතුව'}:</span>
                  <span className="text-blue-700">Rs. {selectedSale.total.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="bg-slate-50 p-4 border-t border-slate-150 flex gap-2">
              <button
                onClick={() => handleReprintReceipt(selectedSale)}
                className="flex-1 bg-slate-900 hover:bg-black text-white font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95 animate-in"
              >
                <Printer className="h-4 w-4 text-slate-350" />
                <span>{language === 'en' ? 'Reprint Invoice' : 'බිල ප්‍රින්ට් කරන්න'}</span>
              </button>
              <button
                onClick={() => setSelectedSale(null)}
                className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-750 font-bold py-2.5 rounded-xl transition active:scale-95"
              >
                {language === 'en' ? 'Close' : 'වසා දමන්න'}
              </button>
            </div>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
};
