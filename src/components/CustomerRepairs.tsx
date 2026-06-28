import React, { useState, useMemo } from 'react';
import { Customer, RepairJob, Sale, DeviceType, RepairStatus } from '../types';
import { translations } from '../lib/translations';
import { 
  Search, User, Phone, Wrench, Plus, History, Clock, CheckCircle, 
  MapPin, Notebook, MessageSquare, Shield, DollarSign, ChevronRight, Edit, Calendar 
} from 'lucide-react';

interface CustomerRepairsProps {
  language: 'en' | 'si';
  customers: Customer[];
  repairs: RepairJob[];
  sales: Sale[];
  onAddCustomer: (customer: Customer) => Customer;
  onAddRepair: (repair: RepairJob) => void;
  onUpdateRepairStatus: (repairId: string, status: RepairStatus, notes: string, actualCost?: number) => void;
}

export const CustomerRepairs: React.FC<CustomerRepairsProps> = ({
  language,
  customers,
  repairs,
  sales,
  onAddCustomer,
  onAddRepair,
  onUpdateRepairStatus
}) => {
  const t = translations[language];

  // Sub-tabs
  const [subTab, setSubTab] = useState<'customers' | 'repairs'>('customers');

  // Customer Directory States
  const [custSearch, setCustSearch] = useState('');
  const [selectedCust, setSelectedCustomer] = useState<Customer | null>(customers[0] || null);
  const [isNewCustOpen, setIsNewCustOpen] = useState(false);

  // New Customer Form Fields
  const [cName, setCName] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [cEmail, setCEmail] = useState('');
  const [cAddress, setCAddress] = useState('');
  const [cNotes, setCNotes] = useState('');

  // Repair Jobs States
  const [repairSearch, setRepairSearch] = useState('');
  const [isNewRepairOpen, setIsNewRepairOpen] = useState(false);
  const [editingRepair, setEditingRepair] = useState<RepairJob | null>(null);

  // New Repair Form Fields
  const [rCustomer, setRCustomer] = useState<Customer | null>(null);
  const [rDeviceType, setRDeviceType] = useState<DeviceType>('Phone');
  const [rDeviceName, setRDeviceName] = useState('');
  const [rSerialNo, setRSerialNo] = useState('');
  const [rIssue, setRIssue] = useState('');
  const [rTech, setRTech] = useState('Asanka (Senior Tech)');
  const [rEstCost, setREstCost] = useState<number>(0);
  const [rNotes, setRNotes] = useState('');

  // Edit Repair Status Fields
  const [editStatus, setEditStatus] = useState<RepairStatus>('Pending');
  const [editNotes, setEditStatusNotes] = useState('');
  const [editActualCost, setEditActualCost] = useState<number>(0);

  // Filtered Customers
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.name.toLowerCase().includes(custSearch.toLowerCase()) || 
      c.phone.includes(custSearch) ||
      c.id.toLowerCase().includes(custSearch.toLowerCase())
    );
  }, [customers, custSearch]);

  // Filtered Repairs
  const filteredRepairs = useMemo(() => {
    return repairs.filter(r => 
      r.customerName.toLowerCase().includes(repairSearch.toLowerCase()) || 
      r.customerPhone.includes(repairSearch) ||
      r.deviceName.toLowerCase().includes(repairSearch.toLowerCase()) ||
      r.id.toLowerCase().includes(repairSearch.toLowerCase())
    );
  }, [repairs, repairSearch]);

  // Selected Customer History
  const selectedCustHistory = useMemo(() => {
    if (!selectedCust) return { sales: [], repairs: [] };
    
    const custSales = sales.filter(s => s.customerId === selectedCust.id);
    const custRepairs = repairs.filter(r => r.customerId === selectedCust.id);

    return {
      sales: custSales,
      repairs: custRepairs
    };
  }, [selectedCust, sales, repairs]);

  // Handle Register Customer
  const handleRegisterCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cName.trim() || !cPhone.trim()) return;

    const newCust = onAddCustomer({
      id: `CUST-${Date.now()}`,
      name: cName.trim(),
      phone: cPhone.trim(),
      email: cEmail.trim() || undefined,
      address: cAddress.trim() || undefined,
      notes: cNotes.trim() || undefined,
      loyaltyPoints: 0,
      createdAt: new Date().toISOString()
    });

    setSelectedCustomer(newCust);
    setIsNewCustOpen(false);
    setCName('');
    setCPhone('');
    setCEmail('');
    setCAddress('');
    setCNotes('');
  };

  // Handle Save Repair Job
  const handleSaveRepair = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rCustomer || !rDeviceName.trim() || !rIssue.trim()) {
      alert(language === 'en' ? 'Please select a customer, device and describe the issue!' : 'කරුණාකර පාරිභෝගිකයා, උපාංගය සහ දෝෂය ඇතුළත් කරන්න!');
      return;
    }

    const newJob: RepairJob = {
      id: `REP-${Math.floor(1000 + Math.random() * 9000)}`,
      customerId: rCustomer.id,
      customerName: rCustomer.name,
      customerPhone: rCustomer.phone,
      deviceType: rDeviceType,
      deviceName: rDeviceName.trim(),
      serialNo: rSerialNo.trim() || undefined,
      issueDescription: rIssue.trim(),
      assignedTechnician: rTech,
      estimatedCost: rEstCost,
      status: 'Pending',
      notes: rNotes.trim(),
      createdAt: new Date().toISOString()
    };

    onAddRepair(newJob);
    setIsNewRepairOpen(false);
    setRCustomer(null);
    setRDeviceName('');
    setRSerialNo('');
    setRIssue('');
    setRNotes('');
    setREstCost(0);
  };

  // Open Edit Status Modal
  const openEditStatusModal = (repair: RepairJob) => {
    setEditingRepair(repair);
    setEditStatus(repair.status);
    setEditStatusNotes(repair.notes);
    setEditActualCost(repair.actualCost || repair.estimatedCost);
  };

  // Handle Status Update
  const handleUpdateStatusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRepair) return;

    onUpdateRepairStatus(
      editingRepair.id,
      editStatus,
      editNotes,
      editStatus === 'Delivered' ? editActualCost : undefined
    );

    setEditingRepair(null);
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
          onClick={() => setSubTab('customers')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center ${
            subTab === 'customers' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <User className="h-4 w-4 mr-1.5" />
          {t.customerDirectory}
        </button>
        <button
          onClick={() => setSubTab('repairs')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center ${
            subTab === 'repairs' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Wrench className="h-4 w-4 mr-1.5" />
          {t.activeRepairs}
        </button>
      </div>

      {/* CUSTOMER DIRECTORY TAB */}
      {subTab === 'customers' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Customer List (Left) */}
          <div className="lg:col-span-4 bg-white rounded-2xl shadow-sm border border-slate-100 p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.customerDirectory}</h3>
              <button
                onClick={() => setIsNewCustOpen(true)}
                className="text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center"
              >
                <Plus className="h-3 w-3 mr-0.5" />
                {t.newCustomer}
              </button>
            </div>

            {/* Customer Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder={t.searchCustPlaceholder}
                value={custSearch}
                onChange={(e) => setCustSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            {/* Customers List */}
            <div className="space-y-1.5 max-h-[50vh] overflow-y-auto pr-1">
              {filteredCustomers.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs font-medium">
                  No customers found.
                </div>
              ) : (
                filteredCustomers.map(cust => (
                  <button
                    key={cust.id}
                    onClick={() => setSelectedCustomer(cust)}
                    className={`w-full text-left p-3 rounded-xl border flex justify-between items-center transition ${
                      selectedCust?.id === cust.id
                        ? 'bg-blue-50 border-blue-200 text-blue-900'
                        : 'bg-slate-50/50 border-slate-100 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div>
                      <h4 className="text-xs font-extrabold">{cust.name}</h4>
                      <p className="text-[10px] text-slate-400 font-medium flex items-center mt-0.5">
                        <Phone className="h-2.5 w-2.5 mr-1" /> {cust.phone}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Customer CRM Profile View (Right) */}
          <div className="lg:col-span-8 space-y-6">
            {selectedCust ? (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6">
                {/* Profile Header */}
                <div className="flex items-start space-x-4 border-b border-slate-100 pb-5">
                  <div className="bg-blue-100 p-3 rounded-xl text-blue-600">
                    <User className="h-8 w-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-extrabold text-slate-800">{selectedCust.name}</h3>
                    <p className="text-xs text-slate-400 font-bold flex items-center">
                      <Phone className="h-3.5 w-3.5 mr-1 text-slate-400" /> {selectedCust.phone}
                      {selectedCust.email && <span className="mx-2">•</span>}
                      {selectedCust.email && <span>{selectedCust.email}</span>}
                    </p>
                    <p className="text-[10px] text-slate-400">Registered: {new Date(selectedCust.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Profile Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
                  {selectedCust.address && (
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex items-start space-x-2">
                      <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-slate-400 font-bold mb-0.5">{t.address}</div>
                        <div className="text-slate-700 font-medium">{selectedCust.address}</div>
                      </div>
                    </div>
                  )}

                  {selectedCust.notes && (
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex items-start space-x-2">
                      <Notebook className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-slate-400 font-bold mb-0.5">{t.notes}</div>
                        <div className="text-slate-700 font-medium">{selectedCust.notes}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Customer CRM History Tabs */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center">
                    <History className="h-4 w-4 mr-1.5 text-blue-600" />
                    {t.customerHistory}
                  </h4>

                  {selectedCustHistory.sales.length === 0 && selectedCustHistory.repairs.length === 0 ? (
                    <p className="text-slate-400 text-xs font-medium text-center py-8">{t.noHistory}</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Purchase History */}
                      <div className="space-y-3">
                        <h5 className="text-xs font-bold text-slate-700 border-b border-slate-100 pb-2 flex items-center justify-between">
                          <span>{t.salesHistory}</span>
                          <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {selectedCustHistory.sales.length}
                          </span>
                        </h5>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                          {selectedCustHistory.sales.map(sale => (
                            <div key={sale.id} className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-[11px] space-y-1">
                              <div className="flex justify-between font-bold text-slate-800">
                                <span>{sale.id}</span>
                                <span className="text-blue-600">Rs. {sale.total.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-slate-400 text-[10px]">
                                <span>{new Date(sale.createdAt).toLocaleDateString()} • {sale.saleType}</span>
                                <span>{sale.paymentMethod}</span>
                              </div>
                              <div className="text-[10px] text-slate-500 line-clamp-1 font-medium mt-1">
                                {sale.items.map(i => `${i.productNameEn} (x${i.quantity})`).join(', ')}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Repair History */}
                      <div className="space-y-3">
                        <h5 className="text-xs font-bold text-slate-700 border-b border-slate-100 pb-2 flex items-center justify-between">
                          <span>{language === 'en' ? 'Repair History' : 'රෙපෙයාර් ඉතිහාසය'}</span>
                          <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {selectedCustHistory.repairs.length}
                          </span>
                        </h5>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                          {selectedCustHistory.repairs.map(rep => (
                            <div key={rep.id} className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-[11px] space-y-1.5">
                              <div className="flex justify-between items-center font-bold">
                                <span className="text-slate-800">{rep.deviceName}</span>
                                <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold border ${getStatusStyle(rep.status)}`}>
                                  {rep.status}
                                </span>
                              </div>
                              <div className="text-slate-500 text-[10px]">
                                ID: {rep.id} • Est: <span className="font-bold text-slate-700">Rs. {rep.estimatedCost.toLocaleString()}</span>
                              </div>
                              <p className="text-[10px] text-slate-400 font-medium italic line-clamp-1">
                                Issue: {rep.issueDescription}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center text-slate-400 font-medium">
                Please select a customer from the left directory to view full profile and history.
              </div>
            )}
          </div>
        </div>
      )}

      {/* REPAIR JOBS TAB */}
      {subTab === 'repairs' && (
        <div className="space-y-6">
          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder={language === 'en' ? 'Search repair by customer, ID or device...' : 'පාරිභෝගිකයා, අංකය හෝ උපාංගය මඟින් සොයන්න...'}
                value={repairSearch}
                onChange={(e) => setRepairSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-xs font-bold text-slate-800"
              />
            </div>

            <button
              onClick={() => setIsNewRepairOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-md flex items-center shrink-0"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              {t.newRepairJob}
            </button>
          </div>

          {/* Active Repairs List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {filteredRepairs.length === 0 ? (
              <div className="col-span-full bg-white rounded-2xl shadow-sm border border-slate-100 py-12 text-center text-slate-400 font-medium">
                No active repair jobs found matching search filters.
              </div>
            ) : (
              filteredRepairs.map((rep) => (
                <div key={rep.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition flex flex-col justify-between">
                  <div className="p-5 space-y-3.5">
                    {/* Header */}
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded">
                          ID: {rep.id}
                        </span>
                        <h4 className="text-sm font-extrabold text-slate-800 mt-2">
                          {rep.deviceName}
                        </h4>
                        {rep.serialNo && (
                          <p className="text-[10px] text-slate-400">S/N: {rep.serialNo}</p>
                        )}
                      </div>

                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusStyle(rep.status)}`}>
                        {rep.status}
                      </span>
                    </div>

                    {/* Customer Info */}
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs space-y-1">
                      <div className="font-extrabold text-slate-700 flex items-center">
                        <User className="h-3.5 w-3.5 mr-1 text-slate-400" />
                        {rep.customerName}
                      </div>
                      <div className="text-[10px] text-slate-400 font-bold flex items-center">
                        <Phone className="h-3 w-3 mr-1" />
                        {rep.customerPhone}
                      </div>
                    </div>

                    {/* Issue & Tech */}
                    <div className="text-xs font-semibold space-y-1.5">
                      <div>
                        <span className="text-slate-400 font-bold">{t.issue}: </span>
                        <span className="text-slate-700 font-medium">{rep.issueDescription}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold">{t.assignedTech}: </span>
                        <span className="text-slate-700 font-medium">{rep.assignedTechnician}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold">{t.estCost}: </span>
                        <span className="text-blue-600 font-extrabold">Rs. {rep.estimatedCost.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Work Notes Log */}
                    {rep.notes && (
                      <div className="bg-amber-50/50 border border-amber-100 p-2.5 rounded-xl text-[11px] text-slate-600 leading-relaxed font-medium">
                        <span className="font-bold text-amber-800 flex items-center mb-0.5">
                          <Notebook className="h-3 w-3 mr-1" /> {t.techNotes}
                        </span>
                        {rep.notes}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="bg-slate-50 p-3.5 border-t border-slate-100 flex justify-end">
                    <button
                      onClick={() => openEditStatusModal(rep)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-xl text-[11px] font-bold shadow-sm transition flex items-center"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      {t.updateStatus}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* REGISTER NEW CUSTOMER MODAL */}
      {isNewCustOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-950 text-white p-4 flex justify-between items-center">
              <h3 className="text-xs font-bold flex items-center">
                <User className="h-4 w-4 mr-1 text-blue-400" />
                {t.registerCustomer}
              </h3>
              <button onClick={() => setIsNewCustOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleRegisterCustomer} className="p-6 space-y-3 text-xs font-semibold">
              <div className="space-y-1">
                <label className="font-bold text-slate-500">{t.fullName} *</label>
                <input
                  type="text"
                  required
                  value={cName}
                  onChange={(e) => setCName(e.target.value)}
                  placeholder="e.g. Sunil Perera"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-500">{t.phoneNumber} *</label>
                <input
                  type="tel"
                  required
                  value={cPhone}
                  onChange={(e) => setCPhone(e.target.value)}
                  placeholder="e.g. 0771112223"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-500">{t.emailAddress}</label>
                <input
                  type="email"
                  value={cEmail}
                  onChange={(e) => setCEmail(e.target.value)}
                  placeholder="e.g. sunil@gmail.com"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-medium"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-500">{t.address}</label>
                <input
                  type="text"
                  value={cAddress}
                  onChange={(e) => setCAddress(e.target.value)}
                  placeholder="e.g. Colombo Road, Kurunegala"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-medium"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-500">{t.notes}</label>
                <textarea
                  value={cNotes}
                  onChange={(e) => setCNotes(e.target.value)}
                  placeholder="e.g. Wholesale buyer of electronic accessories."
                  rows={2}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-medium"
                />
              </div>

              <div className="flex space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsNewCustOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-2 rounded-lg font-bold"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-bold shadow"
                >
                  {t.addCustomer}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REGISTER NEW REPAIR MODAL */}
      {isNewRepairOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-950 text-white p-4 flex justify-between items-center">
              <h3 className="text-xs font-bold flex items-center">
                <Wrench className="h-4 w-4 mr-1 text-blue-400" />
                {t.newRepairJob}
              </h3>
              <button onClick={() => setIsNewRepairOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveRepair} className="p-6 space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Select Customer */}
                <div className="space-y-1 md:col-span-2">
                  <label className="font-bold text-slate-500">{t.selectCustomer} *</label>
                  <select
                    required
                    onChange={(e) => setRCustomer(customers.find(c => c.id === e.target.value) || null)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-bold bg-white"
                  >
                    <option value="">-- Choose Customer --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                    ))}
                  </select>
                </div>

                {/* Device Type */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">{t.deviceType}</label>
                  <select
                    value={rDeviceType}
                    onChange={(e) => setRDeviceType(e.target.value as DeviceType)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-bold bg-white"
                  >
                    <option value="Phone">Phone (දුරකථන)</option>
                    <option value="Computer">Computer (පරිගණක)</option>
                    <option value="Other">Other (වෙනත්)</option>
                  </select>
                </div>

                {/* Device Name */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">{t.deviceName} *</label>
                  <input
                    type="text"
                    required
                    value={rDeviceName}
                    onChange={(e) => setRDeviceName(e.target.value)}
                    placeholder="e.g. ASUS VivoBook 15"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-bold"
                  />
                </div>

                {/* Serial No */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">{t.serialNo}</label>
                  <input
                    type="text"
                    value={rSerialNo}
                    onChange={(e) => setRSerialNo(e.target.value)}
                    placeholder="e.g. Serial / IMEI"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-bold"
                  />
                </div>

                {/* Assigned Tech */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">{t.technician}</label>
                  <select
                    value={rTech}
                    onChange={(e) => setRTech(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-bold bg-white"
                  >
                    <option value="Asanka (Senior Tech)">Asanka (Senior Tech)</option>
                    <option value="Janaka (Chip-Level Specialist)">Janaka (Chip Specialist)</option>
                    <option value="Sameera (Junior Tech)">Sameera (Junior Tech)</option>
                  </select>
                </div>

                {/* Estimated Cost */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">{t.estCostLkr} *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={rEstCost || ''}
                    onChange={(e) => setREstCost(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-bold"
                  />
                </div>

                {/* Issue Description */}
                <div className="space-y-1 md:col-span-2">
                  <label className="font-bold text-slate-500">{t.issue} *</label>
                  <textarea
                    required
                    value={rIssue}
                    onChange={(e) => setRIssue(e.target.value)}
                    placeholder="Describe what is wrong with the device..."
                    rows={2}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-medium"
                  />
                </div>

                {/* Notes */}
                <div className="space-y-1 md:col-span-2">
                  <label className="font-bold text-slate-500">{t.notes}</label>
                  <textarea
                    value={rNotes}
                    onChange={(e) => setRNotes(e.target.value)}
                    placeholder="Additional work logs or diagnostic remarks..."
                    rows={2}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-medium"
                  />
                </div>
              </div>

              <div className="flex space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewRepairOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-2 rounded-lg font-bold"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-bold shadow"
                >
                  {t.saveRepair}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPDATE STATUS MODAL */}
      {editingRepair && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-950 text-white p-4 flex justify-between items-center">
              <h3 className="text-xs font-bold flex items-center">
                <Wrench className="h-4 w-4 mr-1 text-blue-400" />
                {t.updateStatus}: {editingRepair.id}
              </h3>
              <button onClick={() => setEditingRepair(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleUpdateStatusSubmit} className="p-5 space-y-4 text-xs font-semibold">
              {/* Status Select */}
              <div className="space-y-1">
                <label className="font-bold text-slate-500">{t.repairStatus}</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as RepairStatus)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-bold bg-white"
                >
                  <option value="Pending">{t.statusPending}</option>
                  <option value="In Progress">{t.statusProgress}</option>
                  <option value="Ready for Pickup">{t.statusReady}</option>
                  <option value="Delivered">{t.statusDelivered}</option>
                  <option value="Cancelled">{t.statusCancelled}</option>
                </select>
              </div>

              {/* Actual Cost (Only if status is Delivered) */}
              {editStatus === 'Delivered' && (
                <div className="space-y-1 animate-in slide-in-from-top-2 duration-150">
                  <label className="font-bold text-slate-500">{t.actualCostLkr}</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editActualCost}
                    onChange={(e) => setEditActualCost(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-bold"
                  />
                </div>
              )}

              {/* Log Notes */}
              <div className="space-y-1">
                <label className="font-bold text-slate-500">{t.repairNotes}</label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditStatusNotes(e.target.value)}
                  placeholder="Add details of parts replaced or work done..."
                  rows={3}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-medium"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingRepair(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-2 rounded-lg font-bold"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-bold shadow"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
