import React, { useState, useMemo } from 'react';
import { SpecialOrder, Product, Customer, SpecialOrderItem } from '../types';
import { translations } from '../lib/translations';
import { 
  Plus, Search, ShoppingBag, Truck, CheckCircle, Clock, 
  MapPin, User, Phone, DollarSign, Notebook, ArrowRight, X, Edit, Printer, Trash2, ChevronDown 
} from 'lucide-react';

interface SpecialOrdersProps {
  language: 'en' | 'si';
  specialOrders: SpecialOrder[];
  products: Product[];
  customers: Customer[];
  onAddSpecialOrder: (order: SpecialOrder) => void;
  onUpdateSpecialOrderStatus: (orderId: string, status: SpecialOrder['status'], trackingNo?: string) => void;
  onAddCustomer: (customer: Customer) => Customer;
  onUpdateSpecialOrder: (order: SpecialOrder) => void;
  onDeleteSpecialOrder: (id: string) => void;
}

export const SpecialOrders: React.FC<SpecialOrdersProps> = ({
  language,
  specialOrders,
  products,
  customers,
  onAddSpecialOrder,
  onUpdateSpecialOrderStatus,
  onAddCustomer,
  onUpdateSpecialOrder,
  onDeleteSpecialOrder
}) => {
  const t = translations[language];

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'Pending' | 'In Production' | 'Ready' | 'Dispatched'>('Pending');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<SpecialOrder | null>(null);
  const [editingOrderDetails, setEditingOrderDetails] = useState<SpecialOrder | null>(null);
  const [printLabelOrder, setPrintLabelOrder] = useState<SpecialOrder | null>(null);
  const [includeItemsOnLabel, setIncludeItemsOnLabel] = useState(false);

  // Form Fields
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  
  const [orderType, setOrderType] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [orderItems, setOrderItems] = useState<SpecialOrderItem[]>([
    { id: `item-${Date.now()}`, name: '', size: 'N/A', qty: 1, unitPrice: 0 }
  ]);
  const [advancePaid, setAdvancePaid] = useState<number>(0);
  const [deliveryType, setDeliveryType] = useState<'Store Pickup' | 'Courier'>('Store Pickup');
  const [courierAddress, setCourierAddress] = useState('');
  const [notes, setNotes] = useState('');

  // Status update modal fields
  const [editStatus, setEditStatus] = useState<SpecialOrder['status']>('Pending');
  const [editTracking, setEditTracking] = useState('');

  // Count helper
  const counts = useMemo(() => {
    return {
      Pending: specialOrders.filter(so => so.status === 'Pending').length,
      'In Production': specialOrders.filter(so => so.status === 'In Production').length,
      Ready: specialOrders.filter(so => so.status === 'Ready').length,
      Dispatched: specialOrders.filter(so => so.status === 'Dispatched').length,
    };
  }, [specialOrders]);

  // Filtered Orders by Search and activeTab
  const filteredOrders = useMemo(() => {
    return specialOrders.filter(so => {
      const matchesSearch = 
        so.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        so.customerPhone.includes(searchQuery) ||
        so.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (so.orderType && so.orderType.toLowerCase().includes(searchQuery.toLowerCase())) ||
        so.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesTab = so.status === activeTab;
      return matchesSearch && matchesTab;
    });
  }, [specialOrders, searchQuery, activeTab]);

  // Filter customers for auto-complete
  const filteredCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return [];
    return customers.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.phone.includes(q)
    );
  }, [customers, customerSearch]);

  // Next order ID sequence generator
  const getNextOrderId = () => {
    const coOrders = specialOrders.filter(so => so.id.startsWith('#CO-'));
    if (coOrders.length === 0) return '#CO-0001';
    const numbers = coOrders.map(so => parseInt(so.id.replace('#CO-', ''), 10)).filter(n => !isNaN(n));
    if (numbers.length === 0) return '#CO-0001';
    const maxNum = Math.max(...numbers);
    return `#CO-${String(maxNum + 1).padStart(4, '0')}`;
  };

  // Calculate dynamic total
  const totalAmount = useMemo(() => {
    return orderItems.reduce((sum, item) => sum + (item.qty * item.unitPrice), 0);
  }, [orderItems]);

  const balanceRemaining = totalAmount - advancePaid;

  const handleAddItem = () => {
    setOrderItems(prev => [
      ...prev,
      { id: `item-${Date.now()}-${Math.random()}`, name: '', size: 'N/A', qty: 1, unitPrice: 0 }
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (orderItems.length > 1) {
      setOrderItems(prev => prev.filter(item => item.id !== id));
    } else {
      setOrderItems([{ id: `item-${Date.now()}`, name: '', size: 'N/A', qty: 1, unitPrice: 0 }]);
    }
  };

  const handleItemChange = (id: string, field: keyof SpecialOrderItem, value: any) => {
    setOrderItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingOrderDetails(null);
    setCustName('');
    setCustPhone('');
    setCustomerSearch('');
    setOrderType('');
    setDueDate('');
    setOrderItems([{ id: `item-${Date.now()}`, name: '', size: 'N/A', qty: 1, unitPrice: 0 }]);
    setAdvancePaid(0);
    setDeliveryType('Store Pickup');
    setCourierAddress('');
    setNotes('');
  };

  // Handle Submit New Special Request / Edit Details
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim() || !custPhone.trim() || orderItems.some(i => !i.name.trim())) return;

    // Check if customer exists in the customer list. If not, auto-add them.
    const cleanPhone = custPhone.trim();
    const cleanName = custName.trim();
    const matchedCust = customers.find(c => c.phone === cleanPhone);
    if (!matchedCust) {
      onAddCustomer({
        id: `CUST-${Date.now()}`,
        name: cleanName,
        phone: cleanPhone,
        address: deliveryType === 'Courier' ? courierAddress.trim() : undefined,
        loyaltyPoints: 0,
        createdAt: new Date().toISOString()
      });
    }

    const mainItemName = orderItems.map(item => `${item.qty}x ${item.name} (${item.size})`).join(', ');

    if (editingOrderDetails) {
      onUpdateSpecialOrder({
        ...editingOrderDetails,
        customerName: cleanName,
        customerPhone: cleanPhone,
        itemName: mainItemName,
        estimatedCost: totalAmount,
        advancePaid,
        deliveryType,
        courierAddress: deliveryType === 'Courier' ? (courierAddress.trim() || undefined) : undefined,
        notes: notes.trim() || undefined,
        orderType,
        dueDate,
        items: orderItems
      });
    } else {
      const nextId = getNextOrderId();
      const newOrder: SpecialOrder = {
        id: nextId,
        customerName: cleanName,
        customerPhone: cleanPhone,
        itemName: mainItemName,
        estimatedCost: totalAmount,
        advancePaid,
        deliveryType,
        courierAddress: deliveryType === 'Courier' ? (courierAddress.trim() || undefined) : undefined,
        status: 'Pending',
        notes: notes.trim() || undefined,
        createdAt: new Date().toISOString(),
        orderType,
        dueDate,
        items: orderItems
      };

      onAddSpecialOrder(newOrder);
    }

    handleCloseModal();
  };

  const handleEditClick = (order: SpecialOrder) => {
    setEditingOrderDetails(order);
    setCustName(order.customerName);
    setCustPhone(order.customerPhone);
    setOrderType(order.orderType || '');
    setDueDate(order.dueDate || '');
    setOrderItems(order.items && order.items.length > 0 ? [...order.items] : [
      { id: `item-${Date.now()}`, name: order.itemName, size: 'N/A', qty: 1, unitPrice: order.estimatedCost }
    ]);
    setAdvancePaid(order.advancePaid);
    setDeliveryType(order.deliveryType);
    setCourierAddress(order.courierAddress || '');
    setNotes(order.notes || '');
    setIsModalOpen(true);
  };

  // State Transition helpers
  const handleTransitionStatus = (order: SpecialOrder) => {
    let nextStatus: SpecialOrder['status'] = 'Pending';
    if (order.status === 'Pending') nextStatus = 'In Production';
    else if (order.status === 'In Production') nextStatus = 'Ready';
    else if (order.status === 'Ready') nextStatus = 'Dispatched';

    onUpdateSpecialOrderStatus(order.id, nextStatus, order.courierTrackingNo);
  };

  // Cash Ledger collection helper
  const handleCollectBalance = (order: SpecialOrder) => {
    const updated = {
      ...order,
      advancePaid: order.estimatedCost
    };
    onUpdateSpecialOrder(updated);
  };

  // Handle Update Status Submit
  const handleUpdateStatusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;

    onUpdateSpecialOrderStatus(editingOrder.id, editStatus, editTracking.trim() || undefined);
    setEditingOrder(null);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-amber-100 text-amber-800 border-amber-250';
      case 'In Production': return 'bg-blue-100 text-blue-800 border-blue-250';
      case 'Ready': return 'bg-purple-100 text-purple-850 border-purple-250';
      case 'Dispatched': return 'bg-emerald-100 text-emerald-800 border-emerald-250';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        {/* Status Tabs */}
        <div className="flex flex-wrap gap-1.5 shrink-0">
          {(['Pending', 'In Production', 'Ready', 'Dispatched'] as const).map((tab) => {
            const isActive = activeTab === tab;
            const count = counts[tab];
            let activeColorClass = 'bg-blue-600 border-blue-600 text-white';
            let activeBadgeClass = 'bg-blue-700 text-white';

            if (tab === 'Pending') {
              activeColorClass = 'bg-amber-500 border-amber-500 text-white';
              activeBadgeClass = 'bg-amber-700 text-white';
            } else if (tab === 'In Production') {
              activeColorClass = 'bg-blue-600 border-blue-600 text-white';
              activeBadgeClass = 'bg-blue-700 text-white';
            } else if (tab === 'Ready') {
              activeColorClass = 'bg-purple-600 border-purple-600 text-white';
              activeBadgeClass = 'bg-purple-700 text-white';
            } else if (tab === 'Dispatched') {
              activeColorClass = 'bg-emerald-600 border-emerald-600 text-white';
              activeBadgeClass = 'bg-emerald-700 text-white';
            }

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition flex items-center space-x-1.5 border shadow-sm cursor-pointer ${
                  isActive 
                    ? activeColorClass 
                    : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
                }`}
              >
                <span>{tab === 'Pending' ? 'Pending' : tab === 'In Production' ? 'In Production' : tab === 'Ready' ? 'Ready' : 'Dispatched'}</span>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                  isActive ? activeBadgeClass : 'bg-slate-100 text-slate-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-1 justify-end">
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={language === 'en' ? 'Search custom requests...' : 'විශේෂ ඇණවුම් සොයන්න...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-205 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-bold text-slate-800"
            />
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-750 text-white px-4 py-2 rounded-xl text-xs font-black transition shadow-md flex items-center shrink-0 cursor-pointer"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            {language === 'en' ? 'New Order' : 'නව විශේෂ ඇණවුමක්'}
          </button>
        </div>
      </div>

      {/* Special Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
        {filteredOrders.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl shadow-sm border border-slate-100 py-12 text-center text-slate-400 font-medium">
            No special or custom orders found in "{activeTab}" status.
          </div>
        ) : (
          filteredOrders.map(order => {
            const cardBalance = order.estimatedCost - order.advancePaid;
            return (
              <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition flex flex-col justify-between p-5 space-y-4">
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <span className="bg-slate-100 text-slate-800 text-xs font-black px-2 py-0.5 rounded">
                      {order.id}
                    </span>
                    <span className={`ml-2 px-2.5 py-0.5 rounded-full text-[10px] font-black border ${getStatusStyle(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                </div>

                {/* Order Type / Item details */}
                <div>
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide">
                    {order.orderType || 'Other'}
                  </h4>
                  <p className="text-[11px] text-slate-550 font-bold mt-1 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    {order.itemName}
                  </p>
                </div>

                {/* Customer Details */}
                <div className="space-y-0.5">
                  <div className="text-sm font-black text-slate-800">
                    {order.customerName}
                  </div>
                  <div className="text-xs text-slate-450 font-bold">
                    {order.customerPhone}
                  </div>
                </div>

                {/* Due Date */}
                {order.dueDate && (
                  <div className="text-xs font-bold text-slate-600 flex items-center">
                    <Clock className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                    <span>Due: {new Date(order.dueDate).toLocaleDateString()}</span>
                  </div>
                )}

                {/* Balance Status Banner */}
                {cardBalance > 0 ? (
                  <div className="bg-amber-50 text-amber-900 p-2 rounded-xl border border-amber-200 flex items-center text-xs font-black">
                    <span className="mr-1.5 text-amber-550 text-sm">⚠</span>
                    <span>Rs. {cardBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })} Pending</span>
                  </div>
                ) : (
                  <div className="bg-emerald-50 text-emerald-900 p-2 rounded-xl border border-emerald-250 flex items-center text-xs font-black">
                    <span className="mr-1.5 text-emerald-655 text-sm">✓</span>
                    <span>Paid in Full</span>
                  </div>
                )}

                {/* Remarks */}
                <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed font-semibold">
                  {order.notes || 'No description'}
                </div>

                {/* Items & Variants Details in list */}
                {order.items && order.items.length > 0 && (
                  <div className="space-y-1 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 text-[11px] font-semibold text-slate-700">
                    {order.items.map((item, idx) => (
                      <div key={item.id || idx} className="flex justify-between items-center border-b border-slate-100 last:border-0 pb-1 last:pb-0 pt-1 first:pt-0">
                        <span className="truncate max-w-[120px] font-bold">
                          {item.name} <span className="text-[9px] text-slate-500 bg-slate-150 px-1 rounded font-bold">{item.size}</span>
                        </span>
                        <span className="text-slate-500 font-bold">
                          {item.qty} x Rs. {item.unitPrice.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Financial Table Breakdown */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-150 text-xs space-y-1.5 font-bold">
                  <div className="flex justify-between text-slate-500">
                    <span>Total</span>
                    <span className="font-extrabold text-slate-800">Rs. {order.estimatedCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Advance</span>
                    <span className="font-extrabold text-slate-800">Rs. {order.advancePaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 font-black border-t border-slate-200/60 pt-1.5 mt-1">
                    <span>Balance</span>
                    <span className={cardBalance > 0 ? 'text-blue-650' : 'text-emerald-700'}>
                      Rs. {cardBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Actions Block */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex gap-2">
                    {cardBalance > 0 && (
                      <button
                        onClick={() => handleCollectBalance(order)}
                        className="flex-1 bg-amber-600 hover:bg-amber-750 text-white py-1.5 rounded-xl text-xs font-black transition shadow-sm cursor-pointer text-center"
                      >
                        Collect Balance
                      </button>
                    )}
                    
                    {order.status !== 'Dispatched' && (
                      <button
                        onClick={() => handleTransitionStatus(order)}
                        className="flex-1 bg-blue-600 hover:bg-blue-750 text-white py-1.5 rounded-xl text-xs font-black transition shadow-sm cursor-pointer text-center"
                      >
                        {order.status === 'Pending' && 'Move to In-Production'}
                        {order.status === 'In Production' && 'Move to Ready'}
                        {order.status === 'Ready' && 'Move to Dispatched'}
                      </button>
                    )}
                  </div>

                  <div className="flex justify-between items-center gap-2">
                    <button
                      onClick={() => setPrintLabelOrder(order)}
                      className="bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded-xl text-[10px] font-bold shadow-sm transition flex items-center cursor-pointer"
                    >
                      <Printer className="h-3 w-3 mr-1" /> Label
                    </button>

                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleEditClick(order)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-xl text-[10px] font-bold transition cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete special order ${order.id}?`)) {
                            onDeleteSpecialOrder(order.id);
                          }
                        }}
                        className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* NEW SPECIAL ORDER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="bg-slate-950 text-white p-4 flex justify-between items-center shrink-0">
              <h3 className="text-xs font-bold flex items-center">
                <ShoppingBag className="h-4 w-4 mr-1 text-blue-400" />
                {language === 'en' ? (editingOrderDetails ? 'Edit Special / Custom Order' : 'New Special/Custom Order') : (editingOrderDetails ? 'විශේෂ ඇණවුම් විස්තර වෙනස් කරන්න' : 'නව විශේෂ ඇණවුමක්')}
              </h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-semibold overflow-y-auto flex-1">
              {/* Customer Auto-complete Fields */}
              <div className="space-y-1 relative">
                <label className="font-bold text-slate-500">Customer Details *</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <input
                      type="text"
                      required
                      value={custName}
                      onChange={(e) => {
                        setCustName(e.target.value);
                        setCustomerSearch(e.target.value);
                      }}
                      placeholder="Customer Name"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-bold"
                    />
                  </div>
                  <div>
                    <input
                      type="tel"
                      required
                      value={custPhone}
                      onChange={(e) => {
                        setCustPhone(e.target.value);
                        setCustomerSearch(e.target.value);
                      }}
                      placeholder="Phone Number"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-bold"
                    />
                  </div>
                </div>
                {/* Floating Suggestions */}
                {customerSearch.trim() && filteredCustomers.length > 0 && (
                  <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-30 max-h-36 overflow-y-auto">
                    {filteredCustomers.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setCustName(c.name);
                          setCustPhone(c.phone);
                          if (c.address) {
                            setCourierAddress(c.address);
                          }
                          setCustomerSearch('');
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex justify-between"
                      >
                        <span>{c.name}</span>
                        <span className="text-slate-450">{c.phone}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Order Type & Due Date */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">{language === 'en' ? 'Order Type *' : 'ඇණවුම් වර්ගය *'}</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      list="order-types"
                      value={orderType}
                      onChange={(e) => setOrderType(e.target.value)}
                      placeholder={language === 'en' ? 'Select or type...' : 'තෝරන්න හෝ ටයිප් කරන්න...'}
                      className="w-full pr-8 px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-bold bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400">
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="text-[9px] text-slate-400 font-semibold mt-0.5">{language === 'en' ? 'Type any custom order type name directly if not in the list.' : 'ලැයිස්තුවේ නැති වෙනත් ඕනෑම වර්ගයක් කෙලින්ම ටයිප් කළ හැකිය.'}</p>
                  <datalist id="order-types">
                    <option value="Clothing / T-Shirt" />
                    <option value="Cap / Embroidery" />
                    <option value="Banner / Flex Printing" />
                    <option value="Custom Mug / Cup" />
                    <option value="Sticker / Decal" />
                    <option value="Business Cards" />
                    <option value="Uniforms / Suits" />
                    <option value="Sportswear / Jersey" />
                    <option value="Engraving / Plaque" />
                    <option value="Rubber Stamp" />
                    <option value="Gift Item / Toy" />
                    <option value="Charger Type C Original" />
                    <option value="Screen Guard / Temper" />
                    <option value="Other" />
                  </datalist>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-bold"
                  />
                </div>
              </div>

              {/* Items & Variants */}
              <div className="space-y-2 border border-slate-100 p-3 rounded-xl bg-slate-55">
                <div className="flex justify-between items-center pb-1.5 border-b border-slate-200">
                  <span className="font-bold text-slate-700">Order Items & Variants</span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-2.5 py-1 rounded-lg text-[10px] font-bold transition flex items-center cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Item
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {orderItems.map((item, index) => (
                    <div key={item.id} className="flex gap-2 items-end bg-white p-2.5 rounded-lg border border-slate-200 relative">
                      <div className="flex-1 min-w-0">
                        <label className="text-[9px] font-bold text-slate-400 block mb-0.5">Item / Service *</label>
                        <input
                          type="text"
                          required
                          value={item.name}
                          onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                          placeholder="e.g. T-Shirt"
                          className="w-full px-2 py-1 border border-slate-250 rounded-md text-slate-800 font-semibold"
                        />
                      </div>
                      <div className="w-16">
                        <label className="text-[9px] font-bold text-slate-400 block mb-0.5">Size</label>
                        <input
                          type="text"
                          list="sizes"
                          value={item.size}
                          onChange={(e) => handleItemChange(item.id, 'size', e.target.value)}
                          className="w-full px-2 py-1 border border-slate-250 rounded-md text-slate-800 text-center font-bold"
                        />
                      </div>
                      <div className="w-14">
                        <label className="text-[9px] font-bold text-slate-400 block mb-0.5">Qty</label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={item.qty}
                          onChange={(e) => handleItemChange(item.id, 'qty', Math.max(1, Number(e.target.value)))}
                          className="w-full px-2 py-1 border border-slate-250 rounded-md text-slate-800 text-center"
                        />
                      </div>
                      <div className="w-20">
                        <label className="text-[9px] font-bold text-slate-400 block mb-0.5">Unit Price</label>
                        <input
                          type="number"
                          min="0"
                          required
                          value={item.unitPrice || ''}
                          onChange={(e) => handleItemChange(item.id, 'unitPrice', Number(e.target.value))}
                          className="w-full px-2 py-1 border border-slate-250 rounded-md text-slate-800 text-right"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-md transition shrink-0 cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Remarks / Print Details */}
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Order Remarks / Print Details</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Specific printing notes, color codes, etc."
                  rows={2}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>

              {/* Delivery Type & Address */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-500">Delivery Method</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button" onClick={() => setDeliveryType('Store Pickup')}
                    className={`py-1.5 rounded-lg border text-xs font-bold transition cursor-pointer ${
                      deliveryType === 'Store Pickup' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    Store Pickup
                  </button>
                  <button
                    type="button" onClick={() => setDeliveryType('Courier')}
                    className={`py-1.5 rounded-lg border text-xs font-bold transition cursor-pointer ${
                      deliveryType === 'Courier' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    Courier Delivery
                  </button>
                </div>
              </div>

              {deliveryType === 'Courier' && (
                <div className="space-y-1 animate-in slide-in-from-top-2 duration-150">
                  <label className="font-bold text-slate-500">Delivery Address (Optional)</label>
                  <input
                    type="text"
                    value={courierAddress}
                    onChange={(e) => setCourierAddress(e.target.value)}
                    placeholder="For shipping labels"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
              )}

              {/* Financial Ledger Section */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Total Amount</span>
                  <span className="font-extrabold text-slate-900 text-sm">Rs. {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Advance Paid</span>
                  <div className="relative max-w-[120px]">
                    <span className="absolute left-2.5 top-1.5 text-slate-400 font-bold">Rs.</span>
                    <input
                      type="number"
                      min="0"
                      value={advancePaid || ''}
                      onChange={(e) => setAdvancePaid(Number(e.target.value))}
                      className="w-full pl-8 pr-2 py-1 text-right border border-slate-250 rounded-md text-slate-800 font-bold bg-white"
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center border-t border-slate-200 pt-2 font-extrabold">
                  <span className="text-slate-800">Balance Remaining</span>
                  <span className={`text-sm ${balanceRemaining > 0 ? 'text-blue-650' : 'text-emerald-600'}`}>
                    Rs. {balanceRemaining.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="flex space-x-2 pt-3 border-t border-slate-100 shrink-0">
                <button type="button" onClick={handleCloseModal} className="flex-1 bg-slate-100 py-2 rounded-lg font-bold cursor-pointer">Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold shadow cursor-pointer">Save Order</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPDATE STATUS MODAL */}
      {editingOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-950 text-white p-4 flex justify-between items-center">
              <h3 className="text-xs font-bold flex items-center">
                <Truck className="h-4 w-4 mr-1 text-blue-400" />
                Update Special Order: {editingOrder.id}
              </h3>
              <button onClick={() => setEditingOrder(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleUpdateStatusSubmit} className="p-5 space-y-4 text-xs font-semibold">
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Order Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white"
                >
                  <option value="Pending">Pending (පොරොත්තු ලේඛනයේ)</option>
                  <option value="In Production">In Production (නිෂ්පාදනය වෙමින් පවතී)</option>
                  <option value="Ready">Ready (නිම කර ඇත)</option>
                  <option value="Dispatched">Dispatched (ලබා දී ඇත)</option>
                </select>
              </div>

              {editingOrder.deliveryType === 'Courier' && editStatus === 'Dispatched' && (
                <div className="space-y-1 animate-in slide-in-from-top-2 duration-150">
                  <label className="font-bold text-slate-500">Courier Tracking Number</label>
                  <input
                    type="text" value={editTracking} onChange={(e) => setEditTracking(e.target.value)}
                    placeholder="e.g. DOM-12938475" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                  />
                </div>
              )}

              <div className="flex space-x-2 pt-2">
                <button type="button" onClick={() => setEditingOrder(null)} className="flex-1 bg-slate-100 py-2 rounded-lg font-bold cursor-pointer">Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold shadow cursor-pointer">Save Status</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COURIER SHIPPING LABEL PRINT MODAL (HALF A4 SIZE) */}
      {printLabelOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="bg-slate-950 text-white p-4 flex justify-between items-center">
              <h3 className="text-xs font-bold">Courier Shipping Label Preview (A4 Half Page)</h3>
              <button onClick={() => setPrintLabelOrder(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {/* Printable Label Area */}
            <div className="p-6 bg-white" id="printable-shipping-label">
              <div className="border-4 border-double border-slate-950 p-6 grid grid-cols-2 gap-6 text-slate-950 font-sans" style={{ minHeight: '140mm' }}>
                
                {/* SENDER SIDE (LEFT) */}
                <div className="border-r-2 border-dashed border-slate-400 pr-6 flex flex-col justify-between space-y-4">
                  <div>
                    <h4 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">SENDER (විකුණුම්කරු)</h4>
                    <h3 className="text-base font-black text-slate-900 mt-1">SmartShop Pro & Repairs</h3>
                    <p className="text-xs text-slate-700 mt-1 font-medium leading-relaxed">
                      No 120, Colombo Road,<br />
                      Kurunegala, Sri Lanka
                    </p>
                    <p className="text-xs font-bold text-slate-900 mt-2">
                      Tel: 077-1234567 / 037-2234567
                    </p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-[10px] text-slate-500 font-bold">
                    * Handcrafted & self-manufactured quality products safely delivered.
                  </div>
                </div>

                {/* RECIPIENT SIDE (RIGHT) */}
                <div className="flex flex-col justify-between pl-2">
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">RECIPIENT (ලබන්නා)</h4>
                    <div>
                      <h3 className="text-lg font-black text-slate-900">{printLabelOrder.customerName}</h3>
                      <p className="text-xs font-bold text-slate-800 mt-0.5">Tel: {printLabelOrder.customerPhone}</p>
                    </div>

                    <div className="bg-slate-100 p-4 rounded-xl border border-slate-350 shadow-inner">
                      <p className="text-base font-black text-slate-900 leading-relaxed uppercase">
                        {printLabelOrder.courierAddress || 'No shipping address provided.'}
                      </p>
                    </div>

                    {includeItemsOnLabel && (
                      <div className="mt-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs font-semibold space-y-1">
                        <div className="font-extrabold text-slate-700 border-b pb-1 mb-1">Order Details (ඇණවුම් තොරතුරු)</div>
                        {printLabelOrder.items && printLabelOrder.items.length > 0 ? (
                          <div className="space-y-1 border-b pb-1.5 mb-1.5">
                            {printLabelOrder.items.map((item, idx) => (
                              <div key={item.id || idx} className="flex justify-between text-[11px]">
                                <span>{item.qty}x {item.name} ({item.size})</span>
                                <span className="font-bold">Rs. {(item.qty * item.unitPrice).toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex justify-between border-b pb-1.5 mb-1.5">
                            <span>Item Name:</span>
                            <span className="font-bold">{printLabelOrder.itemName}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>Total Cost:</span>
                          <span>Rs. {printLabelOrder.estimatedCost.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Advance Paid:</span>
                          <span className="text-emerald-600">Rs. {printLabelOrder.advancePaid.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between border-t pt-1 font-extrabold text-slate-800">
                          <span>Balance Due:</span>
                          <span className="text-blue-600">Rs. {(printLabelOrder.estimatedCost - printLabelOrder.advancePaid).toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* QR / Barcode representation */}
                  <div className="flex justify-between items-end mt-4">
                    <div className="text-[9px] text-slate-500 font-bold">
                      Order ID: {printLabelOrder.id}<br />
                      Date: {new Date(printLabelOrder.createdAt).toLocaleDateString()}<br />
                      Status: Courier Delivery Pending
                    </div>
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${printLabelOrder.id}`}
                      alt="Label QR"
                      className="h-16 w-16 border border-slate-300 p-1 rounded bg-white"
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* Actions with Item details checkbox toggle */}
            <div className="bg-slate-50 p-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <label className="flex items-center space-x-2 font-bold text-slate-700 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={includeItemsOnLabel}
                  onChange={(e) => setIncludeItemsOnLabel(e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <span>Include Item & Balance details (භාණ්ඩ විස්තර ඇතුළත් කරන්න)</span>
              </label>

              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    const printContents = document.getElementById('printable-shipping-label')?.innerHTML;
                    const originalContents = document.body.innerHTML;
                    if (printContents) {
                      document.body.innerHTML = printContents;
                      window.print();
                      document.body.innerHTML = originalContents;
                      window.location.reload();
                    }
                  }}
                  className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print Label</span>
                </button>
                <button
                  onClick={() => {
                    setPrintLabelOrder(null);
                    setIncludeItemsOnLabel(false);
                  }}
                  className="bg-blue-650 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shadow-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Datalist for sizes */}
      <datalist id="sizes">
        <option value="N/A" />
        <option value="S" />
        <option value="M" />
        <option value="L" />
        <option value="XL" />
        <option value="XXL" />
        <option value="Custom" />
      </datalist>
    </div>
  );
};
