import React, { useState, useMemo, useEffect } from 'react';
import { generateQrCodeDataUrl } from '../lib/qr';
import { Product, Category, Customer, Sale, SaleItem, Employee, RegisterShift, ShopSettings } from '../types';
import { translations } from '../lib/translations';
import { 
  Search, ShoppingCart, Tag, AlertTriangle, CheckCircle, Clock, 
  Wrench, ChevronDown, Trash2, User, Phone, MapPin, CreditCard, X, Printer, ArrowRight, Laptop, RefreshCw, Plus, Mic,
  Scale, Signal, Maximize2, Minimize2
} from 'lucide-react';

interface POSProps {
  language: 'en' | 'si';
  products: Product[];
  customers: Customer[];
  sales?: Sale[];
  onAddSale: (sale: Sale) => void;
  onAddCustomer: (customer: Customer) => Customer;
  updateProductStock: (productId: string, quantitySold: number) => void;
  vatRate?: number;
  ssclRate?: number;
  employees: Employee[];
  activeShift?: RegisterShift;
  onOpenShift: (cashier: string, float: number) => void;
  onCloseShift: (actualCash: number) => void;
  shifts: RegisterShift[];
  settings: ShopSettings;
  categories: string[];
  onAddCategory: (cat: string) => void;
  onAddProduct?: (product: Product) => void;
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
}

const isOutOfStock = (stock: number | 'Unlimited' | string | undefined | null) => {
  if (stock === 'Unlimited') return false;
  if (stock === undefined || stock === null) return false;
  const num = typeof stock === 'string' ? parseFloat(stock) : Number(stock);
  return isNaN(num) || num <= 0;
};

export const POS: React.FC<POSProps> = ({
  language,
  products,
  customers,
  sales = [],
  onAddSale,
  onAddCustomer,
  updateProductStock,
  vatRate = 15,
  ssclRate = 2.5,
  employees,
  activeShift,
  onOpenShift,
  onCloseShift,
  shifts,
  settings,
  categories,
  onAddCategory,
  onAddProduct,
  isFullScreen = false,
  onToggleFullScreen
}) => {
  const t = translations[language];

  // POS State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [posCart, setPosCart] = useState<{ 
    product: Product; 
    quantity: number; // For non-weighted, this is count. For weighted, it is weight in kg.
    customPrice?: number; // Allowed to edit price on-the-fly
  }[]>([]);

  // Pagination State for POS Product Grid
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 24; // 24 items is optimal for grid scaling on cash register screens

  const [applyVat, setApplyVat] = useState(false);
  const [applySscl, setApplySscl] = useState(false);
  
  // Weight prompt states for groceries/veg
  const [weightModalProduct, setWeightModalProduct] = useState<Product | null>(null);
  const [weightValue, setWeightValue] = useState<string>('');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'g'>('kg');
  
  const [priceMode, setPriceMode] = useState<'Retail' | 'Wholesale'>('Retail');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'Online Transfer' | 'Pending'>('Cash');
  const [discount, setDiscount] = useState<number>(0);
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [paymentReference, setPaymentReference] = useState<string>('');

  // Quick Add Product states
  const [isQuickAddModalOpen, setIsQuickAddModalOpen] = useState(false);
  const [quickAddId, setQuickAddId] = useState('');
  const [quickAddNameEn, setQuickAddNameEn] = useState('');
  const [quickAddNameSi, setQuickAddNameSi] = useState('');
  const [quickAddCategory, setQuickAddCategory] = useState('');
  const [quickAddCustomCategory, setQuickAddCustomCategory] = useState('');
  const [quickAddCostPrice, setQuickAddCostPrice] = useState<number>(0);
  const [quickAddRetailPrice, setQuickAddRetailPrice] = useState<number>(0);
  const [quickAddWholesalePrice, setQuickAddWholesalePrice] = useState<number>(0);
  const [quickAddStock, setQuickAddStock] = useState<number>(10);
  const [quickAddStockIsUnlimited, setQuickAddStockIsUnlimited] = useState(false);
  const [quickAddBrand, setQuickAddBrand] = useState('Generic');
  const [quickAddRack, setQuickAddRack] = useState('Main Rack');
  const [quickAddSource, setQuickAddSource] = useState<'Supplier Purchased' | 'Self-Manufactured' | 'Service (Unlimited)'>('Supplier Purchased');
  const [quickAddWeighted, setQuickAddWeighted] = useState(false);
  const [quickAddTaxable, setQuickAddTaxable] = useState(false);

  // Shift & Cashier state variables
  const [openingCashier, setOpeningCashier] = useState('');
  const [openingFloat, setOpeningFloat] = useState(1000);
  const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);
  const [actualCashInDrawer, setActualCashInDrawer] = useState(0);
  const [cashierIdCheckout, setCashierIdCheckout] = useState('');
  const [lastClosedShift, setLastClosedShift] = useState<RegisterShift | null>(null);

  useEffect(() => {
    if (activeShift) {
      const matched = employees.find(e => e.name === activeShift.cashierName);
      if (matched) {
        setCashierIdCheckout(matched.id);
      } else if (employees.length > 0) {
        setCashierIdCheckout(employees[0].id);
      }
    }
  }, [activeShift, employees]);



  // Voice assistant states (UI/UX Designer & Product Manager)
  const [isListening, setIsListening] = useState(false);
  const [voiceLog, setVoiceLog] = useState<string>('');

  // Local Latency State (Architect)
  const [latencyMode, setLatencyMode] = useState<'online' | 'slow' | 'unstable' | 'offline'>('online');
  const [simulatedPing, setSimulatedPing] = useState(15);

  useEffect(() => {
    let interval: any;
    if (latencyMode === 'online') {
      setSimulatedPing(Math.floor(10 + Math.random() * 20));
    } else if (latencyMode === 'slow') {
      setSimulatedPing(Math.floor(1200 + Math.random() * 400));
    } else if (latencyMode === 'unstable') {
      setSimulatedPing(Math.floor(50 + Math.random() * 500));
    } else {
      setSimulatedPing(0);
    }
    
    if (latencyMode !== 'offline') {
      interval = setInterval(() => {
        if (latencyMode === 'online') {
          setSimulatedPing(Math.floor(10 + Math.random() * 20));
        } else if (latencyMode === 'slow') {
          setSimulatedPing(Math.floor(1200 + Math.random() * 400));
        } else if (latencyMode === 'unstable') {
          setSimulatedPing(Math.floor(50 + Math.random() * 800));
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [latencyMode]);

  const toggleVoiceAssistant = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setVoiceLog('');
    
    if (!SpeechRecognition) {
      // Fallback: Simulate voice commands for demonstration/sandbox environments
      const simulatedCommands = [
        language === 'en' ? 'add tempered glass' : 'එකතු කරන්න ටෙම්පර්ඩ්',
        language === 'en' ? 'add charging usb' : 'එකතු කරන්න කේබලය',
        language === 'en' ? 'clear cart' : 'කරත්තය හිස් කරන්න',
        language === 'en' ? 'search RAM' : 'සොයන්න රැම්'
      ];
      const randomCmd = simulatedCommands[Math.floor(Math.random() * simulatedCommands.length)];
      setVoiceLog(`Simulating voice: "${randomCmd}"`);
      processVoiceCommand(randomCmd);
      
      setIsListening(true);
      setTimeout(() => setIsListening(false), 1500);
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = language === 'en' ? 'en-US' : 'si-LK';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setVoiceLog(language === 'en' ? 'Listening... Speak now!' : 'ශ්‍රවණය කරමින්... දැන් කතා කරන්න!');
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      
      if (event.error === 'not-allowed') {
        setVoiceLog(language === 'en' 
          ? 'Error: Microphone access is blocked. Please enable it in browser settings.' 
          : 'දෝෂයකි: මයික්‍රෆෝනයට ප්‍රවේශය අවහිර කර ඇත. කරුණාකර බ්‍රවුසර් සැකසුම් වලින් එය සක්‍රීය කරන්න.');
      } else if (event.error === 'no-speech') {
        setVoiceLog(language === 'en' 
          ? 'Error: No speech detected. Please speak closer to the mic.' 
          : 'දෝෂයකි: කිසිදු හඬක් හඳුනා ගැනීමට නොහැකි විය. කරුණාකර මයික්‍රෆෝනයට ආසන්නව කතා කරන්න.');
      } else {
        setVoiceLog(`Error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      const speechToText = event.results[0][0].transcript;
      setVoiceLog(`"${speechToText}"`);
      processVoiceCommand(speechToText);
    };

    try {
      recognition.start();
    } catch (e: any) {
      console.error(e);
      setVoiceLog(`Error: ${e.message}`);
    }
  };

  const processVoiceCommand = (cmd: string) => {
    const cleanCmd = cmd.toLowerCase().trim();
    
    // Command matches
    if (cleanCmd.includes('clear') || cleanCmd.includes('හිස් කරන්න')) {
      setPosCart([]);
      setVoiceLog(language === 'en' ? 'Cleared cart!' : 'කරත්තය හිස් කරන ලදී!');
      return;
    }

    if (cleanCmd.startsWith('add ') || cleanCmd.startsWith('එකතු කරන්න ')) {
      const keyword = cleanCmd.replace('add ', '').replace('එකතු කරන්න ', '').trim();
      const product = products.find(p => 
        p.nameEn.toLowerCase().includes(keyword) || 
        p.nameSi.toLowerCase().includes(keyword)
      );
      if (product) {
        addToCart(product);
        setVoiceLog(language === 'en' ? `Added ${product.nameEn} to cart` : `${product.nameSi} කරත්තයට එක් කරන ලදී`);
      } else {
        setVoiceLog(language === 'en' ? `Product "${keyword}" not found` : `"${keyword}" හමු නොවීය`);
      }
    } else if (cleanCmd.startsWith('search ') || cleanCmd.startsWith('සොයන්න ')) {
      const keyword = cleanCmd.replace('search ', '').replace('සොයන්න ', '').trim();
      setSearchQuery(keyword);
      setVoiceLog(language === 'en' ? `Searching: "${keyword}"` : `සොයමින්: "${keyword}"`);
    } else {
      // Default to search whatever was spoken directly
      setSearchQuery(cmd);
    }
  };

  // Customer selection states
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isNewCustModalOpen, setIsNewCustModalOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');

  // Determine selected customer's loyalty tier (Product Manager)
  const loyaltyInfo = useMemo(() => {
    if (!selectedCustomer) return { name: 'Bronze', rate: 0, points: 0 };
    const points = selectedCustomer.loyaltyPoints;
    if (points >= 5000) return { name: 'Platinum', rate: 0.10, points };
    if (points >= 3000) return { name: 'Gold', rate: 0.05, points };
    if (points >= 1000) return { name: 'Silver', rate: 0.02, points };
    return { name: 'Bronze', rate: 0, points };
  }, [selectedCustomer]);

  // Receipt state
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [completedSaleQrUrl, setCompletedSaleQrUrl] = useState<string>('');



  // Memoized product sales popularity from sales ledger
  const productPopularity = useMemo(() => {
    const counts: Record<string, number> = {};
    sales.forEach(sale => {
      if (sale.items) {
        sale.items.forEach(item => {
          counts[item.productId] = (counts[item.productId] || 0) + item.quantity;
        });
      }
    });
    return counts;
  }, [sales]);

  // Filter products for quick add, sorted by popularity descending (most sold first)
  const filteredProducts = useMemo(() => {
    const list = products.filter(p => {
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      const matchesSearch = 
        p.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.nameSi.includes(searchQuery) ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });

    return list.sort((a, b) => {
      const aOut = isOutOfStock(a.stock);
      const bOut = isOutOfStock(b.stock);

      // If one is sold out and the other is not, put sold out at the end
      if (aOut && !bOut) return 1;
      if (!aOut && bOut) return -1;

      // If both have the same stock status, sort by popularity descending
      const countA = productPopularity[a.id] || 0;
      const countB = productPopularity[b.id] || 0;
      return countB - countA;
    });
  }, [products, selectedCategory, searchQuery, productPopularity]);

  // Reset to first page on filter/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

  // Sliced page products
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPage]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;

  // Filter existing customers for quick select
  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return [];
    return customers.filter(c => 
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) || 
      c.phone.includes(customerSearch)
    );
  }, [customers, customerSearch]);

  // POS Cart Calculations with VAT and SSCL
  const totals = useMemo(() => {
    let subtotal = 0;
    let totalCost = 0;
    let totalTax = 0;
    let vatTotal = 0;
    let ssclTotal = 0;

    const items: SaleItem[] = posCart.map(item => {
      const p = item.product;
      const isWholesale = priceMode === 'Wholesale' || item.quantity >= p.wholesaleMinQty;
      
      // Use custom price if edited on-the-fly, otherwise standard pricing
      const basePrice = item.customPrice !== undefined 
        ? item.customPrice 
        : (isWholesale ? p.wholesalePrice : p.retailPrice);

      const itemSubtotal = basePrice * item.quantity;

      // Sri Lankan Tax calculation (VAT and SSCL)
      let itemVat = 0;
      let itemSscl = 0;
      let itemTax = 0;

      if (p.isTaxable) {
        if (applySscl) {
          itemSscl = itemSubtotal * (ssclRate / 100);
        }
        if (applyVat) {
          itemVat = (itemSubtotal + itemSscl) * (vatRate / 100);
        }
        itemTax = itemVat + itemSscl;
      }

      subtotal += itemSubtotal;
      totalCost += p.costPrice * item.quantity;
      totalTax += itemTax;
      vatTotal += itemVat;
      ssclTotal += itemSscl;

      return {
        productId: p.id,
        productNameEn: p.nameEn,
        productNameSi: p.nameSi,
        priceType: isWholesale ? 'Wholesale' : 'Retail',
        price: basePrice,
        quantity: item.quantity,
        cost: p.costPrice,
        isWeighted: p.isWeighted,
        isTaxable: p.isTaxable,
        taxAmount: itemTax,
        vatAmount: itemVat,
        ssclAmount: itemSscl
      };
    });

    const tierDiscountAmount = subtotal * loyaltyInfo.rate;
    const total = Math.max(0, subtotal + totalTax - discount - tierDiscountAmount);
    const profit = total - totalCost - totalTax;

    return {
      items,
      subtotal,
      totalTax,
      vatTotal,
      ssclTotal,
      total,
      totalCost,
      profit,
      tierDiscountAmount,
      loyaltyTier: loyaltyInfo.name,
      loyaltyRate: loyaltyInfo.rate
    };
  }, [posCart, priceMode, discount, vatRate, ssclRate, loyaltyInfo, applyVat, applySscl]);

  // Synchronize amountPaid for Card/Bank Transfer checkouts
  useEffect(() => {
    if (paymentMethod === 'Card' || paymentMethod === 'Online Transfer') {
      setAmountPaid(totals.total);
    }
  }, [paymentMethod, totals.total]);

  // Keyboard Shortcuts Listener Hook
  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      const shortcuts = settings.posShortcuts;
      if (!shortcuts) return;

      const key = e.key;

      if (key === (shortcuts.focusSearch || 'F1')) {
        e.preventDefault();
        const searchInput = document.getElementById('pos-search-input');
        if (searchInput) {
          searchInput.focus();
          (searchInput as any).select();
        }
      } else if (key === (shortcuts.completeSale || 'F8')) {
        e.preventDefault();
        const btn = document.getElementById('pos-btn-complete-sale');
        if (btn && !btn.hasAttribute('disabled')) {
          (btn as HTMLButtonElement).click();
        }
      } else if (key === (shortcuts.clearCart || 'F9')) {
        e.preventDefault();
        const btn = document.getElementById('pos-btn-clear-cart');
        if (btn && !btn.hasAttribute('disabled')) {
          (btn as HTMLButtonElement).click();
        }
      } else if (key === (shortcuts.cashCheckout || 'F2')) {
        e.preventDefault();
        setPaymentMethod('Cash');
        setAmountPaid(totals.total);
      } else if (key === (shortcuts.cardCheckout || 'F4')) {
        e.preventDefault();
        setPaymentMethod('Card');
        setAmountPaid(totals.total);
        setTimeout(() => {
          const refBox = document.getElementById('payment-reference-input');
          if (refBox) {
            refBox.focus();
          }
        }, 50);
      } else if (key === (shortcuts.bankCheckout || 'F6')) {
        e.preventDefault();
        setPaymentMethod('Online Transfer');
        setAmountPaid(totals.total);
        setTimeout(() => {
          const refBox = document.getElementById('payment-reference-input');
          if (refBox) {
            refBox.focus();
          }
        }, 50);
      }
    };

    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => {
      window.removeEventListener('keydown', handleGlobalShortcuts);
    };
  }, [settings.posShortcuts, totals.total]);

  // Add item to POS cart
  const addToCart = (product: Product) => {
    if (product.isWeighted) {
      setWeightModalProduct(product);
      setWeightValue('');
      setWeightUnit('kg');
      return;
    }

    setPosCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (product.stock !== 'Unlimited' && existing.quantity >= product.stock) {
          alert(language === 'en' ? 'Stock limit reached!' : 'පවතින උපරිම තොගය සපුරා ඇත!');
          return prev;
        }
        // Remove existing item and prepend it with updated quantity so it goes to the top
        const filtered = prev.filter(item => item.product.id !== product.id);
        return [{
          product,
          quantity: existing.quantity + 1,
          customPrice: existing.customPrice
        }, ...filtered];
      } else {
        if (product.stock !== 'Unlimited' && product.stock <= 0) {
          alert(language === 'en' ? 'Out of stock!' : 'තොග අවසන්!');
          return prev;
        }
        return [{ product, quantity: 1 }, ...prev];
      }
    });
  };

  const handleConfirmWeight = (e: React.FormEvent) => {
    e.preventDefault();
    if (!weightModalProduct) return;

    const val = parseFloat(weightValue);
    if (isNaN(val) || val <= 0) {
      alert(language === 'en' ? 'Please enter a valid weight!' : 'කරුණාකර නිවැරදි බරක් ඇතුළත් කරන්න!');
      return;
    }

    const weightInKg = weightUnit === 'g' ? val / 1000 : val;

    if (weightModalProduct.stock !== 'Unlimited' && weightInKg > weightModalProduct.stock) {
      alert(
        language === 'en' 
          ? `Insufficient stock! Only ${weightModalProduct.stock} kg available.` 
          : `තොග ප්‍රමාණවත් නැත! පවතින්නේ ${weightModalProduct.stock} kg පමණි.`
      );
      return;
    }

    setPosCart(prev => {
      const existing = prev.find(item => item.product.id === weightModalProduct.id);
      if (existing) {
        const newQty = existing.quantity + weightInKg;
        if (weightModalProduct.stock !== 'Unlimited' && newQty > weightModalProduct.stock) {
          alert(
            language === 'en' 
              ? `Stock limit reached! Max stock: ${weightModalProduct.stock} kg.` 
              : `පවතින උපරිම තොගය සපුරා ඇත! උපරිම තොගය: ${weightModalProduct.stock} kg.`
          );
          return prev;
        }
        const filtered = prev.filter(item => item.product.id !== weightModalProduct.id);
        return [{
          product: weightModalProduct,
          quantity: newQty,
          customPrice: existing.customPrice
        }, ...filtered];
      } else {
        return [{ product: weightModalProduct, quantity: weightInKg }, ...prev];
      }
    });

    setWeightModalProduct(null);
  };

  // Update item quantity/weight in POS cart
  const updateQty = (productId: string, val: number) => {
    if (val <= 0) return;
    setPosCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          if (item.product.stock !== 'Unlimited' && val > item.product.stock) {
            alert(language === 'en' ? 'Stock limit reached!' : 'පවතින උපරිම තොගය සපුරා ඇත!');
            return item;
          }
          return { ...item, quantity: val };
        }
        return item;
      });
    });
  };

  // Update item custom price on-the-fly
  const updateCustomPrice = (productId: string, price: number) => {
    if (price < 0) return;
    setPosCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          return { ...item, customPrice: price };
        }
        return item;
      });
    });
  };

  // Remove item from POS cart
  const removeItem = (productId: string) => {
    setPosCart(prev => prev.filter(item => item.product.id !== productId));
  };

  // Register customer on the fly
  const handleRegisterCustomer = (e: React.FormEvent) => {
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

    setSelectedCustomer(newCust);
    setIsNewCustModalOpen(false);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustAddress('');
    setCustomerSearch('');
  };

  const resetQuickAddFields = () => {
    setQuickAddId('');
    setQuickAddNameEn('');
    setQuickAddNameSi('');
    setQuickAddCategory('');
    setQuickAddCustomCategory('');
    setQuickAddCostPrice(0);
    setQuickAddRetailPrice(0);
    setQuickAddWholesalePrice(0);
    setQuickAddStock(10);
    setQuickAddStockIsUnlimited(false);
    setQuickAddBrand('Generic');
    setQuickAddRack('Main Rack');
    setQuickAddSource('Supplier Purchased');
    setQuickAddWeighted(false);
    setQuickAddTaxable(false);
  };

  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAddNameEn.trim()) {
      alert(language === 'en' ? 'Product name (English) is required!' : 'භාණ්ඩයේ ඉංග්‍රීසි නම අනිවාර්ය වේ!');
      return;
    }
    if (!quickAddCategory) {
      alert(language === 'en' ? 'Category is required!' : 'වර්ගීකරණය අනිවාර්ය වේ!');
      return;
    }
    const finalCategory = quickAddCategory === 'new' ? quickAddCustomCategory.trim() : quickAddCategory;
    if (!finalCategory) {
      alert(language === 'en' ? 'Category name is required!' : 'වර්ගීකරණයේ නම අනිවාර්ය වේ!');
      return;
    }

    const finalId = quickAddId.trim() || `P-${Math.floor(100000 + Math.random() * 900000)}`;
    
    // Check for duplicate ID
    const duplicate = products.some(p => p.id.toLowerCase() === finalId.toLowerCase());
    if (duplicate) {
      alert(language === 'en' ? `Product ID "${finalId}" already exists!` : `භාණ්ඩයේ අංකය "${finalId}" පද්ධතියේ දැනටමත් පවතී!`);
      return;
    }

    const newProduct: Product = {
      id: finalId,
      nameEn: quickAddNameEn.trim(),
      nameSi: quickAddNameSi.trim() || quickAddNameEn.trim(),
      category: finalCategory,
      source: quickAddSource,
      costPrice: Number(quickAddCostPrice) || 0,
      retailPrice: Number(quickAddRetailPrice) || 0,
      wholesalePrice: Number(quickAddWholesalePrice) || Number(quickAddRetailPrice) || 0,
      wholesaleMinQty: 5,
      stock: quickAddStockIsUnlimited ? 'Unlimited' : (Number(quickAddStock) || 0),
      lowStockAlert: 5,
      brand: quickAddBrand.trim() || 'Generic',
      rackLocation: quickAddRack.trim() || 'Main Rack',
      isWeighted: quickAddWeighted,
      isTaxable: quickAddTaxable,
    };

    // 1. Add to central inventory
    if (onAddProduct) {
      onAddProduct(newProduct);
    }

    // 2. Add to categories list if it is a new category
    if (quickAddCategory === 'new' && finalCategory) {
      onAddCategory(finalCategory);
    }

    // 3. Add directly to billing cart
    addToCart(newProduct);

    // 4. Close modal and reset fields
    setIsQuickAddModalOpen(false);
    resetQuickAddFields();
  };

  // Process and complete the POS sale
  const handleCompleteSale = () => {
    if (posCart.length === 0) {
      alert(language === 'en' ? 'Cart is empty!' : 'කරත්තය හිස් ය!');
      return;
    }

    // Require customer for Unpaid/Credit sales
    if (paymentMethod === 'Pending' && !selectedCustomer) {
      alert(
        language === 'en'
          ? '⚠️ Customer is required for Credit (Unpaid) sales!\nPlease select or add a customer before completing this sale.'
          : '⚠️ ණය (Unpaid) බිල්පතක් සඳහා ගැනුම්කරු අනිවාර්ය වේ!\nකරුණාකර ගැනුම්කරු තෝරන්න හෝ ලියාපදිංචි කරන්න.'
      );
      return;
    }

    // Double check stock
    for (const item of posCart) {
      const p = item.product;
      if (p.stock !== 'Unlimited' && p.stock < item.quantity) {
        alert(
          language === 'en' 
            ? `Stock error: ${p.nameEn} only has ${p.stock} units left.` 
            : `තොග දෝෂයකි: ${p.nameSi} සඳහා ඉතිරිව ඇත්තේ ඒකක ${p.stock} ක් පමණි.`
        );
        return;
      }
    }

    const saleId = `S-POS-${Math.floor(1000 + Math.random() * 9000)}`;
    const newSale: Sale = {
      id: saleId,
      customerId: selectedCustomer?.id || undefined,
      customerName: selectedCustomer?.name || (language === 'en' ? 'Walk-In Customer' : 'පැමිණි පාරිභෝගිකයා'),
      cashierId: cashierIdCheckout || undefined,
      cashierName: employees.find(e => e.id === cashierIdCheckout)?.name || undefined,
      saleType: 'POS',
      priceType: priceMode,
      items: totals.items,
      subtotal: totals.subtotal,
      discount,
      total: totals.total,
      totalCost: totals.totalCost,
      profit: totals.profit,
      totalTax: totals.totalTax,
      vatTotal: totals.vatTotal,
      ssclTotal: totals.ssclTotal,
      paymentMethod,
      paymentReference: (paymentMethod === 'Card' || paymentMethod === 'Online Transfer') ? paymentReference.trim() : undefined,
      loyaltyPointsEarned: Math.floor(totals.total / 1000),
      createdAt: new Date().toISOString()
    };

    // Update stock levels
    posCart.forEach(item => {
      if (item.product.stock !== 'Unlimited') {
        updateProductStock(item.product.id, item.quantity);
      }
    });

    onAddSale(newSale);
    setCompletedSale(newSale);
    generateQrCodeDataUrl(`BILL:${saleId}`).then(url => {
      setCompletedSaleQrUrl(url);
    });

    // Reset POS form
    setPosCart([]);
    setDiscount(0);
    setAmountPaid(0);
    setPaymentReference('');
    setSelectedCustomer(null);
    setCustomerSearch('');
    setApplyVat(false);
    setApplySscl(false);
  };

  const changeDue = amountPaid > 0 ? Math.max(0, amountPaid - totals.total) : 0;

  if (!activeShift) {
    return (
      <div className="lg:col-span-12 min-h-[70vh] flex items-center justify-center bg-slate-900 text-slate-100 rounded-3xl p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
        {/* Decorative glassmorphic gradient blobs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -translate-x-12 -translate-y-12"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl translate-x-12 translate-y-12"></div>
        
        <div className="max-w-md w-full space-y-6 relative z-10 text-center">
          <div className="inline-flex p-4 rounded-2xl bg-slate-800 border border-slate-700 shadow-inner">
            <ShoppingCart className="h-10 w-10 text-blue-400" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
              {language === 'en' ? 'Cash Drawer Locked' : 'මුදල් ලාච්චුව වසා ඇත'}
            </h2>
            <p className="text-xs text-slate-400">
              {language === 'en' 
                ? 'To begin checkout operations, please open a new cash register shift.' 
                : 'විකුණුම් ආරම්භ කිරීමට, කරුණාකර නව මුදල් ලේඛන මාරුවක් (Shift) ආරම්භ කරන්න.'}
            </p>
          </div>

          <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800 space-y-4 text-left">
            <div className="space-y-1 text-xs">
              <label className="font-bold text-slate-400">{language === 'en' ? 'Select Active Cashier' : 'අයකැමි තෝරන්න'}</label>
              <select
                value={openingCashier}
                onChange={(e) => setOpeningCashier(e.target.value)}
                className="w-full px-3 py-2 bg-slate-850 border border-slate-750 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-bold"
              >
                <option value="">-- {language === 'en' ? 'Select Cashier' : 'අයකැමි තෝරන්න'} --</option>
                {employees.map(e => (
                  <option key={e.id} value={e.name}>{e.name} ({e.role})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1 text-xs">
              <label className="font-bold text-slate-400">{language === 'en' ? 'Opening Float Cash (LKR)' : 'ආරම්භක මාරු සල්ලි (LKR)'}</label>
              <input
                type="number"
                value={openingFloat}
                onChange={(e) => setOpeningFloat(Number(e.target.value))}
                placeholder="e.g. 1000"
                className="w-full px-3 py-2 bg-slate-850 border border-slate-750 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-bold"
              />
            </div>

            <button
              onClick={() => {
                if (!openingCashier) {
                  alert(language === 'en' ? 'Please select a cashier!' : 'කරුණාකර අයකැමි තෝරන්න!');
                  return;
                }
                onOpenShift(openingCashier, openingFloat);
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-lg shadow-blue-600/10 active:scale-95 flex items-center justify-center space-x-2"
            >
              <CheckCircle className="h-4 w-4" />
              <span>{language === 'en' ? 'Open Cash Register Shift' : 'ලේඛන මාරුව ආරම්භ කරන්න'}</span>
            </button>
          </div>

          {lastClosedShift && (
            <div className="text-[10px] text-slate-500 text-center bg-slate-950/20 p-3 rounded-xl border border-slate-800">
              <span className="font-bold">{language === 'en' ? 'Last Active Shift:' : 'අවසන් සක්‍රීය මාරුව:'} </span>
              {lastClosedShift.cashierName} • Z-Report discrepancy: Rs. {(lastClosedShift.actualCash - lastClosedShift.expectedCash).toLocaleString()}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Product Selection Panel (Left) */}
      <div className="lg:col-span-7 space-y-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 space-y-3">
          <div className="flex gap-2 items-center">
            <div className="relative flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  id="pos-search-input"
                  type="text"
                  placeholder={language === 'en' ? 'Search by name, ID or code...' : 'නම හෝ අංකය මඟින් සොයන්න...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-xs font-bold text-slate-800"
                />
              </div>
              
              <button
                type="button"
                onClick={toggleVoiceAssistant}
                className={`p-2.5 rounded-xl border flex items-center justify-center transition-all ${
                  isListening 
                    ? 'bg-rose-500 border-rose-600 text-white animate-pulse' 
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-500 hover:border-blue-400'
                }`}
                title="Voice Assistant (English / සිංහල)"
              >
                <Mic className="h-4 w-4" />
              </button>

              {onToggleFullScreen && (
                <button
                  type="button"
                  onClick={onToggleFullScreen}
                  className={`p-2.5 rounded-xl border flex items-center justify-center transition-all ${
                    isFullScreen
                      ? 'bg-blue-50 border-blue-200 text-blue-600 shadow-sm'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-500 hover:border-blue-400'
                  }`}
                  title={isFullScreen ? (language === 'en' ? 'Exit Full Screen' : 'සාමාන්‍ය තිරය') : (language === 'en' ? 'Full Screen Mode' : 'සම්පූර්ණ තිරය')}
                >
                  {isFullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </button>
              )}
            </div>
            <div className="flex gap-1.5 items-center">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
              >
                <option value="All">{t.allCategories}</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {(t as any)[cat] || cat}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  setQuickAddId(`P-${Math.floor(100000 + Math.random() * 900000)}`);
                  if (categories.length > 0) {
                    setQuickAddCategory(categories[0]);
                  }
                  setIsQuickAddModalOpen(true);
                }}
                className="p-2 bg-slate-50 border border-slate-200 hover:border-blue-400 hover:bg-slate-100 rounded-xl transition text-slate-500 flex items-center justify-center shrink-0"
                title={language === 'en' ? 'Quick Add Product' : 'නව භාණ්ඩයක් ඇතුළත් කරන්න'}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
          {voiceLog && (
            <div className="text-[10px] text-indigo-500 font-bold bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100 flex items-center justify-between animate-pulse">
              <span>🗣️ Voice Command parsed: {voiceLog}</span>
              <button onClick={() => setVoiceLog('')} className="text-indigo-400 hover:text-indigo-600 text-xs font-extrabold">✕</button>
            </div>
          )}
        </div>

        {/* Quick Click Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 max-h-[55vh] overflow-y-auto pr-1">
          {paginatedProducts.map(p => {
            const isLowStock = p.stock !== 'Unlimited' && p.stock <= p.lowStockAlert;
            const isOutOfStock = p.stock !== 'Unlimited' && p.stock <= 0;

            return (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                disabled={isOutOfStock}
                className={`p-3 bg-white border rounded-xl text-left hover:shadow-sm active:scale-95 transition flex flex-col justify-between h-28 ${
                  isOutOfStock 
                    ? 'border-slate-100 bg-slate-50/50 opacity-50 cursor-not-allowed' 
                    : isLowStock 
                    ? 'border-rose-200 hover:border-rose-300' 
                    : 'border-slate-200 hover:border-blue-400'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{p.id}</span>
                    <span className={`text-[8px] font-extrabold px-1 py-0.5 rounded text-white ${
                      p.source === 'Self-Manufactured' ? 'bg-emerald-500' : p.source === 'Service (Unlimited)' ? 'bg-purple-500' : 'bg-blue-500'
                    }`}>
                      {p.isWeighted ? 'Weight' : 'Unit'}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 line-clamp-1 mt-1">
                    {language === 'en' ? p.nameEn : p.nameSi}
                  </h4>
                  <p className="text-[10px] text-slate-400 line-clamp-1">
                    {language === 'en' ? p.nameSi : p.nameEn}
                  </p>
                </div>

                <div className="flex justify-between items-end w-full pt-1 border-t border-slate-100">
                  <span className="text-xs font-extrabold text-blue-600">
                    Rs. {priceMode === 'Wholesale' ? p.wholesalePrice : p.retailPrice} {p.isWeighted && '/kg'}
                  </span>
                  <span className={`text-[10px] font-bold ${isOutOfStock ? 'text-rose-500' : isLowStock ? 'text-amber-500' : 'text-slate-500'}`}>
                    {p.stock === 'Unlimited' ? '∞' : `${p.stock} Qty`}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* POS Grid Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center bg-white px-4 py-2 border border-slate-200 rounded-xl shadow-sm text-xs font-bold text-slate-600">
            <span>
              {language === 'en' ? `Page ${currentPage} of ${totalPages}` : `පිටුව ${currentPage} න් ${totalPages}`}
            </span>
            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center hover:bg-slate-100 disabled:opacity-40 transition text-sm cursor-pointer"
              >
                ‹
              </button>
              {(() => {
                const pages: (number | string)[] = [];
                if (totalPages <= 5) {
                  for (let i = 1; i <= totalPages; i++) pages.push(i);
                } else {
                  pages.push(1);
                  if (currentPage > 3) pages.push('...');
                  const start = Math.max(2, currentPage - 1);
                  const end = Math.min(totalPages - 1, currentPage + 1);
                  for (let i = start; i <= end; i++) {
                    pages.push(i);
                  }
                  if (currentPage < totalPages - 2) pages.push('...');
                  pages.push(totalPages);
                }
                return pages.map((p, idx) => {
                  if (p === '...') {
                    return <span key={`dots-${idx}`} className="px-1 text-slate-400 text-[10px]">...</span>;
                  }
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setCurrentPage(p as number)}
                      className={`w-7 h-7 rounded-lg border text-[10px] font-extrabold transition ${
                        currentPage === p 
                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm' 
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {p}
                    </button>
                  );
                });
              })()}
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center hover:bg-slate-100 disabled:opacity-40 transition text-sm cursor-pointer"
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>

      {/* POS Billing Terminal (Right) */}
      <div className="lg:col-span-5 bg-white rounded-2xl shadow-sm border border-slate-100 p-4 space-y-3 flex flex-col justify-between">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex flex-col gap-2 pb-2.5 border-b border-slate-100">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-800 flex items-center">
                <ShoppingCart className="h-4 w-4 mr-1 text-blue-600" />
                {t.posTerminal}
              </h3>
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  id="pos-btn-clear-cart"
                  onClick={() => {
                    if (posCart.length === 0) return;
                    if (confirm(language === 'en' ? 'Are you sure you want to clear the billing cart?' : 'බිල්පත් කරත්තය හිස් කිරීමට ඔබට විශ්වාසද?')) {
                      setPosCart([]);
                      setDiscount(0);
                      setAmountPaid(0);
                      setPaymentReference('');
                    }
                  }}
                  className="px-2 py-1 text-[9px] font-bold bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-600 border border-slate-200 rounded-lg transition"
                >
                  {language === 'en' ? 'Clear' : 'හිස් කරන්න'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActualCashInDrawer(activeShift ? activeShift.expectedCash : 0);
                    setIsClosingModalOpen(true);
                  }}
                  className="px-2 py-1 text-[9px] font-bold bg-rose-50 hover:bg-rose-105 active:scale-95 text-rose-600 border border-rose-250 rounded-lg transition"
                >
                  {language === 'en' ? 'Close Register' : 'මාරුව වසන්න'}
                </button>
                <div className="flex space-x-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                  <button
                    onClick={() => setPriceMode('Retail')}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition ${
                      priceMode === 'Retail' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    {t.retail}
                  </button>
                  <button
                    onClick={() => setPriceMode('Wholesale')}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition ${
                      priceMode === 'Wholesale' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    {t.wholesale}
                  </button>
                </div>
              </div>
            </div>
            
            {/* Live Telemetry, Cashier selector and Dongle Signal Bar */}
            <div className="flex items-center justify-between bg-slate-50/80 px-2 py-1.5 rounded-xl border border-slate-200/60 gap-1.5">
              {/* Cashier selection dropdown */}
              <div className="flex items-center space-x-1">
                <span className="text-[9px] text-slate-400 font-extrabold uppercase shrink-0">Cashier:</span>
                <select
                  value={cashierIdCheckout}
                  onChange={(e) => setCashierIdCheckout(e.target.value)}
                  className="bg-transparent border border-slate-200/80 hover:border-slate-300 text-[9px] font-extrabold rounded px-1.5 py-0.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-[90px] truncate"
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>

              {/* Latency Mode Selector & Ping */}
              <div className="flex items-center space-x-1.5 ml-auto">
                <div className="flex items-center space-x-1">
                  {/* Signal bars representing USB Dongle */}
                  {(() => {
                    let activeBars = 0;
                    let colorClass = 'bg-slate-300';
                    if (latencyMode === 'online') {
                      activeBars = 4;
                      colorClass = 'bg-emerald-500';
                    } else if (latencyMode === 'slow') {
                      activeBars = 2;
                      colorClass = 'bg-amber-500';
                    } else if (latencyMode === 'unstable') {
                      activeBars = 2;
                      colorClass = 'bg-amber-400 animate-pulse';
                    } else {
                      activeBars = 0;
                      colorClass = 'bg-rose-500';
                    }

                    return (
                      <div className="flex items-end space-x-[2px] h-3 px-1 pb-[1px]" title={`Dongle Signal: ${activeBars}/4`}>
                        <div className={`w-[2.5px] h-[3px] rounded-[0.5px] ${activeBars >= 1 ? colorClass : 'bg-slate-300'}`}></div>
                        <div className={`w-[2.5px] h-[5px] rounded-[0.5px] ${activeBars >= 2 ? colorClass : 'bg-slate-300'}`}></div>
                        <div className={`w-[2.5px] h-[7px] rounded-[0.5px] ${activeBars >= 3 ? colorClass : 'bg-slate-300'}`}></div>
                        <div className={`w-[2.5px] h-[9px] rounded-[0.5px] ${activeBars >= 4 ? colorClass : 'bg-slate-300'}`}></div>
                      </div>
                    );
                  })()}
                  <span className={`h-1.5 w-1.5 rounded-full ${
                    latencyMode === 'online' ? 'bg-emerald-500' :
                    latencyMode === 'slow' ? 'bg-blue-400' :
                    latencyMode === 'unstable' ? 'bg-amber-500 animate-ping' : 'bg-rose-500'
                  }`} />
                  <span className="text-[9px] text-slate-500 font-bold shrink-0">{latencyMode === 'offline' ? 'offline' : `${simulatedPing}ms`}</span>
                </div>

                <select
                  value={latencyMode}
                  onChange={(e) => setLatencyMode(e.target.value as any)}
                  className="bg-transparent border border-slate-200/80 hover:border-slate-300 text-[9px] font-bold rounded px-1 py-0.5 text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="online">Live (4G)</option>
                  <option value="slow">3G (Slow)</option>
                  <option value="unstable">Lossy</option>
                  <option value="offline">Offline</option>
                </select>
              </div>
            </div>
          </div>

          {/* Customer Selection Row */}
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
            {selectedCustomer ? (
              <div className="flex gap-2 items-center w-full">
                <div className="flex-1 bg-white px-2 py-1 rounded-lg border border-slate-200 flex justify-between items-center min-w-0">
                  <div className="flex items-center space-x-1.5 min-w-0 flex-1">
                    <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="text-xs font-bold text-slate-800 truncate">{selectedCustomer.name}</span>
                    <span className={`text-[8px] font-extrabold px-1 rounded text-white uppercase tracking-wide shrink-0 ${
                      loyaltyInfo.name === 'Platinum' ? 'bg-indigo-600' :
                      loyaltyInfo.name === 'Gold' ? 'bg-amber-500' :
                      loyaltyInfo.name === 'Silver' ? 'bg-slate-400' : 'bg-amber-700'
                    }`}>
                      {loyaltyInfo.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedCustomer(null)}
                    className="text-slate-400 hover:text-rose-500 font-extrabold text-xs ml-1.5 shrink-0"
                  >
                    ✕
                  </button>
                </div>
                
                <button
                  type="button"
                  onClick={() => setIsNewCustModalOpen(true)}
                  className="bg-blue-50 hover:bg-blue-105 active:scale-95 text-blue-600 border border-blue-200 rounded-lg text-[9px] font-bold px-2.5 py-1.5 flex items-center shrink-0 transition"
                >
                  <Plus className="h-3 w-3 mr-0.5" />
                  <span>{language === 'en' ? 'New' : 'නව'}</span>
                </button>
              </div>
            ) : (
              <div className="flex gap-2 items-center w-full">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder={language === 'en' ? 'Walk-In Customer / Search...' : 'පැමිණි පාරිභෝගිකයා / සොයන්න...'}
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />

                  {/* Dropdown suggestions */}
                  {filteredCustomers.length > 0 && (
                    <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-32 overflow-y-auto">
                      {filteredCustomers.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setSelectedCustomer(c);
                            setCustomerSearch('');
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-bold hover:bg-slate-50 border-b border-slate-100 last:border-b-0 text-slate-700 flex justify-between"
                        >
                          <span>{c.name}</span>
                          <span className="text-slate-400">{c.phone}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                <button
                  type="button"
                  onClick={() => setIsNewCustModalOpen(true)}
                  className="bg-blue-50 hover:bg-blue-105 active:scale-95 text-blue-600 border border-blue-200 rounded-lg text-[9px] font-bold px-2.5 py-1.5 flex items-center shrink-0 transition"
                >
                  <Plus className="h-3 w-3 mr-0.5" />
                  <span>{language === 'en' ? 'New' : 'නව'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Cart Item Rows */}
          <div className="space-y-1.5 min-h-[300px] max-h-[380px] overflow-y-auto pr-1">
            {posCart.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs font-medium">
                No items in bill. Select products from left panel.
              </div>
            ) : (
              posCart.map(item => {
                const p = item.product;
                const isWholesale = priceMode === 'Wholesale' || item.quantity >= p.wholesaleMinQty;
                
                const activePrice = item.customPrice !== undefined 
                  ? item.customPrice 
                  : (isWholesale ? p.wholesalePrice : p.retailPrice);

                return (
                  <div key={p.id} className="bg-slate-50 hover:bg-slate-100/75 px-2.5 py-1.5 border border-slate-200 rounded-xl transition flex items-center justify-between gap-2.5 text-xs">
                    {/* Left: Product Info */}
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <h4 className="font-bold text-slate-800 text-[11px] truncate" title={language === 'en' ? p.nameEn : p.nameSi}>
                        {language === 'en' ? p.nameEn : p.nameSi}
                      </h4>
                      <div className="flex items-center space-x-1.5 text-[9px] text-slate-400 font-medium min-w-0">
                        <span className="font-bold shrink-0">{p.id}</span>
                        <span className="text-slate-300 shrink-0">•</span>
                        <span className="truncate">{language === 'en' ? p.nameSi : p.nameEn}</span>
                        {p.isTaxable && (
                          <span className="text-[7.5px] font-extrabold px-1 py-0.2 bg-blue-50 text-blue-600 border border-blue-200 rounded shrink-0">
                            TAX
                          </span>
                        )}
                        {p.isWeighted && (
                          <span className="text-[7.5px] font-extrabold px-1 py-0.2 bg-emerald-50 text-emerald-600 border border-emerald-250 rounded shrink-0">
                            WEIGHT
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Controls & Pricing */}
                    <div className="flex items-center space-x-1.5 shrink-0">
                      {/* Price Edit Box */}
                      <div className="flex flex-col items-center">
                        <input
                          type="number"
                          min="0"
                          value={activePrice}
                          onChange={(e) => updateCustomPrice(p.id, Number(e.target.value))}
                          className="w-12 px-1 py-0.5 bg-white border border-slate-200 rounded text-center text-[10px] font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          title="Edit Unit Price"
                        />
                        <span className="text-[7.5px] text-slate-400 font-extrabold mt-0.5">Rs. / {p.isWeighted ? 'kg' : 'unit'}</span>
                      </div>

                      {/* Quantity Selector: [-] Qty [+] */}
                      <div className="flex items-center bg-white border border-slate-200 rounded-md p-0.5">
                        <button
                          type="button"
                          onClick={() => updateQty(p.id, item.quantity - (p.isWeighted ? 0.25 : 1))}
                          className="w-4 h-4 flex items-center justify-center text-[9px] font-extrabold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="0.01"
                          step={p.isWeighted ? '0.05' : '1'}
                          value={item.quantity}
                          onChange={(e) => updateQty(p.id, Number(e.target.value))}
                          className="w-8 text-center text-[9px] font-black text-slate-800 focus:outline-none bg-transparent"
                        />
                        <button
                          type="button"
                          onClick={() => updateQty(p.id, item.quantity + (p.isWeighted ? 0.25 : 1))}
                          className="w-4 h-4 flex items-center justify-center text-[9px] font-extrabold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition"
                        >
                          +
                        </button>
                      </div>

                      {/* Line Total */}
                      <div className="w-14 text-right font-extrabold text-[10px] text-slate-800">
                        Rs. {(activePrice * item.quantity).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </div>

                      {/* Delete Button */}
                      <button 
                        onClick={() => removeItem(p.id)} 
                        className="text-slate-400 hover:text-rose-500 p-0.5 hover:bg-slate-100 rounded transition"
                        title="Remove Item"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Pricing Summary and Payments */}
        <div className="border-t border-slate-200 pt-3 space-y-3">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500">{t.payMethod}:</label>
            <div className="grid grid-cols-4 gap-1">
              {[
                { key: 'Cash' as const, label: t.cash },
                { key: 'Card' as const, label: t.card },
                { key: 'Online Transfer' as const, label: language === 'en' ? 'Bank' : 'බැංකු' },
                { key: 'Pending' as const, label: language === 'en' ? 'Unpaid' : 'ණය' }
              ].map(pay => (
                <button
                  key={pay.key}
                  onClick={() => setPaymentMethod(pay.key)}
                  className={`py-1.5 rounded-lg text-[10px] font-bold border transition ${
                    paymentMethod === pay.key
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {pay.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tax Toggles — compact row */}
          <div className="flex items-center justify-between gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/60">
            <span className="text-[8.5px] font-extrabold text-slate-400 uppercase tracking-wider shrink-0">Tax / බදු:</span>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer group">
                <div className={`relative w-7 h-4 rounded-full transition-colors ${applyVat ? 'bg-blue-500' : 'bg-slate-300'}`}>
                  <input type="checkbox" checked={applyVat} onChange={(e) => setApplyVat(e.target.checked)} className="sr-only" />
                  <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${applyVat ? 'translate-x-3' : ''}`} />
                </div>
                <span className="text-[9px] font-bold text-slate-600">VAT {vatRate}%</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer group">
                <div className={`relative w-7 h-4 rounded-full transition-colors ${applySscl ? 'bg-indigo-500' : 'bg-slate-300'}`}>
                  <input type="checkbox" checked={applySscl} onChange={(e) => setApplySscl(e.target.checked)} className="sr-only" />
                  <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${applySscl ? 'translate-x-3' : ''}`} />
                </div>
                <span className="text-[9px] font-bold text-slate-600">SSCL {ssclRate}%</span>
              </label>
            </div>
          </div>

          {/* Bill Summary Card */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            {/* Line items */}
            <div className="px-3 py-2 space-y-1 text-[11px]">
              <div className="flex justify-between text-slate-500">
                <span>{t.subtotal}</span>
                <span className="font-semibold text-slate-700">Rs. {totals.subtotal.toLocaleString()}</span>
              </div>
              {applyVat && totals.vatTotal > 0 && (
                <div className="flex justify-between text-blue-600">
                  <span>VAT ({vatRate}%)</span>
                  <span className="font-semibold">+ Rs. {totals.vatTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                </div>
              )}
              {applyVat && totals.vatTotal === 0 && (
                <div className="flex justify-between text-amber-500 text-[10px]">
                  <span>VAT ({vatRate}%)</span>
                  <span className="font-semibold italic">Non-taxable items</span>
                </div>
              )}
              {applySscl && totals.ssclTotal > 0 && (
                <div className="flex justify-between text-violet-600">
                  <span>SSCL ({ssclRate}%)</span>
                  <span className="font-semibold">+ Rs. {totals.ssclTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                </div>
              )}
              {applySscl && totals.ssclTotal === 0 && (
                <div className="flex justify-between text-amber-500 text-[10px]">
                  <span>SSCL ({ssclRate}%)</span>
                  <span className="font-semibold italic">Non-taxable items</span>
                </div>
              )}

              {/* Discount inline */}
              <div className="flex justify-between items-center text-slate-500">
                <span>{t.discount}</span>
                <div className="flex items-center gap-1.5">
                  <div className="relative">
                    <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[8px] text-slate-400 font-bold pointer-events-none">Rs.</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={discount || ''}
                      onChange={(e) => setDiscount(Number(e.target.value))}
                      className="w-16 pl-5 pr-1 py-0.5 bg-rose-50 border border-rose-200 rounded-lg text-[10px] font-bold text-rose-700 text-right focus:outline-none focus:ring-1 focus:ring-rose-400"
                    />
                  </div>
                  {discount > 0 && (
                    <span className="text-rose-500 font-bold text-[10px]">- Rs. {discount.toLocaleString()}</span>
                  )}
                </div>
              </div>

              {totals.tierDiscountAmount > 0 && (
                <div className="flex justify-between text-indigo-500 text-[10px]">
                  <span>🎖️ {totals.loyaltyTier} Loyalty ({(totals.loyaltyRate * 100)}%)</span>
                  <span className="font-bold">- Rs. {totals.tierDiscountAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                </div>
              )}
            </div>

            {/* TOTAL ROW — prominent */}
            <div className="bg-slate-900 px-3 py-2.5 flex justify-between items-center">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">TOTAL</span>
              <span className="text-white font-black text-base tracking-tight">
                Rs. {totals.total.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
            </div>

            {/* Amount Paid row (Cash/Pending checkout only) */}
            {(paymentMethod === 'Cash' || paymentMethod === 'Pending') ? (
              <div className="px-3 py-2 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-500">{language === 'en' ? 'Amount Paid' : 'ලබාදුන් මුදල'}</span>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] text-emerald-500 font-extrabold pointer-events-none">Rs.</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="0.00"
                      value={amountPaid || ''}
                      onChange={(e) => setAmountPaid(Number(e.target.value))}
                      className="w-24 pl-7 pr-2 py-1 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] font-black text-emerald-800 text-right focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition"
                    />
                  </div>
                </div>
                {/* Quick cash buttons */}
                {paymentMethod === 'Cash' && (
                  <div className="flex gap-1">
                    {[500, 1000, 2000, 5000].map(amt => (
                      <button
                        key={amt}
                        onClick={() => setAmountPaid(amt)}
                        className={`flex-1 py-1 text-[9px] font-bold rounded-lg border transition ${
                          amountPaid === amt
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700'
                        }`}
                      >
                        {amt >= 1000 ? `${amt/1000}K` : amt}
                      </button>
                    ))}
                    <button
                      onClick={() => setAmountPaid(totals.total)}
                      className={`flex-1 py-1 text-[9px] font-bold rounded-lg border transition ${
                        amountPaid === totals.total
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700'
                      }`}
                    >
                      Exact
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Card & Bank Checkout Payment Reference Details */
              <div className="px-3 py-2.5 space-y-1.5 bg-slate-50/50">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">
                    {language === 'en' ? 'Transaction Details / Reference *' : 'ගනුදෙනු විස්තර / යොමු අංකය *'}
                  </label>
                  <input
                    type="text"
                    id="payment-reference-input"
                    placeholder={paymentMethod === 'Card' 
                      ? (language === 'en' ? 'e.g. Card Ref, Slip No, Last 4 digits...' : 'උදා: කාඩ්පත් අංකය, රිසිට්පත් අංකය...')
                      : (language === 'en' ? 'e.g. Bank Reference No, Transaction ID...' : 'උදා: බැංකු මාරුකිරීම් අංකය, ID අංකය...')}
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition"
                  />
                </div>
                <div className="text-[8px] text-slate-400 italic">
                  * {language === 'en' ? 'Amount Paid set to Exact Total automatically.' : 'මුළු එකතුව ස්වයංක්‍රීයව ගෙවන ලද මුදල ලෙස සලකනු ලැබේ.'}
                </div>
              </div>
            )}

            {/* Change Due */}
            {paymentMethod === 'Cash' && amountPaid > 0 && (
              <div className={`px-3 py-2 flex justify-between items-center border-t ${
                changeDue >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'
              }`}>
                <span className={`text-[10px] font-extrabold uppercase tracking-widest ${changeDue >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {changeDue >= 0 ? (language === 'en' ? 'CHANGE DUE' : 'ඉතිරිය') : (language === 'en' ? 'BALANCE DUE' : 'ශේෂය')}
                </span>
                <span className={`font-black text-sm ${changeDue >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  Rs. {Math.abs(changeDue).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
              </div>
            )}
          </div>

          {paymentMethod === 'Pending' && !selectedCustomer && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-2.5 rounded-xl flex items-start gap-1.5 text-[10px] font-bold">
              <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <span>{language === 'en' ? 'Customer registration is required for Unpaid (Credit) sales.' : 'ණය (Unpaid) බිලක් සඳහා ගැනුම්කරුවෙකු තෝරාගැනීම අනිවාර්ය වේ.'}</span>
              </div>
            </div>
          )}

          {/* Complete Sale CTA */}
          <button
            id="pos-btn-complete-sale"
            onClick={handleCompleteSale}
            disabled={posCart.length === 0 || (paymentMethod === 'Pending' && !selectedCustomer)}
            className={`w-full py-3 rounded-xl text-sm font-extrabold shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 tracking-wide ${
              (posCart.length === 0 || (paymentMethod === 'Pending' && !selectedCustomer))
                ? 'bg-slate-350 text-slate-500 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/20 hover:shadow-blue-500/30'
            }`}
          >
            <CheckCircle className="h-4.5 w-4.5" />
            <span>
              {paymentMethod === 'Pending' && !selectedCustomer
                ? (language === 'en' ? 'Select Customer to Complete' : 'ගැනුම්කරු තෝරන්න')
                : t.completeSale}
            </span>
          </button>
        </div>
      </div>

      {/* WEIGHT MODAL FOR GROCERIES / VEGETABLES */}
      {weightModalProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm overflow-hidden border border-slate-100 text-slate-800 animate-in fade-in zoom-in duration-200">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-500 text-white p-5 text-center space-y-1 relative">
              <button 
                type="button" 
                onClick={() => setWeightModalProduct(null)} 
                className="absolute top-4 right-4 text-emerald-100 hover:text-white transition animate-in fade-in duration-100"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="inline-flex p-3 rounded-full bg-white/10 backdrop-blur-sm text-emerald-100 mb-1">
                <Scale className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-base font-extrabold tracking-tight">
                {language === 'en' ? 'Weight Measurement' : 'බර මැනීම ලබාදෙන්න'}
              </h3>
              <p className="text-xs text-emerald-100 font-medium">
                {language === 'en' ? weightModalProduct.nameEn : weightModalProduct.nameSi}
              </p>
            </div>

            <form onSubmit={handleConfirmWeight} className="p-6 space-y-5 text-xs font-semibold">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-150 flex justify-between items-center text-slate-700">
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  {language === 'en' ? 'Price Rate' : 'මිල අනුපාතය'}
                </span>
                <span className="text-sm font-extrabold text-emerald-600">
                  Rs. {priceMode === 'Wholesale' ? weightModalProduct.wholesalePrice : weightModalProduct.retailPrice} / kg
                </span>
              </div>

              <div className="space-y-2">
                <label className="text-slate-500 font-bold block">
                  {language === 'en' ? 'Enter Weight:' : 'බර ඇතුළත් කරන්න:'}
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      required
                      autoFocus
                      step="any"
                      min="0.001"
                      value={weightValue}
                      onChange={(e) => setWeightValue(e.target.value)}
                      placeholder={weightUnit === 'kg' ? 'e.g. 1.5' : 'e.g. 500'}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-extrabold text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-center"
                    />
                  </div>
                  <div className="flex bg-slate-150 p-1 rounded-2xl border border-slate-200 space-x-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setWeightUnit('kg');
                        const val = parseFloat(weightValue);
                        if (!isNaN(val) && val > 0 && weightUnit === 'g') {
                          setWeightValue((val / 1000).toString());
                        }
                      }}
                      className={`px-3 py-1 rounded-xl text-xs font-extrabold transition-all duration-200 ${
                        weightUnit === 'kg' 
                          ? 'bg-white text-emerald-600 shadow-sm' 
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      kg
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setWeightUnit('g');
                        const val = parseFloat(weightValue);
                        if (!isNaN(val) && val > 0 && weightUnit === 'kg') {
                          setWeightValue((val * 1000).toString());
                        }
                      }}
                      className={`px-3 py-1 rounded-xl text-xs font-extrabold transition-all duration-200 ${
                        weightUnit === 'g' 
                          ? 'bg-white text-emerald-600 shadow-sm' 
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      g
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wide block">
                  {language === 'en' ? 'Touch Presets' : 'ස්පර්ශක කෙටිමං'}
                </span>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { value: '100', unit: 'g' as const, label: '100g' },
                    { value: '250', unit: 'g' as const, label: '250g' },
                    { value: '500', unit: 'g' as const, label: '500g' },
                    { value: '1', unit: 'kg' as const, label: '1kg' },
                    { value: '1.5', unit: 'kg' as const, label: '1.5kg' },
                    { value: '2', unit: 'kg' as const, label: '2kg' },
                    { value: '5', unit: 'kg' as const, label: '5kg' },
                    { value: '10', unit: 'kg' as const, label: '10kg' }
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setWeightValue(preset.value);
                        setWeightUnit(preset.unit);
                      }}
                      className="py-2 bg-slate-50 hover:bg-slate-100 active:scale-95 transition-all text-xs font-bold text-slate-700 border border-slate-200 rounded-xl"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setWeightModalProduct(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-2.5 rounded-2xl font-bold transition active:scale-95"
                >
                  {language === 'en' ? 'Cancel' : 'අවලංගු කරන්න'}
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-2xl font-bold shadow-lg shadow-emerald-600/15 transition active:scale-95"
                >
                  {language === 'en' ? 'Add to Bill' : 'බිලට එක්කරන්න'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW CUSTOMER MODAL */}
      {isNewCustModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-950 text-white p-4 flex justify-between items-center">
              <h3 className="text-xs font-bold flex items-center">
                <Plus className="h-4 w-4 mr-1 text-blue-400" />
                {t.registerCustomer}
              </h3>
              <button onClick={() => setIsNewCustModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleRegisterCustomer} className="p-5 space-y-3 text-xs font-semibold">
              <div className="space-y-1">
                <label className="font-bold text-slate-500">{t.fullName} *</label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="e.g. Kamal Gunarathne"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-500">{t.phoneNumber} *</label>
                <input
                  type="tel"
                  required
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="e.g. 0712345678"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-500">{t.address}</label>
                <input
                  type="text"
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  placeholder="e.g. Kurunegala"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-medium"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewCustModalOpen(false)}
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

      {/* POS RECEIPT SUCCESS MODAL */}
      {completedSale && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="bg-blue-600 text-white p-4 text-center space-y-0.5">
              <CheckCircle className="h-8 w-8 mx-auto text-white animate-bounce" />
              <h3 className="text-base font-bold">{language === 'en' ? 'POS Sale Completed!' : 'විකුණුම් බිල්පත සාර්ථකයි!'}</h3>
              <p className="text-[10px] text-blue-100">Bill ID: {completedSale.id}</p>
            </div>

            {/* Printable Area */}
            <div className="p-5 space-y-4 max-h-[50vh] overflow-y-auto" id="pos-print-receipt">
              {/* Receipt Header — left shop info, right QR code */}
              <div className="flex gap-3 items-start border-b border-dashed border-slate-200 pb-3">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-extrabold text-slate-900">{settings.shopName || 'SmartShop Pro & Repairs'}</h4>
                  {settings.shopAddress && <p className="text-[9px] text-slate-500 mt-0.5">{settings.shopAddress}</p>}
                  {settings.shopPhone && <p className="text-[9px] text-slate-500">Tel: {settings.shopPhone}</p>}
                  {settings.shopEmail && <p className="text-[9px] text-slate-500">{settings.shopEmail}</p>}
                  <p className="text-[9px] text-slate-400 mt-1">{new Date(completedSale.createdAt).toLocaleString()}</p>
                  <p className="text-[9px] font-bold text-slate-400 mt-0.5">Bill # {completedSale.id}</p>
                </div>
                <div className="shrink-0 flex flex-col items-center">
                  {completedSaleQrUrl ? (
                    <img
                      src={completedSaleQrUrl}
                      alt="QR"
                      className="w-16 h-16 rounded"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  ) : (
                    <div className="w-16 h-16 bg-slate-100 flex items-center justify-center text-[8px] text-slate-400">Generating...</div>
                  )}
                  <span className="text-[7px] text-slate-400 mt-0.5 font-medium">Scan to verify</span>
                </div>
              </div>

              <div className="text-[10px] text-slate-600 space-y-0.5">
                <div><span className="font-semibold">{t.fullName}:</span> {completedSale.customerName || 'Walk-In Customer'}</div>
                {completedSale.cashierName && <div><span className="font-semibold">Cashier:</span> {completedSale.cashierName}</div>}
                <div><span className="font-semibold">{t.payMethod}:</span> {completedSale.paymentMethod === 'Pending' ? '⚠️ CREDIT (Unpaid)' : completedSale.paymentMethod}</div>
              </div>

              {/* Items Table */}
              <div className="border-t border-b border-dashed border-slate-200 py-2 space-y-1.5">
                <div className="grid grid-cols-12 text-[9px] font-bold text-slate-400">
                  <span className="col-span-6">ITEM</span>
                  <span className="col-span-2 text-center">QTY</span>
                  <span className="col-span-4 text-right">PRICE</span>
                </div>
                {completedSale.items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 text-[10px] text-slate-700 font-medium">
                    <span className="col-span-6 truncate">{language === 'en' ? item.productNameEn : item.productNameSi}</span>
                    <span className="col-span-2 text-center">{item.quantity}</span>
                    <span className="col-span-4 text-right">Rs. {(item.price * item.quantity).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-0.5 text-[11px] text-slate-700">
                <div className="flex justify-between">
                  <span>{t.subtotal}:</span>
                  <span>Rs. {completedSale.subtotal.toLocaleString()}</span>
                </div>
                {completedSale.vatTotal > 0 && (
                  <div className="flex justify-between text-blue-600 font-semibold">
                    <span>VAT ({vatRate}%):</span>
                    <span>Rs. {completedSale.vatTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  </div>
                )}
                {completedSale.ssclTotal > 0 && (
                  <div className="flex justify-between text-indigo-600 font-semibold">
                    <span>SSCL ({ssclRate}%):</span>
                    <span>Rs. {completedSale.ssclTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="flex justify-between text-rose-500">
                  <span>{t.discount}:</span>
                  <span>- Rs. {completedSale.discount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-extrabold text-slate-800 text-xs border-t border-slate-100 pt-1">
                  <span>{t.total}:</span>
                  <span>Rs. {completedSale.total.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="text-center text-[9px] text-slate-400 font-bold pt-2">
                Thank You! Come Again.<br />ඔබට ස්තුතියි! නැවත පැමිණෙන්න.
              </div>
            </div>

            {/* Actions */}
            <div className="bg-slate-50 p-3 border-t border-slate-100 flex space-x-2">
              <button
                onClick={() => {
                  const qrUrl = completedSaleQrUrl;
                  const printContent = `
                    <!DOCTYPE html><html><head><title>Receipt - ${completedSale.id}</title>
                    <style>
                      * { margin: 0; padding: 0; box-sizing: border-box; }
                      @media print {
                        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        @page { margin: 0; size: ${settings.receiptWidth || '80mm'} auto; }
                      }
                      body { font-family: 'Courier New', Courier, monospace; font-size: 10px; width: ${settings.receiptWidth === '58mm' ? '52mm' : settings.receiptWidth === 'A4' ? '190mm' : '74mm'}; padding: 4mm; color: #000; }
                      .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px; }
                      .shop-info { flex: 1; text-align: left; }
                      .shop-name { font-size: 12px; font-weight: bold; text-transform: uppercase; margin-bottom: 1px; text-align: left; }
                      .shop-detail { font-size: 8px; color: #333; line-height: 1.6; text-align: left; }
                      .qr-wrap { flex-shrink: 0; text-align: center; margin-left: 6px; }
                      .qr-wrap img { width: 22mm; height: 22mm; display: block; image-rendering: pixelated; }
                      .qr-label { font-size: 6px; color: #666; margin-top: 1px; text-align: center; }
                      .bold { font-weight: bold; }
                      .sep { border-top: 1px dashed #000; margin: 4px 0; }
                      .row { display: flex; justify-content: space-between; margin: 1.5px 0; font-size: 9px; }
                      .item-row { display: flex; margin: 1.5px 0; font-size: 9px; }
                      .item-name { flex: 2; word-break: break-word; }
                      .item-qty { width: 20px; text-align: center; }
                      .item-amt { width: 40px; text-align: right; }
                      .total-row { font-size: 12px; font-weight: bold; border-top: 1px solid #000; padding-top: 3px; margin-top: 3px; display: flex; justify-content: space-between; }
                      .footer { text-align: center; font-size: 8px; color: #333; margin-top: 6px; line-height: 1.4; }
                    </style></head><body>
                    <div class="header">
                      <div class="shop-info">
                        <div class="shop-name">${settings.shopName || 'SmartShop'}</div>
                        ${settings.shopAddress ? `<div class="shop-detail">${settings.shopAddress}</div>` : ''}
                        ${settings.shopPhone ? `<div class="shop-detail">Tel: ${settings.shopPhone}</div>` : ''}
                        ${settings.shopEmail ? `<div class="shop-detail">${settings.shopEmail}</div>` : ''}
                        ${settings.taxRegistrationNo ? `<div class="shop-detail">Tax Reg: ${settings.taxRegistrationNo}</div>` : ''}
                      </div>
                      <div class="qr-wrap">
                        ${qrUrl ? `<img src="${qrUrl}" alt="QR" />` : '<div style="width:22mm;height:22mm;border:1px solid #000;font-size:7px;display:flex;align-items:center;justify-content:center;">QR Code</div>'}
                        <div class="qr-label">Scan to verify</div>
                      </div>
                    </div>
                    <div class="sep"></div>
                    <div class="row"><span>Bill #: <b>${completedSale.id}</b></span><span>${new Date(completedSale.createdAt).toLocaleString('en-LK')}</span></div>
                    <div class="row"><span>Customer: ${completedSale.customerName || 'Walk-In'}</span>${completedSale.cashierName ? `<span>Cashier: ${completedSale.cashierName}</span>` : ''}</div>
                    <div class="row"><span>Payment: <b>${completedSale.paymentMethod === 'Pending' ? '⚠ CREDIT (Unpaid)' : completedSale.paymentMethod}</b></span></div>
                    <div class="sep"></div>
                    <div class="item-row bold"><span class="item-name">Item</span><span class="item-qty">Qty</span><span class="item-amt">Amount</span></div>
                    <div class="sep"></div>
                    ${completedSale.items.map(item => `
                      <div class="item-row"><span class="item-name">${language === 'en' ? item.productNameEn : item.productNameSi}</span>
                      <span class="item-qty">${item.quantity}${item.isWeighted ? 'kg' : ''}</span>
                      <span class="item-amt">Rs.${(item.price * item.quantity).toLocaleString(undefined, {maximumFractionDigits:2})}</span></div>`).join('')}
                    <div class="sep"></div>
                    <div class="row"><span>Subtotal:</span><span>Rs.${completedSale.subtotal.toLocaleString()}</span></div>
                    ${completedSale.vatTotal > 0 ? `<div class="row"><span>VAT (${vatRate}%):</span><span>Rs.${completedSale.vatTotal.toLocaleString(undefined,{maximumFractionDigits:2})}</span></div>` : ''}
                    ${completedSale.ssclTotal > 0 ? `<div class="row"><span>SSCL (${ssclRate}%):</span><span>Rs.${completedSale.ssclTotal.toLocaleString(undefined,{maximumFractionDigits:2})}</span></div>` : ''}
                    ${completedSale.discount > 0 ? `<div class="row"><span>Discount:</span><span>-Rs.${completedSale.discount.toLocaleString()}</span></div>` : ''}
                    <div class="total-row"><span>TOTAL:</span><span>Rs.${completedSale.total.toLocaleString(undefined,{maximumFractionDigits:2})}</span></div>
                    <div class="sep"></div>
                    <div class="footer">${settings.receiptFooterMessage ? settings.receiptFooterMessage.replace(/\n/g, '<br/>') : 'Thank You! Come Again.<br/>ඔබට ස්තුතියි! නැවත පැමිණෙන්න.'}</div>
                    </body></html>`;
                  const w = window.open('', '_blank', 'width=420,height=680');
                  if (w) { w.document.write(printContent); w.document.close(); w.focus(); setTimeout(() => w.print(), 600); }
                }}
                className="flex-1 bg-slate-800 hover:bg-slate-900 text-white py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>{t.printReceipt}</span>
              </button>
              <button
                onClick={() => setCompletedSale(null)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl text-xs font-bold transition"
              >
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Z-REPORT / CLOSE REGISTER MODAL */}
      {isClosingModalOpen && activeShift && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-slate-100 text-slate-800">
            <div className="bg-slate-950 text-white p-4 text-center space-y-0.5">
              <h3 className="text-sm font-bold flex items-center justify-center">
                <Clock className="h-4 w-4 mr-1.5 text-rose-400" />
                {language === 'en' ? 'Close Register & Z-Report' : 'ලේඛනය වසා Z-වාර්තාව මුද්‍රණය'}
              </h3>
              <p className="text-[10px] text-slate-400">Shift ID: {activeShift.id}</p>
            </div>

            <div className="p-5 space-y-4 text-xs font-semibold text-slate-750" id="z-report-print">
              <div className="text-center border-b border-dashed border-slate-200 pb-2">
                <h4 className="text-xs font-extrabold text-slate-850">{settings.shopName}</h4>
                <p className="text-[9px] text-slate-450">{settings.shopAddress} • {settings.shopPhone}</p>
                <p className="text-[10px] text-slate-850 font-extrabold mt-2 uppercase tracking-wide">*** Z-REPORT (DAY-END) ***</p>
                <p className="text-[9px] text-slate-450 font-medium">Opened At: {new Date(activeShift.openedAt).toLocaleString()}</p>
                <p className="text-[9px] text-slate-450 font-medium">Closed At: {new Date().toLocaleString()}</p>
              </div>

              <div className="space-y-1.5 py-1 text-slate-700">
                <div className="flex justify-between">
                  <span>Cashier Name:</span>
                  <span className="font-bold text-slate-800">{activeShift.cashierName}</span>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-1.5">
                  <span>Opening Float:</span>
                  <span className="font-bold">Rs. {activeShift.floatCash.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cash Sales (+):</span>
                  <span className="font-bold">Rs. {activeShift.cashSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Card Sales:</span>
                  <span className="font-bold">Rs. {activeShift.cardSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Online Transfers (QR):</span>
                  <span className="font-bold">Rs. {activeShift.transferSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-slate-900 border-t border-dashed border-slate-200 pt-1.5">
                  <span>Expected Cash in Drawer:</span>
                  <span className="font-extrabold">Rs. {activeShift.expectedCash.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <label className="font-bold text-slate-500">{language === 'en' ? 'Actual Cash in Drawer:' : 'ලාච්චුවේ ඇති සැබෑ මුදල:'}</label>
                <input
                  type="number"
                  value={actualCashInDrawer}
                  onChange={(e) => setActualCashInDrawer(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-extrabold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              {(() => {
                const discrepancy = actualCashInDrawer - activeShift.expectedCash;
                return (
                  <div className={`p-2.5 rounded-lg text-center font-bold text-xs flex justify-between items-center ${
                    discrepancy === 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                    discrepancy < 0 ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                    'bg-blue-50 text-blue-700 border border-blue-100'
                  }`}>
                    <span>Discrepancy:</span>
                    <span>
                      {discrepancy === 0 ? 'Balanced (Rs. 0)' :
                       discrepancy < 0 ? `Shortage (-Rs. ${Math.abs(discrepancy).toLocaleString()})` :
                       `Excess (+Rs. ${discrepancy.toLocaleString()})`}
                    </span>
                  </div>
                );
              })()}
            </div>

            <div className="bg-slate-50 p-3 border-t border-slate-100 flex space-x-2">
              <button
                type="button"
                onClick={() => {
                  const printContents = document.getElementById('z-report-print')?.innerHTML;
                  const originalContents = document.body.innerHTML;
                  if (printContents) {
                    document.body.innerHTML = printContents;
                    window.print();
                    document.body.innerHTML = originalContents;
                    window.location.reload();
                  }
                }}
                className="flex-1 bg-slate-800 hover:bg-slate-900 text-white py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print Z-Report</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onCloseShift(actualCashInDrawer);
                  setLastClosedShift({
                    ...activeShift,
                    actualCash: actualCashInDrawer,
                    status: 'Closed',
                    closedAt: new Date().toISOString()
                  });
                  setIsClosingModalOpen(false);
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl text-xs font-bold shadow-md transition"
              >
                {language === 'en' ? 'Close Shift' : 'මාරුව අවසන් කරන්න'}
              </button>
              <button
                type="button"
                onClick={() => setIsClosingModalOpen(false)}
                className="px-3 bg-slate-200 hover:bg-slate-300 text-slate-600 py-2 rounded-xl text-xs font-bold transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK ADD PRODUCT MODAL */}
      {isQuickAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-100 text-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="bg-blue-600/20 p-1.5 rounded-lg border border-blue-500/30 text-blue-400">
                  <Plus className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">
                    {language === 'en' ? 'Quick Add Product' : 'නව භාණ්ඩයක් ඇතුළත් කරන්න'}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {language === 'en' ? 'Instantly save to inventory & add to active bill' : 'තොග ලේඛනයට ඇතුලත් කර බිල්පතට එක් කරන්න'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsQuickAddModalOpen(false);
                  resetQuickAddFields();
                }} 
                className="text-slate-400 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleQuickAddSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Product ID */}
                <div className="space-y-1 text-xs">
                  <label className="font-bold text-slate-500">{language === 'en' ? 'Product ID / Barcode *' : 'භාණ්ඩයේ අංකය / බාකෝඩ් *'}</label>
                  <input
                    type="text"
                    required
                    value={quickAddId}
                    onChange={(e) => setQuickAddId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                </div>

                {/* Category Selector */}
                <div className="space-y-1 text-xs">
                  <label className="font-bold text-slate-500">{language === 'en' ? 'Category *' : 'වර්ගීකරණය *'}</label>
                  <select
                    required
                    value={quickAddCategory}
                    onChange={(e) => setQuickAddCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>
                        {(t as any)[cat] || cat}
                      </option>
                    ))}
                    <option value="new">+ {language === 'en' ? 'New Category...' : 'නව වර්ගීකරණයක්...'}</option>
                  </select>
                </div>
              </div>

              {/* Custom Category Input if "new" is selected */}
              {quickAddCategory === 'new' && (
                <div className="space-y-1 text-xs animate-in slide-in-from-top-2 duration-100">
                  <label className="font-bold text-slate-500">{language === 'en' ? 'New Category Name *' : 'නව වර්ගීකරණයේ නම *'}</label>
                  <input
                    type="text"
                    required
                    placeholder={language === 'en' ? 'Enter category name' : 'වර්ගීකරණයේ නම ඇතුළත් කරන්න'}
                    value={quickAddCustomCategory}
                    onChange={(e) => setQuickAddCustomCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                </div>
              )}

              {/* English Name */}
              <div className="space-y-1 text-xs">
                <label className="font-bold text-slate-500">{language === 'en' ? 'Product Name (English) *' : 'භාණ්ඩයේ නම (ඉංග්‍රීසි) *'}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kingston DDR4 8GB RAM"
                  value={quickAddNameEn}
                  onChange={(e) => setQuickAddNameEn(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                />
              </div>

              {/* Sinhala Name */}
              <div className="space-y-1 text-xs">
                <label className="font-bold text-slate-500">{language === 'en' ? 'Product Name (Sinhala) - Optional' : 'භාණ්ඩයේ නම (සිංහල) - අත්‍යවශ්‍ය නොවේ'}</label>
                <input
                  type="text"
                  placeholder="e.g. කිංග්ස්ටන් රැම් එක"
                  value={quickAddNameSi}
                  onChange={(e) => setQuickAddNameSi(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                />
              </div>

              {/* Cost & Prices Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1 text-xs">
                  <label className="font-bold text-slate-500">{language === 'en' ? 'Cost Price (Rs.) *' : 'මිලදී ගත් මිල (Rs.) *'}</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={quickAddCostPrice === 0 ? '' : quickAddCostPrice}
                    onChange={(e) => setQuickAddCostPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                </div>
                <div className="space-y-1 text-xs">
                  <label className="font-bold text-slate-500">{language === 'en' ? 'Retail Price (Rs.) *' : 'சில்ලර මිල (Rs.) *'}</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={quickAddRetailPrice === 0 ? '' : quickAddRetailPrice}
                    onChange={(e) => setQuickAddRetailPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                </div>
                <div className="space-y-1 text-xs">
                  <label className="font-bold text-slate-500">{language === 'en' ? 'Wholesale Price (Rs.)' : 'තොග මිල (Rs.)'}</label>
                  <input
                    type="number"
                    min="0"
                    value={quickAddWholesalePrice === 0 ? '' : quickAddWholesalePrice}
                    onChange={(e) => setQuickAddWholesalePrice(Number(e.target.value))}
                    placeholder={String(quickAddRetailPrice)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                </div>
              </div>

              {/* Stock and Type Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between items-center">
                    <label className="font-bold text-slate-500">{language === 'en' ? 'Initial Stock *' : 'ආරම්භක තොගය *'}</label>
                    <label className="flex items-center space-x-1 cursor-pointer font-bold text-blue-600 select-none">
                      <input
                        type="checkbox"
                        checked={quickAddStockIsUnlimited}
                        onChange={(e) => setQuickAddStockIsUnlimited(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span>{language === 'en' ? 'Unlimited' : 'අසීමිත'}</span>
                    </label>
                  </div>
                  <input
                    type="number"
                    required={!quickAddStockIsUnlimited}
                    disabled={quickAddStockIsUnlimited}
                    min="0"
                    value={quickAddStockIsUnlimited ? '' : quickAddStock}
                    onChange={(e) => setQuickAddStock(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold disabled:bg-slate-50 disabled:text-slate-400"
                  />
                </div>

                <div className="space-y-1 text-xs">
                  <label className="font-bold text-slate-500">{language === 'en' ? 'Source *' : 'භාණ්ඩයේ ප්‍රභවය *'}</label>
                  <select
                    required
                    value={quickAddSource}
                    onChange={(e) => setQuickAddSource(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  >
                    <option value="Supplier Purchased">{language === 'en' ? 'Supplier Purchased' : 'සැපයුම්කරුගෙන් මිලදී ගත්'}</option>
                    <option value="Self-Manufactured">{language === 'en' ? 'Self-Manufactured' : 'ස්වයං නිෂ්පාදිත'}</option>
                    <option value="Service (Unlimited)">{language === 'en' ? 'Service / Unlimited' : 'සේවා / අසීමිත'}</option>
                  </select>
                </div>
              </div>

              {/* Brand and Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 text-xs">
                  <label className="font-bold text-slate-500">{language === 'en' ? 'Brand / Manufacturer' : 'වෙළඳ නාමය'}</label>
                  <input
                    type="text"
                    value={quickAddBrand}
                    onChange={(e) => setQuickAddBrand(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                </div>

                <div className="space-y-1 text-xs">
                  <label className="font-bold text-slate-500">{language === 'en' ? 'Rack / Storage Location' : 'තබා ඇති රාක්කය / ස්ථානය'}</label>
                  <input
                    type="text"
                    value={quickAddRack}
                    onChange={(e) => setQuickAddRack(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                </div>
              </div>

              {/* Flags Row */}
              <div className="flex flex-wrap gap-4 pt-2 border-t border-slate-100">
                <label className="flex items-center space-x-2 text-xs font-bold text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={quickAddWeighted}
                    onChange={(e) => setQuickAddWeighted(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <span>{language === 'en' ? 'Sold by Weight (e.g. kg)' : 'බර අනුව විකුණන (උදා: kg)'}</span>
                </label>

                <label className="flex items-center space-x-2 text-xs font-bold text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={quickAddTaxable}
                    onChange={(e) => setQuickAddTaxable(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <span>{language === 'en' ? 'Subject to VAT & SSCL' : 'VAT සහ SSCL බදු අදාළ වේ'}</span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-600/10 active:scale-95 flex items-center justify-center space-x-1.5"
                >
                  <Plus className="h-4 w-4" />
                  <span>{language === 'en' ? 'Save & Add to Bill' : 'සුරක්ෂිත කර බිලට එක් කරන්න'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsQuickAddModalOpen(false);
                    resetQuickAddFields();
                  }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition"
                >
                  {language === 'en' ? 'Cancel' : 'අවලංගු කරන්න'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
