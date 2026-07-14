import React, { useState, useMemo, useEffect } from 'react';
import { Customer, Supplier, SmsLog } from '../types';
import { translations } from '../lib/translations';
import { extractBirthdayFromNIC } from '../lib/nic';
import { 
  Users, User, Phone, Plus, Search, Mail, MapPin, 
  Notebook, Gift, Star, Award, Trash2, Edit, Clock, Laptop, Printer, CheckCircle, Calendar
} from 'lucide-react';

interface ContactsLoyaltyProps {
  language: 'en' | 'si';
  customers: Customer[];
  suppliers: Supplier[];
  onAddCustomer: (customer: Customer) => Customer;
  onAddSupplier: (supplier: Supplier) => void;
  onUpdateCustomerPoints: (customerId: string, points: number) => void;
  loyaltyPointValue: number; // e.g. 1000
  pointRedemptionValue?: number; // e.g. 10
  smsLogs: SmsLog[];
  onSendSms: (phone: string, message: string) => void;
  onUpdateCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
  onUpdateSupplier: (supplier: Supplier) => void;
  onDeleteSupplier: (id: string) => void;
  activeSubTab?: string;
  onSubTabChange?: (tab: any) => void;
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
  pointRedemptionValue = 10,
  smsLogs,
  onSendSms,
  activeSubTab,
  onSubTabChange
}) => {
  const t = translations[language];

  // Helper to calculate days remaining for birthdays
  const getBirthdayStatus = (bdayStr: string) => {
    if (!bdayStr) return null;
    const today = new Date();
    const bday = new Date(bdayStr);
    
    const bdayThisYear = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
    
    today.setHours(0, 0, 0, 0);
    bdayThisYear.setHours(0, 0, 0, 0);
    
    let diffTime = bdayThisYear.getTime() - today.getTime();
    let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (bday.getMonth() === today.getMonth() && bday.getDate() === today.getDate()) {
      return { isToday: true, daysRemaining: 0, text: language === 'en' ? 'Today! 🎂' : 'අද දින! 🎂' };
    }
    
    if (diffDays < 0) {
      const bdayNextYear = new Date(today.getFullYear() + 1, bday.getMonth(), bday.getDate());
      bdayNextYear.setHours(0, 0, 0, 0);
      diffTime = bdayNextYear.getTime() - today.getTime();
      diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    
    return { 
      isToday: false, 
      daysRemaining: diffDays, 
      text: language === 'en' ? `In ${diffDays} days` : `තව දින ${diffDays}කින්` 
    };
  };

  // Tabs
  const [activeTab, setActiveTab] = useState<'customers' | 'suppliers' | 'loyalty' | 'debtors' | 'sms-gateway' | 'birthdays'>('customers');

  useEffect(() => {
    if (activeSubTab && (activeSubTab === 'customers' || activeSubTab === 'suppliers' || activeSubTab === 'loyalty' || activeSubTab === 'debtors' || activeSubTab === 'sms-gateway' || activeSubTab === 'birthdays')) {
      setActiveTab(activeSubTab as any);
    }
  }, [activeSubTab]);

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
  const [cNic, setCNic] = useState('');
  const [cBirthday, setCBirthday] = useState('');

  // Supplier Form Fields
  const [sName, setSName] = useState('');
  const [sPhone, setSPhone] = useState('');
  const [sEmail, setSEmail] = useState('');
  const [sCompany, setSCompany] = useState('');
  const [sAddress, setSAddress] = useState('');
  const [sNotes, setSNotes] = useState('');
  const [sNic, setSNic] = useState('');
  const [sBirthday, setSBirthday] = useState('');

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
        notes: cNotes.trim() || undefined,
        nic: cNic.trim() || undefined,
        birthday: cBirthday || undefined
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
        nic: cNic.trim() || undefined,
        birthday: cBirthday || undefined,
        loyaltyPoints: 0,
        createdAt: new Date().toISOString()
      });
    }

    setIsCustModalOpen(false);
    setCName(''); setCPhone(''); setCEmail(''); setCAddress(''); setCNotes(''); setCNic(''); setCBirthday('');
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
        notes: sNotes.trim() || undefined,
        nic: sNic.trim() || undefined,
        birthday: sBirthday || undefined
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
        nic: sNic.trim() || undefined,
        birthday: sBirthday || undefined,
        createdAt: new Date().toISOString()
      });
    }

    setIsSuppModalOpen(false);
    setSName(''); setSPhone(''); setSEmail(''); setSCompany(''); setSAddress(''); setSNotes(''); setSNic(''); setSBirthday('');
  };

  return (
    <div className="space-y-6">
      {/* Sub-tabs Toggle */}
      <div className="flex border-b border-slate-200 bg-white p-2 rounded-xl shadow-sm space-x-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => { setActiveTab('customers'); if (onSubTabChange) onSubTabChange('customers'); }}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center ${
            activeTab === 'customers' ? 'bg-blue-600 text-white shadow' : 'text-slate-650 hover:bg-slate-100'
          }`}
        >
          <User className="h-4 w-4 mr-1.5" />
          {language === 'en' ? 'Customers' : 'ගැනුම්කරුවන්'}
        </button>
        <button
          onClick={() => { setActiveTab('suppliers'); if (onSubTabChange) onSubTabChange('suppliers'); }}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center ${
            activeTab === 'suppliers' ? 'bg-blue-600 text-white shadow' : 'text-slate-655 hover:bg-slate-100'
          }`}
        >
          <Users className="h-4 w-4 mr-1.5" />
          {language === 'en' ? 'Suppliers' : 'විකුණුම්කරුවන් (Suppliers)'}
        </button>
        <button
          onClick={() => { setActiveTab('loyalty'); if (onSubTabChange) onSubTabChange('loyalty'); }}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center ${
            activeTab === 'loyalty' ? 'bg-blue-600 text-white shadow' : 'text-slate-655 hover:bg-slate-100'
          }`}
        >
          <Award className="h-4 w-4 mr-1.5" />
          {language === 'en' ? 'Loyalty Program' : 'ලෝයල්ටි වැඩසටහන'}
        </button>
        <button
          onClick={() => { setActiveTab('debtors'); if (onSubTabChange) onSubTabChange('debtors'); }}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center ${
            activeTab === 'debtors' ? 'bg-blue-600 text-white shadow' : 'text-slate-655 hover:bg-slate-100'
          }`}
        >
          <Notebook className="h-4 w-4 mr-1.5" />
          {language === 'en' ? 'Debtors & HP Reminders' : 'ණයගැතියන් සහ HP මතක් කිරීම්'}
        </button>
        <button
          onClick={() => { setActiveTab('sms-gateway'); if (onSubTabChange) onSubTabChange('sms-gateway'); }}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center ${
            activeTab === 'sms-gateway' ? 'bg-blue-600 text-white shadow' : 'text-slate-655 hover:bg-slate-100'
          }`}
        >
          <Phone className="h-4 w-4 mr-1.5" />
          {language === 'en' ? 'SMS Gateway & SIM' : 'SMS Gateway සහ SIM'}
        </button>
        <button
          onClick={() => { setActiveTab('birthdays'); if (onSubTabChange) onSubTabChange('birthdays'); }}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center ${
            activeTab === 'birthdays' ? 'bg-blue-600 text-white shadow' : 'text-slate-655 hover:bg-slate-100'
          }`}
        >
          <Gift className="h-4 w-4 mr-1.5" />
          {language === 'en' ? 'Birthdays & Promos' : 'උපන්දින සහ ප්‍රවර්ධන'}
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
                              setCNic(cust.nic || '');
                              setCBirthday(cust.birthday || '');
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
                              setSNic(supp.nic || '');
                              setSBirthday(supp.birthday || '');
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
                <span className="font-bold text-indigo-300">Rs. {(loyaltyPointValue || 1).toLocaleString()} = 1 Point</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{language === 'en' ? 'Point Value' : 'පොයින්ට් එකක වටිනාකම'}:</span>
                <span className="font-bold text-emerald-400">1 Point = Rs. {(pointRedemptionValue || 10).toFixed(2)}</span>
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
              <button onClick={() => { setIsCustModalOpen(false); setEditingCustomer(null); setCName(''); setCPhone(''); setCEmail(''); setCAddress(''); setCNotes(''); setCNic(''); setCBirthday(''); }} className="text-slate-400 hover:text-white">✕</button>
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
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">NIC Number (Optional)</label>
                  <input
                    type="text" value={cNic} 
                    onChange={(e) => {
                      const val = e.target.value;
                      setCNic(val);
                      const res = extractBirthdayFromNIC(val);
                      if (res) {
                        setCBirthday(res.birthday);
                      }
                    }}
                    placeholder="e.g. 942341234V" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg uppercase"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Birthday (උපන්දිනය)</label>
                  <input
                    type="date" value={cBirthday} onChange={(e) => setCBirthday(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-bold bg-white"
                  />
                </div>
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
                <button type="button" onClick={() => { setIsCustModalOpen(false); setEditingCustomer(null); setCName(''); setCPhone(''); setCEmail(''); setCAddress(''); setCNotes(''); setCNic(''); setCBirthday(''); }} className="flex-1 bg-slate-100 py-2 rounded-lg font-bold">Cancel</button>
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

      {/* BIRTHDAYS TAB */}
      {activeTab === 'birthdays' && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-base font-black text-slate-800 flex items-center">
                  <Gift className="h-5 w-5 mr-2 text-rose-500 animate-bounce" />
                  Birthday Registry & Campaigns (උපන්දින ප්‍රවර්ධන)
                </h3>
                <p className="text-xs text-slate-400 font-bold">
                  Extract birthdays from Sri Lankan NIC numbers automatically or add them manually to run SMS marketing campaigns.
                </p>
              </div>
            </div>

            {/* Birthday Status Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="bg-gradient-to-br from-rose-50 to-pink-50 p-4 rounded-2xl border border-rose-100 flex items-center space-x-4">
                <div className="p-3 bg-rose-500 rounded-xl text-white">
                  <Gift className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-rose-600 uppercase tracking-wider">Birthdays Today</h4>
                  <p className="text-2xl font-black text-slate-800">
                    {(() => {
                      const today = new Date();
                      const count = [...customers, ...suppliers].filter(p => {
                        if (!p.birthday) return false;
                        const d = new Date(p.birthday);
                        return d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
                      }).length;
                      return count;
                    })()}
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-2xl border border-blue-100 flex items-center space-x-4">
                <div className="p-3 bg-blue-500 rounded-xl text-white">
                  <Calendar className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-wider">Upcoming (30 Days)</h4>
                  <p className="text-2xl font-black text-slate-800">
                    {(() => {
                      const today = new Date();
                      const count = [...customers, ...suppliers].filter(p => {
                        if (!p.birthday) return false;
                        const d = new Date(p.birthday);
                        const bdayThisYear = new Date(today.getFullYear(), d.getMonth(), d.getDate());
                        let diffTime = bdayThisYear.getTime() - today.getTime();
                        let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        if (diffDays < 0) {
                          const bdayNextYear = new Date(today.getFullYear() + 1, d.getMonth(), d.getDate());
                          diffTime = bdayNextYear.getTime() - today.getTime();
                          diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        }
                        return diffDays >= 0 && diffDays <= 30;
                      }).length;
                      return count;
                    })()}
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-2xl border border-slate-200 flex items-center space-x-4">
                <div className="p-3 bg-slate-600 rounded-xl text-white">
                  <Award className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Registered Birthdays</h4>
                  <p className="text-2xl font-black text-slate-800">
                    {[...customers, ...suppliers].filter(p => !!p.birthday).length}
                  </p>
                </div>
              </div>
            </div>

            {/* Birthday Registry Table */}
            <div className="border border-slate-150 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs font-semibold">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold text-[9px] uppercase tracking-wider">
                    <th className="py-3 px-6">Name (නම)</th>
                    <th className="py-3 px-6">Type</th>
                    <th className="py-3 px-6">Phone (දුරකථන)</th>
                    <th className="py-3 px-6">Birthday (උපන්දිනය)</th>
                    <th className="py-3 px-6">NIC / Age</th>
                    <th className="py-3 px-6 text-center">Status</th>
                    <th className="py-3 px-6 text-right">Marketing Campaigns</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-700 bg-white">
                  {(() => {
                    const list = [...customers.map(c => ({ ...c, type: 'Customer' })), ...suppliers.map(s => ({ ...s, type: 'Supplier' }))]
                      .filter(p => !!p.birthday)
                      .map(p => {
                        const statusInfo = getBirthdayStatus(p.birthday!);
                        return { ...p, statusInfo };
                      })
                      .sort((a, b) => (a.statusInfo?.daysRemaining || 999) - (b.statusInfo?.daysRemaining || 999));

                    if (list.length === 0) {
                      return (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                            No registered birthdays found. Edit a customer/supplier to add their NIC or birthday.
                          </td>
                        </tr>
                      );
                    }

                    return list.map(p => {
                      const age = p.birthday ? new Date().getFullYear() - new Date(p.birthday).getFullYear() : '-';
                      const defaultPromoTextSi = `සුභ උපන්දිනයක් වේවා ${p.name}! SmartShop Pro වෙතින් ඔබට විශේෂ තෑග්ගක්: ඊළඟ වතාවේ පැමිණීමේදී 10% ක වට්ටමක් ලබා ගැනීමට BDAY-10 කේතය පෙන්වන්න.`;
                      const defaultPromoTextEn = `Happy Birthday ${p.name}! SmartShop Pro has a special gift for you: show code BDAY-10 on your next visit to get a 10% discount.`;
                      const promoMsg = language === 'si' ? defaultPromoTextSi : defaultPromoTextEn;

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/50">
                          <td className="py-4 px-6 font-bold text-slate-800">{p.name}</td>
                          <td className="py-4 px-6">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              p.type === 'Customer' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-purple-50 text-purple-600 border border-purple-100'
                            }`}>
                              {p.type}
                            </span>
                          </td>
                          <td className="py-4 px-6 font-mono font-bold text-slate-500">{p.phone}</td>
                          <td className="py-4 px-6 font-bold text-slate-600">
                            {p.birthday ? new Date(p.birthday).toLocaleDateString() : '-'}
                          </td>
                          <td className="py-4 px-6 text-slate-450 font-bold">
                            <div>{p.nic || 'Manual'}</div>
                            {p.birthday && <div className="text-[10px] text-slate-400">Age: {age} yrs</div>}
                          </td>
                          <td className="py-4 px-6 text-center">
                            {p.statusInfo?.isToday ? (
                              <span className="bg-rose-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold animate-pulse">
                                {p.statusInfo.text}
                              </span>
                            ) : (
                              <span className="bg-slate-100 text-slate-650 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                                {p.statusInfo?.text}
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button
                              onClick={() => {
                                onSendSms(p.phone, promoMsg);
                                alert(language === 'en' ? `Birthday Promo SMS sent to ${p.name}!` : `${p.name} වෙත උපන්දින වට්ටම් SMS පණිවිඩය යවන ලදී!`);
                              }}
                              className="px-3 py-1.5 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white rounded-xl text-[10px] font-black shadow-md cursor-pointer transition active:scale-95 flex items-center space-x-1 ml-auto"
                            >
                              <Gift className="h-3 w-3 mr-0.5" />
                              <span>Send Promo SMS</span>
                            </button>
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

      {/* NEW SUPPLIER MODAL */}
      {isSuppModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-950 text-white p-4 flex justify-between items-center">
              <h3 className="text-xs font-bold flex items-center">
                <Users className="h-4 w-4 mr-1 text-blue-400" />
                {language === 'en' ? (editingSupplier ? 'Edit Supplier' : 'Add New Supplier') : (editingSupplier ? 'සැපයුම්කරු විස්තර වෙනස් කරන්න' : 'නව විකුණුම්කරුවෙකු ඇතුළත් කරන්න')}
              </h3>
              <button onClick={() => { setIsSuppModalOpen(false); setEditingSupplier(null); setSName(''); setSPhone(''); setSEmail(''); setSCompany(''); setSAddress(''); setSNotes(''); setSNic(''); setSBirthday(''); }} className="text-slate-400 hover:text-white">✕</button>
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
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">NIC Number (Optional)</label>
                  <input
                    type="text" value={sNic} 
                    onChange={(e) => {
                      const val = e.target.value;
                      setSNic(val);
                      const res = extractBirthdayFromNIC(val);
                      if (res) {
                        setSBirthday(res.birthday);
                      }
                    }}
                    placeholder="e.g. 942341234V" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg uppercase"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Birthday (උපන්දිනය)</label>
                  <input
                    type="date" value={sBirthday} onChange={(e) => setSBirthday(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-bold bg-white"
                  />
                </div>
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
                <button type="button" onClick={() => { setIsSuppModalOpen(false); setEditingSupplier(null); setSName(''); setSPhone(''); setSEmail(''); setSCompany(''); setSAddress(''); setSNotes(''); setSNic(''); setSBirthday(''); }} className="flex-1 bg-slate-100 py-2 rounded-lg font-bold">Cancel</button>
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
