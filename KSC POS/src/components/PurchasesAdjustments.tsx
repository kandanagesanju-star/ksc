import React, { useState, useMemo, useEffect } from 'react';
import { Product, Supplier, PurchaseOrder, StockAdjustment, StockReturn, Sale } from '../types';
import { translations } from '../lib/translations';
import { 
  Plus, Search, ShoppingCart, Truck, AlertTriangle, Check, 
  Trash2, ClipboardSignature, ArrowLeftRight, RefreshCw, X, Download, Calendar
} from 'lucide-react';

interface PurchasesAdjustmentsProps {
  language: 'en' | 'si';
  products: Product[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  stockAdjustments: StockAdjustment[];
  stockReturns: StockReturn[];
  sales: Sale[];
  onAddPurchaseOrder: (order: PurchaseOrder) => void;
  onReceivePurchaseOrder: (orderId: string) => void;
  onAddStockAdjustment: (adj: StockAdjustment) => void;
  onAddStockReturn: (ret: StockReturn) => void;
  onAddSupplier: (supplier: Supplier) => void;
  onAddProduct: (product: Product) => void;
  onDeletePurchaseOrder: (id: string) => void;
  onDeleteStockAdjustment: (id: string) => void;
  onDeleteStockReturn: (id: string) => void;
  categories: string[];
  onAddCategory: (cat: string) => void;
  activeSubTab?: string;
  onSubTabChange?: (tab: any) => void;
}

export const PurchasesAdjustments: React.FC<PurchasesAdjustmentsProps> = ({
  language,
  products,
  suppliers,
  purchaseOrders,
  stockAdjustments,
  stockReturns,
  sales,
  onAddPurchaseOrder,
  onReceivePurchaseOrder,
  onAddStockAdjustment,
  onAddStockReturn,
  onAddSupplier,
  onAddProduct,
  onDeletePurchaseOrder,
  onDeleteStockAdjustment,
  onDeleteStockReturn,
  categories,
  onAddCategory,
  activeSubTab,
  onSubTabChange
}) => {
  const t = translations[language];

  // Primary Tabs
  const [activeTab, setActiveTab] = useState<'purchases' | 'adjustments' | 'returns'>('purchases');

  useEffect(() => {
    if (activeSubTab && (activeSubTab === 'purchases' || activeSubTab === 'adjustments' || activeSubTab === 'returns')) {
      setActiveTab(activeSubTab as any);
    }
  }, [activeSubTab]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  const handleTabChange = (tab: 'purchases' | 'adjustments' | 'returns') => {
    setActiveTab(tab);
    setSearchTerm('');
    setFilterStartDate('');
    setFilterEndDate('');
    if (onSubTabChange) onSubTabChange(tab);
  };

  // Filtered lists
  const filteredPurchaseOrders = useMemo(() => {
    return purchaseOrders.filter(po => {
      const idMatch = po.id.toLowerCase().includes(searchTerm.toLowerCase());
      const supplierMatch = po.supplierName.toLowerCase().includes(searchTerm.toLowerCase());
      const suppObj = suppliers.find(s => s.companyName === po.supplierName || s.name === po.supplierName);
      const phoneMatch = suppObj ? suppObj.phone.includes(searchTerm) : false;
      const itemsMatch = po.items.some(item => {
        const nameMatch = item.productName.toLowerCase().includes(searchTerm.toLowerCase());
        const prodIdMatch = item.productId.toLowerCase().includes(searchTerm.toLowerCase());
        return nameMatch || prodIdMatch;
      });

      const textMatch = idMatch || supplierMatch || phoneMatch || itemsMatch;
      if (!textMatch && searchTerm) return false;

      if (filterStartDate) {
        const poDate = new Date(po.createdAt).toISOString().split('T')[0];
        if (poDate < filterStartDate) return false;
      }
      if (filterEndDate) {
        const poDate = new Date(po.createdAt).toISOString().split('T')[0];
        if (poDate > filterEndDate) return false;
      }
      return true;
    });
  }, [purchaseOrders, suppliers, searchTerm, filterStartDate, filterEndDate]);

  const filteredStockAdjustments = useMemo(() => {
    return stockAdjustments.filter(adj => {
      const idMatch = adj.id.toLowerCase().includes(searchTerm.toLowerCase());
      const nameMatch = adj.productName.toLowerCase().includes(searchTerm.toLowerCase());
      const prodIdMatch = adj.productId.toLowerCase().includes(searchTerm.toLowerCase());
      const reasonMatch = adj.reason.toLowerCase().includes(searchTerm.toLowerCase());
      const byMatch = adj.adjustedBy.toLowerCase().includes(searchTerm.toLowerCase());

      const textMatch = idMatch || nameMatch || prodIdMatch || reasonMatch || byMatch;
      if (!textMatch && searchTerm) return false;

      if (filterStartDate) {
        const adjDate = new Date(adj.createdAt).toISOString().split('T')[0];
        if (adjDate < filterStartDate) return false;
      }
      if (filterEndDate) {
        const adjDate = new Date(adj.createdAt).toISOString().split('T')[0];
        if (adjDate > filterEndDate) return false;
      }
      return true;
    });
  }, [stockAdjustments, searchTerm, filterStartDate, filterEndDate]);

  const filteredStockReturns = useMemo(() => {
    return stockReturns.filter(ret => {
      const idMatch = ret.id.toLowerCase().includes(searchTerm.toLowerCase());
      const typeMatch = ret.type.toLowerCase().includes(searchTerm.toLowerCase());
      const relIdMatch = ret.relatedId ? ret.relatedId.toLowerCase().includes(searchTerm.toLowerCase()) : false;
      const nameMatch = ret.customerOrSupplierName.toLowerCase().includes(searchTerm.toLowerCase());
      const reasonMatch = ret.reason.toLowerCase().includes(searchTerm.toLowerCase());
      const itemsMatch = ret.items.some(item => {
        const nMatch = item.productName.toLowerCase().includes(searchTerm.toLowerCase());
        const idMatch = item.productId.toLowerCase().includes(searchTerm.toLowerCase());
        return nMatch || idMatch;
      });

      const textMatch = idMatch || typeMatch || relIdMatch || nameMatch || reasonMatch || itemsMatch;
      if (!textMatch && searchTerm) return false;

      if (filterStartDate) {
        const retDate = new Date(ret.createdAt).toISOString().split('T')[0];
        if (retDate < filterStartDate) return false;
      }
      if (filterEndDate) {
        const retDate = new Date(ret.createdAt).toISOString().split('T')[0];
        if (retDate > filterEndDate) return false;
      }
      return true;
    });
  }, [stockReturns, searchTerm, filterStartDate, filterEndDate]);

  // Modals
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  
  // Quick Add Supplier Modal States
  const [isNewSuppModalOpen, setIsNewSuppModalOpen] = useState(false);
  const [suppCompanyName, setSuppCompanyName] = useState('');
  const [suppContactName, setSuppContactName] = useState('');
  const [suppPhone, setSuppPhone] = useState('');
  const [suppEmail, setSuppEmail] = useState('');
  const [suppAddress, setSuppAddress] = useState('');
  const [suppNotes, setSuppNotes] = useState('');

  // Quick Add Product Modal States
  const [isNewProdModalOpen, setIsNewProdModalOpen] = useState(false);
  const [newProdId, setNewProdId] = useState('');
  const [newProdNameEn, setNewProdNameEn] = useState('');
  const [newProdNameSi, setNewProdNameSi] = useState('');
  const [newProdCategory, setNewProdCategory] = useState<any>('Phone Accessories');
  const [newProdCost, setNewProdCost] = useState<number>(0);
  const [newProdRetail, setNewProdRetail] = useState<number>(0);
  const [newProdWholesale, setNewProdWholesale] = useState<number>(0);
  const [newProdWholesaleMin, setNewProdWholesaleMin] = useState<number>(5);
  const [newProdBrand, setNewProdBrand] = useState('Generic');
  const [newProdLocation, setNewProdLocation] = useState('Counter');
  const [newProdIsWeighted, setNewProdIsWeighted] = useState(false);
  const [newProdIsTaxable, setNewProdIsTaxable] = useState(true);



  // New Purchase Form state
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [purchaseCart, setPurchaseCart] = useState<{ product: Product; qty: number; costPrice: number }[]>([]);

  // Stock Adjustment Form state
  const [adjProduct, setAdjProduct] = useState<Product | null>(null);
  const [adjType, setAdjType] = useState<'Wastage' | 'Damage' | 'Manual Correction'>('Wastage');
  const [adjQty, setAdjQty] = useState<number>(0);
  const [adjReason, setAdjReason] = useState('');

  // Stock Return Form state
  const [retType, setRetType] = useState<'Sales Return' | 'Purchase Return'>('Sales Return');
  const [retRelatedId, setRetRelatedId] = useState('');
  const [retName, setRetRelatedName] = useState('');
  const [retProduct, setRetProduct] = useState<Product | null>(null);
  const [retQty, setRetQty] = useState<number>(1);
  const [retRefund, setRetRefund] = useState<number>(0);
  const [retReason, setRetReason] = useState('');

  // Return Lookup & Validation States
  const [lookupError, setLookupError] = useState('');
  const [lookupSuccess, setLookupSuccess] = useState('');
  const [matchedSale, setMatchedSale] = useState<Sale | null>(null);
  const [matchedPO, setMatchedPO] = useState<PurchaseOrder | null>(null);
  const [returnAction, setReturnAction] = useState<'Return to Stock' | 'Scrap'>('Return to Stock');

  // Auto-suggest reorders list
  const reorderSuggestions = useMemo(() => {
    return products.filter(p => p.stock !== 'Unlimited' && p.stock <= p.lowStockAlert);
  }, [products]);

  // Group reorder suggestions by category
  const groupedSuggestions = useMemo(() => {
    const groups: Record<string, Product[]> = {};
    reorderSuggestions.forEach(p => {
      if (!groups[p.category]) groups[p.category] = [];
      groups[p.category].push(p);
    });
    return groups;
  }, [reorderSuggestions]);

  // Handle Add Purchase Order
  const handleCreatePurchaseOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier || purchaseCart.length === 0) return;

    const newOrder: PurchaseOrder = {
      id: `PO-${Math.floor(1000 + Math.random() * 9000)}`,
      supplierId: selectedSupplier.id,
      supplierName: selectedSupplier.companyName,
      items: purchaseCart.map(item => ({
        productId: item.product.id,
        productName: item.product.nameEn,
        qty: item.qty,
        costPrice: item.costPrice
      })),
      totalAmount: purchaseCart.reduce((acc, curr) => acc + (curr.costPrice * curr.qty), 0),
      status: 'Ordered',
      createdAt: new Date().toISOString()
    };

    onAddPurchaseOrder(newOrder);
    setIsPurchaseModalOpen(false);
    setSelectedSupplier(null);
    setPurchaseCart([]);
  };

  // Handle Quick Add Supplier
  const handleQuickAddSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!suppCompanyName.trim() || !suppPhone.trim() || !suppContactName.trim()) return;

    const newSupp: Supplier = {
      id: `SUP-${Date.now()}`,
      companyName: suppCompanyName.trim(),
      name: suppContactName.trim(),
      phone: suppPhone.trim(),
      email: suppEmail.trim() || undefined,
      address: suppAddress.trim() || undefined,
      notes: suppNotes.trim() || undefined,
      createdAt: new Date().toISOString()
    };

    onAddSupplier(newSupp);
    setSelectedSupplier(newSupp);
    setIsNewSuppModalOpen(false);
    setSuppCompanyName('');
    setSuppContactName('');
    setSuppPhone('');
    setSuppEmail('');
    setSuppAddress('');
    setSuppNotes('');
  };

  // Handle Quick Add Product
  const handleQuickAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdId.trim() || !newProdNameEn.trim() || newProdCost <= 0) return;

    const newProd: Product = {
      id: newProdId.trim(),
      nameEn: newProdNameEn.trim(),
      nameSi: newProdNameSi.trim() || newProdNameEn.trim(),
      category: newProdCategory,
      source: 'Supplier Purchased',
      costPrice: newProdCost,
      retailPrice: newProdRetail || (newProdCost * 1.3),
      wholesalePrice: newProdWholesale || (newProdCost * 1.15),
      wholesaleMinQty: newProdWholesaleMin,
      stock: 0, // Starts with 0 stock as we are creating a Purchase Order to buy it
      lowStockAlert: 5,
      brand: newProdBrand,
      rackLocation: newProdLocation,
      isWeighted: newProdIsWeighted,
      isTaxable: newProdIsTaxable
    };

    onAddProduct(newProd);
    setPurchaseCart(prev => [...prev, { product: newProd, qty: 10, costPrice: newProdCost }]);
    setIsNewProdModalOpen(false);
    setNewProdId('');
    setNewProdNameEn('');
    setNewProdNameSi('');
    setNewProdCost(0);
    setNewProdRetail(0);
    setNewProdWholesale(0);
    setNewProdWholesaleMin(5);
    setNewProdBrand('Generic');
    setNewProdLocation('Counter');
    setNewProdIsWeighted(false);
    setNewProdIsTaxable(true);
  };

  // Handle Add Stock Adjustment
  const handleCreateAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjProduct || adjQty === 0 || !adjReason.trim()) return;

    const newAdj: StockAdjustment = {
      id: `ADJ-${Math.floor(1000 + Math.random() * 9000)}`,
      productId: adjProduct.id,
      productName: adjProduct.nameEn,
      type: adjType,
      qtyAdjusted: adjQty,
      reason: adjReason.trim(),
      adjustedBy: 'Admin',
      createdAt: new Date().toISOString()
    };

    onAddStockAdjustment(newAdj);
    setIsAdjustmentModalOpen(false);
    setAdjProduct(null);
    setAdjQty(0);
    setAdjReason('');
  };

  const handleLookupTransaction = () => {
    setLookupError('');
    setLookupSuccess('');
    setMatchedSale(null);
    setMatchedPO(null);
    setRetProduct(null);
    setRetQty(1);
    setRetRefund(0);

    const term = retRelatedId.trim().toLowerCase();
    if (!term) {
      setLookupError(language === 'en' ? 'Please enter a Transaction ID.' : 'කරුණාකර ගනුදෙනු අංකය ඇතුළත් කරන්න.');
      return;
    }

    if (retType === 'Sales Return') {
      const found = sales.find(s => s.id.toLowerCase() === term);
      if (found) {
        setMatchedSale(found);
        setRetRelatedName(found.customerName || 'Walk-In Customer');
        setLookupSuccess(language === 'en' ? `Invoice found! Customer: ${found.customerName || 'Walk-In Customer'}` : `බිල්පත හමු විය! ගැනුම්කරු: ${found.customerName || 'Walk-In Customer'}`);
      } else {
        setLookupError(language === 'en' ? 'Invoice ID not found.' : 'බිල්පත් අංකය හමු නොවීය.');
      }
    } else {
      const found = purchaseOrders.find(po => po.id.toLowerCase() === term);
      if (found) {
        setMatchedPO(found);
        setRetRelatedName(found.supplierName);
        setLookupSuccess(language === 'en' ? `PO found! Supplier: ${found.supplierName}` : `මිලදී ගැනීමේ ඇණවුම හමු විය! සැපයුම්කරු: ${found.supplierName}`);
      } else {
        setLookupError(language === 'en' ? 'Purchase Order ID not found.' : 'මිලදී ගැනීමේ ඇණවුම් අංකය හමු නොවීය.');
      }
    }
  };

  // Handle Add Stock Return
  const handleCreateReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!retProduct || retQty <= 0 || !retReason.trim()) return;

    const newRet: StockReturn = {
      id: `RET-${Math.floor(1000 + Math.random() * 9000)}`,
      type: retType,
      relatedId: retRelatedId.trim(),
      customerOrSupplierName: retName.trim(),
      items: [{
        productId: retProduct.id,
        productName: retProduct.nameEn,
        qty: retQty,
        refundAmount: retRefund
      }],
      totalRefund: retRefund,
      reason: retReason.trim(),
      createdAt: new Date().toISOString(),
      action: retType === 'Sales Return' ? returnAction : undefined
    };

    onAddStockReturn(newRet);
    setIsReturnModalOpen(false);
    setRetProduct(null);
    setRetQty(1);
    setRetRefund(0);
    setRetReason('');
    setRetRelatedId('');
    setRetRelatedName('');
    setMatchedSale(null);
    setMatchedPO(null);
    setLookupError('');
    setLookupSuccess('');
  };

  return (
    <div className="space-y-6">
      {/* Primary Sub-tabs Toggle */}
      <div className="flex overflow-x-auto whitespace-nowrap scrollbar-none border-b border-slate-200 bg-white p-2 rounded-xl shadow-sm space-x-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <button
          onClick={() => handleTabChange('purchases')}
          className={`shrink-0 px-4 py-2 rounded-lg text-xs font-bold transition flex items-center ${
            activeTab === 'purchases' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Truck className="h-4 w-4 mr-1.5" />
          {language === 'en' ? 'Purchases (Supplier Orders)' : 'බඩු මිලදී ගැනීම් (Purchases)'}
        </button>
        <button
          onClick={() => handleTabChange('adjustments')}
          className={`shrink-0 px-4 py-2 rounded-lg text-xs font-bold transition flex items-center ${
            activeTab === 'adjustments' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ClipboardSignature className="h-4 w-4 mr-1.5" />
          {language === 'en' ? 'Stock Adjustments' : 'තොග වෙනස් කිරීම් (Adjustments)'}
        </button>
        <button
          onClick={() => handleTabChange('returns')}
          className={`shrink-0 px-4 py-2 rounded-lg text-xs font-bold transition flex items-center ${
            activeTab === 'returns' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ArrowLeftRight className="h-4 w-4 mr-1.5" />
          {language === 'en' ? 'Returns Management' : 'භාණ්ඩ ආපසු එවීම් (Returns)'}
        </button>
      </div>

      {/* PURCHASES TAB */}
      {activeTab === 'purchases' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center">
              <Truck className="h-4.5 w-4.5 mr-1.5 text-blue-600" />
              {language === 'en' ? 'Supplier Purchase Orders' : 'විකුණුම්කරුවන්ගේ මිලදී ගැනීමේ ඇණවුම්'}
            </h3>
            <button
              onClick={() => setIsPurchaseModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-md flex items-center"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              {language === 'en' ? 'New Purchase Order' : 'නව මිලදී ගැනීමේ ඇණවුමක්'}
            </button>
          </div>

          {/* Re-order suggestions block */}
          {reorderSuggestions.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-4">
              <h4 className="text-xs font-bold text-amber-800 flex items-center">
                <AlertTriangle className="h-4.5 w-4.5 mr-1.5 animate-bounce" />
                {language === 'en' ? 'Auto Stock Re-Order Suggestions' : 'ස්වයංක්‍රීය නැවත ඇණවුම් යෝජනා'}
              </h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                {language === 'en' 
                  ? 'The following items are running low on stock. Click below to generate a reorder checklist which you can send to suppliers.'
                  : 'පහත සඳහන් භාණ්ඩවල තොග අවසන් වෙමින් පවතී. සැපයුම්කරුවන්ට යැවිය හැකි නැවත ඇණවුම් ලැයිස්තුවක් සාදා ගැනීමට පහත බොත්තම ඔබන්න.'}
              </p>

              {/* Grouped Display by Category */}
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {Object.entries(groupedSuggestions).map(([cat, items]) => (
                  <div key={cat} className="space-y-1 bg-white/45 p-2 rounded-xl border border-amber-100/50">
                    <span className="text-[9px] font-black uppercase text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200 tracking-wider inline-block">
                      {cat}
                    </span>
                    <div className="flex flex-wrap gap-1.5 pt-1 pl-1">
                      {items.map(p => (
                        <span key={p.id} className="bg-white border border-amber-200/50 px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-700 shadow-sm flex items-center gap-1">
                          <span>{p.nameEn}</span>
                          <span className="text-[9px] text-rose-600 font-black">({p.stock} left)</span>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  let listText = '*** AUTO STOCK REORDER SUGGESTIONS ***\n';
                  listText += `Generated: ${new Date().toLocaleString()}\n\n`;
                  
                  Object.entries(groupedSuggestions).forEach(([cat, items]) => {
                    listText += `\nCATEGORY: ${cat.toUpperCase()}\n`;
                    listText += `========================================\n`;
                    items.forEach(p => {
                      listText += `- [ ] ${p.nameEn} (ID: ${p.id}) - Current Stock: ${p.stock} | Low Stock Alert Limit: ${p.lowStockAlert}\n`;
                    });
                  });

                  const blob = new Blob([listText], { type: 'text/plain;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `Reorder_Checklist_${new Date().toISOString().split('T')[0]}.txt`;
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                }}
                className="bg-amber-600 hover:bg-amber-700 active:scale-95 text-white px-4 py-2 rounded-xl text-xs font-black transition shadow shadow-amber-600/10 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span>{language === 'en' ? 'Download Grouped Checklist' : 'කාණ්ඩ අනුව ඇණවුම් ලැයිස්තුව බාගත කරන්න'}</span>
              </button>
            </div>
          )}

          {/* Search & Filter Bar */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder={language === 'en' ? 'Search by PO ID, Supplier name/phone, Product name/barcode...' : 'PO අංකය, සැපයුම්කරු නම/දුරකථන, භාණ්ඩ නම/බාකෝඩ් මගින් සොයන්න...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 placeholder-slate-400"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span>{language === 'en' ? 'From' : 'සිට'}:</span>
                <input
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="bg-transparent focus:outline-none text-slate-700 font-bold border-none p-0 cursor-pointer text-xs"
                />
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span>{language === 'en' ? 'To' : 'දක්වා'}:</span>
                <input
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  className="bg-transparent focus:outline-none text-slate-700 font-bold border-none p-0 cursor-pointer text-xs"
                />
              </div>
              {(searchTerm || filterStartDate || filterEndDate) && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterStartDate('');
                    setFilterEndDate('');
                  }}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-extrabold transition cursor-pointer"
                  title="Clear Filters"
                >
                  {language === 'en' ? 'Clear' : 'පිරිසිදු කරන්න'}
                </button>
              )}
            </div>
          </div>

          {/* Purchase Orders Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-extrabold text-[10px] tracking-wider border-b border-slate-100">
                    <th className="py-4 px-6">PO ID</th>
                    <th className="py-4 px-6">SUPPLIER</th>
                    <th className="py-4 px-6">ITEMS ORDERED</th>
                    <th className="py-4 px-6 text-right">TOTAL AMOUNT</th>
                    <th className="py-4 px-6 text-center">STATUS</th>
                    <th className="py-4 px-6 text-center">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                  {filteredPurchaseOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">No purchase orders found.</td>
                    </tr>
                  ) : (
                    purchaseOrders.map(order => (
                      <tr key={order.id} className="hover:bg-slate-50/50">
                        <td className="py-4 px-6 text-slate-400 font-bold">{order.id}</td>
                        <td className="py-4 px-6 font-bold text-slate-800">{order.supplierName}</td>
                        <td className="py-4 px-6 min-w-[200px]">
                          <div className="space-y-0.5">
                            {order.items.map((i: any, idx: number) => (
                              <div key={idx} className="text-[11px] text-slate-600">
                                • {i.productName} (x{i.qty})
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right font-extrabold text-slate-800">Rs. {order.totalAmount.toLocaleString()}</td>
                        <td className="py-4 px-6 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            order.status === 'Received' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            {order.status === 'Ordered' && (
                              <button
                                onClick={() => {
                                  if (confirm(language === 'en' ? 'Have you received all items and want to update stock?' : 'සියලුම භාණ්ඩ ලැබුණිද? තොගය යාවත්කාලීන කරන්නද?')) {
                                    onReceivePurchaseOrder(order.id);
                                  }
                                }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded-lg text-[10px] font-bold shadow-sm transition cursor-pointer"
                              >
                                Receive
                              </button>
                            )}
                            <button
                              onClick={() => {
                                if (confirm(language === 'en' ? `Are you sure you want to delete purchase order ${order.id}?` : `මිලදී ගැනීමේ ඇණවුම ${order.id} මකා දැමීමට අවශ්‍ය බව ස්ථිරද?`)) {
                                  onDeletePurchaseOrder(order.id);
                                }
                              }}
                              className="p-1 text-rose-600 hover:bg-slate-100 rounded transition cursor-pointer"
                              title="Delete Purchase Order"
                            >
                              <Trash2 className="h-4 w-4" />
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

      {/* ADJUSTMENTS TAB */}
      {activeTab === 'adjustments' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center">
              <ClipboardSignature className="h-4.5 w-4.5 mr-1.5 text-blue-600" />
              {language === 'en' ? 'Stock Adjustments Ledger' : 'තොග ගැලපුම් ලේඛනය'}
            </h3>
            <button
              onClick={() => setIsAdjustmentModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-md flex items-center"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              {language === 'en' ? 'Record Adjustment' : 'තොග ගැලපුමක් සිදු කරන්න'}
            </button>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder={language === 'en' ? 'Search by Adjustment ID, Product ID/Name, Reason, Person...' : 'ගැලපුම් අංකය, භාණ්ඩ අංකය/නම, හේතුව, පුද්ගලයා මගින් සොයන්න...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 placeholder-slate-400"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span>{language === 'en' ? 'From' : 'සිට'}:</span>
                <input
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="bg-transparent focus:outline-none text-slate-700 font-bold border-none p-0 cursor-pointer text-xs"
                />
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span>{language === 'en' ? 'To' : 'දක්වා'}:</span>
                <input
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  className="bg-transparent focus:outline-none text-slate-700 font-bold border-none p-0 cursor-pointer text-xs"
                />
              </div>
              {(searchTerm || filterStartDate || filterEndDate) && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterStartDate('');
                    setFilterEndDate('');
                  }}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-extrabold transition cursor-pointer"
                  title="Clear Filters"
                >
                  {language === 'en' ? 'Clear' : 'පිරිසිදු කරන්න'}
                </button>
              )}
            </div>
          </div>

          {/* Adjustments Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-extrabold text-[10px] tracking-wider border-b border-slate-100">
                    <th className="py-4 px-6">ADJ ID</th>
                    <th className="py-4 px-6">PRODUCT</th>
                    <th className="py-4 px-6 text-center">TYPE</th>
                    <th className="py-4 px-6 text-center">QTY ADJUSTED</th>
                    <th className="py-4 px-6">REASON</th>
                    <th className="py-4 px-6">ADJUSTED BY</th>
                    <th className="py-4 px-6 text-center">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                  {filteredStockAdjustments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">No adjustments recorded.</td>
                    </tr>
                  ) : (
                    filteredStockAdjustments.map(adj => (
                      <tr key={adj.id} className="hover:bg-slate-50/50">
                        <td className="py-4 px-6 text-slate-400 font-bold">{adj.id}</td>
                        <td className="py-4 px-6 font-bold text-slate-800">{adj.productName}</td>
                        <td className="py-4 px-6 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            adj.type === 'Wastage' ? 'bg-rose-100 text-rose-800' : adj.type === 'Damage' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {adj.type}
                          </span>
                        </td>
                        <td className={`py-4 px-6 text-center font-extrabold ${adj.qtyAdjusted < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {adj.qtyAdjusted > 0 ? `+${adj.qtyAdjusted}` : adj.qtyAdjusted}
                        </td>
                        <td className="py-4 px-6 text-slate-500 font-medium">{adj.reason}</td>
                        <td className="py-4 px-6 text-slate-500">{adj.adjustedBy}</td>
                        <td className="py-4 px-6 text-center">
                          <button
                            onClick={() => {
                              if (confirm(language === 'en' ? `Are you sure you want to delete stock adjustment ${adj.id}?` : `තොග ගැලපුම ${adj.id} මකා දැමීමට අවශ්‍ය බව ස්ථිරද?`)) {
                                onDeleteStockAdjustment(adj.id);
                              }
                            }}
                            className="p-1 text-rose-600 hover:bg-slate-100 rounded transition cursor-pointer"
                            title="Delete Adjustment"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
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

      {/* RETURNS TAB */}
      {activeTab === 'returns' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center">
              <ArrowLeftRight className="h-4.5 w-4.5 mr-1.5 text-blue-600" />
              {language === 'en' ? 'Manage Returns' : 'ආපසු ලැබුණු/යැවූ භාණ්ඩ කළමනාකරණය'}
            </h3>
            <button
              onClick={() => setIsReturnModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-md flex items-center"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              {language === 'en' ? 'Record Return' : 'ආපසු එවීමක් සටහන් කරන්න'}
            </button>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder={language === 'en' ? 'Search by Return ID, Related ID, Customer/Supplier name, Reason, Product name/barcode...' : 'ආපසු එවීම් අංකය, අදාළ අංකය, පාරිභෝගික/සැපයුම්කරු නම, හේතුව, භාණ්ඩ නම/බාකෝඩ් මගින් සොයන්න...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 placeholder-slate-400"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span>{language === 'en' ? 'From' : 'සිට'}:</span>
                <input
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="bg-transparent focus:outline-none text-slate-700 font-bold border-none p-0 cursor-pointer text-xs"
                />
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span>{language === 'en' ? 'To' : 'දක්වා'}:</span>
                <input
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  className="bg-transparent focus:outline-none text-slate-700 font-bold border-none p-0 cursor-pointer text-xs"
                />
              </div>
              {(searchTerm || filterStartDate || filterEndDate) && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterStartDate('');
                    setFilterEndDate('');
                  }}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-extrabold transition cursor-pointer"
                  title="Clear Filters"
                >
                  {language === 'en' ? 'Clear' : 'පිරිසිදු කරන්න'}
                </button>
              )}
            </div>
          </div>

          {/* Returns Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-extrabold text-[10px] tracking-wider border-b border-slate-100">
                    <th className="py-4 px-6">RET ID</th>
                    <th className="py-4 px-6">TYPE</th>
                    <th className="py-4 px-6">CUST / SUPP NAME</th>
                    <th className="py-4 px-6">ITEMS</th>
                    <th className="py-4 px-6 text-right">REFUND AMOUNT</th>
                    <th className="py-4 px-6">REASON</th>
                    <th className="py-4 px-6 text-center">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                  {filteredStockReturns.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">No returns recorded.</td>
                    </tr>
                  ) : (
                    filteredStockReturns.map(ret => (
                      <tr key={ret.id} className="hover:bg-slate-50/50">
                        <td className="py-4 px-6 text-slate-400 font-bold">{ret.id}</td>
                        <td className="py-4 px-6">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            ret.type === 'Sales Return' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {ret.type}
                          </span>
                        </td>
                        <td className="py-4 px-6 font-bold text-slate-800">{ret.customerOrSupplierName}</td>
                        <td className="py-4 px-6 min-w-[150px]">
                          {ret.items.map((i, idx) => (
                            <div key={idx} className="text-[11px] text-slate-600">
                              {i.productName} (x{i.qty})
                            </div>
                          ))}
                        </td>
                        <td className="py-4 px-6 text-right font-extrabold text-blue-600">Rs. {ret.totalRefund.toLocaleString()}</td>
                        <td className="py-4 px-6 text-slate-500 font-medium">{ret.reason}</td>
                        <td className="py-4 px-6 text-center">
                          <button
                            onClick={() => {
                              if (confirm(language === 'en' ? `Are you sure you want to delete stock return ${ret.id}?` : `භාණ්ඩ ආපසු එවීම ${ret.id} මකා දැමීමට අවශ්‍ය බව ස්ථිරද?`)) {
                                onDeleteStockReturn(ret.id);
                              }
                            }}
                            className="p-1 text-rose-600 hover:bg-slate-100 rounded transition cursor-pointer"
                            title="Delete Return"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
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

      {/* NEW PURCHASE ORDER MODAL */}
      {isPurchaseModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-950 text-white p-4 flex justify-between items-center">
              <h3 className="text-xs font-bold flex items-center">
                <Truck className="h-4 w-4 mr-1 text-blue-400" />
                {language === 'en' ? 'Create Supplier Purchase Order' : 'නව සැපයුම් ඇණවුමක් සාදන්න'}
              </h3>
              <button onClick={() => setIsPurchaseModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreatePurchaseOrder} className="p-6 space-y-4 text-xs font-semibold">
              {/* Select Supplier with Quick Add button */}
              <div className="space-y-1">
                <label className="font-bold text-slate-500 flex justify-between items-center">
                  <span>Select Supplier *</span>
                  <button
                    type="button"
                    onClick={() => setIsNewSuppModalOpen(true)}
                    className="text-blue-600 hover:underline flex items-center"
                  >
                    <Plus className="h-3 w-3 mr-0.5" /> Quick Add Supplier
                  </button>
                </label>
                <select
                  required
                  value={selectedSupplier?.id || ''}
                  onChange={(e) => setSelectedSupplier(suppliers.find(s => s.id === e.target.value) || null)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white font-bold"
                >
                  <option value="">-- Choose Supplier --</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.companyName} ({s.name})</option>
                  ))}
                </select>
              </div>

              {/* Add items to order cart with Quick Add Product button */}
              <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-slate-500">Add Product to Order</label>
                  <button
                    type="button"
                    onClick={() => setIsNewProdModalOpen(true)}
                    className="text-blue-600 hover:underline flex items-center text-[11px]"
                  >
                    <Plus className="h-3 w-3 mr-0.5" /> Add New Product
                  </button>
                </div>
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-12">
                    <select
                      id="po-product-select"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white"
                      onChange={(e) => {
                        const prod = products.find(p => p.id === e.target.value);
                        if (!prod) return;
                        setPurchaseCart(prev => {
                          const existing = prev.find(item => item.product.id === prod.id);
                          if (existing) return prev;
                          return [...prev, { product: prod, qty: 10, costPrice: prod.costPrice }];
                        });
                      }}
                    >
                      <option value="">-- Select Product --</option>
                      {products.filter(p => p.stock !== 'Unlimited').map(p => (
                        <option key={p.id} value={p.id}>{p.nameEn} (Cost: Rs. {p.costPrice})</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Cart Items with editable cost price */}
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {purchaseCart.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <div className="flex-1 min-w-0 pr-2">
                      <h4 className="font-bold text-slate-800 truncate">{item.product.nameEn}</h4>
                      
                      {/* Editable Cost Price */}
                      <div className="flex items-center space-x-1 mt-1">
                        <span className="text-[10px] text-slate-400">Cost (LKR):</span>
                        <input
                          type="number"
                          value={item.costPrice}
                          onChange={(e) => {
                            const newCost = Number(e.target.value);
                            setPurchaseCart(prev => prev.map(c => c.product.id === item.product.id ? { ...c, costPrice: newCost } : c));
                          }}
                          className="w-20 px-1 py-0.5 border border-slate-200 rounded text-[11px] font-bold"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setPurchaseCart(prev => prev.map(c => c.product.id === item.product.id ? { ...c, qty: val } : c));
                        }}
                        className="w-16 px-2 py-1 border border-slate-200 rounded text-center font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => setPurchaseCart(prev => prev.filter(c => c.product.id !== item.product.id))}
                        className="text-slate-400 hover:text-rose-500"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex space-x-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsPurchaseModalOpen(false)} className="flex-1 bg-slate-100 py-2 rounded-lg font-bold">Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold shadow">Submit Order</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK ADD SUPPLIER MODAL */}
      {isNewSuppModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-950 text-white p-4 flex justify-between items-center">
              <h3 className="text-xs font-bold flex items-center">
                <Truck className="h-4 w-4 mr-1 text-blue-400" />
                {language === 'en' ? 'Add New Supplier' : 'නව විකුණුම්කරුවෙකු ඇතුළත් කරන්න'}
              </h3>
              <button onClick={() => { setIsNewSuppModalOpen(false); setSuppCompanyName(''); setSuppContactName(''); setSuppPhone(''); setSuppEmail(''); setSuppAddress(''); setSuppNotes(''); }} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleQuickAddSupplier} className="p-5 space-y-3 text-xs font-semibold">
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Company Name *</label>
                <input
                  type="text" required value={suppCompanyName} onChange={(e) => setSuppCompanyName(e.target.value)}
                  placeholder="e.g. Abans Distributors" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Contact Person Name *</label>
                <input
                  type="text" required value={suppContactName} onChange={(e) => setSuppContactName(e.target.value)}
                  placeholder="e.g. Sunil Perera" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Phone Number *</label>
                <input
                  type="tel" required value={suppPhone} onChange={(e) => setSuppPhone(e.target.value)}
                  placeholder="e.g. 0112233445" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Email Address</label>
                <input
                  type="email" value={suppEmail} onChange={(e) => setSuppEmail(e.target.value)}
                  placeholder="e.g. sales@abans.lk" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Address</label>
                <input
                  type="text" value={suppAddress} onChange={(e) => setSuppAddress(e.target.value)}
                  placeholder="e.g. Colombo Road, Kurunegala" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Notes</label>
                <textarea
                  value={suppNotes} onChange={(e) => setSuppNotes(e.target.value)}
                  placeholder="Add custom notes..." rows={2} className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button type="button" onClick={() => { setIsNewSuppModalOpen(false); setSuppCompanyName(''); setSuppContactName(''); setSuppPhone(''); setSuppEmail(''); setSuppAddress(''); setSuppNotes(''); }} className="flex-1 bg-slate-100 py-2 rounded-lg font-bold">Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold shadow">Save Supplier</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK ADD PRODUCT MODAL */}
      {isNewProdModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-950 text-white p-4 flex justify-between items-center">
              <h3 className="text-xs font-bold flex items-center">
                <Plus className="h-4 w-4 mr-1 text-blue-400" />
                {language === 'en' ? 'Add New Product to Inventory' : 'නව භාණ්ඩයක් ඇතුළත් කරන්න'}
              </h3>
              <button onClick={() => { setIsNewProdModalOpen(false); setNewProdId(''); setNewProdNameEn(''); setNewProdNameSi(''); setNewProdCost(0); setNewProdRetail(0); setNewProdWholesale(0); setNewProdBrand('Generic'); setNewProdLocation('Counter'); setNewProdIsWeighted(false); setNewProdIsTaxable(true); }} className="text-slate-400 hover:text-white">✕</button>
            </div>
            
            <form onSubmit={handleQuickAddProduct} className="p-6 space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* ID */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Product ID / Code *</label>
                  <input
                    type="text" required value={newProdId} onChange={(e) => setNewProdId(e.target.value)}
                    placeholder="e.g. P101" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-500">{t.category}</label>
                  <div className="flex gap-2">
                    <select
                      value={newProdCategory}
                      onChange={(e) => setNewProdCategory(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-bold bg-white"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{(t as any)[cat] || cat}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        const newCat = prompt(
                          language === 'en' 
                            ? 'Enter new category name:' 
                            : 'නව වර්ගීකරණයේ නම ඇතුළත් කරන්න:'
                        );
                        if (newCat) {
                          onAddCategory(newCat);
                          setNewProdCategory(newCat);
                        }
                      }}
                      className="px-3 bg-blue-50 hover:bg-blue-105 active:scale-95 text-blue-600 border border-blue-200 rounded-lg font-bold transition flex items-center justify-center shrink-0"
                      title={language === 'en' ? 'Add New Category' : 'නව වර්ගීකරණයක් එක් කරන්න'}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Name EN */}
                <div className="space-y-1 md:col-span-2">
                  <label className="font-bold text-slate-500">{t.productNameEn} *</label>
                  <input
                    type="text" required value={newProdNameEn} onChange={(e) => setNewProdNameEn(e.target.value)}
                    placeholder="e.g. Samsung Fast Charger" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-bold"
                  />
                </div>

                {/* Name SI */}
                <div className="space-y-1 md:col-span-2">
                  <label className="font-bold text-slate-500">{t.productNameSi} *</label>
                  <input
                    type="text" required value={newProdNameSi} onChange={(e) => setNewProdNameSi(e.target.value)}
                    placeholder="උදා: සැම්සුන්ග් වේගවත් චාජරය" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-bold"
                  />
                </div>

                {/* Brand */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Brand Name</label>
                  <input
                    type="text" value={newProdBrand} onChange={(e) => setNewProdBrand(e.target.value)}
                    placeholder="e.g. Anker" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                  />
                </div>

                {/* Rack Location */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Rack / Location</label>
                  <input
                    type="text" value={newProdLocation} onChange={(e) => setNewProdLocation(e.target.value)}
                    placeholder="e.g. Rack A-1" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                  />
                </div>

                {/* Cost Price */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Cost Price (LKR) *</label>
                  <input
                    type="number" required value={newProdCost || ''} onChange={(e) => setNewProdCost(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                  />
                </div>

                {/* Retail Price */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Retail Price (LKR) *</label>
                  <input
                    type="number" required value={newProdRetail || ''} onChange={(e) => setNewProdRetail(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                  />
                </div>

                {/* Wholesale Price */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Wholesale Price (LKR)</label>
                  <input
                    type="number" value={newProdWholesale || ''} onChange={(e) => setNewProdWholesale(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                  />
                </div>

                {/* Wholesale Min Qty */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Wholesale Min Qty</label>
                  <input
                    type="number" value={newProdWholesaleMin} onChange={(e) => setNewProdWholesaleMin(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                  />
                </div>

                {/* Sold by Weight */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Sold by Weight?</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button" onClick={() => setNewProdIsWeighted(true)}
                      className={`py-1.5 rounded-lg border transition ${
                        newProdIsWeighted ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      Yes (by kg)
                    </button>
                    <button
                      type="button" onClick={() => setNewProdIsWeighted(false)}
                      className={`py-1.5 rounded-lg border transition ${
                        !newProdIsWeighted ? 'bg-blue-650 text-white border-blue-600' : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      No (by unit)
                    </button>
                  </div>
                </div>

                {/* Taxable */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Taxable (VAT+SSCL)?</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button" onClick={() => setNewProdIsTaxable(true)}
                      className={`py-1.5 rounded-lg border transition ${
                        newProdIsTaxable ? 'bg-blue-650 text-white border-blue-600' : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button" onClick={() => setNewProdIsTaxable(false)}
                      className={`py-1.5 rounded-lg border transition ${
                        !newProdIsTaxable ? 'bg-slate-800 text-white border-slate-800' : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex space-x-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => { setIsNewProdModalOpen(false); setNewProdId(''); setNewProdNameEn(''); setNewProdNameSi(''); setNewProdCost(0); setNewProdRetail(0); setNewProdWholesale(0); setNewProdBrand('Generic'); setNewProdLocation('Counter'); setNewProdIsWeighted(false); setNewProdIsTaxable(true); }} className="flex-1 bg-slate-100 py-2 rounded-lg font-bold">Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold shadow">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW ADJUSTMENT MODAL */}
      {isAdjustmentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-950 text-white p-4 flex justify-between items-center">
              <h3 className="text-xs font-bold flex items-center">
                <ClipboardSignature className="h-4 w-4 mr-1 text-blue-400" />
                {language === 'en' ? 'Record Stock Adjustment' : 'නව තොග වෙනස් කිරීමක්'}
              </h3>
              <button onClick={() => setIsAdjustmentModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateAdjustment} className="p-5 space-y-3 text-xs font-semibold">
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Select Product *</label>
                <select
                  required
                  onChange={(e) => setAdjProduct(products.find(p => p.id === e.target.value) || null)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white font-bold"
                >
                  <option value="">-- Choose Product --</option>
                  {products.filter(p => p.stock !== 'Unlimited').map(p => (
                    <option key={p.id} value={p.id}>{p.nameEn} (Stock: {p.stock})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500">Adjustment Type</label>
                <select
                  value={adjType}
                  onChange={(e) => setAdjType(e.target.value as any)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white"
                >
                  <option value="Wastage">Wastage (අපතේ යාම)</option>
                  <option value="Damage">Damage (හානි වීම්)</option>
                  <option value="Manual Correction">Manual Correction (තොග නිවැරදි කිරීම)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500">Quantity Adjusted (Use negative for loss) *</label>
                <input
                  type="number"
                  required
                  value={adjQty || ''}
                  onChange={(e) => setAdjQty(Number(e.target.value))}
                  placeholder="e.g. -2 or 5"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500">Reason / Remarks *</label>
                <input
                  type="text"
                  required
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  placeholder="Describe why stock is adjusted..."
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button type="button" onClick={() => setIsAdjustmentModalOpen(false)} className="flex-1 bg-slate-100 py-2 rounded-lg font-bold">Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold shadow">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW RETURN MODAL */}
      {isReturnModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-950 text-white p-4 flex justify-between items-center">
              <h3 className="text-xs font-bold flex items-center">
                <ArrowLeftRight className="h-4 w-4 mr-1 text-blue-400" />
                {language === 'en' ? 'Record Stock Return' : 'භාණ්ඩ ආපසු එවීමක්'}
              </h3>
              <button onClick={() => {
                setIsReturnModalOpen(false);
                setLookupError('');
                setLookupSuccess('');
                setMatchedSale(null);
                setMatchedPO(null);
                setRetProduct(null);
              }} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateReturn} className="p-5 space-y-3 text-xs font-semibold">
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Return Type</label>
                <select
                  value={retType}
                  onChange={(e) => {
                    setRetType(e.target.value as any);
                    setRetRelatedId('');
                    setRetRelatedName('');
                    setMatchedSale(null);
                    setMatchedPO(null);
                    setRetProduct(null);
                    setLookupError('');
                    setLookupSuccess('');
                  }}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white font-bold"
                >
                  <option value="Sales Return">Sales Return (පාරිභෝගිකයාගෙන් නැවත ලැබුණු)</option>
                  <option value="Purchase Return">Purchase Return (සැපයුම්කරුට ආපසු යැවූ)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500">Related ID (Invoice / PO ID)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={retRelatedId}
                    onChange={(e) => setRetRelatedId(e.target.value)}
                    placeholder={retType === 'Sales Return' ? 'e.g. S-POS-1234' : 'e.g. PO-5678'}
                    className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-bold"
                  />
                  <button
                    type="button"
                    onClick={handleLookupTransaction}
                    className="px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition whitespace-nowrap"
                  >
                    {language === 'en' ? 'Lookup' : 'සොයන්න'}
                  </button>
                </div>
              </div>

              {/* Lookup Message Alerts */}
              {lookupError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 p-2 rounded-lg text-[10px] font-bold">
                  ⚠️ {lookupError}
                </div>
              )}
              {lookupSuccess && (
                <div className="bg-emerald-50 border border-emerald-255 text-emerald-700 p-2 rounded-lg text-[10px] font-bold">
                  ✓ {lookupSuccess}
                </div>
              )}

              <div className="space-y-1">
                <label className="font-bold text-slate-500">Customer / Supplier Name</label>
                <input
                  type="text"
                  required
                  value={retName}
                  onChange={(e) => setRetRelatedName(e.target.value)}
                  placeholder="e.g. Kasun Rathnayake"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500 flex justify-between">
                  <span>Select Returned Product *</span>
                  {matchedSale || matchedPO ? (
                    <span className="text-[9px] text-blue-600 font-bold bg-blue-50 px-1.5 rounded border border-blue-200">Autofiltering active</span>
                  ) : null}
                </label>
                <select
                  required
                  value={retProduct?.id || ''}
                  onChange={(e) => {
                    const prodId = e.target.value;
                    const matched = products.find(p => p.id === prodId) || null;
                    setRetProduct(matched);
                    
                    if (matched) {
                      // Autofill refund amount based on original invoice pricing
                      if (matchedSale) {
                        const originalItem = matchedSale.items.find(it => it.productId === prodId);
                        if (originalItem) {
                          setRetQty(1);
                          setRetRefund(originalItem.price);
                        }
                      } else if (matchedPO) {
                        const originalItem = matchedPO.items.find(it => it.productId === prodId);
                        if (originalItem) {
                          setRetQty(1);
                          setRetRefund(originalItem.costPrice);
                        }
                      } else {
                        // Fallback to current retail price
                        setRetQty(1);
                        setRetRefund(matched.retailPrice);
                      }
                    }
                  }}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white font-bold"
                >
                  <option value="">-- Choose Product --</option>
                  {matchedSale ? (
                    products.filter(p => matchedSale.items.some(item => item.productId === p.id)).map(p => (
                      <option key={p.id} value={p.id}>{p.nameEn} (Invoice Qty: {matchedSale.items.find(it => it.productId === p.id)?.quantity})</option>
                    ))
                  ) : matchedPO ? (
                    products.filter(p => matchedPO.items.some(item => item.productId === p.id)).map(p => (
                      <option key={p.id} value={p.id}>{p.nameEn} (Ordered Qty: {matchedPO.items.find(it => it.productId === p.id)?.qty})</option>
                    ))
                  ) : (
                    products.map(p => (
                      <option key={p.id} value={p.id}>{p.nameEn}</option>
                    ))
                  )}
                </select>
              </div>

              {/* Optional stock return action (Sales Returns only) */}
              {retType === 'Sales Return' && (
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Inventory Return Action</label>
                  <select
                    value={returnAction}
                    onChange={(e) => setReturnAction(e.target.value as any)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white font-bold text-slate-700"
                  >
                    <option value="Return to Stock">↩ Put back in saleable stock (පෙර තොගයට එක් කරන්න)</option>
                    <option value="Scrap">🗑 Scrap / Mark Damaged (අවලංගු/හානි ලෙස සලකන්න)</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 flex justify-between">
                    <span>Quantity *</span>
                    {matchedSale || matchedPO ? (
                      <span className="text-[9.5px] text-slate-400">
                        Max: {
                          matchedSale 
                            ? (matchedSale.items.find(it => it.productId === retProduct?.id)?.quantity || 1)
                            : (matchedPO?.items.find(it => it.productId === retProduct?.id)?.qty || 1)
                        }
                      </span>
                    ) : null}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={
                      matchedSale 
                        ? (matchedSale.items.find(it => it.productId === retProduct?.id)?.quantity || undefined)
                        : matchedPO 
                        ? (matchedPO.items.find(it => it.productId === retProduct?.id)?.qty || undefined)
                        : undefined
                    }
                    required
                    value={retQty}
                    onChange={(e) => {
                      const val = Math.max(1, Number(e.target.value));
                      setRetQty(val);
                      // Auto recalculate refund
                      if (retProduct) {
                        if (matchedSale) {
                          const originalItem = matchedSale.items.find(it => it.productId === retProduct.id);
                          if (originalItem) setRetRefund(originalItem.price * val);
                        } else if (matchedPO) {
                          const originalItem = matchedPO.items.find(it => it.productId === retProduct.id);
                          if (originalItem) setRetRefund(originalItem.costPrice * val);
                        } else {
                          setRetRefund(retProduct.retailPrice * val);
                        }
                      }
                    }}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Refund Amount (LKR) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={retRefund || ''}
                    onChange={(e) => setRetRefund(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500">Reason for Return *</label>
                <input
                  type="text"
                  required
                  value={retReason}
                  onChange={(e) => setRetReason(e.target.value)}
                  placeholder="e.g. Faulty product / wrong model"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button type="button" onClick={() => {
                  setIsReturnModalOpen(false);
                  setLookupError('');
                  setLookupSuccess('');
                  setMatchedSale(null);
                  setMatchedPO(null);
                  setRetProduct(null);
                }} className="flex-1 bg-slate-100 py-2 rounded-lg font-bold">Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold shadow">Save Return</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
