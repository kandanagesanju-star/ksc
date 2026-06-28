import React, { useState, useMemo, useEffect } from 'react';
import { Customer, Supplier, SmsLog } from '../types';
import { translations } from '../lib/translations';
import { 
  Users, User, Phone, Plus, Search, Mail, MapPin, 
  Notebook, Gift, Star, Award, Trash2, Edit, Clock, Laptop, Printer, CheckCircle
} from 'lucide-react';

interface ContactsLoyaltyProps {
  language: 'en' | 'si';
  customers: Customer[];
  suppliers: Supplier[];
  onAddCustomer: (customer: Customer) => Customer;
  onAddSupplier: (supplier: Supplier) => void;
  onUpdateCustomerPoints: (customerId: string, points: number) => void;
  loyaltyPointValue: number; // e.g. 1000
  smsLogs: SmsLog[];
  onSendSms: (phone: string, message: string) => void;
  onUpdateCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
  onUpdateSupplier: (supplier: Supplier) => void;
  onDeleteSupplier: (id: string) => void;
}

export const ContactsLoyalty: React.FC<ContactsLoyaltyProps> = ({
  language,
  customers,
  suppliers,
  onAddCustomer,
  onAddSupplier,
  onUpdateCustomer,
  onDeleteCustomer,
  onUpdateSupplier,
  onDeleteSupplier,
  onUpdateCustomerPoints,
  loyaltyPointValue,
  smsLogs,
  onSendSms
}) => {
  const t = translations[language];

  // Tabs
  const [activeTab, setActiveTab] = useState<'customers' | 'suppliers' | 'loyalty' | 'debtors' | 'sms-gateway'>('customers');

  // Search states
  const [custSearch, setCustSearch] = useState('');
  const [suppSearch, setSuppSearch] = useState('');

  // USB SIM Dongle Web Serial API Simulator states
  const [isSerialConnected, setIsSerialConnected] = useState(false);
  const [serialLogs, setSerialLogs] = useState<string[]>([]);
  const [smsTargetPhone, setSmsTargetPhone] = useState('');
  const [smsMessageText, setSmsMessageText] = useState('');

  // Editing States
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // CSV Import States
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [csvText, setCsvText] = useState('');

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvText.trim()) return;

    try {
      const lines = csvText.split('\n');
      let importCount = 0;
      
      lines.forEach(line => {
        if (!line.trim()) return;
        const columns = line.split(',');
        if (columns.length < 2) return; // Need at least Name and Phone
        
        const name = columns[0].trim();
        const phone = columns[1].trim();
        const email = columns[2] ? columns[2].trim() : undefined;
        const address = columns[3] ? columns[3].trim() : undefined;

        if (name && phone && name.toLowerCase() !== 'name') { // skip header row if present
          onAddCustomer({
            id: `CUST-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            name,
            phone,
            email: email || undefined,
            address: address || undefined,
            loyaltyPoints: 0,
            createdAt: new Date().toISOString()
          });
          importCount++;
        }
      });

      alert(language === 'en' ? `Successfully imported ${importCount} customers!` : `පාරිභෝගිකයින් ${importCount}ක් සාර්ථකව ආයාත කරන ලදී!`);
      setIsImportModalOpen(false);
      setCsvText('');
    } catch (err) {
      alert('Error parsing CSV file. Please make sure the format is: Name,Phone,Email,Address');
    }
  };

  // Mock SIM Inbox messages (AT+CMGL="ALL" simulation)
  const [simInbox, setSimInbox] = useState<{ id: string; sender: string; text: string; date: string }[]>([
    { id: '1', sender: '+94718300589', text: 'Install KSC POS Professional Evolution at our new pharmacy branch.', date: '2026-06-26 08:30' },
    { id: '2', sender: 'Commercial Bank', text: 'Cr LKR 12,500.00 to Acc ending 4752 from LankaQR payment.', date: '2026-06-25 18:45' },
    { id: '3', sender: '+94771234567', text: 'What is the estimated delivery time for our special custom cap order?', date: '2026-06-25 12:10' }
  ]);

  const handleConnectSerial = () => {
    if (isSerialConnected) {
      setIsSerialConnected(false);
      setSerialLogs(prev => [...prev, `[SIM_PORT] Disconnected virtual dongle.`]);
      return;
    }
    setIsSerialConnected(true);
    setSerialLogs(prev => [
      ...prev,
      `[SIM_PORT] Opening virtual COM3 port at 9600 baud rate...`,
      `[SIM_PORT] Connection established.`,
      `[AT_CMD] Sending: AT`,
      `[AT_CMD] Received: OK`,
      `[AT_CMD] Sending: AT+CMGF=1`,
      `[AT_CMD] Received: OK`,
      `[AT_CMD] Sending: AT+CMGL="ALL"`,
      `[AT_CMD] Successfully read ${simInbox.length} messages from SIM card memory.`
    ]);
  };

  // Modals
  const [isCustModalOpen, setIsCustModalOpen] = useState(false);
  const [isSuppModalOpen, setIsSuppModalOpen] = useState(false);

  // Customer Form Fields
  const [cName, setCName] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [cEmail, setCEmail] = useState('');
  const [cAddress, setCAddress] = useState('');
  const [cNotes, setCNotes] = useState('');

  // Supplier Form Fields
  const [sName, setSName] = useState('');
  const [sPhone, setSPhone] = useState('');
  const [sEmail, setSEmail] = useState('');
  const [sCompany, setSCompany] = useState('');
  const [sAddress, setSAddress] = useState('');
  const [sNotes, setSNotes] = useState('');

  // Filtered lists
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.name.toLowerCase().includes(custSearch.toLowerCase()) ||
      c.phone.includes(custSearch)
    );
  }, [customers, custSearch]);

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(s => 
      s.name.toLowerCase().includes(suppSearch.toLowerCase()) ||
      s.phone.includes(suppSearch) ||
      s.companyName.toLowerCase().includes(suppSearch.toLowerCase())
    );
  }, [suppliers, suppSearch]);

  // Handle Customer Submit
  const handleCustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cName.trim() || !cPhone.trim()) return;

    if (editingCustomer) {
      onUpdateCustomer({
        ...editingCustomer,
        name: cName.trim(),
        phone: cPhone.trim(),
        email: cEmail.trim() || undefined,
        address: cAddress.trim() || undefined,
        notes: cNotes.trim() || undefined
      });
      setEditingCustomer(null);
    } else {
      onAddCustomer({
        id: `CUST-${Date.now()}`,
        name: cName.trim(),
        phone: cPhone.trim(),
        email: cEmail.trim() || undefined,
        address: cAddress.trim() || undefined,
        notes: cNotes.trim() || undefined,
        loyaltyPoints: 0,
        createdAt: new Date().toISOString()
      });
    }

    setIsCustModalOpen(false);
    setCName(''); setCPhone(''); setCEmail(''); setCAddress(''); setCNotes('');
  };

  // Handle Supplier Submit
  const handleSuppSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sName.trim() || !sPhone.trim() || !sCompany.trim()) return;

    if (editingSupplier) {
      onUpdateSupplier({
        ...editingSupplier,
        name: sName.trim(),
        phone: sPhone.trim(),
        email: sEmail.trim() || undefined,
        companyName: sCompany.trim(),
        address: sAddress.trim() || undefined,
        notes: sNotes.trim() || undefined
      });
      setEditingSupplier(null);
    } else {
      onAddSupplier({
        id: `SUP-${Date.now()}`,
        name: sName.trim(),
        phone: sPhone.trim(),
        email: sEmail.trim() || undefined,
        companyName: sCompany.trim(),
        address: sAddress.trim() || undefined,
        notes: sNotes.trim() || undefined,
        createdAt: new Date().toISOString()
      });
    }

    setIsSuppModalOpen(false);
    setSName(''); setSPhone(''); setSEmail(''); setSCompany(''); setSAddress(''); setSNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Sub-tabs Toggle */}
      <div className="flex border-b border-slate-200 bg-white p-2 rounded-xl shadow-sm space-x-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('customers')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center ${
            activeTab === 'customers' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <User className="h-4 w-4 mr-1.5" />
          {language === 'en' ? 'Customers' : 'ගැනුම්කරුවන්'}
        </button>
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center ${
            activeTab === 'suppliers' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="h-4 w-4 mr-1.5" />
          {language === 'en' ? 'Suppliers' : 'විකුණුම්කරුවන් (Suppliers)'}
        </button>
        <button
          onClick={() => setActiveTab('loyalty')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center ${
            activeTab === 'loyalty' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Award className="h-4 w-4 mr-1.5" />
          {language === 'en' ? 'Loyalty Program' : 'ලෝයල්ටි වැඩසටහන'}
        </button>
        <button
          onClick={() => setActiveTab('debtors')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center ${
            activeTab === 'debtors' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Notebook className="h-4 w-4 mr-1.5" />
          {language === 'en' ? 'Debtors & HP Reminders' : 'ණයගැතියන් සහ HP මතක් කිරීම්'}
        </button>
        <button
          onClick={() => setActiveTab('sms-gateway')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center ${
            activeTab === 'sms-gateway' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Phone className="h-4 w-4 mr-1.5" />
          {language === 'en' ? 'SMS Gateway & SIM' : 'SMS Gateway සහ SIM'}
        </button>
      </div>

      {/* CUSTOMERS TAB */}
      {activeTab === 'customers' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder={language === 'en' ? 'Search customers...' : 'ගැනුම්කරුවන් සොයන්න...'}
                value={custSearch}
                onChange={(e) => setCustSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-bold text-slate-800"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center active:scale-95"
              >
                <Plus className="h-4 w-4 mr-1.5 text-blue-500" />
                {language === 'en' ? 'Import (CSV)' : 'CSV ආයාත කරන්න'}
              </button>
              <button
                onClick={() => setIsCustModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-md flex items-center active:scale-95"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                {language === 'en' ? 'Add Customer' : 'ගැනුම්කරුවෙකු එක් කරන්න'}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-extrabold text-[10px] tracking-wider border-b border-slate-100">
                    <th className="py-4 px-6">ID</th>
                    <th className="py-4 px-6">NAME</th>
                    <th className="py-4 px-6">PHONE</th>
                    <th className="py-4 px-6">EMAIL</th>
                    <th className="py-4 px-6">ADDRESS</th>
                    <th className="py-4 px-6 text-center">LOYALTY POINTS</th>
                    <th className="py-4 px-6 text-center">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">No customers found.</td>
                    </tr>
                  ) : (
                    filteredCustomers.map(cust => (
                      <tr key={cust.id} className="hover:bg-slate-50/50">
                        <td className="py-4 px-6 text-slate-400">{cust.id}</td>
                        <td className="py-4 px-6 font-bold text-slate-800">{cust.name}</td>
                        <td className="py-4 px-6">{cust.phone}</td>
                        <td className="py-4 px-6 text-slate-500">{cust.email || '-'}</td>
                        <td className="py-4 px-6 text-slate-500">{cust.address || '-'}</td>
                        <td className="py-4 px-6 text-center">
                          <span className="bg-blue-50 text-blue-700 font-extrabold px-2.5 py-1 rounded-full text-xs">
                            {cust.loyaltyPoints} pts
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center flex justify-center space-x-1.5">
                          <button
                            onClick={() => {
                              setEditingCustomer(cust);
                              setCName(cust.name);
                              setCPhone(cust.phone);
                              setCEmail(cust.email || '');
                              setCAddress(cust.address || '');
                              setCNotes(cust.notes || '');
                              setIsCustModalOpen(true);
                            }}
                            className="p-1 text-blue-650 hover:bg-slate-100 rounded transition cursor-pointer"
                            title="Edit Customer"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(language === 'en' ? `Are you sure you want to delete customer ${cust.name}?` : `පාරිභෝගිකයා ${cust.name} මකා දැමීමට අවශ්‍ය බව ස්ථිරද?`)) {
                                onDeleteCustomer(cust.id);
                              }
                            }}
                            className="p-1 text-rose-650 hover:bg-slate-100 rounded transition cursor-pointer"
                            title="Delete Customer"
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

      {/* SUPPLIERS TAB */}
      {activeTab === 'suppliers' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder={language === 'en' ? 'Search suppliers...' : 'විකුණුම්කරුවන් සොයන්න...'}
                value={suppSearch}
                onChange={(e) => setSuppSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-bold text-slate-800"
              />
            </div>
            <button
              onClick={() => setIsSuppModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-md flex items-center"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              {language === 'en' ? 'Add Supplier' : 'විකුණුම්කරුවෙකු එක් කරන්න'}
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-extrabold text-[10px] tracking-wider border-b border-slate-100">
                    <th className="py-4 px-6">ID</th>
                    <th className="py-4 px-6">COMPANY NAME</th>
                    <th className="py-4 px-6">CONTACT PERSON</th>
                    <th className="py-4 px-6">PHONE</th>
                    <th className="py-4 px-6">EMAIL</th>
                    <th className="py-4 px-6">ADDRESS</th>
                    <th className="py-4 px-6 text-center">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                  {filteredSuppliers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">No suppliers found.</td>
                    </tr>
                  ) : (
                    filteredSuppliers.map(supp => (
                      <tr key={supp.id} className="hover:bg-slate-50/50">
                        <td className="py-4 px-6 text-slate-400">{supp.id}</td>
                        <td className="py-4 px-6 font-bold text-slate-800">{supp.companyName}</td>
                        <td className="py-4 px-6">{supp.name}</td>
                        <td className="py-4 px-6">{supp.phone}</td>
                        <td className="py-4 px-6 text-slate-500">{supp.email || '-'}</td>
                        <td className="py-4 px-6 text-slate-500">{supp.address || '-'}</td>
                        <td className="py-4 px-6 text-center flex justify-center space-x-1.5">
                          <button
                            onClick={() => {
                              setEditingSupplier(supp);
                              setSName(supp.name);
                              setSPhone(supp.phone);
                              setSEmail(supp.email || '');
                              setSCompany(supp.companyName);
                              setSAddress(supp.address || '');
                              setSNotes(supp.notes || '');
                              setIsSuppModalOpen(true);
                            }}
                            className="p-1 text-blue-655 hover:bg-slate-100 rounded transition cursor-pointer"
                            title="Edit Supplier"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(language === 'en' ? `Are you sure you want to delete supplier ${supp.companyName}?` : `සැපයුම්කරු ${supp.companyName} මකා දැමීමට අවශ්‍ය බව ස්ථිරද?`)) {
                                onDeleteSupplier(supp.id);
                              }
                            }}
                            className="p-1 text-rose-655 hover:bg-slate-100 rounded transition cursor-pointer"
                            title="Delete Supplier"
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

      {/* LOYALTY PROGRAM TAB */}
      {activeTab === 'loyalty' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Rules / Config overview */}
          <div className="bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white space-y-4">
            <div className="bg-white/10 p-3 rounded-xl w-fit">
              <Gift className="h-6 w-6 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-base font-bold">{language === 'en' ? 'Loyalty Program Rules' : 'ලෝයල්ටි ක්‍රමවේද රීති'}</h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {language === 'en' 
                  ? 'Encourage customer retention by awarding loyalty points automatically for every purchase made at the cash counter or online store.'
                  : 'පාරිභෝගිකයින් නැවත පැමිණීම දිරිමත් කිරීම සඳහා සෑම මිලදී ගැනීමකටම ස්වයංක්‍රීයව ලෝයල්ටි පොයින්ට්ස් ලබා දෙන්න.'}
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 p-4 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">{language === 'en' ? 'Earning Rule' : 'ලැබෙන ක්‍රමය'}:</span>
                <span className="font-bold text-indigo-300">Rs. {loyaltyPointValue.toLocaleString()} = 1 Point</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{language === 'en' ? 'Point Value' : 'පොයින්ට් එකක වටිනාකම'}:</span>
                <span className="font-bold text-emerald-400">1 Point = Rs. 10.00</span>
              </div>
            </div>
          </div>

          {/* Top Loyalty Customers list */}
          <div className="md:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center">
              <Star className="h-4.5 w-4.5 mr-1.5 text-amber-500" />
              {language === 'en' ? 'Top Loyalty Members' : 'වැඩිම ලෝයල්ටි ලකුණු හිමි පාරිභෝගිකයින්'}
            </h3>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {customers.map(cust => (
                <div key={cust.id} className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center text-xs font-semibold">
                  <div>
                    <h4 className="text-slate-800 font-bold">{cust.name}</h4>
                    <p className="text-[10px] text-slate-400">{cust.phone}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="bg-amber-100 text-amber-800 font-extrabold px-3 py-1 rounded-full">
                      {cust.loyaltyPoints} Points
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* NEW CUSTOMER MODAL */}
      {isCustModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-950 text-white p-4 flex justify-between items-center">
              <h3 className="text-xs font-bold flex items-center">
                {language === 'en' ? (editingCustomer ? 'Edit Customer' : 'Add New Customer') : (editingCustomer ? 'පාරිභෝගික විස්තර වෙනස් කරන්න' : 'නව ගැනුම්කරුවෙකු ලියාපදිංචි කරන්න')}
              </h3>
              <button onClick={() => { setIsCustModalOpen(false); setEditingCustomer(null); setCName(''); setCPhone(''); setCEmail(''); setCAddress(''); setCNotes(''); }} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCustSubmit} className="p-5 space-y-3 text-xs font-semibold">
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Full Name *</label>
                <input
                  type="text" required value={cName} onChange={(e) => setCName(e.target.value)}
                  placeholder="e.g. Nimal Silva" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Phone Number *</label>
                <input
                  type="tel" required value={cPhone} onChange={(e) => setCPhone(e.target.value)}
                  placeholder="e.g. 0771234567" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Email Address</label>
                <input
                  type="email" value={cEmail} onChange={(e) => setCEmail(e.target.value)}
                  placeholder="e.g. nimal@gmail.com" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Address</label>
                <input
                  type="text" value={cAddress} onChange={(e) => setCAddress(e.target.value)}
                  placeholder="e.g. Galle Road, Colombo" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Notes</label>
                <textarea
                  value={cNotes} onChange={(e) => setCNotes(e.target.value)}
                  placeholder="Add custom notes..." rows={2} className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button type="button" onClick={() => { setIsCustModalOpen(false); setEditingCustomer(null); setCName(''); setCPhone(''); setCEmail(''); setCAddress(''); setCNotes(''); }} className="flex-1 bg-slate-100 py-2 rounded-lg font-bold">Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold shadow">Save Customer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DEBTORS TAB */}
      {activeTab === 'debtors' && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Outstanding Debtors & Hire Purchase (HP) Ledger</h3>
              <p className="text-[10px] text-slate-400 font-medium">Send automatic billing reminders to customer phones via USB SMS Gateway.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold">
                <thead>
                  <tr className="border-b border-slate-150 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                    <th className="py-2.5">Customer Name</th>
                    <th>Phone</th>
                    <th>Outstanding Debt</th>
                    <th>HP EMI Instalment</th>
                    <th>Next Due Date</th>
                    <th className="text-center">Reminder Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-700">
                  {(() => {
                    const debtors = customers.map((c, idx) => {
                      const mockBalance = (idx % 2 === 0) ? (2450 + (idx * 1350)) : 0;
                      const mockHPInstalment = (idx % 3 === 0) ? 1500 : 0;
                      return {
                        ...c,
                        outstanding: mockBalance,
                        hpInstalment: mockHPInstalment,
                        dueDate: new Date(Date.now() + (idx * 2) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                      };
                    }).filter(d => d.outstanding > 0 || d.hpInstalment > 0);

                    if (debtors.length === 0) {
                      return (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                            No debtors found in contacts ledger.
                          </td>
                        </tr>
                      );
                    }

                    return debtors.map(d => (
                      <tr key={d.id} className="hover:bg-slate-50/50">
                        <td className="py-3 font-bold text-slate-800">{d.name}</td>
                        <td className="font-mono text-slate-500">{d.phone}</td>
                        <td className="text-rose-600 font-extrabold">Rs. {d.outstanding.toLocaleString()}</td>
                        <td className="text-blue-600 font-extrabold">Rs. {d.hpInstalment.toLocaleString()}</td>
                        <td className="text-slate-550">{d.dueDate}</td>
                        <td className="py-3">
                          <div className="flex justify-center space-x-1.5 text-[10px]">
                            {d.outstanding > 0 && (
                              <button
                                onClick={() => {
                                  const msg = `Dear ${d.name}, your outstanding balance at KSC POS is Rs. ${d.outstanding.toLocaleString()}. Please settle. Thank you!`;
                                  onSendSms(d.phone, msg);
                                  alert(`Debt reminder SMS sent to ${d.phone} successfully!`);
                                }}
                                className="px-2.5 py-1 bg-rose-50 text-rose-600 border border-rose-150 hover:bg-rose-100 rounded-lg font-bold transition"
                              >
                                Send Debt SMS
                              </button>
                            )}
                            {d.hpInstalment > 0 && (
                              <button
                                onClick={() => {
                                  const msg = `Dear ${d.name}, your HP Instalment of Rs. ${d.hpInstalment.toLocaleString()} is due on ${d.dueDate}. Please settle. Thank you!`;
                                  onSendSms(d.phone, msg);
                                  alert(`HP instalment reminder SMS sent to ${d.phone} successfully!`);
                                }}
                                className="px-2.5 py-1 bg-blue-50 text-blue-600 border border-blue-150 hover:bg-blue-100 rounded-lg font-bold transition"
                              >
                                Send HP SMS
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SMS GATEWAY TAB */}
      {activeTab === 'sms-gateway' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* SIM Gateway Connector & Quick Sender */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4 text-xs font-semibold text-slate-700">
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">USB Serial SMS Gateway</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Dongle connector via simulated AT commands reader.</p>
                </div>
                <button
                  type="button"
                  onClick={handleConnectSerial}
                  className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold transition-all shadow-sm ${
                    isSerialConnected 
                      ? 'bg-emerald-500 text-white border-emerald-600' 
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {isSerialConnected ? 'Connected (COM3)' : 'Connect SMS Dongle'}
                </button>
              </div>

              {/* AT Logs screen */}
              <div className="space-y-1">
                <label className="font-bold text-slate-500">USB Serial AT Commands Logs</label>
                <div className="bg-slate-900 text-slate-300 font-mono text-[9px] p-3 rounded-xl h-36 overflow-y-auto border border-slate-800 space-y-0.5">
                  {serialLogs.length === 0 ? (
                    <span className="text-slate-500 italic">No activity logs. Connect device to start.</span>
                  ) : (
                    serialLogs.map((log, idx) => (
                      <div key={idx} className={log.includes('Error') ? 'text-rose-400 font-bold' : log.includes('[AT_CMD]') ? 'text-blue-400' : 'text-slate-300'}>
                        {log}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Quick Send SMS */}
              <div className="space-y-3 pt-2">
                <h4 className="font-extrabold text-slate-800">Quick SMS Notification</h4>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Recipient Phone</label>
                    <input
                      type="tel"
                      value={smsTargetPhone}
                      onChange={(e) => setSmsTargetPhone(e.target.value)}
                      placeholder="e.g. 0718300589"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-bold bg-slate-50 focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Message Text</label>
                    <textarea
                      value={smsMessageText}
                      onChange={(e) => setSmsMessageText(e.target.value)}
                      placeholder="Type SMS text..."
                      rows={2}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-medium bg-slate-50 focus:bg-white focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!isSerialConnected) {
                        alert('Error: USB Dongle disconnected! Please connect COM3 first.');
                        return;
                      }
                      if (!smsTargetPhone.trim() || !smsMessageText.trim()) return;
                      onSendSms(smsTargetPhone, smsMessageText);
                      setSerialLogs(prev => [
                        ...prev,
                        `[AT_CMD] Sending: AT+CMGS="${smsTargetPhone}"`,
                        `[AT_CMD] Sending text: "${smsMessageText}"`,
                        `[AT_CMD] Received: +CMGS: OK`
                      ]);
                      setSmsMessageText('');
                      alert('SMS Sent Successfully!');
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition shadow-md"
                  >
                    Send Quick SMS
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* SIM Inbox & Outbox Logs */}
          <div className="lg:col-span-6 space-y-4 text-xs font-semibold text-slate-700">
            {/* Inbox */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">SIM Inbox Messages (AT+CMGL="ALL")</h3>
                <p className="text-[10px] text-slate-400 font-medium">Live incoming alerts and replies read from SIM memory.</p>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {simInbox.map(msg => (
                  <div key={msg.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1 relative text-left">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-800 flex items-center">
                        <User className="h-3.5 w-3.5 mr-1 text-slate-400" />
                        {msg.sender}
                      </span>
                      <span className="text-[9px] text-slate-400">{msg.date}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium leading-relaxed">{msg.text}</p>
                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSmsTargetPhone(msg.sender);
                          setSmsMessageText(`Dear Customer, `);
                          alert(`Replying to ${msg.sender}. Fill in message body and click Send.`);
                        }}
                        className="px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-150 hover:bg-blue-100 rounded text-[9px] font-bold transition"
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Outbox Logs */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Sent Outbox Logs</h3>
                <p className="text-[10px] text-slate-400 font-medium">Historical records of all outgoing SMS alerts sent by POS.</p>
              </div>

              <div className="overflow-x-auto max-h-48 overflow-y-auto">
                <table className="w-full text-left text-xs font-semibold">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold text-[9px] uppercase tracking-wider">
                      <th className="py-2">Time</th>
                      <th>Recipient</th>
                      <th>Message Text</th>
                      <th className="text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-[11px]">
                    {smsLogs.length > 0 ? (
                      smsLogs.map(log => (
                        <tr key={log.id} className="text-slate-600 hover:bg-slate-50/50">
                          <td className="py-2 text-slate-450">{new Date(log.timestamp).toLocaleTimeString()}</td>
                          <td className="font-mono text-slate-850">{log.phone}</td>
                          <td className="truncate max-w-[150px] font-medium" title={log.message}>{log.message}</td>
                          <td className="text-right">
                            <span className="bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase border border-emerald-100">
                              {log.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-slate-400 font-medium">
                          No messages sent in this session.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NEW SUPPLIER MODAL */}
      {isSuppModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-950 text-white p-4 flex justify-between items-center">
              <h3 className="text-xs font-bold flex items-center">
                <Users className="h-4 w-4 mr-1 text-blue-400" />
                {language === 'en' ? (editingSupplier ? 'Edit Supplier' : 'Add New Supplier') : (editingSupplier ? 'සැපයුම්කරු විස්තර වෙනස් කරන්න' : 'නව විකුණුම්කරුවෙකු ඇතුළත් කරන්න')}
              </h3>
              <button onClick={() => { setIsSuppModalOpen(false); setEditingSupplier(null); setSName(''); setSPhone(''); setSEmail(''); setSCompany(''); setSAddress(''); setSNotes(''); }} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSuppSubmit} className="p-5 space-y-3 text-xs font-semibold">
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Company Name *</label>
                <input
                  type="text" required value={sCompany} onChange={(e) => setSCompany(e.target.value)}
                  placeholder="e.g. Abans Distributors" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Contact Person Name *</label>
                <input
                  type="text" required value={sName} onChange={(e) => setSName(e.target.value)}
                  placeholder="e.g. Sunil Perera" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Phone Number *</label>
                <input
                  type="tel" required value={sPhone} onChange={(e) => setSPhone(e.target.value)}
                  placeholder="e.g. 0112233445" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Email Address</label>
                <input
                  type="email" value={sEmail} onChange={(e) => setSEmail(e.target.value)}
                  placeholder="e.g. sales@abans.lk" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Address</label>
                <input
                  type="text" value={sAddress} onChange={(e) => setSAddress(e.target.value)}
                  placeholder="e.g. Colombo Road, Kurunegala" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Notes</label>
                <textarea
                  value={sNotes} onChange={(e) => setSNotes(e.target.value)}
                  placeholder="Add custom notes..." rows={2} className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button type="button" onClick={() => { setIsSuppModalOpen(false); setEditingSupplier(null); setSName(''); setSPhone(''); setSEmail(''); setSCompany(''); setSAddress(''); setSNotes(''); }} className="flex-1 bg-slate-100 py-2 rounded-lg font-bold">Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold shadow">Save Supplier</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV IMPORT MODAL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-950 text-white p-4 flex justify-between items-center">
              <h3 className="text-xs font-bold flex items-center">
                <Plus className="h-4 w-4 mr-1 text-blue-400" />
                Import Customers from CSV
              </h3>
              <button onClick={() => setIsImportModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleImportSubmit} className="p-5 space-y-3.5 text-xs font-semibold text-slate-700">
              <div className="space-y-1">
                <label className="font-bold text-slate-450 uppercase text-[9px]">CSV Content (Format: Name,Phone,Email,Address)</label>
                <textarea
                  required
                  rows={6}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder="Nimal Silva,0771234567,nimal@gmail.com,Colombo&#10;Kamal Perera,0717654321,kamal@gmail.com,Kandy"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none font-mono text-[10px]"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button type="button" onClick={() => setIsImportModalOpen(false)} className="flex-1 bg-slate-100 py-2 rounded-lg font-bold">Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold shadow">Import Contacts</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
