import React, { useState, useMemo, useEffect } from 'react';
import { Employee, AttendanceRecord, CommissionRecord, ShopSettings } from '../types';
import { translations } from '../lib/translations';
import { 
  Plus, Calendar, DollarSign, Users, User, Phone, CheckCircle, 
  Clock, Award, ClipboardList, Briefcase, Notebook, Trash2, Edit 
} from 'lucide-react';

interface AttendanceStaffProps {
  language: 'en' | 'si';
  settings: ShopSettings;
  employees: Employee[];
  attendance: AttendanceRecord[];
  commissions: CommissionRecord[];
  onAddEmployee: (emp: Employee) => void;
  onRecordAttendance: (rec: AttendanceRecord) => void;
  onAddCommission: (com: CommissionRecord) => void;
  onPayoutStaff: (employeeId: string, amount: number) => void;
  onUpdateEmployee: (emp: Employee) => void;
  onDeleteEmployee: (id: string) => void;
  onUpdateAttendance: (rec: AttendanceRecord) => void;
  onDeleteAttendance: (id: string) => void;
  activeSubTab?: string;
  onSubTabChange?: (tab: any) => void;
}

export const AttendanceStaff: React.FC<AttendanceStaffProps> = ({
  language,
  settings,
  employees,
  attendance,
  commissions,
  onAddEmployee,
  onRecordAttendance,
  onAddCommission,
  onPayoutStaff,
  onUpdateEmployee,
  onDeleteEmployee,
  onUpdateAttendance,
  onDeleteAttendance,
  activeSubTab,
  onSubTabChange
}) => {
  const t = translations[language];

  // Primary Sub-tabs Toggle
  const [activeTab, setActiveTab] = useState<'profiles' | 'attendance' | 'commissions'>('profiles');

  useEffect(() => {
    if (activeSubTab && (activeSubTab === 'profiles' || activeSubTab === 'attendance' || activeSubTab === 'commissions')) {
      setActiveTab(activeSubTab as any);
    }
  }, [activeSubTab]);

  // Modals
  const [isEmpModalOpen, setIsEmpModalOpen] = useState(false);
  const [isAttModalOpen, setIsAttModalOpen] = useState(false);
  const [isComModalOpen, setIsComModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editingAttendance, setEditingAttendance] = useState<AttendanceRecord | null>(null);

  // New Employee Form Fields
  const [eName, setEName] = useState('');
  const [ePhone, setEPhone] = useState('');
  const [eRole, setERole] = useState<'Admin' | 'Cashier' | 'Technician'>('Cashier');
  const [eSalary, setESalary] = useState<number>(0);
  const [eCommission, setECommission] = useState<number>(0);
  const [eAddress, setEAddress] = useState('');
  const [ePasscode, setEPasscode] = useState('');

  // New Attendance Form Fields
  const [attEmpId, setAttEmpId] = useState('');
  const [attStatus, setAttStatus] = useState<'Present' | 'Absent' | 'Leave'>('Present');
  const [attClockIn, setAttClockIn] = useState('08:30');
  const [attClockOut, setAttClockOut] = useState('17:30');

  // New Commission Form Fields
  const [comEmpId, setComEmpId] = useState('');
  const [comSourceType, setComSourceType] = useState<'Repair' | 'Sale'>('Repair');
  const [comSourceId, setComSourceId] = useState('');
  const [comAmount, setComAmount] = useState<number>(0);

  // Payout Modal States
  const [payoutEmployee, setPayoutEmployee] = useState<Employee | null>(null);
  const [payoutAmount, setPayoutAmount] = useState<number>(0);

  const handlePayoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutEmployee || payoutAmount <= 0) return;
    if (payoutAmount > payoutEmployee.walletBalance) {
      alert(language === 'en' ? 'Payout amount exceeds wallet balance!' : 'ගෙවීම් මුදල පසුම්බි ශේෂය ඉක්මවා යයි!');
      return;
    }
    onPayoutStaff(payoutEmployee.id, payoutAmount);
    setPayoutEmployee(null);
    setPayoutAmount(0);
    alert(language === 'en' ? 'Payout successful!' : 'ගෙවීම් සාර්ථකයි!');
  };

  // Filtered lists
  const filteredEmployees = useMemo(() => {
    return employees;
  }, [employees]);

  // Handle Add Employee / Edit Employee
  const handleAddEmployeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eName.trim() || !ePhone.trim()) return;

    if (editingEmployee) {
      onUpdateEmployee({
        ...editingEmployee,
        name: eName.trim(),
        phone: ePhone.trim(),
        role: eRole,
        basicSalary: eSalary,
        commissionRate: eCommission,
        address: eAddress.trim() || undefined,
        passcode: ePasscode.trim() || undefined
      });
      setEditingEmployee(null);
    } else {
      onAddEmployee({
        id: `EMP-${Date.now()}`,
        name: eName.trim(),
        phone: ePhone.trim(),
        role: eRole,
        basicSalary: eSalary,
        commissionRate: eCommission,
        address: eAddress.trim() || undefined,
        joinedDate: new Date().toISOString().split('T')[0],
        walletBalance: 0,
        passcode: ePasscode.trim() || undefined
      });
    }

    setIsEmpModalOpen(false);
    setEName(''); setEPhone(''); setESalary(0); setECommission(0); setEAddress(''); setEPasscode('');
  };

  // Handle Record Attendance
  const handleRecordAttendanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!attEmpId) return;

    const emp = employees.find(empItem => empItem.id === attEmpId);
    if (!emp) return;

    if (editingAttendance) {
      onUpdateAttendance({
        ...editingAttendance,
        employeeId: emp.id,
        employeeName: emp.name,
        clockIn: attClockIn,
        clockOut: attClockOut || undefined,
        status: attStatus
      });
      setEditingAttendance(null);
    } else {
      onRecordAttendance({
        id: `ATT-${Date.now()}`,
        employeeId: emp.id,
        employeeName: emp.name,
        date: new Date().toISOString().split('T')[0],
        clockIn: attClockIn,
        clockOut: attClockOut || undefined,
        status: attStatus
      });
    }

    setIsAttModalOpen(false);
    setAttEmpId(''); setAttStatus('Present'); setAttClockIn('08:30'); setAttClockOut('17:30');
  };

  // Handle Add Commission
  const handleAddCommissionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comEmpId || comAmount <= 0) return;

    const emp = employees.find(empItem => empItem.id === comEmpId);
    if (!emp) return;

    onAddCommission({
      id: `COM-${Date.now()}`,
      employeeId: emp.id,
      employeeName: emp.name,
      sourceType: comSourceType,
      sourceId: comSourceId.trim(),
      amount: comAmount,
      createdAt: new Date().toISOString()
    });

    setIsComModalOpen(false);
    setComSourceId(''); setComAmount(0);
  };

  return (
    <div className="space-y-6">
      {/* Sub-tabs Toggle */}
      <div className="flex border-b border-slate-200 bg-white p-2 rounded-xl shadow-sm space-x-2">
        <button
          onClick={() => { setActiveTab('profiles'); if (onSubTabChange) onSubTabChange('profiles'); }}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center ${
            activeTab === 'profiles' ? 'bg-blue-600 text-white shadow' : 'text-slate-650 hover:bg-slate-100'
          }`}
        >
          <User className="h-4 w-4 mr-1.5" />
          {language === 'en' ? 'Employee Profiles' : 'සේවක පැතිකඩ'}
        </button>
        <button
          onClick={() => { setActiveTab('attendance'); if (onSubTabChange) onSubTabChange('attendance'); }}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center ${
            activeTab === 'attendance' ? 'bg-blue-600 text-white shadow' : 'text-slate-655 hover:bg-slate-100'
          }`}
        >
          <Calendar className="h-4 w-4 mr-1.5" />
          {language === 'en' ? 'Attendance & Salary' : 'පැමිණීම සහ වැටුප්'}
        </button>
        <button
          onClick={() => { setActiveTab('commissions'); if (onSubTabChange) onSubTabChange('commissions'); }}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center ${
            activeTab === 'commissions' ? 'bg-blue-600 text-white shadow' : 'text-slate-655 hover:bg-slate-100'
          }`}
        >
          <Award className="h-4 w-4 mr-1.5" />
          {language === 'en' ? 'Staff Commissions' : 'කොමිස් ගෙවීම් (Commissions)'}
        </button>
      </div>

      {/* PROFILES TAB */}
      {activeTab === 'profiles' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center">
              <Users className="h-4.5 w-4.5 mr-1.5 text-blue-600" />
              {language === 'en' ? 'Employee Profiles Directory' : 'සේවක තොරතුරු නාමාවලිය'}
            </h3>
            <button
              onClick={() => setIsEmpModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-md flex items-center"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              {language === 'en' ? 'Add Employee' : 'නව සේවකයෙකු ඇතුළත් කරන්න'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {filteredEmployees.map(emp => (
              <div key={emp.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4 hover:shadow-md transition">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3.5">
                    <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600">
                      <Briefcase className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-800">{emp.name}</h4>
                      <p className="text-[10px] text-slate-400 font-bold">{emp.role} • ID: {emp.id}</p>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => {
                        const entered = prompt(language === 'en' ? 'Security authentication: Enter Admin PIN passcode to edit employee profile:' : 'ආරක්ෂක සත්‍යාපනය: සේවක පැතිකඩ වෙනස් කිරීමට කළමනාකරු PIN අංකය ඇතුළත් කරන්න:');
                        if (entered !== (settings.adminPin || '8892')) {
                          alert(language === 'en' ? 'Unauthorized! Incorrect Admin PIN.' : 'අනවසරයි! වැරදි කළමනාකරු PIN අංකයකි.');
                          return;
                        }
                        setEditingEmployee(emp);
                        setEName(emp.name);
                        setEPhone(emp.phone);
                        setERole(emp.role);
                        setESalary(emp.basicSalary);
                        setECommission(emp.commissionRate);
                        setEAddress(emp.address || '');
                        setEPasscode(emp.passcode || '');
                        setIsEmpModalOpen(true);
                      }}
                      className="p-1 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition cursor-pointer"
                      title="Edit Employee"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        const entered = prompt(language === 'en' ? 'Security authentication: Enter Admin PIN passcode to delete employee:' : 'ආරක්ෂක සත්‍යාපනය: සේවකයා ඉවත් කිරීමට කළමනාකරු PIN අංකය ඇතුළත් කරන්න:');
                        if (entered !== (settings.adminPin || '8892')) {
                          alert(language === 'en' ? 'Unauthorized! Incorrect Admin PIN.' : 'අනවසරයි! වැරදි කළමනාකරු PIN අංකයකි.');
                          return;
                        }
                        if (confirm(language === 'en' ? `Are you sure you want to delete employee ${emp.name}?` : `මෙම සේවකයා (${emp.name}) පද්ධතියෙන් ඉවත් කිරීමට අවශ්‍ය බව ස්ථිරද?`)) {
                          onDeleteEmployee(emp.id);
                        }
                      }}
                      className="p-1 hover:bg-rose-50 text-rose-600 rounded-lg transition cursor-pointer"
                      title="Delete Employee"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="text-xs font-semibold space-y-2 border-t border-slate-100 pt-3 text-slate-600">
                  <div className="flex justify-between">
                    <span>Phone:</span>
                    <span className="text-slate-800 font-bold">{emp.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Basic Salary:</span>
                    <span className="text-slate-800 font-bold">Rs. {emp.basicSalary.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Commission Rate:</span>
                    <span className="text-blue-600 font-extrabold">{emp.commissionRate}%</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-100 pt-2">
                    <span>Wallet Balance:</span>
                    <span className="text-emerald-600 font-black">Rs. {(emp.walletBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  {emp.walletBalance > 0 && (
                    <button
                      onClick={() => {
                        setPayoutEmployee(emp);
                        setPayoutAmount(emp.walletBalance);
                      }}
                      className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 rounded-xl text-[10px] transition shadow"
                    >
                      Payout Commission
                    </button>
                  )}
                  {emp.address && (
                    <div className="text-[10px] text-slate-400 font-medium">
                      Address: {emp.address}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ATTENDANCE TAB */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center">
              <ClipboardList className="h-4.5 w-4.5 mr-1.5 text-blue-600" />
              {language === 'en' ? 'Daily Attendance Log' : 'දිනපතා පැමිණීමේ ලේඛනය'}
            </h3>
            <button
              onClick={() => setIsAttModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-md flex items-center"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              {language === 'en' ? 'Clock In / Out' : 'පැමිණීම සටහන් කරන්න'}
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-extrabold text-[10px] tracking-wider border-b border-slate-100">
                    <th className="py-4 px-6">DATE</th>
                    <th className="py-4 px-6">EMPLOYEE</th>
                    <th className="py-4 px-6 text-center">CLOCK IN</th>
                    <th className="py-4 px-6 text-center">CLOCK OUT</th>
                    <th className="py-4 px-6 text-center">STATUS</th>
                    <th className="py-4 px-6 text-center">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                  {attendance.map(rec => (
                    <tr key={rec.id} className="hover:bg-slate-50/50">
                      <td className="py-4 px-6 font-bold text-slate-400">{rec.date}</td>
                      <td className="py-4 px-6 font-bold text-slate-800">{rec.employeeName}</td>
                      <td className="py-4 px-6 text-center font-medium">{rec.clockIn}</td>
                      <td className="py-4 px-6 text-center font-medium">{rec.clockOut || '-'}</td>
                      <td className="py-4 px-6 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          rec.status === 'Present' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {rec.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex justify-center space-x-1.5">
                          <button
                            onClick={() => {
                              setEditingAttendance(rec);
                              setAttEmpId(rec.employeeId);
                              setAttStatus(rec.status);
                              setAttClockIn(rec.clockIn || '08:30');
                              setAttClockOut(rec.clockOut || '17:30');
                              setIsAttModalOpen(true);
                            }}
                            className="p-1 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition cursor-pointer"
                            title="Edit Attendance"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(language === 'en' ? `Are you sure you want to delete this attendance record?` : `මෙම පැමිණීමේ සටහන මකා දැමීමට අවශ්‍ය බව ස්ථිරද?`)) {
                                onDeleteAttendance(rec.id);
                              }
                            }}
                            className="p-1 hover:bg-rose-50 text-rose-600 rounded-lg transition cursor-pointer"
                            title="Delete Attendance"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* COMMISSIONS TAB */}
      {activeTab === 'commissions' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center">
              <Award className="h-4.5 w-4.5 mr-1.5 text-blue-600" />
              {language === 'en' ? 'Staff Commissions Ledger' : 'සේවක කොමිස් ගෙවීම් ලේඛනය'}
            </h3>
            <button
              onClick={() => setIsComModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-md flex items-center"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              {language === 'en' ? 'Record Commission' : 'නව කොමිස් ගෙවීමක්'}
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-extrabold text-[10px] tracking-wider border-b border-slate-100">
                    <th className="py-4 px-6">ID</th>
                    <th className="py-4 px-6">EMPLOYEE</th>
                    <th className="py-4 px-6 text-center">SOURCE TYPE</th>
                    <th className="py-4 px-6">SOURCE ID</th>
                    <th className="py-4 px-6 text-right">COMMISSION AMOUNT</th>
                    <th className="py-4 px-6 text-center">DATE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                  {commissions.map(com => (
                    <tr key={com.id} className="hover:bg-slate-50/50">
                      <td className="py-4 px-6 text-slate-400">{com.id}</td>
                      <td className="py-4 px-6 font-bold text-slate-800">{com.employeeName}</td>
                      <td className="py-4 px-6 text-center">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold">
                          {com.sourceType}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-medium text-slate-500">{com.sourceId || '-'}</td>
                      <td className="py-4 px-6 text-right font-extrabold text-blue-600">Rs. {com.amount.toLocaleString()}</td>
                      <td className="py-4 px-6 text-center text-slate-400 font-medium">{new Date(com.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* NEW EMPLOYEE MODAL */}
      {isEmpModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-950 text-white p-4 flex justify-between items-center">
              <h3 className="text-xs font-bold flex items-center">
                <User className="h-4 w-4 mr-1 text-blue-400" />
                {editingEmployee ? 'Edit Employee Profile' : 'Add New Employee'}
              </h3>
              <button onClick={() => { setIsEmpModalOpen(false); setEditingEmployee(null); setEName(''); setEPhone(''); setESalary(0); setECommission(0); setEAddress(''); }} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAddEmployeeSubmit} className="p-5 space-y-3 text-xs font-semibold">
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Employee Name *</label>
                <input
                  type="text" required value={eName} onChange={(e) => setEName(e.target.value)}
                  placeholder="e.g. Asanka Perera" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Phone Number *</label>
                <input
                  type="tel" required value={ePhone} onChange={(e) => setEPhone(e.target.value)}
                  placeholder="e.g. 0771234567" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Role</label>
                <select
                  value={eRole} onChange={(e) => setERole(e.target.value as any)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white"
                >
                  <option value="Admin">Admin</option>
                  <option value="Cashier">Cashier</option>
                  <option value="Technician">Technician</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Basic Salary (LKR) *</label>
                  <input
                    type="number" min="0" required value={eSalary || ''} onChange={(e) => setESalary(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Commission Rate (%) *</label>
                  <input
                    type="number" min="0" required value={eCommission || ''} onChange={(e) => setECommission(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Employee Login Passcode (PIN/Alphanumeric)</label>
                <input
                  type="password"
                  maxLength={12}
                  value={ePasscode}
                  onChange={(e) => setEPasscode(e.target.value)}
                  placeholder="e.g. passcode"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-center font-extrabold tracking-widest text-slate-800 focus:bg-slate-50"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Address</label>
                <input
                  type="text" value={eAddress} onChange={(e) => setEAddress(e.target.value)}
                  placeholder="e.g. Kurunegala" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button type="button" onClick={() => { setIsEmpModalOpen(false); setEditingEmployee(null); setEName(''); setEPhone(''); setESalary(0); setECommission(0); setEAddress(''); setEPasscode(''); }} className="flex-1 bg-slate-100 py-2 rounded-lg font-bold">Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold shadow">Save Employee</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW ATTENDANCE MODAL */}
      {isAttModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-950 text-white p-4 flex justify-between items-center">
              <h3 className="text-xs font-bold flex items-center">
                <Calendar className="h-4 w-4 mr-1 text-blue-400" />
                {editingAttendance ? 'Edit Attendance Record' : 'Record Employee Attendance'}
              </h3>
              <button onClick={() => { setIsAttModalOpen(false); setEditingAttendance(null); setAttEmpId(''); setAttStatus('Present'); setAttClockIn('08:30'); setAttClockOut('17:30'); }} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleRecordAttendanceSubmit} className="p-5 space-y-3 text-xs font-semibold">
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Select Employee *</label>
                <select
                  required value={attEmpId} onChange={(e) => setAttEmpId(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white font-bold"
                >
                  <option value="">-- Choose Employee --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500">Status</label>
                <select
                  value={attStatus} onChange={(e) => setAttStatus(e.target.value as any)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white font-bold"
                >
                  <option value="Present">Present (පැමිණ සිටී)</option>
                  <option value="Absent">Absent (පැමිණ නැත)</option>
                  <option value="Leave">Leave (නිවාඩු)</option>
                </select>
              </div>

              {attStatus === 'Present' && (
                <div className="grid grid-cols-2 gap-2 animate-in slide-in-from-top-2 duration-150">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-500">Clock In Time</label>
                    <input
                      type="text" value={attClockIn} onChange={(e) => setAttClockIn(e.target.value)}
                      placeholder="e.g. 08:30" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-500">Clock Out Time</label>
                    <input
                      type="text" value={attClockOut} onChange={(e) => setAttClockOut(e.target.value)}
                      placeholder="e.g. 17:30" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>
              )}

              <div className="flex space-x-2 pt-2">
                <button type="button" onClick={() => { setIsAttModalOpen(false); setEditingAttendance(null); setAttEmpId(''); setAttStatus('Present'); setAttClockIn('08:30'); setAttClockOut('17:30'); }} className="flex-1 bg-slate-100 py-2 rounded-lg font-bold">Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold shadow">Save Attendance</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW COMMISSION MODAL */}
      {isComModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-950 text-white p-4 flex justify-between items-center">
              <h3 className="text-xs font-bold flex items-center">
                <Award className="h-4 w-4 mr-1 text-blue-400" />
                Record Staff Commission
              </h3>
              <button onClick={() => setIsComModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAddCommissionSubmit} className="p-5 space-y-3 text-xs font-semibold">
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Select Employee *</label>
                <select
                  required onChange={(e) => setComEmpId(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white font-bold"
                >
                  <option value="">-- Choose Employee --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Source Type</label>
                  <select
                    value={comSourceType} onChange={(e) => setComSourceType(e.target.value as any)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="Repair">Repair Job</option>
                    <option value="Sale">Sale Item</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Source ID</label>
                  <input
                    type="text" value={comSourceId} onChange={(e) => setComSourceId(e.target.value)}
                    placeholder="e.g. REP-1234" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500">Commission Amount (LKR) *</label>
                <input
                  type="number" min="0" required value={comAmount || ''} onChange={(e) => setComAmount(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-bold"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button type="button" onClick={() => setIsComModalOpen(false)} className="flex-1 bg-slate-100 py-2 rounded-lg font-bold">Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold shadow">Save Commission</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PAYOUT COMMISSION MODAL */}
      {payoutEmployee && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-950 text-white p-4 flex justify-between items-center">
              <h3 className="text-xs font-bold flex items-center">
                <DollarSign className="h-4 w-4 mr-1 text-emerald-400" />
                Payout Commission: {payoutEmployee.name}
              </h3>
              <button onClick={() => setPayoutEmployee(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handlePayoutSubmit} className="p-5 space-y-3.5 text-xs font-semibold text-slate-700">
              <div className="space-y-1">
                <div className="flex justify-between font-bold">
                  <span>Available Balance:</span>
                  <span className="text-emerald-600 font-extrabold">Rs. {payoutEmployee.walletBalance.toLocaleString()}</span>
                </div>
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Payout Amount (LKR) *</label>
                <input
                  type="number"
                  min="1"
                  max={payoutEmployee.walletBalance}
                  required
                  value={payoutAmount || ''}
                  onChange={(e) => setPayoutAmount(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-bold"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button type="button" onClick={() => setPayoutEmployee(null)} className="flex-1 bg-slate-100 py-2 rounded-lg font-bold">Cancel</button>
                <button type="submit" className="flex-1 bg-emerald-600 text-white py-2 rounded-lg font-bold shadow">Confirm Payout</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
