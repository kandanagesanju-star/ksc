import React, { useState, useMemo, useEffect } from 'react';
import { Customer, RepairJob, Sale, DeviceType, RepairStatus } from '../types';
import { translations } from '../lib/translations';
import { 
  Search, User, Phone, Wrench, Plus, History, Clock, CheckCircle, 
  MapPin, Notebook, MessageSquare, Shield, DollarSign, ChevronRight, Edit, Calendar, Camera 
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

  // Helper for pattern lock dots coordinate mapping
  const getDotCoords = (num: number) => {
    const col = (num - 1) % 3;
    const row = Math.floor((num - 1) / 3);
    return {
      x: 20 + col * 30,
      y: 20 + row * 30
    };
  };

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
  const [rCustomerName, setRCustomerName] = useState('');
  const [rCustomerPhone, setRCustomerPhone] = useState('');
  const [rCustomerAddress, setRCustomerAddress] = useState('');
  const [rImei, setRImei] = useState('');
  const [rExpectedReturnDate, setRExpectedReturnDate] = useState('');
  const [rPatternLock, setRPatternLock] = useState<number[]>([]);
  const [rDeviceFrontPhoto, setRDeviceFrontPhoto] = useState<string | null>(null);
  const [rDeviceBackPhoto, setRDeviceBackPhoto] = useState<string | null>(null);
  const [rStatus, setRStatus] = useState<RepairStatus>('Pending');
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

  // Auto-populate customer fields when selected from dropdown
  useEffect(() => {
    if (rCustomer) {
      setRCustomerName(rCustomer.name);
      setRCustomerPhone(rCustomer.phone);
      setRCustomerAddress(rCustomer.address || '');
    } else {
      setRCustomerName('');
      setRCustomerPhone('');
      setRCustomerAddress('');
    }
  }, [rCustomer]);

  // Handle Save Repair Job
  const handleSaveRepair = (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalCust = rCustomer;
    if (!finalCust) {
      const nameVal = rCustomerName.trim();
      const phoneVal = rCustomerPhone.trim();
      if (!nameVal || !phoneVal) {
        alert(language === 'en' ? 'Please select a customer or fill customer details!' : 'කරුණාකර පාරිභෝගිකයෙකු තෝරන්න හෝ විස්තර ඇතුළත් කරන්න!');
        return;
      }
      
      const existing = customers.find(c => c.phone === phoneVal);
      if (existing) {
        finalCust = existing;
      } else {
        finalCust = onAddCustomer({
          id: `CUST-${Date.now()}`,
          name: nameVal,
          phone: phoneVal,
          address: rCustomerAddress.trim() || undefined,
          loyaltyPoints: 0,
          createdAt: new Date().toISOString()
        });
      }
    }

    if (!rDeviceName.trim() || !rIssue.trim()) {
      alert(language === 'en' ? 'Please fill all required fields!' : 'කරුණාකර අවශ්‍ය සියලුම ක්ෂේත්‍ර පුරවන්න!');
      return;
    }

    const newJob: RepairJob = {
      id: `REP-${Math.floor(1000 + Math.random() * 9000)}`,
      customerId: finalCust.id,
      customerName: finalCust.name,
      customerPhone: finalCust.phone,
      customerAddress: rCustomerAddress.trim() || undefined,
      deviceType: rDeviceType,
      deviceName: rDeviceName.trim(),
      serialNo: rSerialNo.trim() || undefined,
      imei: rImei.trim() || undefined,
      issueDescription: rIssue.trim(),
      assignedTechnician: rTech,
      estimatedCost: rEstCost,
      status: rStatus,
      notes: rNotes.trim(),
      expectedReturnDate: rExpectedReturnDate || undefined,
      patternLock: rPatternLock.length > 0 ? rPatternLock.join('-') : undefined,
      deviceFrontPhoto: rDeviceFrontPhoto || undefined,
      deviceBackPhoto: rDeviceBackPhoto || undefined,
      createdAt: new Date().toISOString()
    };

    onAddRepair(newJob);
    setIsNewRepairOpen(false);
    
    // Reset form states
    setRCustomer(null);
    setRCustomerName('');
    setRCustomerPhone('');
    setRCustomerAddress('');
    setRImei('');
    setRExpectedReturnDate('');
    setRPatternLock([]);
    setRDeviceFrontPhoto(null);
    setRDeviceBackPhoto(null);
    setRStatus('Pending');
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
                        {rep.imei && (
                          <p className="text-[10px] text-slate-400">IMEI: {rep.imei}</p>
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
                      {rep.customerAddress && (
                        <div className="text-[10px] text-slate-400 font-medium flex items-center">
                          <MapPin className="h-3 w-3 mr-1 text-slate-400" />
                          {rep.customerAddress}
                        </div>
                      )}
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
                      {rep.expectedReturnDate && (
                        <div className="flex items-center text-slate-500 font-bold">
                          <Calendar className="h-3.5 w-3.5 mr-1 text-slate-400" />
                          <span>Expected Return: {new Date(rep.expectedReturnDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    {/* Pattern Lock Info */}
                    {rep.patternLock && (
                      <div className="bg-slate-900 border border-slate-800 p-2 rounded-xl text-[10px] text-slate-300 flex items-center justify-between font-mono">
                        <span className="font-bold text-slate-400 uppercase tracking-wider">Pattern Lock:</span>
                        <span>{rep.patternLock.split('-').join(' → ')}</span>
                      </div>
                    )}

                    {/* Device Photos */}
                    {(rep.deviceFrontPhoto || rep.deviceBackPhoto) && (
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        {rep.deviceFrontPhoto && (
                          <div className="relative h-16 rounded-lg overflow-hidden border border-slate-200 bg-slate-950">
                            <img src={rep.deviceFrontPhoto} alt="Front" className="w-full h-full object-contain" />
                            <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[7px] text-center font-bold py-0.5">Front</span>
                          </div>
                        )}
                        {rep.deviceBackPhoto && (
                          <div className="relative h-16 rounded-lg overflow-hidden border border-slate-200 bg-slate-950">
                            <img src={rep.deviceBackPhoto} alt="Back" className="w-full h-full object-contain" />
                            <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[7px] text-center font-bold py-0.5">Back</span>
                          </div>
                        )}
                      </div>
                    )}

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
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-100 flex flex-col max-h-[90vh]">
            <div className="bg-slate-950 text-white p-5 flex justify-between items-center shrink-0">
              <h3 className="text-sm font-black tracking-tight flex items-center">
                <Wrench className="h-4.5 w-4.5 mr-2 text-blue-500" />
                {t.newRepairJob}
              </h3>
              <button 
                onClick={() => {
                  setIsNewRepairOpen(false);
                  setRCustomer(null);
                  setRCustomerName('');
                  setRCustomerPhone('');
                  setRCustomerAddress('');
                  setRImei('');
                  setRExpectedReturnDate('');
                  setRPatternLock([]);
                  setRDeviceFrontPhoto(null);
                  setRDeviceBackPhoto(null);
                  setRStatus('Pending');
                  setRDeviceName('');
                  setRSerialNo('');
                  setRIssue('');
                  setRNotes('');
                  setREstCost(0);
                }} 
                className="text-slate-400 hover:text-white cursor-pointer transition p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRepair} className="p-6 space-y-5 overflow-y-auto flex-1 text-xs font-semibold text-slate-850">
              {/* Section 1: Customer Details */}
              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-150 space-y-3">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                  <User className="h-3.5 w-3.5 mr-1 text-slate-400" /> Customer Information
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Select Existing Customer */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-500">{t.selectCustomer}</label>
                    <select
                      value={rCustomer?.id || ''}
                      onChange={(e) => setRCustomer(customers.find(c => c.id === e.target.value) || null)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 font-bold bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Choose (Or Walk-In) --</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                      ))}
                    </select>
                  </div>

                  {/* Customer Name */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-500">Customer Name *</label>
                    <input
                      type="text"
                      required
                      value={rCustomerName}
                      onChange={(e) => setRCustomerName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-500">Phone Number *</label>
                    <input
                      type="text"
                      required
                      value={rCustomerPhone}
                      onChange={(e) => setRCustomerPhone(e.target.value)}
                      placeholder="e.g. 0771234567"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Address */}
                  <div className="space-y-1 md:col-span-3">
                    <label className="font-bold text-slate-500">Address</label>
                    <input
                      type="text"
                      value={rCustomerAddress}
                      onChange={(e) => setRCustomerAddress(e.target.value)}
                      placeholder="Customer address details..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Device & Status details */}
              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-150 space-y-3">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                  <Wrench className="h-3.5 w-3.5 mr-1 text-slate-400" /> Device & Job Details
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Device Type */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-500">{t.deviceType}</label>
                    <select
                      value={rDeviceType}
                      onChange={(e) => setRDeviceType(e.target.value as DeviceType)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 font-bold bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Phone">Phone (දුරකථන)</option>
                      <option value="Computer">Computer (පරිගණක)</option>
                      <option value="Other">Other (වෙනත්)</option>
                    </select>
                  </div>

                  {/* Device Model */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-500">Device Model *</label>
                    <input
                      type="text"
                      required
                      value={rDeviceName}
                      onChange={(e) => setRDeviceName(e.target.value)}
                      placeholder="e.g. iPhone 13, HP Pavilion"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Initial Status */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-500">Status</label>
                    <select
                      value={rStatus}
                      onChange={(e) => setRStatus(e.target.value as RepairStatus)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 font-bold bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Pending">Received (භාරගන්නා ලදී)</option>
                      <option value="In Progress">In Progress (ක්‍රියාත්මක වෙමින්)</option>
                      <option value="Ready for Pickup">Ready for Pickup (සූදානම්)</option>
                    </select>
                  </div>

                  {/* IMEI / Serial No */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-500">IMEI Number (Optional)</label>
                    <input
                      type="text"
                      value={rImei}
                      onChange={(e) => setRImei(e.target.value)}
                      placeholder="Scan or enter IMEI..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Expected Return Date */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-500">Expected Return Date</label>
                    <input
                      type="date"
                      value={rExpectedReturnDate}
                      onChange={(e) => setRExpectedReturnDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Estimated Cost */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-500">Estimated Cost (LKR)</label>
                    <input
                      type="number"
                      min="0"
                      value={rEstCost || ''}
                      onChange={(e) => setREstCost(Number(e.target.value))}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Issues, Notes, & Photos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Column: Diagnostics & Notes */}
                <div className="space-y-4">
                  {/* Reported Issue */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-500">Reported Issue *</label>
                    <textarea
                      required
                      value={rIssue}
                      onChange={(e) => setRIssue(e.target.value)}
                      placeholder="Describe what is wrong with the device..."
                      rows={2}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-850 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Additional Notes & Passcode */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-500">Additional Notes & Passcode</label>
                    <textarea
                      value={rNotes}
                      onChange={(e) => setRNotes(e.target.value)}
                      placeholder="PIN code, accessories included..."
                      rows={2}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-850 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Technician Select */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-500">{t.technician}</label>
                    <select
                      value={rTech}
                      onChange={(e) => setRTech(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 font-bold bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Asanka (Senior Tech)">Asanka (Senior Tech)</option>
                      <option value="Janaka (Chip-Level Specialist)">Janaka (Chip Specialist)</option>
                      <option value="Sameera (Junior Tech)">Sameera (Junior Tech)</option>
                    </select>
                  </div>
                </div>

                {/* Right Column: Pattern Lock Drawing */}
                <div className="flex flex-col items-center justify-center p-3 bg-slate-950 rounded-2xl border border-slate-850 space-y-2">
                  <div className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Device Pattern Lock</div>
                  <div className="relative w-36 h-36">
                    <svg 
                      viewBox="0 0 100 100" 
                      className="w-full h-full touch-none select-none cursor-pointer"
                      onTouchMove={(e) => {
                        const touch = e.touches[0];
                        const element = document.elementFromPoint(touch.clientX, touch.clientY);
                        if (element && element.hasAttribute('data-dot-index')) {
                          const idx = Number(element.getAttribute('data-dot-index'));
                          if (!rPatternLock.includes(idx)) {
                            setRPatternLock(prev => [...prev, idx]);
                          }
                        }
                      }}
                    >
                      {/* Lines between connected dots */}
                      {rPatternLock.map((dot, idx) => {
                        if (idx === 0) return null;
                        const prevDot = rPatternLock[idx - 1];
                        const p1 = getDotCoords(prevDot);
                        const p2 = getDotCoords(dot);
                        return (
                          <line
                            key={idx}
                            x1={p1.x}
                            y1={p1.y}
                            x2={p2.x}
                            y2={p2.y}
                            stroke="#3b82f6"
                            strokeWidth="6"
                            strokeLinecap="round"
                            strokeOpacity="0.8"
                          />
                        );
                      })}
                      
                      {/* 3x3 Dots Grid */}
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
                        const coords = getDotCoords(num);
                        const isSelected = rPatternLock.includes(num);
                        return (
                          <g key={num}>
                            {/* Larger touch area */}
                            <circle
                              cx={coords.x}
                              cy={coords.y}
                              r="10"
                              fill="transparent"
                              data-dot-index={num}
                              onMouseDown={() => setRPatternLock([num])}
                              onMouseEnter={(e) => {
                                if (e.buttons === 1) {
                                  if (!rPatternLock.includes(num)) {
                                    setRPatternLock(prev => [...prev, num]);
                                  }
                                }
                              }}
                              onTouchStart={(e) => setRPatternLock([num])}
                              onClick={() => {
                                if (!rPatternLock.includes(num)) {
                                  setRPatternLock(prev => [...prev, num]);
                                }
                              }}
                              className="cursor-pointer"
                            />
                            {/* Visual Dot */}
                            <circle
                              cx={coords.x}
                              cy={coords.y}
                              r={isSelected ? "5" : "3.5"}
                              fill={isSelected ? "#3b82f6" : "#64748b"}
                              className="transition-all duration-200 pointer-events-none"
                            />
                            {/* Selection Ring */}
                            {isSelected && (
                              <circle
                                cx={coords.x}
                                cy={coords.y}
                                r="8"
                                fill="transparent"
                                stroke="#3b82f6"
                                strokeWidth="1.5"
                                strokeOpacity="0.5"
                                className="animate-ping pointer-events-none"
                              />
                            )}
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                  <div className="flex gap-2 w-full justify-between items-center text-[9px] px-2">
                    <span className="text-slate-400 font-bold font-mono truncate max-w-[120px]">
                      {rPatternLock.length > 0 ? `Lock: ${rPatternLock.join('→')}` : 'Draw lock screen pattern'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setRPatternLock([])}
                      className="text-rose-400 hover:text-rose-500 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800 cursor-pointer active:scale-95 transition"
                    >
                      Clear Pattern
                    </button>
                  </div>
                </div>
              </div>

              {/* Section 4: Device Photo Capture */}
              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-150 space-y-3">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                  <Camera className="h-3.5 w-3.5 mr-1 text-slate-400" /> Device Image Capture
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Front Photo */}
                  <div className="flex flex-col space-y-1">
                    <label className="font-bold text-slate-500">Device Front Photo</label>
                    {rDeviceFrontPhoto ? (
                      <div className="relative w-full h-28 rounded-2xl overflow-hidden border border-slate-200 group shadow-sm bg-slate-950">
                        <img src={rDeviceFrontPhoto} alt="Front Preview" className="w-full h-full object-contain" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                          <button
                            type="button"
                            onClick={() => setRDeviceFrontPhoto(null)}
                            className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-xl text-[10px] font-bold shadow-md cursor-pointer active:scale-95 transition"
                          >
                            Remove Photo
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => document.getElementById('front-photo-input')?.click()}
                        className="w-full h-28 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 hover:border-blue-400 transition cursor-pointer"
                      >
                        <Camera className="h-6 w-6 mb-1 text-slate-400" />
                        <span className="font-extrabold text-[10px]">Capture Front</span>
                      </button>
                    )}
                    <input
                      id="front-photo-input"
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => setRDeviceFrontPhoto(reader.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </div>

                  {/* Back Photo */}
                  <div className="flex flex-col space-y-1">
                    <label className="font-bold text-slate-500">Device Back Photo</label>
                    {rDeviceBackPhoto ? (
                      <div className="relative w-full h-28 rounded-2xl overflow-hidden border border-slate-200 group shadow-sm bg-slate-950">
                        <img src={rDeviceBackPhoto} alt="Back Preview" className="w-full h-full object-contain" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                          <button
                            type="button"
                            onClick={() => setRDeviceBackPhoto(null)}
                            className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-xl text-[10px] font-bold shadow-md cursor-pointer active:scale-95 transition"
                          >
                            Remove Photo
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => document.getElementById('back-photo-input')?.click()}
                        className="w-full h-28 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 hover:border-blue-400 transition cursor-pointer"
                      >
                        <Camera className="h-6 w-6 mb-1 text-slate-400" />
                        <span className="font-extrabold text-[10px]">Capture Back</span>
                      </button>
                    )}
                    <input
                      id="back-photo-input"
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => setRDeviceBackPhoto(reader.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex space-x-3 pt-4 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsNewRepairOpen(false);
                    setRCustomer(null);
                    setRCustomerName('');
                    setRCustomerPhone('');
                    setRCustomerAddress('');
                    setRImei('');
                    setRExpectedReturnDate('');
                    setRPatternLock([]);
                    setRDeviceFrontPhoto(null);
                    setRDeviceBackPhoto(null);
                    setRStatus('Pending');
                    setRDeviceName('');
                    setRSerialNo('');
                    setRIssue('');
                    setRNotes('');
                    setREstCost(0);
                  }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-650 py-3 rounded-2xl font-black transition cursor-pointer active:scale-[0.98]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 rounded-2xl font-black shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition cursor-pointer active:scale-[0.98]"
                >
                  Save Job
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
