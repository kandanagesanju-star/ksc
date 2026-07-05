import React, { useState, useMemo, useEffect } from 'react';
import { RepairJob, Quotation, Customer, RepairStatus, Product } from '../types';
import { translations } from '../lib/translations';
import { 
  Plus, Search, Wrench, Edit, Trash2, Printer, CheckCircle, 
  Clock, Notebook, Calendar, User, Phone, FileText, ArrowRight, X, MapPin 
} from 'lucide-react';

interface QuotationsRepairsProps {
  language: 'en' | 'si';
  repairs: RepairJob[];
  quotations: Quotation[];
  customers: Customer[];
  products: Product[];
  onAddRepair: (repair: RepairJob) => void;
  onUpdateRepairStatus: (repairId: string, status: RepairStatus, notes: string, actualCost?: number) => void;
  onAddQuotation: (quote: Quotation) => void;
  onAddCustomer: (customer: Customer) => Customer;
  onAddProduct: (product: Product) => void;
  onUpdateQuotation: (quote: Quotation) => void;
  onDeleteQuotation: (id: string) => void;
  onUpdateRepair: (repair: RepairJob) => void;
  onDeleteRepair: (id: string) => void;
  activeSubTab?: string;
  onSubTabChange?: (tab: any) => void;
}

export const QuotationsRepairs: React.FC<QuotationsRepairsProps> = ({
  language,
  repairs,
  quotations,
  customers,
  products,
  onAddRepair,
  onUpdateRepairStatus,
  onAddQuotation,
  onAddCustomer,
  onAddProduct,
  onUpdateQuotation,
  onDeleteQuotation,
  onUpdateRepair,
  onDeleteRepair,
  activeSubTab,
  onSubTabChange
}) => {
  const t = translations[language];

  // Primary Tabs
  const [activeTab, setActiveTab] = useState<'repairs' | 'quotations'>('repairs');

  useEffect(() => {
    if (activeSubTab && (activeSubTab === 'repairs' || activeSubTab === 'quotations')) {
      setActiveTab(activeSubTab as any);
    }
  }, [activeSubTab]);

  // Search
  const [repairSearch, setRepairSearch] = useState('');
  const [quoteSearch, setQuoteSearch] = useState('');

  // Modals
  const [isRepairModalOpen, setIsRepairModalOpen] = useState(false);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [isNewCustModalOpen, setIsNewCustModalOpen] = useState(false);
  const [isNewProdModalOpen, setIsNewProdModalOpen] = useState(false);
  const [editingRepair, setEditingRepair] = useState<RepairJob | null>(null);
  const [editingRepairDetails, setEditingRepairDetails] = useState<RepairJob | null>(null);
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);

  // New Repair Form state
  const [selectedRepairCust, setSelectedRepairCust] = useState<Customer | null>(null);
  const [repairCustSearch, setRepairCustSearch] = useState('');
  const [rDeviceType, setRDeviceType] = useState<'Phone' | 'Computer' | 'Other'>('Phone');
  const [rDeviceName, setRDeviceName] = useState('');
  const [rSerialNo, setRSerialNo] = useState('');
  const [rIssue, setRIssue] = useState('');
  const [rTech, setRTech] = useState('Asanka (Senior Tech)');
  const [rEstCost, setREstCost] = useState<number>(0);
  const [rNotes, setRNotes] = useState('');

  // New Quotation Form state
  const [selectedQuoteCust, setSelectedQuoteCust] = useState<Customer | null>(null);
  const [quoteCustSearch, setQuoteCustSearch] = useState('');
  const [qItems, setQItems] = useState<{ description: string; price: number; qty: number }[]>([
    { description: '', price: 0, qty: 1 }
  ]);
  const [qNotes, setQNotes] = useState('');

  // Quick Add Customer Form Fields
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');

  // Quick Add Product Form Fields
  const [newProdNameEn, setNewProdNameEn] = useState('');
  const [newProdCost, setNewProdCost] = useState<number>(0);
  const [newProdRetail, setNewProdRetail] = useState<number>(0);

  // Edit Status Form state
  const [editStatus, setEditStatus] = useState<RepairStatus>('Pending');
  const [editNotes, setEditNotes] = useState('');
  const [editActualCost, setEditActualCost] = useState<number>(0);

  // Filtered lists
  const filteredRepairs = useMemo(() => {
    return repairs.filter(r => 
      r.customerName.toLowerCase().includes(repairSearch.toLowerCase()) ||
      r.customerPhone.includes(repairSearch) ||
      r.deviceName.toLowerCase().includes(repairSearch.toLowerCase()) ||
      r.id.toLowerCase().includes(repairSearch.toLowerCase())
    );
  }, [repairs, repairSearch]);

  const filteredQuotes = useMemo(() => {
    return quotations.filter(q => 
      q.customerName.toLowerCase().includes(quoteSearch.toLowerCase()) ||
      q.customerPhone.includes(quoteSearch) ||
      q.id.toLowerCase().includes(quoteSearch.toLowerCase())
    );
  }, [quotations, quoteSearch]);

  // Filter customers for auto-complete
  const filteredRepairCustomers = useMemo(() => {
    if (!repairCustSearch.trim()) return [];
    return customers.filter(c => 
      c.name.toLowerCase().includes(repairCustSearch.toLowerCase()) || 
      c.phone.includes(repairCustSearch)
    );
  }, [customers, repairCustSearch]);

  const filteredQuoteCustomers = useMemo(() => {
    if (!quoteCustSearch.trim()) return [];
    return customers.filter(c => 
      c.name.toLowerCase().includes(quoteCustSearch.toLowerCase()) || 
      c.phone.includes(quoteCustSearch)
    );
  }, [customers, quoteCustSearch]);

  // Handle Add Repair Job
  const handleAddRepairSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRepairCust || !rDeviceName.trim() || !rIssue.trim()) return;

    if (editingRepairDetails) {
      onUpdateRepair({
        ...editingRepairDetails,
        customerId: selectedRepairCust.id,
        customerName: selectedRepairCust.name,
        customerPhone: selectedRepairCust.phone,
        deviceType: rDeviceType,
        deviceName: rDeviceName.trim(),
        serialNo: rSerialNo.trim() || undefined,
        issueDescription: rIssue.trim(),
        assignedTechnician: rTech,
        estimatedCost: rEstCost,
        notes: rNotes.trim()
      });
      setEditingRepairDetails(null);
    } else {
      onAddRepair({
        id: `REP-${Math.floor(1000 + Math.random() * 9000)}`,
        customerId: selectedRepairCust.id,
        customerName: selectedRepairCust.name,
        customerPhone: selectedRepairCust.phone,
        deviceType: rDeviceType,
        deviceName: rDeviceName.trim(),
        serialNo: rSerialNo.trim() || undefined,
        issueDescription: rIssue.trim(),
        assignedTechnician: rTech,
        estimatedCost: rEstCost,
        status: 'Pending',
        notes: rNotes.trim(),
        createdAt: new Date().toISOString()
      });
    }

    setIsRepairModalOpen(false);
    setSelectedRepairCust(null); setRDeviceName(''); setRSerialNo(''); setRIssue(''); setRNotes(''); setREstCost(0);
  };

  // Handle Add Quotation
  const handleAddQuotationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuoteCust) return;

    const total = qItems.reduce((acc, curr) => acc + (curr.price * curr.qty), 0);

    if (editingQuotation) {
      onUpdateQuotation({
        ...editingQuotation,
        customerName: selectedQuoteCust.name,
        customerPhone: selectedQuoteCust.phone,
        items: qItems.filter(item => item.description.trim() !== ''),
        total,
        notes: qNotes.trim() || undefined
      });
      setEditingQuotation(null);
    } else {
      onAddQuotation({
        id: `QT-${Math.floor(1000 + Math.random() * 9000)}`,
        customerName: selectedQuoteCust.name,
        customerPhone: selectedQuoteCust.phone,
        items: qItems.filter(item => item.description.trim() !== ''),
        total,
        validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        notes: qNotes.trim() || undefined
      });
    }

    setIsQuoteModalOpen(false);
    setSelectedQuoteCust(null); setQNotes(''); setQItems([{ description: '', price: 0, qty: 1 }]);
  };

  // Handle Quick Add Customer
  const handleQuickAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim() || !newCustPhone.trim()) return;

    const newCust = onAddCustomer({
      id: `CUST-${Date.now()}`,
      name: newCustName.trim(),
      phone: newCustPhone.trim(),
      address: newCustAddress.trim() || undefined,
      loyaltyPoints: 0,
      createdAt: new Date().toISOString()
    });

    if (activeTab === 'repairs') {
      setSelectedRepairCust(newCust);
    } else {
      setSelectedQuoteCust(newCust);
    }
    setIsNewCustModalOpen(false);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustAddress('');
  };

  // Handle Quick Add Product
  const handleQuickAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdNameEn.trim() || newProdCost <= 0) return;

    const newProd: Product = {
      id: `P-${Math.floor(100 + Math.random() * 900)}`,
      nameEn: newProdNameEn.trim(),
      nameSi: newProdNameEn.trim(),
      category: 'Computer Parts',
      source: 'Supplier Purchased',
      costPrice: newProdCost,
      retailPrice: newProdRetail || (newProdCost * 1.3),
      wholesalePrice: newProdCost * 1.15,
      wholesaleMinQty: 5,
      stock: 5,
      lowStockAlert: 2,
      brand: 'Generic',
      rackLocation: 'Counter',
      isWeighted: false,
      isTaxable: true
    };

    onAddProduct(newProd);
    setQItems(prev => {
      const emptyFiltered = prev.filter(i => i.description.trim() !== '');
      return [...emptyFiltered, { description: newProd.nameEn, price: newProd.retailPrice, qty: 1 }];
    });
    setIsNewProdModalOpen(false);
    setNewProdNameEn('');
    setNewProdCost(0);
    setNewProdRetail(0);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'In Progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Ready for Pickup': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Delivered': return 'bg-slate-100 text-slate-800 border-slate-200';
      default: return 'bg-rose-100 text-rose-800 border-rose-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-tabs Toggle */}
      <div className="flex border-b border-slate-200 bg-white p-2 rounded-xl shadow-sm space-x-2">
        <button
          onClick={() => { setActiveTab('repairs'); if (onSubTabChange) onSubTabChange('repairs'); }}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center ${
            activeTab === 'repairs' ? 'bg-blue-600 text-white shadow' : 'text-slate-650 hover:bg-slate-100'
          }`}
        >
          <Wrench className="h-4 w-4 mr-1.5" />
          {language === 'en' ? 'Repairs Tracking' : 'පරිගණක සහ දුරකථන රෙපෙයාර්'}
        </button>
        <button
          onClick={() => { setActiveTab('quotations'); if (onSubTabChange) onSubTabChange('quotations'); }}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center ${
            activeTab === 'quotations' ? 'bg-blue-600 text-white shadow' : 'text-slate-655 hover:bg-slate-100'
          }`}
        >
          <FileText className="h-4 w-4 mr-1.5" />
          {language === 'en' ? 'Quotations' : 'මිල ගණන් ලේඛන (Quotations)'}
        </button>
      </div>

      {/* REPAIRS SECTION */}
      {activeTab === 'repairs' && (
        <div className="space-y-6">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder={language === 'en' ? 'Search repair by customer, ID or device...' : 'රෙපෙයාර් සොයන්න...'}
                value={repairSearch}
                onChange={(e) => setRepairSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-bold text-slate-800"
              />
            </div>
            <button
              onClick={() => setIsRepairModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-md flex items-center"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              {language === 'en' ? 'New Repair Job' : 'නව රෙපෙයාර් එකක්'}
            </button>
          </div>

          {/* Repairs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {filteredRepairs.map(rep => (
              <div key={rep.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition flex flex-col justify-between">
                <div className="p-5 space-y-3.5">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded">ID: {rep.id}</span>
                      <h4 className="text-sm font-extrabold text-slate-800 mt-2">{rep.deviceName}</h4>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusStyle(rep.status)}`}>
                      {rep.status}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs space-y-1">
                    <div className="font-extrabold text-slate-700 flex items-center">
                      <User className="h-3.5 w-3.5 mr-1 text-slate-400" /> {rep.customerName}
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold flex items-center">
                      <Phone className="h-3 w-3 mr-1" /> {rep.customerPhone}
                    </div>
                  </div>

                  <div className="text-xs font-semibold space-y-1 text-slate-600">
                    <div><span className="text-slate-400 font-bold">Issue: </span>{rep.issueDescription}</div>
                    <div><span className="text-slate-400 font-bold">Technician: </span>{rep.assignedTechnician}</div>
                    <div><span className="text-slate-400 font-bold">Est. Cost: </span><span className="text-blue-600 font-extrabold">Rs. {rep.estimatedCost.toLocaleString()}</span></div>
                  </div>

                  {rep.notes && (
                    <div className="bg-amber-50/50 border border-amber-100 p-2.5 rounded-xl text-[10px] text-slate-600 leading-relaxed font-medium">
                      <Notebook className="h-3.5 w-3.5 inline mr-1 text-amber-700" /> {rep.notes}
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 p-3.5 border-t border-slate-100 flex justify-between items-center">
                  <button
                    onClick={() => {
                      if (confirm(language === 'en' ? `Are you sure you want to delete repair job ${rep.id}?` : `මෙම රෙපෙයාර් එක (${rep.id}) මකා දැමීමට අවශ්‍ය බව ස්ථිරද?`)) {
                        onDeleteRepair(rep.id);
                      }
                    }}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer flex items-center justify-center"
                    title="Delete Repair"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => {
                        setEditingRepairDetails(rep);
                        const matchedCust = customers.find(c => c.id === rep.customerId) || {
                          id: rep.customerId,
                          name: rep.customerName,
                          phone: rep.customerPhone,
                          loyaltyPoints: 0,
                          createdAt: new Date().toISOString()
                        };
                        setSelectedRepairCust(matchedCust);
                        setRDeviceType(rep.deviceType);
                        setRDeviceName(rep.deviceName);
                        setRSerialNo(rep.serialNo || '');
                        setRIssue(rep.issueDescription);
                        setRTech(rep.assignedTechnician);
                        setREstCost(rep.estimatedCost);
                        setRNotes(rep.notes);
                        setIsRepairModalOpen(true);
                      }}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-[11px] font-bold transition flex items-center cursor-pointer"
                    >
                      <Edit className="h-3 w-3 mr-1" /> Edit
                    </button>
                    <button
                      onClick={() => {
                        setEditingRepair(rep);
                        setEditStatus(rep.status);
                        setEditNotes(rep.notes);
                        setEditActualCost(rep.actualCost || rep.estimatedCost);
                      }}
                      className="bg-blue-650 hover:bg-blue-700 text-white px-3 py-1.5 rounded-xl text-[11px] font-bold shadow-sm transition flex items-center cursor-pointer"
                    >
                      Status
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* QUOTATIONS SECTION */}
      {activeTab === 'quotations' && (
        <div className="space-y-6">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder={language === 'en' ? 'Search quotations...' : 'කොටේෂන් සොයන්න...'}
                value={quoteSearch}
                onChange={(e) => setQuoteSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-bold text-slate-800"
              />
            </div>
            <button
              onClick={() => setIsQuoteModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-md flex items-center"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              {language === 'en' ? 'New Quotation' : 'නව කොටේෂන් පත්‍රයක්'}
            </button>
          </div>

          {/* Quotations List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {filteredQuotes.map(quote => (
              <div key={quote.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded">ID: {quote.id}</span>
                    <span className="text-[10px] text-slate-400 font-bold">Valid until: {quote.validUntil}</span>
                  </div>

                  <div>
                    <h4 className="text-sm font-extrabold text-slate-800">{quote.customerName}</h4>
                    <p className="text-[10px] text-slate-400 font-bold">{quote.customerPhone}</p>
                  </div>

                  <div className="border-t border-b border-dashed border-slate-100 py-3 space-y-1.5">
                    {quote.items.map((i, idx) => (
                      <div key={idx} className="flex justify-between text-xs text-slate-600 font-semibold">
                        <span>{i.description} (x{i.qty})</span>
                        <span>Rs. {(i.price * i.qty).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <span className="text-xs text-slate-400 font-bold">Estimated Total:</span>
                    <span className="text-base font-extrabold text-blue-600">Rs. {quote.total.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-slate-100 gap-2">
                  <button
                    onClick={() => {
                      if (confirm(language === 'en' ? `Are you sure you want to delete quotation ${quote.id}?` : `මෙම කොටේෂන් පත්‍රය (${quote.id}) මකා දැමීමට අවශ්‍ය බව ස්ථිරද?`)) {
                        onDeleteQuotation(quote.id);
                      }
                    }}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer flex items-center justify-center"
                    title="Delete Quotation"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingQuotation(quote);
                        const matchedCust = customers.find(c => c.name === quote.customerName && c.phone === quote.customerPhone) || {
                          id: `TEMP-${Date.now()}`,
                          name: quote.customerName,
                          phone: quote.customerPhone,
                          loyaltyPoints: 0,
                          createdAt: new Date().toISOString()
                        };
                        setSelectedQuoteCust(matchedCust);
                        setQItems(quote.items.length > 0 ? quote.items : [{ description: '', price: 0, qty: 1 }]);
                        setQNotes(quote.notes || '');
                        setIsQuoteModalOpen(true);
                      }}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-[11px] font-bold transition flex items-center cursor-pointer"
                    >
                      <Edit className="h-3 w-3 mr-1" /> Edit
                    </button>
                    <button
                      onClick={() => {
                        alert(`Printing Quotation ${quote.id} for ${quote.customerName} (Total: Rs. ${quote.total.toLocaleString()})`);
                      }}
                      className="bg-slate-800 hover:bg-slate-900 text-white px-3.5 py-1.5 rounded-xl text-[11px] font-bold shadow-sm transition flex items-center cursor-pointer"
                    >
                      <Printer className="h-3.5 w-3.5 mr-1" /> Print Quote
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NEW REPAIR MODAL */}
      {isRepairModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-950 text-white p-4 flex justify-between items-center">
              <h3 className="text-xs font-bold flex items-center">
                <Wrench className="h-4 w-4 mr-1 text-blue-400" />
                {editingRepairDetails ? 'Edit Repair Details' : 'Add New Repair Job'}
              </h3>
              <button onClick={() => { setIsRepairModalOpen(false); setEditingRepairDetails(null); setSelectedRepairCust(null); setRDeviceName(''); setRSerialNo(''); setRIssue(''); setRNotes(''); setREstCost(0); }} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAddRepairSubmit} className="p-6 space-y-4 text-xs font-semibold">
              {/* Customer Select with auto-complete & quick add */}
              <div className="space-y-1 relative">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-slate-500">Select Customer *</label>
                  <button
                    type="button"
                    onClick={() => setIsNewCustModalOpen(true)}
                    className="text-blue-600 hover:underline flex items-center"
                  >
                    <Plus className="h-3 w-3 mr-0.5" /> Quick Add Customer
                  </button>
                </div>

                {selectedRepairCust ? (
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 flex justify-between items-center mt-1">
                    <div>
                      <h4 className="font-bold text-slate-800">{selectedRepairCust.name}</h4>
                      <p className="text-[10px] text-slate-400">{selectedRepairCust.phone}</p>
                    </div>
                    <button type="button" onClick={() => setSelectedRepairCust(null)} className="text-rose-500 font-bold">✕</button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="text"
                      required
                      value={repairCustSearch}
                      onChange={(e) => setRepairCustSearch(e.target.value)}
                      placeholder="Type name or phone to search..."
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-bold"
                    />
                    {filteredRepairCustomers.length > 0 && (
                      <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-32 overflow-y-auto">
                        {filteredRepairCustomers.map(c => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setSelectedRepairCust(c);
                              setRepairCustSearch('');
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex justify-between"
                          >
                            <span>{c.name}</span>
                            <span>{c.phone}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Device Type</label>
                  <select
                    value={rDeviceType}
                    onChange={(e) => setRDeviceType(e.target.value as any)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="Phone">Phone</option>
                    <option value="Computer">Computer</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Device Model *</label>
                  <input
                    type="text" required value={rDeviceName} onChange={(e) => setRDeviceName(e.target.value)}
                    placeholder="e.g. iPhone 13" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Serial / IMEI No</label>
                  <input
                    type="text" value={rSerialNo} onChange={(e) => setRSerialNo(e.target.value)}
                    placeholder="e.g. S/N 12345" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Est. Repair Cost (LKR)</label>
                  <input
                    type="number" value={rEstCost || ''} onChange={(e) => setREstCost(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-bold text-blue-600"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500">Reported Issue *</label>
                <textarea
                  required value={rIssue} onChange={(e) => setRIssue(e.target.value)}
                  placeholder="Describe device fault details..." rows={2} className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex space-x-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => { setIsRepairModalOpen(false); setEditingRepairDetails(null); setSelectedRepairCust(null); setRDeviceName(''); setRSerialNo(''); setRIssue(''); setRNotes(''); setREstCost(0); }} className="flex-1 bg-slate-100 py-2 rounded-lg font-bold">Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold shadow">Save Repair</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW QUOTATION MODAL */}
      {isQuoteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-950 text-white p-4 flex justify-between items-center">
              <h3 className="text-xs font-bold flex items-center">
                <FileText className="h-4 w-4 mr-1 text-blue-400" />
                {editingQuotation ? 'Edit Price Quotation' : 'Create Price Quotation'}
              </h3>
              <button onClick={() => { setIsQuoteModalOpen(false); setEditingQuotation(null); setSelectedQuoteCust(null); setQNotes(''); setQItems([{ description: '', price: 0, qty: 1 }]); }} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAddQuotationSubmit} className="p-6 space-y-4 text-xs font-semibold">
              {/* Customer select with auto-complete & quick add */}
              <div className="space-y-1 relative">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-slate-500">Select Customer *</label>
                  <button
                    type="button"
                    onClick={() => setIsNewCustModalOpen(true)}
                    className="text-blue-600 hover:underline flex items-center"
                  >
                    <Plus className="h-3 w-3 mr-0.5" /> Quick Add Customer
                  </button>
                </div>

                {selectedQuoteCust ? (
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 flex justify-between items-center mt-1">
                    <div>
                      <h4 className="font-bold text-slate-800">{selectedQuoteCust.name}</h4>
                      <p className="text-[10px] text-slate-400">{selectedQuoteCust.phone}</p>
                    </div>
                    <button type="button" onClick={() => setSelectedQuoteCust(null)} className="text-rose-500 font-bold">✕</button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="text"
                      required
                      value={quoteCustSearch}
                      onChange={(e) => setQuoteCustSearch(e.target.value)}
                      placeholder="Type name or phone to search..."
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-bold"
                    />
                    {filteredQuoteCustomers.length > 0 && (
                      <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-32 overflow-y-auto">
                        {filteredQuoteCustomers.map(c => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setSelectedQuoteCust(c);
                              setQuoteCustSearch('');
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex justify-between"
                          >
                            <span>{c.name}</span>
                            <span>{c.phone}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Quotation Items linked to Central Inventory */}
              <div className="space-y-2">
                <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-200/60">
                  <span className="font-bold text-slate-500">Pick from Central Inventory</span>
                  <button
                    type="button"
                    onClick={() => setIsNewProdModalOpen(true)}
                    className="text-blue-600 hover:underline flex items-center text-[10px]"
                  >
                    <Plus className="h-3 w-3 mr-0.5" /> Add New Product
                  </button>
                </div>

                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-12">
                    <select
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white"
                      onChange={(e) => {
                        const prod = products.find(p => p.id === e.target.value);
                        if (!prod) return;
                        setQItems(prev => {
                          const emptyFiltered = prev.filter(i => i.description.trim() !== '');
                          return [...emptyFiltered, { description: prod.nameEn, price: prod.retailPrice, qty: 1 }];
                        });
                      }}
                    >
                      <option value="">-- Choose Product to Add --</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.nameEn} (Rs. {p.retailPrice})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto pt-2">
                  {qItems.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <div className="col-span-6">
                        <input
                          type="text" required placeholder="Item Description" value={item.description}
                          onChange={(e) => {
                            const val = e.target.value;
                            setQItems(prev => prev.map((c, i) => i === idx ? { ...c, description: val } : c));
                          }}
                          className="w-full px-2 py-1 border border-slate-200 rounded"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number" required placeholder="Price" value={item.price || ''}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setQItems(prev => prev.map((c, i) => i === idx ? { ...c, price: val } : c));
                          }}
                          className="w-full px-2 py-1 border border-slate-200 rounded"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number" required placeholder="Qty" value={item.qty}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setQItems(prev => prev.map((c, i) => i === idx ? { ...c, qty: val } : c));
                          }}
                          className="w-full px-2 py-1 border border-slate-200 rounded text-center"
                        />
                      </div>
                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => setQItems(prev => prev.filter((_, i) => i !== idx))}
                          className="text-rose-500 font-bold"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500">Remarks / Terms</label>
                <textarea
                  value={qNotes} onChange={(e) => setQNotes(e.target.value)}
                  placeholder="e.g. Price valid for 14 days. 1-year product warranty included." rows={2}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex space-x-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => { setIsQuoteModalOpen(false); setEditingQuotation(null); setSelectedQuoteCust(null); setQNotes(''); setQItems([{ description: '', price: 0, qty: 1 }]); }} className="flex-1 bg-slate-100 py-2 rounded-lg font-bold">Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold shadow">Save Quotation</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK ADD CUSTOMER MODAL */}
      {isNewCustModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-950 text-white p-4 flex justify-between items-center">
              <h3 className="text-xs font-bold">Quick Add Customer</h3>
              <button onClick={() => setIsNewCustModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleQuickAddCustomer} className="p-5 space-y-3 text-xs font-semibold">
              <div>
                <label className="font-bold text-slate-500">Full Name *</label>
                <input
                  type="text" required value={newCustName} onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="e.g. Sunil Perera" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="font-bold text-slate-500">Phone Number *</label>
                <input
                  type="tel" required value={newCustPhone} onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="e.g. 0771234567" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="font-bold text-slate-500">Address (Required for Quotation)</label>
                <input
                  type="text" value={newCustAddress} onChange={(e) => setNewCustAddress(e.target.value)}
                  placeholder="e.g. Kurunegala" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                />
              </div>
              <div className="flex space-x-2 pt-2">
                <button type="button" onClick={() => setIsNewCustModalOpen(false)} className="flex-1 bg-slate-100 py-2 rounded-lg">Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg shadow">Save Customer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK ADD PRODUCT MODAL */}
      {isNewProdModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-950 text-white p-4 flex justify-between items-center">
              <h3 className="text-xs font-bold">Quick Add Product to Inventory</h3>
              <button onClick={() => setIsNewProdModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleQuickAddProduct} className="p-5 space-y-3 text-xs font-semibold">
              <div>
                <label className="font-bold text-slate-500">Product Name (EN) *</label>
                <input
                  type="text" required value={newProdNameEn} onChange={(e) => setNewProdNameEn(e.target.value)}
                  placeholder="e.g. Kingston SSD" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-500">Cost Price *</label>
                  <input
                    type="number" required value={newProdCost || ''} onChange={(e) => setNewProdCost(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-500">Retail Price *</label>
                  <input
                    type="number" required value={newProdRetail || ''} onChange={(e) => setNewProdRetail(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
              <div className="flex space-x-2 pt-2">
                <button type="button" onClick={() => setIsNewProdModalOpen(false)} className="flex-1 bg-slate-100 py-2 rounded-lg">Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg shadow">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPDATE REPAIR STATUS MODAL */}
      {editingRepair && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-950 text-white p-4 flex justify-between items-center">
              <h3 className="text-xs font-bold flex items-center">
                <Wrench className="h-4 w-4 mr-1 text-blue-400" />
                Update Repair Status: {editingRepair.id}
              </h3>
              <button onClick={() => setEditingRepair(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                onUpdateRepairStatus(editingRepair.id, editStatus, editNotes, editStatus === 'Delivered' ? editActualCost : undefined);
                setEditingRepair(null);
              }}
              className="p-5 space-y-4 text-xs font-semibold"
            >
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Repair Status</label>
                <select
                  value={editStatus} onChange={(e) => setEditStatus(e.target.value as RepairStatus)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white"
                >
                  <option value="Pending">Pending Diagnosis (පරීක්ෂා කරමින්)</option>
                  <option value="In Progress">In Progress (අලුත්වැඩියා වෙමින්)</option>
                  <option value="Ready for Pickup">Ready for Pickup (ලබාගැනීමට සූදානම්)</option>
                  <option value="Delivered">Delivered & Completed (භාර දී අවසන්)</option>
                  <option value="Cancelled">Cancelled (අවලංගු කරන ලදී)</option>
                </select>
              </div>

              {editStatus === 'Delivered' && (
                <div className="space-y-1 animate-in slide-in-from-top-2 duration-150">
                  <label className="font-bold text-slate-500">Final Cost (LKR)</label>
                  <input
                    type="number" min="0" required value={editActualCost} onChange={(e) => setEditActualCost(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="font-bold text-slate-500">Technician Work Log / Notes</label>
                <textarea
                  value={editNotes} onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Specify replaced parts, labor details..." rows={3}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button type="button" onClick={() => setEditingRepair(null)} className="flex-1 bg-slate-100 py-2 rounded-lg font-bold">Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold shadow">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
