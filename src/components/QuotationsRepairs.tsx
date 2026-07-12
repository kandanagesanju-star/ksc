import React, { useState, useMemo, useEffect } from 'react';
import { RepairJob, Quotation, Customer, RepairStatus, Product, ShopSettings } from '../types';
import { translations } from '../lib/translations';
import { 
  Plus, Search, Wrench, Edit, Trash2, Printer, CheckCircle, 
  Clock, Notebook, Calendar, User, Phone, FileText, ArrowRight, X, MapPin, Camera 
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
  settings: ShopSettings;
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
  onSubTabChange,
  settings
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

  // Quotation print state hooks
  const [printingQuotation, setPrintingQuotation] = useState<Quotation | null>(null);
  const [includeBankDetails, setIncludeBankDetails] = useState(true);
  const [qBankName, setQBankName] = useState('');
  const [qAccountNo, setQAccountNo] = useState('');
  const [qAccountName, setQAccountName] = useState('');
  const [qValidity, setQValidity] = useState('30 Days');
  const [qSubject, setQSubject] = useState('');

  const printingCustomerAddress = useMemo(() => {
    if (!printingQuotation) return '';
    const matched = customers.find(c => c.name === printingQuotation.customerName && c.phone === printingQuotation.customerPhone);
    return matched?.address || '';
  }, [printingQuotation, customers]);

  // New Repair Form state
  const [selectedRepairCust, setSelectedRepairCust] = useState<Customer | null>(null);
  const [rCustomerName, setRCustomerName] = useState('');
  const [rCustomerPhone, setRCustomerPhone] = useState('');
  const [rCustomerAddress, setRCustomerAddress] = useState('');
  const [rImei, setRImei] = useState('');
  const [rExpectedReturnDate, setRExpectedReturnDate] = useState('');
  const [rPatternLock, setRPatternLock] = useState<number[]>([]);
  const [rDeviceFrontPhoto, setRDeviceFrontPhoto] = useState<string | null>(null);
  const [rDeviceBackPhoto, setRDeviceBackPhoto] = useState<string | null>(null);
  const [rStatus, setRStatus] = useState<RepairStatus>('Pending');
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

  // Helper for pattern lock dots coordinate mapping
  const getDotCoords = (num: number) => {
    const col = (num - 1) % 3;
    const row = Math.floor((num - 1) / 3);
    return {
      x: 20 + col * 30,
      y: 20 + row * 30
    };
  };

  // Auto-populate customer fields when selected from dropdown
  useEffect(() => {
    if (selectedRepairCust) {
      setRCustomerName(selectedRepairCust.name);
      setRCustomerPhone(selectedRepairCust.phone);
      setRCustomerAddress(selectedRepairCust.address || '');
    } else {
      setRCustomerName('');
      setRCustomerPhone('');
      setRCustomerAddress('');
    }
  }, [selectedRepairCust]);

  // Handle Add Repair Job
  const handleAddRepairSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalCust = selectedRepairCust;
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

    if (editingRepairDetails) {
      onUpdateRepair({
        ...editingRepairDetails,
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
        deviceBackPhoto: rDeviceBackPhoto || undefined
      });
      setEditingRepairDetails(null);
    } else {
      onAddRepair({
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
      });
    }

    setIsRepairModalOpen(false);
    setSelectedRepairCust(null);
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

  const handlePrintQuote = () => {
    if (!printingQuotation) return;

    const matchedCustomer = customers.find(c => c.name === printingQuotation.customerName && c.phone === printingQuotation.customerPhone);
    const customerAddress = matchedCustomer?.address || '';

    const subtotal = printingQuotation.total;
    const vatRate = settings.vatRate || 0;
    const ssclRate = settings.ssclRate || 0;
    const vatAmount = subtotal * (vatRate / 100);
    const ssclAmount = subtotal * (ssclRate / 100);
    const grandTotal = subtotal + vatAmount + ssclAmount;

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>PRICE QUOTATION - ${printingQuotation.id}</title>
        <style>
          @page {
            size: A4;
            margin: 20mm;
          }
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #1e293b;
            line-height: 1.5;
            margin: 0;
            padding: 0;
            font-size: 13px;
          }
          .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
          }
          .shop-title {
            font-size: 24px;
            font-weight: 800;
            color: #0f172a;
            margin: 0;
            text-transform: uppercase;
            letter-spacing: -0.5px;
          }
          .shop-tag {
            font-size: 11px;
            color: #64748b;
            margin: 4px 0 0 0;
            font-weight: 600;
            text-transform: uppercase;
          }
          .shop-details {
            text-align: right;
            font-size: 11px;
            color: #475569;
            line-height: 1.6;
          }
          .divider {
            border-bottom: 2px solid #cbd5e1;
            margin-bottom: 20px;
          }
          .doc-title-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          .doc-title {
            font-size: 18px;
            font-weight: 800;
            color: #1e3a8a;
            margin: 0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .meta-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
          }
          .meta-td-left {
            width: 55%;
            vertical-align: top;
            padding-right: 15px;
          }
          .meta-td-right {
            width: 45%;
            vertical-align: top;
            text-align: right;
          }
          .label-header {
            font-size: 10px;
            font-weight: 800;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 6px;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 3px;
          }
          .client-name {
            font-size: 14px;
            font-weight: 800;
            color: #0f172a;
            margin-bottom: 2px;
          }
          .client-phone {
            font-weight: 700;
            color: #475569;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            margin-bottom: 25px;
          }
          .items-table th {
            background-color: #f8fafc;
            color: #1e293b;
            font-weight: 700;
            text-transform: uppercase;
            font-size: 10px;
            letter-spacing: 0.5px;
            border-top: 1px solid #cbd5e1;
            border-bottom: 2px solid #cbd5e1;
            padding: 10px 12px;
            text-align: left;
          }
          .items-table td {
            padding: 10px 12px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 12px;
          }
          .text-right {
            text-align: right !important;
          }
          .text-center {
            text-align: center !important;
          }
          .summary-table {
            width: 320px;
            margin-left: auto;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          .summary-table td {
            padding: 6px 12px;
            font-size: 12px;
          }
          .summary-total {
            font-size: 13px;
            font-weight: 800;
            color: #1e3a8a;
            border-top: 2px solid #cbd5e1;
            border-bottom: 2px double #cbd5e1;
            background-color: #f8fafc;
          }
          .bank-card {
            border: 1px solid #cbd5e1;
            background-color: #f8fafc;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 30px;
            width: 65%;
          }
          .bank-title {
            font-size: 10px;
            font-weight: 800;
            color: #1e3a8a;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 3px;
          }
          .bank-row {
            display: flex;
            margin-bottom: 4px;
            font-size: 11px;
          }
          .bank-row-label {
            width: 100px;
            color: #64748b;
            font-weight: 700;
          }
          .bank-row-val {
            font-weight: 700;
            color: #0f172a;
          }
          .terms-block {
            font-size: 11px;
            color: #64748b;
            line-height: 1.6;
            margin-bottom: 50px;
          }
          .signature-section {
            width: 100%;
            margin-top: 50px;
            border-collapse: collapse;
          }
          .signature-box {
            width: 50%;
            vertical-align: top;
          }
          .signature-line {
            width: 180px;
            border-bottom: 1px solid #94a3b8;
            margin-bottom: 5px;
          }
          .signature-label {
            font-size: 10px;
            color: #64748b;
            font-weight: 700;
            text-transform: uppercase;
          }
        </style>
      </head>
      <body>
        <!-- Header -->
        <table class="header-table">
          <tr>
            <td>
              <h1 class="shop-title">${settings.shopName || 'SmartShop Pro'}</h1>
              <p class="shop-tag">${settings.onlineTagline || 'Device Repairs & Retail Solutions'}</p>
            </td>
            <td class="shop-details">
              ${settings.shopAddress || 'No 120, Colombo Road,'}<br/>
              ${settings.shopAddress ? 'Kurunegala, Sri Lanka' : ''}<br/>
              Tel: ${settings.shopPhone || '077-1234567'}<br/>
              Email: ${settings.shopEmail || 'info@smartshoppro.com'}
            </td>
          </tr>
        </table>

        <div class="divider"></div>

        <!-- Doc Title -->
        <table class="doc-title-table">
          <tr>
            <td>
              <h2 class="doc-title">PRICE QUOTATION (මිල ගණන් කැඳවීම් පත්‍රය)</h2>
            </td>
            <td class="text-right" style="font-size: 14px; font-weight: 800; color: #1e3a8a;">
              Ref No: ${printingQuotation.id}
            </td>
          </tr>
        </table>

        <!-- Metadata -->
        <table class="meta-table">
          <tr>
            <td class="meta-td-left">
              <div class="label-header">PREPARED FOR (වෙත ඉදිරිපත් කෙරේ)</div>
              <div class="client-name">${printingQuotation.customerName}</div>
              <div class="client-phone">Tel: ${printingQuotation.customerPhone}</div>
              ${customerAddress ? `<div style="margin-top: 4px; color: #475569;">Address: ${customerAddress}</div>` : ''}
            </td>
            <td class="meta-td-right">
              <div class="label-header">DOCUMENT DETAILS</div>
              <div style="font-weight: 700; color: #0f172a; margin-bottom: 2px;">Date: ${new Date().toLocaleDateString()}</div>
              <div style="font-weight: 700; color: #b45309;">Validity: ${qValidity}</div>
            </td>
          </tr>
        </table>

        ${qSubject ? `
        <div style="margin-bottom: 20px; font-size: 12px; font-weight: 800; color: #0f172a; text-transform: uppercase; border-left: 3px solid #1e3a8a; padding-left: 8px;">
          Subject: ${qSubject}
        </div>
        ` : ''}

        <!-- Items Table -->
        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 40px;" class="text-center">#</th>
              <th>Description / Specification (විස්තරය)</th>
              <th class="text-center" style="width: 70px;">Qty</th>
              <th class="text-right" style="width: 110px;">Unit Price (Rs.)</th>
              <th class="text-right" style="width: 120px;">Amount (Rs.)</th>
            </tr>
          </thead>
          <tbody>
            ${printingQuotation.items.map((item, idx) => `
              <tr>
                <td class="text-center">${idx + 1}</td>
                <td style="font-weight: 600; color: #0f172a;">${item.description}</td>
                <td class="text-center">${item.qty}</td>
                <td class="text-right">${item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td class="text-right" style="font-weight: 700; color: #0f172a;">${(item.price * item.qty).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- Summary -->
        <table class="summary-table">
          <tr>
            <td class="text-right" style="color: #64748b; font-weight: 600;">Subtotal:</td>
            <td class="text-right" style="font-weight: 700; width: 120px;">Rs. ${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          </tr>
          ${vatRate > 0 ? `
          <tr>
            <td class="text-right" style="color: #64748b; font-weight: 600;">VAT (${vatRate}%):</td>
            <td class="text-right" style="font-weight: 700;">Rs. ${vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          </tr>
          ` : ''}
          ${ssclRate > 0 ? `
          <tr>
            <td class="text-right" style="color: #64748b; font-weight: 600;">SSCL (${ssclRate}%):</td>
            <td class="text-right" style="font-weight: 700;">Rs. ${ssclAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          </tr>
          ` : ''}
          <tr class="summary-total">
            <td class="text-right" style="font-weight: 800;">Grand Total (Rs.):</td>
            <td class="text-right" style="font-weight: 800; font-size: 14px;">Rs. ${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          </tr>
        </table>

        <!-- Bank Details Section -->
        ${includeBankDetails && qAccountNo ? `
        <div class="bank-card">
          <div class="bank-title">BANK ACCOUNT DETAILS FOR CHEQUES (බැංකු ගනුදෙනු විස්තර)</div>
          <div class="bank-row">
            <div class="bank-row-label">Bank Name:</div>
            <div class="bank-row-val">${qBankName}</div>
          </div>
          <div class="bank-row">
            <div class="bank-row-label">Account No:</div>
            <div class="bank-row-val">${qAccountNo}</div>
          </div>
          <div class="bank-row">
            <div class="bank-row-label">Account Name:</div>
            <div class="bank-row-val">${qAccountName}</div>
          </div>
        </div>
        ` : ''}

        <!-- Terms and Conditions -->
        <div class="terms-block">
          <strong>Notes & Terms (වෙනත් තොරතුරු):</strong><br/>
          1. This price quotation is valid for the duration specified above.<br/>
          2. Government / Bank Cheques must be drawn in favor of <strong>"${qAccountName || settings.bankAccountName || settings.shopName}"</strong>.<br/>
          3. Deliveries and services will be initiated upon receipt of official Purchase Orders.
        </div>

        <!-- Signature Section -->
        <table class="signature-section">
          <tr>
            <td class="signature-box">
              <div class="signature-line" style="margin-top: 30px;"></div>
              <div class="signature-label">Prepared By (සකස් කළේ)</div>
            </td>
            <td class="signature-box text-right" style="padding-right: 20px;">
              <div class="signature-line" style="margin-left: auto; margin-top: 30px;"></div>
              <div class="signature-label">Authorized Signature / Stamp</div>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);
    const frameDoc = printFrame.contentWindow?.document || printFrame.contentDocument;
    if (frameDoc) {
      frameDoc.write(printContent);
      frameDoc.close();
      printFrame.contentWindow?.focus();
      setTimeout(() => {
        printFrame.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(printFrame);
        }, 1000);
      }, 500);
    }
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
                      <User className="h-3.5 w-3.5 mr-1 text-slate-400" /> {rep.customerName}
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold flex items-center">
                      <Phone className="h-3 w-3 mr-1" /> {rep.customerPhone}
                    </div>
                    {rep.customerAddress && (
                      <div className="text-[10px] text-slate-400 font-medium flex items-center">
                        <MapPin className="h-3 w-3 mr-1 text-slate-400" /> {rep.customerAddress}
                      </div>
                    )}
                  </div>

                  {/* Issue details */}
                  <div className="text-xs font-semibold space-y-1.5 text-slate-600">
                    <div><span className="text-slate-400 font-bold">Issue: </span>{rep.issueDescription}</div>
                    <div><span className="text-slate-400 font-bold">Technician: </span>{rep.assignedTechnician}</div>
                    <div><span className="text-slate-400 font-bold">Est. Cost: </span><span className="text-blue-600 font-extrabold">Rs. {rep.estimatedCost.toLocaleString()}</span></div>
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
                          address: rep.customerAddress,
                          loyaltyPoints: 0,
                          createdAt: new Date().toISOString()
                        };
                        setSelectedRepairCust(matchedCust);
                        setRCustomerName(rep.customerName);
                        setRCustomerPhone(rep.customerPhone);
                        setRCustomerAddress(rep.customerAddress || '');
                        setRImei(rep.imei || '');
                        setRExpectedReturnDate(rep.expectedReturnDate || '');
                        setRPatternLock(rep.patternLock ? rep.patternLock.split('-').map(Number) : []);
                        setRDeviceFrontPhoto(rep.deviceFrontPhoto || null);
                        setRDeviceBackPhoto(rep.deviceBackPhoto || null);
                        setRStatus(rep.status);
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
                        setPrintingQuotation(quote);
                        setQBankName(settings.bankName || '');
                        setQAccountNo(settings.bankAccountNo || '');
                        setQAccountName(settings.bankAccountName || '');
                        setQValidity('30 Days');
                        setQSubject('');
                        setIncludeBankDetails(true);
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
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-100 flex flex-col max-h-[90vh]">
            <div className="bg-slate-950 text-white p-5 flex justify-between items-center shrink-0">
              <h3 className="text-sm font-black tracking-tight flex items-center">
                <Wrench className="h-4.5 w-4.5 mr-2 text-blue-500" />
                {editingRepairDetails ? 'Edit Repair Details' : 'Add New Repair Job'}
              </h3>
              <button 
                onClick={() => {
                  setIsRepairModalOpen(false);
                  setEditingRepairDetails(null);
                  setSelectedRepairCust(null);
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

            <form onSubmit={handleAddRepairSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 text-xs font-semibold text-slate-850">
              {/* Section 1: Customer Details */}
              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-150 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                    <User className="h-3.5 w-3.5 mr-1 text-slate-400" /> Customer Information
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsNewCustModalOpen(true)}
                    className="text-blue-600 hover:underline flex items-center text-[10px] font-bold"
                  >
                    <Plus className="h-3 w-3 mr-0.5" /> Quick Add Customer
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Select Existing Customer */}
                  <div className="space-y-1 relative">
                    <label className="font-bold text-slate-500">Search / Choose Customer</label>
                    {selectedRepairCust ? (
                      <div className="bg-white p-2 rounded-xl border border-slate-200 flex justify-between items-center mt-0.5">
                        <div className="truncate">
                          <h4 className="font-bold text-slate-800 truncate">{selectedRepairCust.name}</h4>
                          <p className="text-[10px] text-slate-400">{selectedRepairCust.phone}</p>
                        </div>
                        <button type="button" onClick={() => setSelectedRepairCust(null)} className="text-rose-500 font-bold p-1">✕</button>
                      </div>
                    ) : (
                      <div>
                        <input
                          type="text"
                          value={repairCustSearch}
                          onChange={(e) => setRepairCustSearch(e.target.value)}
                          placeholder="Search existing..."
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {filteredRepairCustomers.length > 0 && (
                          <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 max-h-32 overflow-y-auto">
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
                                <span className="text-slate-400">{c.phone}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
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
                    <label className="font-bold text-slate-500">Device Type</label>
                    <select
                      value={rDeviceType}
                      onChange={(e) => setRDeviceType(e.target.value as any)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 font-bold bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Phone">Phone</option>
                      <option value="Computer">Computer</option>
                      <option value="Other">Other</option>
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
                      <option value="Pending">Received</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Ready for Pickup">Ready for Pickup</option>
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
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-855 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Technician Select */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-500">Technician</label>
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
                        onClick={() => document.getElementById('front-photo-input-quote')?.click()}
                        className="w-full h-28 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 hover:border-blue-400 transition cursor-pointer"
                      >
                        <Camera className="h-6 w-6 mb-1 text-slate-400" />
                        <span className="font-extrabold text-[10px]">Capture Front</span>
                      </button>
                    )}
                    <input
                      id="front-photo-input-quote"
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
                        onClick={() => document.getElementById('back-photo-input-quote')?.click()}
                        className="w-full h-28 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 hover:border-blue-400 transition cursor-pointer"
                      >
                        <Camera className="h-6 w-6 mb-1 text-slate-400" />
                        <span className="font-extrabold text-[10px]">Capture Back</span>
                      </button>
                    )}
                    <input
                      id="back-photo-input-quote"
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
                    setIsRepairModalOpen(false);
                    setEditingRepairDetails(null);
                    setSelectedRepairCust(null);
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

      {/* PROFESSIONAL A4 QUOTATION PRINT PREVIEW MODAL */}
      {printingQuotation && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col md:flex-row h-[90vh] animate-in fade-in zoom-in duration-200 text-xs font-semibold text-slate-350">
            
            {/* Left Column: Print Controls Panel */}
            <div className="w-full md:w-96 bg-slate-950 p-6 flex flex-col justify-between border-r border-slate-850 overflow-y-auto shrink-0">
              <div className="space-y-6">
                <div>
                  <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                    Print Config
                  </span>
                  <h3 className="text-lg font-black text-white mt-2">Quotation Generator</h3>
                  <p className="text-xs text-slate-400 mt-1">Configure layout, bank details, and remarks for official quote.</p>
                </div>

                <div className="space-y-4">
                  {/* Subject / Title */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Quotation Subject</label>
                    <input
                      type="text"
                      value={qSubject}
                      onChange={(e) => setQSubject(e.target.value)}
                      placeholder="e.g. SUPPLY & INSTALLATION OF SSDs"
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs font-bold focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Validity Period */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Validity Period</label>
                    <input
                      type="text"
                      value={qValidity}
                      onChange={(e) => setQValidity(e.target.value)}
                      placeholder="e.g. 30 Days"
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs font-bold focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Toggle Bank Account Details */}
                  <div className="flex items-center space-x-2.5 bg-slate-900/40 p-3.5 rounded-xl border border-slate-805">
                    <input
                      type="checkbox"
                      id="incBankDetails"
                      checked={includeBankDetails}
                      onChange={(e) => setIncludeBankDetails(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-800 text-indigo-600 focus:ring-indigo-550"
                    />
                    <label htmlFor="incBankDetails" className="text-xs font-extrabold text-slate-200 cursor-pointer select-none">
                      Include Bank Details
                    </label>
                  </div>

                  {/* Bank Details Editor fields */}
                  {includeBankDetails && (
                    <div className="space-y-3.5 bg-slate-900/60 p-4 rounded-2xl border border-slate-850 animate-in fade-in duration-150">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Bank Name</label>
                        <input
                          type="text"
                          value={qBankName}
                          onChange={(e) => setQBankName(e.target.value)}
                          placeholder="e.g. Bank of Ceylon"
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs font-semibold focus:outline-none focus:border-indigo-550"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Account Number</label>
                        <input
                          type="text"
                          value={qAccountNo}
                          onChange={(e) => setQAccountNo(e.target.value)}
                          placeholder="Account number..."
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs font-semibold focus:outline-none focus:border-indigo-550"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Account Name</label>
                        <input
                          type="text"
                          value={qAccountName}
                          onChange={(e) => setQAccountName(e.target.value)}
                          placeholder="Account holder's name..."
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs font-semibold focus:outline-none focus:border-indigo-550"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col space-y-2 pt-6 border-t border-slate-850">
                <button
                  type="button"
                  onClick={handlePrintQuote}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3 rounded-xl text-xs shadow-lg transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Printer className="h-4 w-4" /> Print Document (A4)
                </button>
                <button
                  type="button"
                  onClick={() => setPrintingQuotation(null)}
                  className="w-full bg-slate-850 hover:bg-slate-805 text-slate-300 font-bold py-2.5 rounded-xl text-xs transition duration-150 cursor-pointer"
                >
                  Close Preview
                </button>
              </div>
            </div>

            {/* Right Column: Live A4 Visual Preview */}
            <div className="flex-1 bg-slate-950 p-6 flex items-start justify-center overflow-y-auto">
              <div className="bg-white text-slate-800 w-[210mm] min-h-[297mm] p-12 shadow-2xl rounded-sm text-left flex flex-col justify-between text-xs select-none">
                <div>
                  {/* Shop Details */}
                  <div className="flex justify-between items-start border-b-2 border-slate-200 pb-5 mb-5">
                    <div>
                      <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{settings.shopName || 'SmartShop Pro'}</h1>
                      <p className="text-[10px] text-slate-500 font-extrabold uppercase mt-1 tracking-wider">{settings.onlineTagline || 'Device Repairs & Retail Solutions'}</p>
                    </div>
                    <div className="text-right text-[10px] text-slate-500 leading-relaxed font-semibold">
                      <p>{settings.shopAddress || 'No 120, Colombo Road,'}</p>
                      {settings.shopAddress && <p>Kurunegala, Sri Lanka</p>}
                      <p>Tel: {settings.shopPhone || '077-1234567'}</p>
                      <p>Email: {settings.shopEmail || 'info@smartshoppro.com'}</p>
                    </div>
                  </div>

                  {/* Document Title */}
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-base font-extrabold text-blue-900 tracking-wide uppercase">Price Quotation (මිල ගණන් කැඳවීම් පත්‍රය)</h2>
                    <span className="text-sm font-black text-blue-905 bg-blue-50 border border-blue-100 px-3 py-1 rounded-lg">
                      Ref No: {printingQuotation.id}
                    </span>
                  </div>

                  {/* Meta Panel */}
                  <div className="grid grid-cols-2 gap-8 mb-6 border-b border-slate-100 pb-6">
                    <div>
                      <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-2">Prepared For / වෙත ඉදිරිපත් කෙරේ</h4>
                      <p className="font-extrabold text-slate-900 text-sm">{printingQuotation.customerName}</p>
                      <p className="text-[11px] text-slate-500 font-bold mt-0.5">Tel: {printingQuotation.customerPhone}</p>
                      {printingCustomerAddress && (
                        <p className="text-[10px] text-slate-500 mt-1">{printingCustomerAddress}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-2">Document Details</h4>
                      <p className="font-bold text-slate-800 text-[11px]">Date: {new Date().toLocaleDateString()}</p>
                      <p className="font-extrabold text-amber-700 text-[11px] mt-1">Validity: {qValidity}</p>
                    </div>
                  </div>

                  {/* Subject */}
                  {qSubject && (
                    <div className="mb-5 text-xs font-extrabold text-slate-900 uppercase border-l-4 border-blue-900 pl-3">
                      Subject: {qSubject}
                    </div>
                  )}

                  {/* Items Table */}
                  <table className="w-full border-collapse mb-6">
                    <thead>
                      <tr className="bg-slate-50 text-[9px] font-extrabold text-slate-500 uppercase border-y border-slate-200">
                        <th className="py-2.5 px-3 text-center w-10">#</th>
                        <th className="py-2.5 px-3 text-left">Description / Specification</th>
                        <th className="py-2.5 px-3 text-center w-16">Qty</th>
                        <th className="py-2.5 px-3 text-right w-28">Unit Price</th>
                        <th className="py-2.5 px-3 text-right w-28">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {printingQuotation.items.map((item, idx) => (
                        <tr key={idx} className="border-b border-slate-100 font-semibold text-slate-800">
                          <td className="py-3 px-3 text-center text-slate-400">{idx + 1}</td>
                          <td className="py-3 px-3 font-bold text-slate-900">{item.description}</td>
                          <td className="py-3 px-3 text-center">{item.qty}</td>
                          <td className="py-3 px-3 text-right">Rs. {item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="py-3 px-3 text-right font-bold text-slate-900">Rs. {(item.price * item.qty).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Totals Block */}
                  <div className="flex justify-end mb-8">
                    <table className="w-85 border-collapse text-xs font-semibold text-slate-600">
                      <tbody>
                        <tr>
                          <td className="py-1.5 px-3 text-right">Subtotal:</td>
                          <td className="py-1.5 px-3 text-right font-bold text-slate-800">Rs. {printingQuotation.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                        {settings.vatRate > 0 && (
                          <tr>
                            <td className="py-1.5 px-3 text-right">VAT ({settings.vatRate}%):</td>
                            <td className="py-1.5 px-3 text-right font-bold text-slate-800">Rs. {(printingQuotation.total * (settings.vatRate / 100)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          </tr>
                        )}
                        {settings.ssclRate > 0 && (
                          <tr>
                            <td className="py-1.5 px-3 text-right">SSCL ({settings.ssclRate}%):</td>
                            <td className="py-1.5 px-3 text-right font-bold text-slate-800">Rs. {(printingQuotation.total * (settings.ssclRate / 100)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          </tr>
                        )}
                        <tr className="border-t border-slate-200 bg-slate-50 font-black text-blue-900">
                          <td className="py-2.5 px-3 text-right text-[11px]">Grand Total (Rs.):</td>
                          <td className="py-2.5 px-3 text-right text-sm">
                            Rs. {(
                              printingQuotation.total + 
                              (printingQuotation.total * ((settings.vatRate || 0) / 100)) + 
                              (printingQuotation.total * ((settings.ssclRate || 0) / 100))
                            ).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Bank Account Details */}
                  {includeBankDetails && qAccountNo && (
                    <div className="bg-slate-50 border border-slate-205 rounded-xl p-4 mb-6 max-w-md">
                      <h4 className="text-[9px] font-black text-blue-900 uppercase tracking-wider mb-2.5">Bank Settlement Details / බැංකු ගිණුම් විස්තරය</h4>
                      <div className="grid grid-cols-3 gap-y-1 font-semibold text-[11px]">
                        <span className="text-slate-400">Bank Name:</span>
                        <span className="col-span-2 text-slate-900 font-bold">{qBankName}</span>
                        
                        <span className="text-slate-400">Account No:</span>
                        <span className="col-span-2 text-slate-900 font-bold font-mono">{qAccountNo}</span>
                        
                        <span className="text-slate-400">Account Name:</span>
                        <span className="col-span-2 text-slate-900 font-bold">{qAccountName}</span>
                      </div>
                    </div>
                  )}

                  {/* Conditions */}
                  <div className="text-[10px] text-slate-500 leading-relaxed max-w-xl">
                    <p className="font-bold text-slate-600 mb-0.5">Notes & Terms:</p>
                    <p>1. This quotation is valid only for the duration specified above.</p>
                    <p>2. Cheques/Transfers must be issued in favor of "{qAccountName || settings.bankAccountName || settings.shopName}".</p>
                  </div>
                </div>

                {/* Signatures */}
                <div className="flex justify-between items-end mt-12 pt-6 border-t border-slate-100">
                  <div>
                    <div className="w-40 border-b border-slate-350 mb-1"></div>
                    <span className="text-[9px] font-black text-slate-450 uppercase tracking-wider">Prepared By</span>
                  </div>
                  <div className="text-right">
                    <div className="w-40 border-b border-slate-350 mb-1 ml-auto"></div>
                    <span className="text-[9px] font-black text-slate-455 uppercase tracking-wider">Authorized Stamp & Signature</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
