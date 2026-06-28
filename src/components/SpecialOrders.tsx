import React, { useState, useMemo } from 'react';
import { SpecialOrder, Product, Customer } from '../types';
import { translations } from '../lib/translations';
import { 
  Plus, Search, ShoppingBag, Truck, CheckCircle, Clock, 
  MapPin, User, Phone, DollarSign, Notebook, ArrowRight, X, Edit, Printer, Trash2 
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

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<SpecialOrder | null>(null);
  const [editingOrderDetails, setEditingOrderDetails] = useState<SpecialOrder | null>(null);
  const [isNewCustModalOpen, setIsNewCustModalOpen] = useState(false);
  const [printLabelOrder, setPrintLabelOrder] = useState<SpecialOrder | null>(null);
  const [includeItemsOnLabel, setIncludeItemsOnLabel] = useState(false);

  // Form Fields
  const [selectedCust, setSelectedCust] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [itemName, setItemName] = useState('');
  const [estCost, setEstCost] = useState<number>(0);
  const [advancePaid, setAdvancePaid] = useState<number>(0);
  const [deliveryType, setDeliveryType] = useState<'Store Pickup' | 'Courier'>('Store Pickup');
  const [courierAddress, setCourierAddress] = useState('');
  const [notes, setNotes] = useState('');

  // Quick Add Customer Form Fields
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');

  // Status update modal fields
  const [editStatus, setEditStatus] = useState<SpecialOrder['status']>('Pending');
  const [editTracking, setEditTracking] = useState('');

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return specialOrders.filter(so => 
      so.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      so.customerPhone.includes(searchQuery) ||
      so.itemName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [specialOrders, searchQuery]);

  // Filter customers for auto-complete
  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return [];
    return customers.filter(c => 
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) || 
      c.phone.includes(customerSearch)
    );
  }, [customers, customerSearch]);

  // Handle Submit New Special Request / Edit Details
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCust || !itemName.trim()) return;

    if (editingOrderDetails) {
      onUpdateSpecialOrder({
        ...editingOrderDetails,
        customerName: selectedCust.name,
        customerPhone: selectedCust.phone,
        itemName: itemName.trim(),
        estimatedCost: estCost,
        advancePaid,
        deliveryType,
        courierAddress: deliveryType === 'Courier' ? (courierAddress.trim() || selectedCust.address || '') : undefined,
        notes: notes.trim() || undefined
      });
      setEditingOrderDetails(null);
    } else {
      const newOrder: SpecialOrder = {
        id: `SPO-${Math.floor(1000 + Math.random() * 9000)}`,
        customerName: selectedCust.name,
        customerPhone: selectedCust.phone,
        itemName: itemName.trim(),
        estimatedCost: estCost,
        advancePaid,
        deliveryType,
        courierAddress: deliveryType === 'Courier' ? (courierAddress.trim() || selectedCust.address || '') : undefined,
        status: 'Pending',
        notes: notes.trim() || undefined,
        createdAt: new Date().toISOString()
      };

      onAddSpecialOrder(newOrder);
    }

    setIsModalOpen(false);
    setSelectedCust(null); setItemName(''); setEstCost(0); setAdvancePaid(0); setCourierAddress(''); setNotes('');
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

    setSelectedCust(newCust);
    setCourierAddress(newCustAddress.trim());
    setIsNewCustModalOpen(false);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustAddress('');
  };

  // Handle Update Status
  const handleUpdateStatusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;

    onUpdateSpecialOrderStatus(editingOrder.id, editStatus, editTracking.trim() || undefined);
    setEditingOrder(null);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Ordered from Supplier': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Arrived': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Shipped/Delivered': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder={language === 'en' ? 'Search custom requests...' : 'විශේෂ ඇණවුම් සොයන්න...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-bold text-slate-800"
          />
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-md flex items-center shrink-0"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          {language === 'en' ? 'New Custom Order' : 'නව විශේෂ ඇණවුමක්'}
        </button>
      </div>

      {/* Special Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
        {filteredOrders.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl shadow-sm border border-slate-100 py-12 text-center text-slate-400 font-medium">
            No special or custom orders found.
          </div>
        ) : (
          filteredOrders.map(order => (
            <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition flex flex-col justify-between">
              <div className="p-5 space-y-3.5">
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded">
                      ID: {order.id}
                    </span>
                    <h4 className="text-sm font-extrabold text-slate-800 mt-2">
                      {order.itemName}
                    </h4>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusStyle(order.status)}`}>
                    {order.status}
                  </span>
                </div>

                {/* Customer Details */}
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs space-y-1">
                  <div className="font-extrabold text-slate-700 flex items-center">
                    <User className="h-3.5 w-3.5 mr-1 text-slate-400" />
                    {order.customerName}
                  </div>
                  <div className="text-[10px] text-slate-400 font-bold flex items-center">
                    <Phone className="h-3 w-3 mr-1" />
                    {order.customerPhone}
                  </div>
                </div>

                {/* Delivery Type & Details */}
                <div className="text-xs font-semibold space-y-1.5 text-slate-600">
                  <div className="flex justify-between">
                    <span>Delivery Mode:</span>
                    <span className="text-slate-800 font-bold">{order.deliveryType}</span>
                  </div>
                  {order.deliveryType === 'Courier' && order.courierAddress && (
                    <div className="bg-blue-50/50 p-2 rounded-lg text-[11px] text-slate-700 font-medium">
                      <MapPin className="h-3 w-3 inline mr-1 text-blue-500" />
                      {order.courierAddress}
                    </div>
                  )}
                  {order.courierTrackingNo && (
                    <div className="text-[10px] text-blue-600 font-bold">
                      Tracking No: {order.courierTrackingNo}
                    </div>
                  )}
                </div>

                {/* Financial Summary */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1">
                  <div className="flex justify-between text-slate-500">
                    <span>Estimated Cost:</span>
                    <span className="font-bold text-slate-800">Rs. {order.estimatedCost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Advance Paid:</span>
                    <span>Rs. {order.advancePaid.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-blue-600 font-extrabold border-t border-slate-200/60 pt-1.5 mt-1">
                    <span>Balance Due:</span>
                    <span>Rs. {(order.estimatedCost - order.advancePaid).toLocaleString()}</span>
                  </div>
                </div>

                {/* Work Notes */}
                {order.notes && (
                  <div className="bg-amber-50/50 border border-amber-100 p-2.5 rounded-xl text-[10px] text-slate-600 leading-relaxed font-medium">
                    <Notebook className="h-3.5 w-3.5 inline mr-1 text-amber-700" />
                    {order.notes}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="bg-slate-50 p-3.5 border-t border-slate-100 flex flex-wrap justify-between items-center gap-2">
                <div className="flex gap-1.5">
                  {order.deliveryType === 'Courier' && (
                    <button
                      onClick={() => setPrintLabelOrder(order)}
                      className="bg-slate-800 hover:bg-slate-900 text-white px-2.5 py-1.5 rounded-xl text-[10px] font-bold shadow-sm transition flex items-center cursor-pointer"
                    >
                      <Printer className="h-3 w-3 mr-1" />
                      Print Label
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setEditingOrder(order);
                      setEditStatus(order.status);
                      setEditTracking(order.courierTrackingNo || '');
                    }}
                    className="bg-blue-650 hover:bg-blue-700 text-white px-2.5 py-1.5 rounded-xl text-[10px] font-bold shadow-sm transition flex items-center cursor-pointer"
                  >
                    Status
                  </button>
                  <button
                    onClick={() => {
                      setEditingOrderDetails(order);
                      const matchedCust = customers.find(c => c.name === order.customerName && c.phone === order.customerPhone) || {
                        id: `TEMP-${Date.now()}`,
                        name: order.customerName,
                        phone: order.customerPhone,
                        loyaltyPoints: 0,
                        createdAt: new Date().toISOString()
                      };
                      setSelectedCust(matchedCust);
                      setItemName(order.itemName);
                      setEstCost(order.estimatedCost);
                      setAdvancePaid(order.advancePaid);
                      setDeliveryType(order.deliveryType);
                      setCourierAddress(order.courierAddress || '');
                      setNotes(order.notes || '');
                      setIsModalOpen(true);
                    }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition flex items-center cursor-pointer"
                  >
                    Edit
                  </button>
                </div>
                <button
                  onClick={() => {
                    if (confirm(language === 'en' ? `Are you sure you want to delete special order ${order.id}?` : `විශේෂ ඇණවුම ${order.id} මකා දැමීමට අවශ්‍ය බව ස්ථිරද?`)) {
                      onDeleteSpecialOrder(order.id);
                    }
                  }}
                  className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                  title="Delete Special Order"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* NEW SPECIAL ORDER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-950 text-white p-4 flex justify-between items-center">
              <h3 className="text-xs font-bold flex items-center">
                <ShoppingBag className="h-4 w-4 mr-1 text-blue-400" />
                {language === 'en' ? (editingOrderDetails ? 'Edit Special / Custom Order' : 'Add Special / Custom Order') : (editingOrderDetails ? 'විශේෂ ඇණවුම් විස්තර වෙනස් කරන්න' : 'නව විශේෂ ඇණවුමක් ඇතුළත් කරන්න')}
              </h3>
              <button onClick={() => { setIsModalOpen(false); setEditingOrderDetails(null); setSelectedCust(null); setItemName(''); setEstCost(0); setAdvancePaid(0); setCourierAddress(''); setNotes(''); }} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-3.5 text-xs font-semibold">
              {/* Customer Auto-complete with Quick Add button */}
              <div className="space-y-1 relative">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-slate-500">Customer Name *</label>
                  <button
                    type="button"
                    onClick={() => setIsNewCustModalOpen(true)}
                    className="text-blue-600 hover:underline flex items-center"
                  >
                    <Plus className="h-3 w-3 mr-0.5" /> Quick Add Customer
                  </button>
                </div>

                {selectedCust ? (
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 flex justify-between items-center mt-1">
                    <div>
                      <h4 className="font-bold text-slate-800">{selectedCust.name}</h4>
                      <p className="text-[10px] text-slate-400">{selectedCust.phone}</p>
                    </div>
                    <button type="button" onClick={() => setSelectedCust(null)} className="text-rose-500 font-bold">✕</button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="text"
                      required
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      placeholder="Type name or phone to search..."
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-bold"
                    />
                    {filteredCustomers.length > 0 && (
                      <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-32 overflow-y-auto">
                        {filteredCustomers.map(c => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setSelectedCust(c);
                              setCourierAddress(c.address || '');
                              setCustomerSearch('');
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

              <div className="space-y-1">
                <label className="font-bold text-slate-500">Requested Item Name / Description *</label>
                <input
                  type="text" required value={itemName} onChange={(e) => setItemName(e.target.value)}
                  placeholder="e.g. Logitech G Pro Keyboard" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Estimated Cost (LKR) *</label>
                  <input
                    type="number" min="0" required value={estCost || ''} onChange={(e) => setEstCost(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Advance Paid (LKR) *</label>
                  <input
                    type="number" min="0" required value={advancePaid || ''} onChange={(e) => setAdvancePaid(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500">Delivery Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button" onClick={() => setDeliveryType('Store Pickup')}
                    className={`py-1.5 rounded-lg border transition ${
                      deliveryType === 'Store Pickup' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    Store Pickup
                  </button>
                  <button
                    type="button" onClick={() => setDeliveryType('Courier')}
                    className={`py-1.5 rounded-lg border transition ${
                      deliveryType === 'Courier' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    Courier Delivery
                  </button>
                </div>
              </div>

              {deliveryType === 'Courier' && (
                <div className="space-y-1 animate-in slide-in-from-top-2 duration-150">
                  <label className="font-bold text-slate-500">Courier Shipping Address *</label>
                  <input
                    type="text" required={deliveryType === 'Courier'} value={courierAddress} onChange={(e) => setCourierAddress(e.target.value)}
                    placeholder="Enter full shipping address..." className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="font-bold text-slate-500">Special Notes / Specifications</label>
                <textarea
                  value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder="Specify color, model details, courier tracking notes..." rows={2}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex space-x-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => { setIsModalOpen(false); setEditingOrderDetails(null); setSelectedCust(null); setItemName(''); setEstCost(0); setAdvancePaid(0); setCourierAddress(''); setNotes(''); }} className="flex-1 bg-slate-100 py-2 rounded-lg font-bold">Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold shadow">Save Special Order</button>
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
                <label className="font-bold text-slate-500">Address</label>
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
                  <option value="Ordered from Supplier">Ordered from Supplier (සැපයුම්කරුගෙන් ඇණවුම් කළ)</option>
                  <option value="Arrived">Arrived (කඩයට ලැබුණු)</option>
                  <option value="Shipped/Delivered">Shipped/Delivered (පාරිභෝගිකයාට ලැබුණු)</option>
                </select>
              </div>

              {editingOrder.deliveryType === 'Courier' && editStatus === 'Shipped/Delivered' && (
                <div className="space-y-1 animate-in slide-in-from-top-2 duration-150">
                  <label className="font-bold text-slate-500">Courier Tracking Number</label>
                  <input
                    type="text" value={editTracking} onChange={(e) => setEditTracking(e.target.value)}
                    placeholder="e.g. DOM-12938475" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                  />
                </div>
              )}

              <div className="flex space-x-2 pt-2">
                <button type="button" onClick={() => setEditingOrder(null)} className="flex-1 bg-slate-100 py-2 rounded-lg font-bold">Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold shadow">Save Status</button>
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
                        <div className="flex justify-between">
                          <span>Item Name:</span>
                          <span className="font-bold">{printLabelOrder.itemName}</span>
                        </div>
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
                  <div className="flex justify-between items-end">
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

            {/* Actions */}
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
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shadow-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
