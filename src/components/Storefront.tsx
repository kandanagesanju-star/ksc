import React, { useState, useMemo, useEffect } from 'react';
import { Product, Category, Customer, RepairJob, Sale, SaleItem, ShopSettings, Review } from '../types';
import { translations } from '../lib/translations';
import { 
  Search, ShoppingCart, CheckCircle, Clock, 
  Wrench, Trash2, User, Phone, MapPin, CreditCard, X, Printer, ArrowRight, Languages,
  Store, Smartphone, Cpu, Lightbulb, ShoppingBag, Gift, Tag, Truck, RotateCcw, ShieldCheck, Coffee, UtensilsCrossed, SmartphoneCharging
} from 'lucide-react';

const isOutOfStock = (stock: number | 'Unlimited' | string | undefined | null) => {
  if (stock === 'Unlimited') return false;
  if (stock === undefined || stock === null) return false;
  const num = typeof stock === 'string' ? parseFloat(stock) : Number(stock);
  return isNaN(num) || num <= 0;
};

interface StorefrontProps {
  language: 'en' | 'si';
  products: Product[];
  customers: Customer[];
  repairs: RepairJob[];
  sales: Sale[];
  onAddSale: (sale: Sale) => void;
  onAddCustomer: (customer: Customer) => Customer;
  updateProductStock: (productId: string, quantitySold: number) => void;
  settings: ShopSettings;
  categories: string[];
  setLanguage: (lang: 'en' | 'si') => void;
  loggedInCustomer: any;
  showCustomerPortal: boolean;
  setShowCustomerPortal: (show: boolean) => void;
}

interface CartItem {
  product: Product;
  quantity: number;
}

export const Storefront: React.FC<StorefrontProps> = ({
  language,
  products,
  customers,
  repairs,
  sales,
  onAddSale,
  onAddCustomer,
  updateProductStock,
  settings,
  categories,
  setLanguage,
  loggedInCustomer,
  showCustomerPortal,
  setShowCustomerPortal
}) => {
  const t = translations[language];

  // Dynamic theme mapping system based on selected Primary Theme Accent Color
  const theme = useMemo(() => {
    const color = settings.onlinePrimaryThemeColor || 'bg-blue-600';
    switch (color) {
      case 'bg-emerald-600':
        return {
          bg: 'bg-emerald-600',
          hoverBg: 'hover:bg-emerald-700',
          activeBg: 'active:bg-emerald-800',
          text: 'text-emerald-600',
          hoverText: 'hover:text-emerald-700',
          border: 'border-emerald-600',
          hoverBorder: 'hover:border-emerald-500',
          focusRing: 'focus:ring-emerald-500',
          lightBg: 'bg-emerald-50',
          hoverLightBg: 'hover:bg-emerald-100',
          lightBorder: 'border-emerald-100',
          lightText: 'text-emerald-800',
          gradientFrom: 'from-emerald-600',
          gradientTo: 'to-teal-600',
          shadow: 'shadow-emerald-200',
          shadowHover: 'hover:shadow-emerald-200',
          accentText: 'text-emerald-300',
          accentBg: 'bg-emerald-500',
          accentBorder: 'border-emerald-500/30'
        };
      case 'bg-purple-600':
        return {
          bg: 'bg-purple-600',
          hoverBg: 'hover:bg-purple-700',
          activeBg: 'active:bg-purple-800',
          text: 'text-purple-600',
          hoverText: 'hover:text-purple-700',
          border: 'border-purple-600',
          hoverBorder: 'hover:border-purple-500',
          focusRing: 'focus:ring-purple-500',
          lightBg: 'bg-purple-50',
          hoverLightBg: 'hover:bg-purple-100',
          lightBorder: 'border-purple-100',
          lightText: 'text-purple-800',
          gradientFrom: 'from-purple-600',
          gradientTo: 'to-fuchsia-600',
          shadow: 'shadow-purple-200',
          shadowHover: 'hover:shadow-purple-200',
          accentText: 'text-purple-300',
          accentBg: 'bg-purple-500',
          accentBorder: 'border-purple-500/30'
        };
      case 'bg-indigo-600':
        return {
          bg: 'bg-indigo-600',
          hoverBg: 'hover:bg-indigo-700',
          activeBg: 'active:bg-indigo-800',
          text: 'text-indigo-600',
          hoverText: 'hover:text-indigo-700',
          border: 'border-indigo-600',
          hoverBorder: 'hover:border-indigo-500',
          focusRing: 'focus:ring-indigo-500',
          lightBg: 'bg-indigo-50',
          hoverLightBg: 'hover:bg-indigo-100',
          lightBorder: 'border-indigo-100',
          lightText: 'text-indigo-800',
          gradientFrom: 'from-indigo-600',
          gradientTo: 'to-violet-600',
          shadow: 'shadow-indigo-200',
          shadowHover: 'hover:shadow-indigo-200',
          accentText: 'text-indigo-300',
          accentBg: 'bg-indigo-500',
          accentBorder: 'border-indigo-500/30'
        };
      case 'bg-blue-600':
      default:
        return {
          bg: 'bg-blue-600',
          hoverBg: 'hover:bg-blue-700',
          activeBg: 'active:bg-blue-800',
          text: 'text-blue-600',
          hoverText: 'hover:text-blue-700',
          border: 'border-blue-600',
          hoverBorder: 'hover:border-blue-500',
          focusRing: 'focus:ring-blue-500',
          lightBg: 'bg-blue-50',
          hoverLightBg: 'hover:bg-blue-100',
          lightBorder: 'border-blue-100',
          lightText: 'text-blue-800',
          gradientFrom: 'from-blue-600',
          gradientTo: 'to-indigo-600',
          shadow: 'shadow-blue-200',
          shadowHover: 'hover:shadow-blue-200',
          accentText: 'text-blue-300',
          accentBg: 'bg-blue-500',
          accentBorder: 'border-blue-500/30'
        };
    }
  }, [settings.onlinePrimaryThemeColor]);

  const isHeaderDark = settings.onlineHeaderBgColor !== 'bg-white' && settings.onlineHeaderBgColor !== undefined;

  // Storefront navigation
  const [activeTab, setActiveTab] = useState<'shop' | 'tracker'>('shop');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Repair tracking search state
  const [trackerQuery, setTrackerQuery] = useState('');
  const [trackedRepairs, setTrackedRepairs] = useState<RepairJob[] | null>(null);
  const [hasSearchedTracker, setHasSearchedTracker] = useState(false);

  // PDP (Product Detail Page) state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const modalScrollRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll PDP modal to top when active product changes
  useEffect(() => {
    if (modalScrollRef.current) {
      modalScrollRef.current.scrollTop = 0;
    }
  }, [selectedProduct]);

  const relatedProducts = useMemo(() => {
    if (!selectedProduct) return [];
    return products
      .filter(p => p.category === selectedProduct.category && p.id !== selectedProduct.id && !p.isHiddenOnline)
      .slice(0, 4);
  }, [products, selectedProduct]);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Checkout form state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'Online Transfer'>('Cash');

  // Receipt modal state
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery]);

  // Reviews state loaded from localStorage, pre-populated if empty
  const [reviews, setReviews] = useState<Review[]>(() => {
    const saved = localStorage.getItem('store_reviews');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    
    // Seed default reviews for all products
    const initialReviews: Review[] = [];
    const names = ['Chamara', 'Saman', 'Dilshan', 'Nimal', 'Priyantha', 'Roshan', 'Kavindu', 'Nilani', 'Dilki', 'Asanka', 'Chathura', 'Kasun', 'Ruwan', 'Gayan', 'Thilina', 'Priya', 'Menaka', 'Sandeep', 'Sanduni', 'Harsha'];
    const commentsEn = [
      'Excellent quality, highly recommended!',
      'Great product for the price. Works perfectly.',
      'Very satisfied with the purchase.',
      'Original product, very durable.',
      'Fast delivery and good packaging.',
      'Superb customer service and great build quality.',
      'Worth every rupee. Will buy again!'
    ];
    const commentsSi = [
      'ඉතාමත් ගුණාත්මක නිෂ්පාදනයක්. ස්තූතියි!',
      'මිලට සරිලන හොඳම භාණ්ඩයක්.',
      'නියමයි, ඉක්මනින්ම ලැබුණා.',
      'පාවිච්චි කරන්න ලේසියි. ගොඩක් වටිනවා.',
      'හොඳ සේවාවක්. ඉක්මන් බෙදාහැරීමක්.',
      'සුපිරිම භාණ්ඩයක්. හැමෝටම ගන්න කියනවා.'
    ];

    products.forEach(p => {
      // Create a deterministic seed based on product ID characters
      const seed = p.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const reviewCount = (seed % 8) + 4; // 4 to 11 reviews per product
      
      for (let i = 0; i < reviewCount; i++) {
        const rating = (seed + i) % 5 === 0 ? 4 : 5; // Mostly 4 and 5 stars
        const isSi = (seed + i) % 2 === 0;
        const comment = isSi ? commentsSi[(seed + i) % commentsSi.length] : commentsEn[(seed + i) % commentsEn.length];
        const name = names[(seed + i) % names.length];
        const phone = `07${Math.floor(10000000 + (seed * i * 3) % 90000000)}`;
        
        initialReviews.push({
          id: `REV-${p.id}-${i}`,
          productId: p.id,
          customerName: name,
          customerPhone: phone,
          rating,
          comment,
          isVerified: true,
          createdAt: new Date(Date.now() - ((i + 1) * 24 * 3600 * 1000)).toISOString()
        });
      }
    });

    localStorage.setItem('store_reviews', JSON.stringify(initialReviews));
    return initialReviews;
  });

  // Write a Review form states
  const [reviewName, setReviewName] = useState('');
  const [reviewPhone, setReviewPhone] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [isWriteReviewOpen, setIsWriteReviewOpen] = useState(false);

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError('');
    setReviewSuccess('');

    if (!selectedProduct) return;

    if (!reviewName.trim() || !reviewPhone.trim() || !reviewComment.trim()) {
      setReviewError(language === 'en' ? 'All fields are required!' : 'සියලුම ක්ෂේත්‍ර ඇතුළත් කිරීම අනිවාර්ය වේ!');
      return;
    }

    // Verify buyer check:
    // Find customer by phone number
    const customerObj = customers.find(c => c.phone.trim() === reviewPhone.trim());
    const hasPurchased = customerObj && sales.some(sale => 
      sale.customerId === customerObj.id &&
      sale.items.some(item => item.productId === selectedProduct.id)
    );

    if (!hasPurchased) {
      setReviewError(
        language === 'en' 
          ? 'Only verified buyers who purchased this item can leave a review.' 
          : 'මෙම භාණ්ඩය මිලදී ගත් පාරිභෝගිකයින්ට පමණක් විචාර (Reviews) එකතු කළ හැක. (ඔබ ඇණවුම සඳහා යෙදූ දුරකථන අංකයම භාවිත කරන්න)'
      );
      return;
    }

    // Create review
    const newReview: Review = {
      id: `REV-${selectedProduct.id}-${Date.now()}`,
      productId: selectedProduct.id,
      customerName: reviewName.trim(),
      customerPhone: reviewPhone.trim(),
      rating: reviewRating,
      comment: reviewComment.trim(),
      isVerified: true,
      createdAt: new Date().toISOString()
    };

    const updatedReviews = [newReview, ...reviews];
    setReviews(updatedReviews);
    localStorage.setItem('store_reviews', JSON.stringify(updatedReviews));

    setReviewName('');
    setReviewPhone('');
    setReviewRating(5);
    setReviewComment('');
    setIsWriteReviewOpen(false);
    setReviewSuccess(language === 'en' ? 'Thank you! Your review has been submitted.' : 'ස්තූතියි! ඔබගේ ප්‍රතිචාරය සාර්ථකව එක් කරන ලදී.');
  };


  // Hero Banner Carousel state
  const bannerUrls: string[] = (
    settings.heroBannerUrls && settings.heroBannerUrls.length > 0
      ? settings.heroBannerUrls
      : [settings.onlineHeroBannerUrl || '/hero-banner.png']
  );
  const [currentBanner, setCurrentBanner] = useState(0);
  const [bannerTransition, setBannerTransition] = useState(true);

  // Auto-advance carousel every 4 seconds
  useEffect(() => {
    if (bannerUrls.length <= 1) return;
    const timer = setInterval(() => {
      setBannerTransition(false);
      setTimeout(() => {
        setCurrentBanner(prev => (prev + 1) % bannerUrls.length);
        setBannerTransition(true);
      }, 80);
    }, 4000);
    return () => clearInterval(timer);
  }, [bannerUrls.length]);

  const goBanner = (idx: number) => {
    setBannerTransition(false);
    setTimeout(() => { setCurrentBanner(idx); setBannerTransition(true); }, 80);
  };
  const prevBanner = () => goBanner((currentBanner - 1 + bannerUrls.length) % bannerUrls.length);
  const nextBanner = () => goBanner((currentBanner + 1) % bannerUrls.length);

  const filteredProducts = useMemo(() => {
    const list = products.filter(product => {
      if (product.isHiddenOnline) return false;
      const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
      const matchesSearch =
        product.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.nameSi.includes(searchQuery) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });

    // In Stock (Unlimited or stock > 0) first, Out of Stock last
    return [...list].sort((a, b) => {
      const aOut = isOutOfStock(a.stock);
      const bOut = isOutOfStock(b.stock);
      if (aOut && !bOut) return 1;
      if (!aOut && bOut) return -1;
      return 0;
    });
  }, [products, selectedCategory, searchQuery]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPage]);

  // Cart calculation helpers with taxes
  const cartTotals = useMemo(() => {
    let subtotal = 0;
    let totalCost = 0;
    let discount = 0;
    let totalTax = 0;
    let vatTotal = 0;
    let ssclTotal = 0;

    const items: SaleItem[] = cart.map(item => {
      const p = item.product;
      const price = p.retailPrice;
      const itemSubtotal = price * item.quantity;

      let itemTax = 0;
      let itemVat = 0;
      let itemSscl = 0;

      if (p.isTaxable) {
        itemSscl = itemSubtotal * (settings.ssclRate / 100);
        itemVat = (itemSubtotal + itemSscl) * (settings.vatRate / 100);
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
        priceType: 'Retail',
        price,
        quantity: item.quantity,
        cost: p.costPrice,
        isWeighted: p.isWeighted,
        isTaxable: p.isTaxable,
        taxAmount: itemTax,
        vatAmount: itemVat,
        ssclAmount: itemSscl
      };
    });

    const total = subtotal + totalTax - discount;
    const profit = total - totalCost - totalTax;

    return { items, subtotal, totalTax, vatTotal, ssclTotal, total, totalCost, profit };
  }, [cart, settings.ssclRate, settings.vatRate]);

  // Add to cart
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (product.stock !== 'Unlimited' && existing.quantity >= product.stock) {
          alert(language === 'en' ? 'Cannot add more. Out of stock!' : 'වැඩිපුර එකතු කළ නොහැක. තොග අවසන් වී ඇත!');
          return prev;
        }
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + (product.isWeighted ? 0.25 : 1) }
            : item
        );
      } else {
        if (product.stock !== 'Unlimited' && product.stock <= 0) {
          alert(language === 'en' ? 'Item is out of stock!' : 'මෙම භාණ්ඩය තොග අවසන් වී ඇත!');
          return prev;
        }
        return [...prev, { product, quantity: product.isWeighted ? 0.25 : 1 }];
      }
    });
    setIsCartOpen(true); // Automatically slide open cart drawer for immediate visibility
  };

  // Update cart item quantity
  const updateCartQty = (productId: string, delta: number) => {
    setCart(prev =>
      prev.map(item => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          if (item.product.stock !== 'Unlimited' && newQty > item.product.stock) {
            alert(language === 'en' ? 'Requested quantity exceeds available stock!' : 'අවශ්‍ය ප්‍රමාණය පවතින තොගයට වඩා වැඩිය!');
            return item;
          }
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(Boolean) as CartItem[]
    );
  };

  // Remove from cart
  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  // Track Repair Search
  const handleTrackRepair = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackerQuery.trim()) return;
    const query = trackerQuery.trim().toLowerCase();
    const results = repairs.filter(r =>
      r.id.toLowerCase() === query || r.customerPhone.includes(query)
    );
    setTrackedRepairs(results);
    setHasSearchedTracker(true);
  };

  // Handle Checkout Submit
  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      alert(language === 'en' ? 'Name and Phone Number are required!' : 'නම සහ දුරකථන අංකය ඇතුළත් කිරීම අනිවාර්ය වේ!');
      return;
    }
    for (const item of cart) {
      const p = item.product;
      if (p.stock !== 'Unlimited' && p.stock < item.quantity) {
        alert(language === 'en'
          ? `Stock error: ${p.nameEn} only has ${p.stock} units left.`
          : `තොග දෝෂයකි: ${p.nameSi} සඳහා ඉතිරිව ඇත්තේ ඒකක ${p.stock} ක් පමණි.`);
        return;
      }
    }
    let customer = customers.find(c => c.phone === customerPhone.trim());
    if (!customer) {
      customer = onAddCustomer({
        id: `CUST-${Date.now()}`,
        name: customerName.trim(),
        phone: customerPhone.trim(),
        email: customerEmail.trim() || undefined,
        address: customerAddress.trim() || undefined,
        loyaltyPoints: 0,
        createdAt: new Date().toISOString()
      });
    }
    const saleId = `S-ON-${Math.floor(1000 + Math.random() * 9000)}`;
    const newSale: Sale = {
      id: saleId,
      customerId: customer.id,
      customerName: customer.name,
      saleType: 'Online',
      priceType: 'Retail',
      items: cartTotals.items,
      subtotal: cartTotals.subtotal,
      discount: 0,
      total: cartTotals.total,
      totalCost: cartTotals.totalCost,
      profit: cartTotals.profit,
      totalTax: cartTotals.totalTax,
      vatTotal: cartTotals.vatTotal,
      ssclTotal: cartTotals.ssclTotal,
      paymentMethod,
      loyaltyPointsEarned: Math.floor(cartTotals.total / (settings.loyaltyPointValue || 1000)),
      createdAt: new Date().toISOString()
    };
    cart.forEach(item => {
      if (item.product.stock !== 'Unlimited') {
        updateProductStock(item.product.id, item.quantity);
      }
    });
    onAddSale(newSale);
    setCompletedSale(newSale);
    setCart([]);
    setIsCheckoutOpen(false);
    setIsCartOpen(false);
  };

  // Status badge helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center w-fit"><Clock className="h-3 w-3 mr-1" /> {t.statusPending}</span>;
      case 'In Progress':
        return <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center w-fit"><Wrench className="h-3 w-3 mr-1" /> {t.statusProgress}</span>;
      case 'Ready for Pickup':
        return <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center w-fit"><CheckCircle className="h-3 w-3 mr-1" /> {t.statusReady}</span>;
      case 'Delivered':
        return <span className="bg-slate-100 text-slate-800 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center w-fit"><CheckCircle className="h-3 w-3 mr-1" /> {t.statusDelivered}</span>;
      default:
        return <span className="bg-rose-100 text-rose-800 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center w-fit"><X className="h-3 w-3 mr-1" /> {t.statusCancelled}</span>;
    }
  };

  // ── Derived shelves ──────────────────────────────────────────────────────────
  const visibleProducts = useMemo(() =>
    products.filter(p => !p.isHiddenOnline),
  [products]);

  const hotDeals = useMemo(() =>
    visibleProducts.filter((p, idx) => p.stock !== 'Unlimited' && !isOutOfStock(p.stock) && idx % 2 === 0).slice(0, 6),
  [visibleProducts]);

  const featuredProducts = useMemo(() =>
    visibleProducts.filter((p, idx) => p.stock !== 'Unlimited' && !isOutOfStock(p.stock) && idx % 2 !== 0).slice(0, 6),
  [visibleProducts]);

  const newArrivals = useMemo(() => {
    return [...visibleProducts].sort((a, b) => {
      const aOut = isOutOfStock(a.stock);
      const bOut = isOutOfStock(b.stock);
      if (aOut && !bOut) return 1;
      if (!aOut && bOut) return -1;
      return b.id.localeCompare(a.id);
    }).slice(0, 6);
  }, [visibleProducts]);

  const getCategoryIcon = (categoryName: string, className = "h-5 w-5") => {
    switch (categoryName) {
      case 'All':
        return <Store className={className} />;
      case 'Phone Accessories':
        return <Smartphone className={className} />;
      case 'Computer Parts':
        return <Cpu className={className} />;
      case 'Electric Items':
        return <Lightbulb className={className} />;
      case 'Grocery Items':
        return <ShoppingBag className={className} />;
      case 'Gift Items':
        return <Gift className={className} />;
      case 'Reload & Cards':
      case 'Phone Cards & Reload':
        return <SmartphoneCharging className={className} />;
      case 'Services / Repairs':
      case 'Services':
        return <Wrench className={className} />;
      case 'Drink Items':
        return <Coffee className={className} />;
      case 'Food Items':
        return <UtensilsCrossed className={className} />;
      default:
        return <Tag className={className} />;
    }
  };

  const renderStars = (rating: number) => (
    <div className="flex items-center space-x-0.5">
      {[1,2,3,4,5].map(s => (
        <span key={s} className={s <= rating ? 'text-amber-400' : 'text-slate-300'} style={{fontSize:'10px'}}>★</span>
      ))}
    </div>
  );

  const ProductCard = ({ product, badge }: { product: Product; badge?: string }) => {
    const fakeOriginal = Math.round(product.retailPrice * 1.18);
    const discount = Math.round(((fakeOriginal - product.retailPrice) / fakeOriginal) * 100);
    const outOfStock = isOutOfStock(product.stock);
    const productReviews = reviews.filter(r => r.productId === product.id);
    const reviewCount = productReviews.length;
    const ratingVal = reviewCount > 0 
      ? Math.round(productReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount)
      : (((product.id.charCodeAt(3) || 4) % 2 === 0) ? 4 : 5);
    return (
      <div 
        onClick={() => setSelectedProduct(product)}
        className="group bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl hover:shadow-slate-150/30 hover:-translate-y-1.5 transition-all duration-300 flex flex-col h-full cursor-pointer"
      >
        <div className="relative h-40 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.nameEn} className="object-cover h-full w-full group-hover:scale-105 transition-all duration-500" />
          ) : (
            <div className="text-slate-450 group-hover:scale-110 transition duration-300">
              {getCategoryIcon(product.category, "h-12 w-12")}
            </div>
          )}
          {badge && (
            <span className="absolute top-3 left-3 bg-rose-500 text-white text-[9px] font-black tracking-wider uppercase px-2.5 py-0.5 rounded-full shadow-md z-10">{badge}</span>
          )}
          {!badge && discount > 5 && (
            <span className="absolute top-3 left-3 bg-rose-500 text-white text-[9px] font-black tracking-wider uppercase px-2.5 py-0.5 rounded-full shadow-md z-10">-{discount}%</span>
          )}
          {outOfStock && (
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[1px] flex items-center justify-center z-10">
              <span className="bg-slate-950/90 text-white text-[10px] font-black tracking-wider uppercase px-3 py-1.5 rounded-full shadow-lg border border-white/10">SOLD OUT</span>
            </div>
          )}
        </div>
        <div className="p-4 flex flex-col flex-1 justify-between space-y-3">
          <div>
            <span className="text-[9px] font-black tracking-wider uppercase text-slate-400 block mb-1">
              {(translations[language] as any)[product.category] || product.category}
            </span>
            <h3 className="text-xs font-extrabold text-slate-800 line-clamp-2 leading-snug mb-1.5 group-hover:text-slate-955 transition-colors">
              {language === 'si' ? (product.nameSi || product.nameEn) : product.nameEn}
            </h3>
            <div className="flex items-center justify-between mt-1 text-[9px] font-extrabold uppercase tracking-wide">
              <div className="flex items-center space-x-1">
                {renderStars(ratingVal)}
                <span className="text-[9px] text-slate-450 font-semibold">({reviewCount})</span>
              </div>
              {outOfStock ? (
                <span className="text-rose-500 flex items-center"><span className="h-1.5 w-1.5 rounded-full bg-rose-500 mr-1 inline-block animate-ping"></span>Out</span>
              ) : product.stock === 'Unlimited' || product.stock > 3 ? (
                <span className="text-emerald-600 flex items-center"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1 inline-block animate-pulse"></span>{language === 'en' ? 'In Stock' : 'තොග ඇත'}</span>
              ) : (
                <span className="text-amber-500 flex items-center"><span className="h-1.5 w-1.5 rounded-full bg-amber-500 mr-1 inline-block animate-pulse"></span>{language === 'en' ? `${product.stock} Left` : `ඉතිරි ${product.stock}`}</span>
              )}
            </div>
          </div>
          <div>
            <div className="flex items-baseline space-x-1.5 mb-2.5">
              <span className={`text-sm font-black ${theme.text} font-outfit`}>Rs. {product.retailPrice.toLocaleString()}</span>
              <span className="text-[10px] text-slate-450 line-through font-semibold">Rs. {fakeOriginal.toLocaleString()}</span>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); addToCart(product); }}
              disabled={outOfStock}
              className={`w-full py-2 rounded-2xl text-[11px] font-black transition-all flex items-center justify-center space-x-1.5 ${
                outOfStock
                  ? 'bg-slate-100 text-slate-450 cursor-not-allowed'
                  : `${theme.bg} ${theme.hoverBg} active:scale-95 text-white shadow-md ${theme.shadow} hover:shadow-lg cursor-pointer`
              }`}
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              <span>{t.addToCart}</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative -mt-4 -mx-3 sm:-mx-6 lg:-mx-8">

      {/* ── TOP USP BAR ───────────────────────────────────────────            <span className="hidden lg:flex items-center space-x-1.5 transition hover:text-white cursor-default">
              <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
              <span className="font-bold">{language === 'en' ? '100% Secure' : 'ආරක්ෂිත'}</span>
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <button onClick={() => setActiveTab('tracker')} className="relative inline-flex items-center text-rose-400 hover:text-rose-300 transition duration-300 font-extrabold gap-1.5 hover:scale-105 active:scale-95 cursor-pointer">
              <Search className="h-3.5 w-3.5 text-rose-400" />
              <span>{language === 'en' ? 'Track Your Repair' : 'රෙපෙයාර් ට්‍රැක් කරන්න'}</span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
            </button>
            {settings.onlinePhone && (
              <span className="hidden md:inline-flex items-center text-slate-400 font-bold gap-1">
                <Phone className="h-3 w-3 text-slate-500" />
                {settings.onlinePhone}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── MAIN HEADER ─────────────────────────────────────────────────────── */}
      <div className={`${settings.onlineHeaderBgColor || 'bg-slate-900'} text-white shadow-lg border-b ${isHeaderDark ? 'border-slate-800/80' : 'border-slate-205'} py-3 px-4 transition-all duration-300`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center gap-3.5 md:gap-4">
          
          {/* Top Row: Logo & Right Controls on Mobile */}
          <div className="flex items-center justify-between w-full md:w-auto gap-4">
            {/* Logo */}
            <div className="flex items-center space-x-3 shrink-0">
              {settings.onlineStoreLogoUrl ? (
                <div className="relative group shrink-0">
                  <div className={`absolute -inset-0.5 rounded-xl bg-gradient-to-tr ${theme.gradientFrom} ${theme.gradientTo} opacity-30 blur group-hover:opacity-60 transition duration-500`}></div>
                  <img 
                    src={settings.onlineStoreLogoUrl} 
                    alt={settings.onlineStoreName || settings.shopName} 
                    className="relative h-10 md:h-11 w-auto max-w-[100px] md:max-w-[130px] object-contain rounded-xl shadow-md bg-white border border-white/20 p-0.5 transition duration-300 group-hover:scale-105" 
                  />
                </div>
              ) : null}
              <div className="text-left">
                <div className={`text-base md:text-xl font-black leading-tight tracking-tight ${isHeaderDark ? 'text-white' : theme.text} font-outfit`}>
                  {settings.onlineStoreName || settings.shopName}
                </div>
                <div className={`text-[9px] md:text-[10px] font-bold mt-0.5 tracking-wide ${isHeaderDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {settings.onlineTagline || 'Best Prices · Trusted Quality'}
                </div>
              </div>
            </div>

            {/* Mobile Controls (Language & Cart & Account icon) */}
            <div className="flex items-center space-x-2 shrink-0 md:hidden">
              <button
                onClick={() => setLanguage(language === 'en' ? 'si' : 'en')}
                className={`flex items-center justify-center p-2 rounded-xl text-xs font-extrabold transition shadow-sm border ${
                  isHeaderDark 
                    ? 'bg-slate-900 border-slate-800/60 hover:bg-slate-850 text-slate-205 hover:text-white' 
                    : 'bg-white border-slate-100 hover:bg-slate-50 text-slate-750'
                }`}
                title={language === 'en' ? 'සිංහල' : 'English'}
              >
                <Languages className={`h-4 w-4 ${isHeaderDark ? 'text-white' : theme.text}`} />
              </button>
              
              <button
                onClick={() => setShowCustomerPortal(true)}
                className={`flex items-center justify-center p-2 rounded-xl text-xs font-extrabold border transition shadow-sm ${
                  loggedInCustomer 
                    ? 'bg-emerald-600 border-emerald-500 text-white shadow-emerald-500/10' 
                    : isHeaderDark 
                      ? 'bg-slate-900 text-slate-205 border-slate-800 hover:bg-slate-850 hover:text-white' 
                      : 'bg-white border-slate-100 text-slate-750 hover:bg-slate-50'
                }`}
                title={loggedInCustomer ? loggedInCustomer.name : (language === 'en' ? 'Account' : 'ගිණුම')}
              >
                <User className="h-4 w-4 shrink-0" />
              </button>

              <button
                onClick={() => setIsCartOpen(true)}
                className={`relative flex items-center justify-center p-2 ${theme.bg} ${theme.hoverBg} text-white rounded-xl text-xs font-bold shadow-lg ${theme.shadow} hover:shadow-xl transition-all duration-300 active:scale-95 cursor-pointer`}
              >
                <ShoppingCart className="h-4.5 w-4.5" />
                {cart.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[8px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center animate-bounce shadow-md border-2 border-white">
                    {cart.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="w-full md:flex-1 md:max-w-2xl">
            <div className={`flex items-center border ${isHeaderDark ? 'border-white/10' : 'border-slate-200'} focus-within:ring-2 focus-within:${theme.focusRing} focus-within:border-transparent rounded-2xl overflow-hidden shadow-sm transition duration-300 ${isHeaderDark ? 'bg-slate-900/60' : 'bg-slate-50/80'}`}>
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value as any)}
                className={`px-2 md:px-4 py-2.5 text-[10px] md:text-xs font-bold ${
                  isHeaderDark 
                    ? 'text-slate-300 bg-slate-900 border-r border-white/10' 
                    : 'text-slate-700 bg-slate-100 border-r border-slate-200'
                } focus:outline-none shrink-0 cursor-pointer hover:bg-opacity-80 transition max-w-[100px] md:max-w-none`}
              >
                <option value="All" className={isHeaderDark ? 'bg-slate-950 text-slate-200' : 'bg-white text-slate-700'}>{t.allCategories}</option>
                {categories.map(c => <option key={c} value={c} className={isHeaderDark ? 'bg-slate-950 text-slate-200' : 'bg-white text-slate-700'}>{c}</option>)}
              </select>
              <input
                type="text"
                placeholder={language === 'en' ? 'Search products, brands and categories...' : 'භාණ්ඩ, බ්‍රෑන්ඩ් සහ කාණ්ඩ සොයන්න...'}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className={`flex-1 px-3 py-2 text-xs md:text-sm focus:outline-none min-w-0 ${
                  isHeaderDark ? 'bg-transparent text-white placeholder-slate-400' : 'bg-transparent text-slate-800 placeholder-slate-400'
                }`}
              />
              <button className={`${theme.bg} ${theme.hoverBg} text-white px-4 md:px-5 py-2.5 flex items-center justify-center transition duration-300 hover:scale-105 active:scale-95 shrink-0 cursor-pointer`}>
                <Search className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Desktop Controls (hidden on Mobile) */}
          <div className="hidden md:flex items-center space-x-3 shrink-0">
            <button
              onClick={() => setLanguage(language === 'en' ? 'si' : 'en')}
              className={`flex items-center space-x-1.5 px-3.5 py-2.5 rounded-2xl text-xs font-extrabold transition shadow-sm border ${
                isHeaderDark 
                  ? 'bg-slate-900 border-slate-800/60 hover:bg-slate-850 text-slate-200 hover:text-white' 
                  : 'bg-white border-slate-100 hover:bg-slate-50 text-slate-750'
              }`}
            >
              <Languages className={`h-4 w-4 ${isHeaderDark ? 'text-white' : theme.text}`} />
              <span>{language === 'en' ? 'සිංහල' : 'English'}</span>
            </button>
            <button
              onClick={() => setShowCustomerPortal(true)}
              className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-2xl text-xs font-extrabold border transition shadow-sm ${
                loggedInCustomer 
                  ? 'bg-emerald-600 border-emerald-500 text-white shadow-emerald-500/10' 
                  : isHeaderDark 
                    ? 'bg-slate-900 text-slate-205 border-slate-800 hover:bg-slate-850 hover:text-white' 
                    : 'bg-white border-slate-100 text-slate-750 hover:bg-slate-50'
              }`}
            >
              <User className="h-4 w-4 shrink-0" />
              <div className="text-left leading-none">
                <div className="text-[8px] opacity-70 font-semibold uppercase tracking-wider">{loggedInCustomer ? 'Active' : language === 'en' ? 'Account' : 'ගිණුම'}</div>
                <div className="font-black text-[11px] mt-0.5">{loggedInCustomer ? loggedInCustomer.name.split(' ')[0] : (language === 'en' ? 'Sign In' : 'පිවිසෙන්න')}</div>
              </div>
            </button>
            <button
              onClick={() => setIsCartOpen(true)}
              className={`relative flex items-center space-x-2.5 px-4 py-2.5 ${theme.bg} ${theme.hoverBg} text-white rounded-2xl text-xs font-bold shadow-lg ${theme.shadow} hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 active:scale-95 cursor-pointer`}
            >
              <ShoppingCart className="h-4.5 w-4.5" />
              <div className="text-left leading-none">
                <div className="text-[8px] opacity-80 uppercase font-semibold tracking-wider">{cart.length} {language === 'en' ? 'items' : 'ද්‍රව්‍ය'}</div>
                <div className="font-black text-[11px] mt-0.5">Rs. {cartTotals.total.toLocaleString()}</div>
              </div>
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center animate-bounce shadow-md border-2 border-white">
                  {cart.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── CATEGORY NAV BAR ────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-100/80 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 flex items-center overflow-x-auto scrollbar-none space-x-1 py-1">
          <button
            onClick={() => { setSelectedCategory('All'); setActiveTab('shop'); }}
            className={`shrink-0 flex items-center space-x-2 px-4 py-3.5 text-xs font-black tracking-wide uppercase transition-all border-b-2 rounded-t-lg hover:bg-slate-50/50 cursor-pointer ${
              selectedCategory === 'All' && activeTab === 'shop' ? `${theme.text} ${theme.border}` : `text-slate-600 border-transparent hover:${theme.text}`
            }`}
          >
            {getCategoryIcon('All', "h-4 w-4")}
            <span>{t.allCategories}</span>
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => { setSelectedCategory(cat as any); setActiveTab('shop'); }}
              className={`shrink-0 flex items-center space-x-2 px-4 py-3.5 text-xs font-black tracking-wide uppercase whitespace-nowrap transition-all border-b-2 rounded-t-lg hover:bg-slate-50/50 cursor-pointer ${
                selectedCategory === cat && activeTab === 'shop' ? `${theme.text} ${theme.border}` : `text-slate-600 border-transparent hover:${theme.text}`
              }`}
            >
              {getCategoryIcon(cat, "h-4 w-4")}
              <span>{(t as any)[cat] || cat}</span>
            </button>
          ))}
          <button
            onClick={() => setActiveTab('tracker')}
            className={`shrink-0 flex items-center space-x-1.5 px-4 py-3 text-xs font-bold whitespace-nowrap transition-colors border-b-2 ${
              activeTab === 'tracker' ? 'text-rose-600 border-rose-500' : 'text-slate-600 border-transparent hover:text-rose-500'
            }`}
          >
            <span>🔧</span><span>{t.trackRepair}</span>
          </button>
        </div>
      </div>

      {/* ── PAGE CONTENT ────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">

        {/* ── SHOP TAB ──────────────────────────────────────────────────────── */}
        {activeTab === 'shop' && (
          <>
            {/* HERO BANNER CAROUSEL */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl select-none" style={{minHeight:'350px'}}>
              {/* Background image — crossfade */}
              <img
                key={currentBanner}
                src={bannerUrls[currentBanner]}
                alt={`Hero Banner ${currentBanner + 1}`}
                className="absolute inset-0 w-full h-full object-cover object-center"
                style={{
                  minHeight: '350px',
                  opacity: bannerTransition ? 1 : 0,
                  transition: 'opacity 0.5s ease-in-out'
                }}
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              {/* Gradient overlay */}
              <div
                className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/40 to-transparent z-0"
              />
              {/* Text content */}
              <div className="relative z-10 flex items-center px-6 md:px-12 h-full py-8" style={{minHeight:'350px'}}>
                <div 
                  key={currentBanner} 
                  className="bg-slate-950/70 backdrop-blur-md border border-white/10 p-6 md:p-8 rounded-3xl max-w-lg space-y-4 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500"
                >
                  <div className={`inline-flex items-center space-x-1.5 ${theme.bg}/90 text-white text-[10px] font-extrabold px-3.5 py-1 rounded-full tracking-wider uppercase shadow-lg border border-white/10`}>
                    <span>🔥</span><span>{language === 'en' ? 'Exclusive Deal' : 'විශේෂ දීමනාවක්'}</span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-white leading-tight font-outfit drop-shadow-sm">
                    {language === 'en' ? 'Premium Quality & ' : 'උසස්ම තත්ත්වය සහ '}<br />
                    <span className={theme.accentText}>{language === 'en' ? 'Unbeatable Prices' : 'අඩුම මිල ගණන්'}</span> <span className="text-yellow-400">✨</span>
                  </h2>
                  <p className="text-slate-200 text-xs md:text-sm font-medium leading-relaxed">
                    {language === 'en'
                      ? 'Explore top-tier mobile accessories, computer parts, repair services, and more.'
                      : 'උසස්ම තත්ත්වයේ දුරකථන උපාංග, පරිගණක කොටස් සහ අලුත්වැඩියා සේවා එකම තැනකින්.'}
                  </p>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-300 font-bold opacity-90">
                    <span className="flex items-center space-x-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
                      <span>{language === 'en' ? 'Genuine Products' : 'විශ්වාසනීය ද්‍රව්‍ය'}</span>
                    </span>
                    <span className="flex items-center space-x-1.5">
                      <Clock className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
                      <span>{language === 'en' ? 'Express Delivery' : 'ශීඝ්‍ර බෙදාහැරීම'}</span>
                    </span>
                    <span className="flex items-center space-x-1.5">
                      <CreditCard className="h-3.5 w-3.5 text-emerald-400" />
                      <span>{language === 'en' ? 'Secure Payments' : 'COD / බැංකු'}</span>
                    </span>
                  </div>
                  <button
                    onClick={() => { setSelectedCategory('All'); setActiveTab('shop'); }}
                    className={`inline-flex items-center space-x-2 ${theme.bg} ${theme.hoverBg} active:scale-95 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg ${theme.shadow} transition-all duration-300 border border-white/10 cursor-pointer`}
                  >
                    <span>{language === 'en' ? 'Shop Collection' : 'භාණ්ඩ බලන්න'}</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {/* Prev / Next arrows */}
              {bannerUrls.length > 1 && (
                <>
                  <button
                    onClick={prevBanner}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-slate-950/40 hover:bg-slate-950/80 hover:scale-105 active:scale-95 text-white flex items-center justify-center backdrop-blur-md transition-all duration-300 border border-white/10 cursor-pointer text-lg font-bold"
                    aria-label="Previous banner"
                  >
                    ‹
                  </button>
                  <button
                    onClick={nextBanner}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-slate-950/40 hover:bg-slate-950/80 hover:scale-105 active:scale-95 text-white flex items-center justify-center backdrop-blur-md transition-all duration-300 border border-white/10 cursor-pointer text-lg font-bold"
                    aria-label="Next banner"
                  >
                    ›
                  </button>
                </>
              )}
              {/* 30% OFF badge */}
              <div
                className={`absolute top-6 right-6 md:right-12 z-10 hidden sm:flex flex-col items-center justify-center w-22 h-22 rounded-full shadow-2xl border-4 border-yellow-400/80 animate-pulse hover:rotate-12 transition duration-300`}
                style={{ background: `linear-gradient(135deg, ${
                  theme.bg === 'bg-emerald-600' ? '#059669,#047857' : 
                  theme.bg === 'bg-purple-600' ? '#9333ea,#7e22ce' : 
                  theme.bg === 'bg-indigo-600' ? '#4f46e5,#4338ca' : 
                  '#2563eb,#1d4ed8'
                })` }}
              >
                <span className="text-[9px] font-black text-white leading-none tracking-widest">UP TO</span>
                <span className="text-2xl font-black text-yellow-300 leading-none my-0.5">30%</span>
                <span className="text-[9px] font-black text-white leading-none tracking-widest">OFF</span>
              </div>
              {/* Dash indicators */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center space-x-2">
                {bannerUrls.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => goBanner(idx)}
                    className={`h-1.5 rounded-full transition-all duration-500 cursor-pointer ${
                      idx === currentBanner
                        ? `w-8 ${theme.accentBg}`
                        : 'w-2 bg-white/40 hover:bg-white/70'
                    }`}
                    aria-label={`Go to banner ${idx + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* QUICK CATEGORY CARDS */}
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-3.5">
              {(['All', ...categories.slice(0, 7)] as string[]).map(cat => {
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => { setSelectedCategory(cat as any); setActiveTab('shop'); }}
                    className={`group flex flex-col items-center justify-center p-3.5 rounded-3xl border transition-all duration-300 hover:shadow-xl hover:shadow-slate-150/45 hover:-translate-y-1 active:scale-95 cursor-pointer ${
                      isActive 
                        ? `${theme.border} bg-white shadow-md ${theme.shadow}/30` 
                        : 'border-slate-100 bg-white hover:border-slate-200'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-2.5 transition duration-300 group-hover:scale-110 shadow-inner ${
                      isActive 
                        ? `${theme.bg} text-white` 
                        : `bg-slate-50 group-hover:bg-slate-100 ${theme.text}`
                    }`}>
                      {getCategoryIcon(cat, "h-5 w-5")}
                    </div>
                    <span className={`text-[10px] font-black leading-tight line-clamp-1 transition duration-300 ${isActive ? theme.text : 'text-slate-800'}`}>
                      {cat === 'All' ? (language === 'en' ? 'All Items' : 'සියල්ල') : ((t as any)[cat] || cat)}
                    </span>
                    <span className="text-[8.5px] text-slate-400 font-extrabold mt-0.5 tracking-wider uppercase">
                      {cat === 'All' ? visibleProducts.length : visibleProducts.filter(p => p.category === cat).length} {language === 'en' ? 'Items' : 'ද්‍රව්‍ය'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* FILTERED / SEARCH RESULTS */}
            {(searchQuery || selectedCategory !== 'All') ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-extrabold text-slate-800">
                    {searchQuery ? (
                      <span className="flex items-center gap-1.5">
                        <Search className={`h-4 w-4 ${theme.text}`} />
                        <span>{language === 'en' ? 'Search results for' : 'සෙවුම් ප්‍රතිඵල'} "{searchQuery}"</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        {getCategoryIcon(selectedCategory, `h-4 w-4 ${theme.text}`)}
                        <span>{selectedCategory === 'All' ? (language === 'en' ? 'All Items' : 'සියල්ල') : ((t as any)[selectedCategory] || selectedCategory)}</span>
                      </span>
                    )}
                    <span className="ml-2 text-xs text-slate-400 font-semibold">({filteredProducts.length} {language === 'en' ? 'results' : 'ප්‍රතිඵල'})</span>
                  </h2>
                  <button onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }} className={`text-xs ${theme.text} font-bold hover:underline`}>
                    {language === 'en' ? 'Clear filter' : 'ලේබලය හිස් කරන්න'}
                  </button>
                </div>
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-16 space-y-3">
                    <Search className="h-12 w-12 mx-auto text-slate-300 animate-bounce" />
                    <p className="text-slate-500 font-semibold">{language === 'en' ? 'No products found.' : 'භාණ්ඩ හමු නොවිණි.'}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {paginatedProducts.map(p => <ProductCard key={p.id} product={p} />)}
                  </div>
                )}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center space-x-1.5 pt-6 text-xs font-bold text-slate-600">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer font-bold"
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
                          return <span key={`dots-${idx}`} className="px-1 text-slate-400 font-bold">...</span>;
                        }
                        return (
                          <button
                            key={p}
                            onClick={() => setCurrentPage(p as number)}
                            className={`w-8 h-8 rounded-lg border text-xs font-bold transition cursor-pointer ${
                              currentPage === p 
                                ? `${theme.bg} border-transparent text-white shadow-sm` 
                                : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            {p}
                          </button>
                        );
                      });
                    })()}
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer font-bold"
                    >
                      ›
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* HOT DEALS */}
                {hotDeals.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center">
                        <h2 className="text-xl font-black text-slate-800 flex items-center space-x-2 font-outfit tracking-tight">
                          <span className="text-2xl animate-bounce">🔥</span>
                          <span>{language === 'en' ? 'Hot Deals' : 'හොඳම ඩීල්'}</span>
                        </h2>
                        <span className="hidden md:inline-flex items-center text-[9px] font-black bg-rose-50 border border-rose-100 text-rose-600 px-2.5 py-1 rounded-lg uppercase tracking-wider ml-3 animate-pulse">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-500 mr-1.5"></span>
                          {language === 'en' ? 'ENDS SOON: 02h 41m' : 'තව ස්වල්ප වේලාවයි'}
                        </span>
                      </div>
                      <button onClick={() => document.getElementById('all-products-catalog')?.scrollIntoView({ behavior: 'smooth' })} className={`text-xs font-black ${theme.text} hover:opacity-80 transition flex items-center space-x-1 uppercase tracking-wider bg-slate-50 hover:bg-slate-100/60 px-3.5 py-1.5 rounded-2xl border border-slate-100 shadow-sm cursor-pointer`}>
                        <span>{language === 'en' ? 'View All' : 'සියල්ල'}</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                      {hotDeals.map(p => <ProductCard key={p.id} product={p} badge={`-${Math.round(((Math.round(p.retailPrice * 1.18) - p.retailPrice) / Math.round(p.retailPrice * 1.18)) * 100)}%`} />)}
                    </div>
                  </div>
                )}

                {/* FEATURED PRODUCTS */}
                {featuredProducts.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h2 className="text-xl font-black text-slate-800 flex items-center space-x-2 font-outfit tracking-tight">
                        <span className="text-2xl text-yellow-500">⭐</span>
                        <span>{language === 'en' ? 'Featured Products' : 'විශේෂිත නිෂ්පාදන'}</span>
                      </h2>
                      <button onClick={() => document.getElementById('all-products-catalog')?.scrollIntoView({ behavior: 'smooth' })} className={`text-xs font-black ${theme.text} hover:opacity-80 transition flex items-center space-x-1 uppercase tracking-wider bg-slate-50 hover:bg-slate-100/60 px-3.5 py-1.5 rounded-2xl border border-slate-100 shadow-sm cursor-pointer`}>
                        <span>{language === 'en' ? 'View All' : 'සියල්ල'}</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                      {featuredProducts.map(p => <ProductCard key={p.id} product={p} />)}
                    </div>
                  </div>
                )}

                {/* NEW ARRIVALS */}
                {newArrivals.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h2 className="text-xl font-black text-slate-800 flex items-center space-x-2.5 font-outfit tracking-tight">
                        <span className={`text-white text-[8px] font-black px-2 py-0.5 rounded-md ${theme.bg} tracking-widest uppercase shadow-sm`}>NEW</span>
                        <span>{language === 'en' ? 'New Arrivals' : 'අලුතින් ආ ද්‍රව්‍ය'}</span>
                      </h2>
                      <button onClick={() => document.getElementById('all-products-catalog')?.scrollIntoView({ behavior: 'smooth' })} className={`text-xs font-black ${theme.text} hover:opacity-80 transition flex items-center space-x-1 uppercase tracking-wider bg-slate-50 hover:bg-slate-100/60 px-3.5 py-1.5 rounded-2xl border border-slate-100 shadow-sm cursor-pointer`}>
                        <span>{language === 'en' ? 'View All' : 'සියල්ල'}</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                      {newArrivals.map(p => <ProductCard key={p.id} product={p} badge="NEW" />)}
                    </div>
                  </div>
                )}

                {/* EXPLORE CATALOG / ALL PRODUCTS */}
                <div id="all-products-catalog" className="space-y-4 pt-6 border-t border-slate-100">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h2 className="text-xl font-black text-slate-800 flex items-center space-x-2 font-outfit tracking-tight">
                      <span className="text-2xl text-blue-500">🛍️</span>
                      <span>{language === 'en' ? 'Explore Our Catalog' : 'සියලුම භාණ්ඩ'}</span>
                      <span className="text-xs text-slate-400 font-bold ml-2">({visibleProducts.length} {language === 'en' ? 'Products' : 'භාණ්ඩ'})</span>
                    </h2>
                  </div>
                  
                  {paginatedProducts.length === 0 ? (
                    <div className="text-center py-16">
                      <p className="text-slate-500 font-semibold">{language === 'en' ? 'No products available.' : 'භාණ්ඩ නොමැත.'}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                      {paginatedProducts.map(p => <ProductCard key={p.id} product={p} />)}
                    </div>
                  )}

                  {/* Smart Catalog Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center space-x-1.5 pt-6 text-xs font-bold text-slate-600">
                      <button
                        onClick={() => {
                          setCurrentPage(p => Math.max(1, p - 1));
                          document.getElementById('all-products-catalog')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        disabled={currentPage === 1}
                        className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer font-bold"
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
                        return pages.map((pNum, idx) => {
                          if (pNum === '...') {
                            return <span key={`dots-${idx}`} className="px-1 text-slate-400 font-bold">...</span>;
                          }
                          return (
                            <button
                              key={pNum}
                              onClick={() => {
                                setCurrentPage(pNum as number);
                                document.getElementById('all-products-catalog')?.scrollIntoView({ behavior: 'smooth' });
                              }}
                              className={`w-8 h-8 rounded-lg border text-xs font-bold transition cursor-pointer ${
                                currentPage === pNum 
                                  ? `${theme.bg} border-transparent text-white shadow-sm` 
                                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              {pNum}
                            </button>
                          );
                        });
                      })()}
                      <button
                        onClick={() => {
                          setCurrentPage(p => Math.min(totalPages, p + 1));
                          document.getElementById('all-products-catalog')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        disabled={currentPage === totalPages}
                        className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer font-bold"
                      >
                        ›
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* TRUST BADGES */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 pt-8 pb-4 border-t border-slate-100">
              {[
                { icon: <Truck className="h-5 w-5" />, title: language === 'en' ? 'Islandwide Delivery' : 'ලංකාව පුරා', sub: language === 'en' ? 'Fast & Reliable' : 'ශීඝ්‍ර සේවාව' },
                { icon: <CreditCard className="h-5 w-5" />, title: language === 'en' ? 'Cash on Delivery' : 'COD', sub: language === 'en' ? 'Pay when you receive' : 'ලැබෙද්දී ගෙවන්න' },
                { icon: <RotateCcw className="h-5 w-5" />, title: language === 'en' ? 'Easy Returns' : 'ආපසු ගෙවීම', sub: language === 'en' ? '7 Days Return Policy' : 'දින 7' },
                { icon: <ShieldCheck className="h-5 w-5" />, title: language === 'en' ? 'Secure Payments' : 'ආරක්ෂිත', sub: language === 'en' ? '100% Protected' : '100% ආරක්ෂිතයි' },
                { icon: <Store className="h-5 w-5" />, title: language === 'en' ? 'Trusted Store' : 'විශ්වාසනීය', sub: language === 'en' ? '1000+ Happy Customers' : 'සතුටු ගනුදෙනුකාරයෝ' },
              ].map((b, i) => (
                <div key={i} className="flex items-center space-x-3 bg-white p-4.5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition duration-300 group">
                  <div className={`w-12 h-12 rounded-2xl ${theme.lightBg} flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition ${theme.text}`}>
                    {b.icon}
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-800 leading-tight font-outfit">{b.title}</div>
                    <div className="text-[10px] text-slate-500 font-bold mt-0.5">{b.sub}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* MODERN FOOTER */}
            <footer className="mt-8 pt-10 pb-6 border-t border-slate-100 text-slate-650 bg-slate-50/50 rounded-t-3xl -mx-4 px-6 md:px-12">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Column 1: Store info */}
                <div className="space-y-3">
                  <h4 className={`text-base font-black tracking-tight ${theme.text} font-outfit`}>
                    {settings.onlineStoreName || settings.shopName}
                  </h4>
                  <p className="text-xs font-medium leading-relaxed text-slate-500">
                    {settings.onlineTagline || 'Best Prices · Trusted Quality'}
                  </p>
                  <p className="text-[11px] font-bold text-slate-400">
                    © 2026 {settings.onlineStoreName || settings.shopName}. All Rights Reserved.
                  </p>
                </div>
                {/* Column 2: Quick Links */}
                <div className="space-y-3">
                  <h5 className="text-xs font-black uppercase tracking-wider text-slate-800 font-outfit">{language === 'en' ? 'Shop Categories' : 'කාණ්ඩ'}</h5>
                  <div className="flex flex-col space-y-2 text-xs font-bold">
                    {categories.slice(0, 4).map(c => (
                      <button key={c} onClick={() => { setSelectedCategory(c as any); setActiveTab('shop'); }} className="text-left hover:text-slate-900 transition-colors cursor-pointer">{(t as any)[c] || c}</button>
                    ))}
                  </div>
                </div>
                {/* Column 3: Contact details */}
                <div className="space-y-3">
                  <h5 className="text-xs font-black uppercase tracking-wider text-slate-800 font-outfit">{language === 'en' ? 'Contact Us' : 'සම්බන්ධ වන්න'}</h5>
                  <div className="flex flex-col space-y-2.5 text-xs font-bold text-slate-550">
                    {settings.onlinePhone && (
                      <a
                        href={`tel:${settings.onlinePhone.replace(/\s/g, '')}`}
                        className="flex items-center space-x-2 group cursor-pointer hover:text-emerald-600 transition-colors duration-200"
                        title={language === 'en' ? 'Tap to Call' : 'ඇමතීමට ස්පර්ශ කරන්න'}
                      >
                        <span className="w-6 h-6 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-100 transition-colors shrink-0 text-[13px]">📞</span>
                        <span className="group-hover:underline underline-offset-2">{settings.onlinePhone}</span>
                      </a>
                    )}
                    {settings.shopAddress && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.shopAddress)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start space-x-2 group cursor-pointer hover:text-blue-600 transition-colors duration-200"
                        title={language === 'en' ? 'Open in Google Maps' : 'Google Maps හි විවෘත කරන්න'}
                      >
                        <span className="w-6 h-6 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 group-hover:bg-blue-100 transition-colors shrink-0 mt-0.5 text-[13px]">📍</span>
                        <span className="group-hover:underline underline-offset-2 leading-relaxed">{settings.shopAddress}</span>
                      </a>
                    )}
                  </div>
                </div>
                {/* Column 4: Payment Seals */}
                <div className="space-y-3">
                  <h5 className="text-xs font-black uppercase tracking-wider text-slate-800 font-outfit">{language === 'en' ? 'Secure Checkout' : 'ආරක්ෂිත ගෙවීම්'}</h5>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <span className="bg-white border border-slate-200/80 px-2 py-1 rounded-lg text-[10px] font-black tracking-wider shadow-sm text-slate-700">COD</span>
                    <span className="bg-white border border-slate-200/80 px-2 py-1 rounded-lg text-[10px] font-black tracking-wider shadow-sm text-slate-700">VISA</span>
                    <span className="bg-white border border-slate-200/80 px-2 py-1 rounded-lg text-[10px] font-black tracking-wider shadow-sm text-slate-700">MASTER</span>
                    <span className="bg-white border border-slate-200/80 px-2 py-1 rounded-lg text-[10px] font-black tracking-wider shadow-sm text-slate-700">BANK TRANSFER</span>
                  </div>
                </div>
              </div>
            </footer>
          </>
        )}

        {/* ── REPAIR TRACKER TAB ────────────────────────────────────────────── */}
        {activeTab === 'tracker' && (
          <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 p-6 text-white text-center">
              <h3 className="text-xl font-bold flex items-center justify-center"><Wrench className="h-5 w-5 mr-2 text-blue-400" />{t.trackRepair}</h3>
              <p className="text-xs text-slate-400 mt-1.5 max-w-md mx-auto">{t.trackRepairDesc}</p>
            </div>
            <div className="p-6 md:p-8 space-y-6">
              <form onSubmit={handleTrackRepair} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" />
                  <input type="text" placeholder={language === 'en' ? 'Enter Repair ID (REP001) or Phone (0771234567)' : 'රෙපෙයාර් අංකය හෝ දුරකථන අංකය ඇතුළත් කරන්න'} value={trackerQuery} onChange={e => setTrackerQuery(e.target.value)} className={`w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 ${theme.focusRing} focus:bg-white transition text-slate-800 font-bold`} />
                </div>
                <button type="submit" className={`${theme.bg} ${theme.hoverBg} text-white px-6 rounded-xl text-sm font-bold shadow-md transition`}>{t.trackBtn}</button>
              </form>
              {hasSearchedTracker && (
                <div className="space-y-6 pt-4 border-t border-slate-100">
                  {!trackedRepairs || trackedRepairs.length === 0 ? (
                    <div className="text-center py-8 space-y-3"><span className="text-4xl">🔍</span><p className="text-rose-500 font-semibold text-sm">{t.noRepairFound}</p></div>
                  ) : (
                    <div className="space-y-6">
                      {trackedRepairs.map(repair => (
                        <div key={repair.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
                          <div className="flex justify-between items-start flex-wrap gap-2">
                            <div>
                              <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${theme.lightBg} ${theme.lightText}`}>ID: {repair.id}</span>
                              <h4 className="text-base font-bold text-slate-800 mt-2">{repair.deviceName}</h4>
                              {repair.serialNo && <p className="text-xs text-slate-400">S/N: {repair.serialNo}</p>}
                            </div>
                            {getStatusBadge(repair.status)}
                          </div>
                          <div className="relative pt-6 pb-2">
                            <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 -translate-y-1/2 z-0 rounded-full"></div>
                            <div className={`absolute top-1/2 left-0 h-1 ${theme.bg} -translate-y-1/2 z-0 rounded-full transition-all duration-500`} style={{ width: repair.status === 'Pending' ? '12%' : repair.status === 'In Progress' ? '50%' : repair.status === 'Ready for Pickup' ? '85%' : repair.status === 'Delivered' ? '100%' : '0%' }}></div>
                            <div className="relative z-10 flex justify-between">
                              {[{ label: t.statusPending, key: 'Pending' }, { label: t.statusProgress, key: 'In Progress' }, { label: t.statusReady, key: 'Ready for Pickup' }, { label: t.statusDelivered, key: 'Delivered' }].map((step, idx) => {
                                const steps = ['Pending', 'In Progress', 'Ready for Pickup', 'Delivered'];
                                const isCompleted = steps.indexOf(step.key) <= steps.indexOf(repair.status) && repair.status !== 'Cancelled';
                                const isActive = step.key === repair.status;
                                return (
                                  <div key={step.key} className="flex flex-col items-center text-center max-w-[80px]">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-sm transition-all ${isCompleted ? `${theme.bg} text-white ring-4 ${theme.lightBg}` : 'bg-white text-slate-400 border border-slate-300'}`}>{isActive ? '⚡' : idx + 1}</div>
                                    <span className={`text-[10px] font-bold mt-2 leading-tight ${isActive ? theme.text : isCompleted ? 'text-slate-700' : 'text-slate-400'}`}>{step.label}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200/60 text-xs">
                            <div className="space-y-1.5"><div className="text-slate-400 font-medium">{t.issue}:</div><div className="text-slate-800 font-bold">{repair.issueDescription}</div></div>
                            <div className="space-y-1.5"><div className="text-slate-400 font-medium">{t.assignedTech}:</div><div className="text-slate-800 font-bold">{repair.assignedTechnician}</div></div>
                            <div className="space-y-1.5"><div className="text-slate-400 font-medium">{t.estCost}:</div><div className={`text-slate-800 font-extrabold text-sm ${theme.text}`}>Rs. {repair.estimatedCost.toLocaleString()}</div></div>
                            {repair.notes && (<div className="space-y-1.5 md:col-span-2 bg-white p-3 rounded-xl border border-slate-200"><div className="text-slate-400 font-semibold">{t.techNotes}:</div><div className="text-slate-700 font-medium whitespace-pre-line">{repair.notes}</div></div>)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── FLOATING WHATSAPP ───────────────────────────────────────────────── */}
      {settings.onlinePhone && (
        <a
          href={`https://wa.me/${settings.onlinePhone.replace(/\D/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-40 flex flex-col items-center group cursor-pointer"
          title={language === 'en' ? 'WhatsApp Order' : 'WhatsApp ඇණවුම'}
        >
          {/* WhatsApp Icon Button */}
          <div className="w-14 h-14 bg-[#25D366] hover:bg-[#20BA5A] text-white rounded-full shadow-2xl shadow-emerald-500/50 flex items-center justify-center transition-all duration-300 group-hover:scale-110 active:scale-95 border-2 border-white/30">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </div>
          {/* Label below button */}
          <span className="mt-1.5 text-[10px] font-black text-white bg-[#25D366] px-2 py-0.5 rounded-full shadow-md tracking-wide uppercase whitespace-nowrap group-hover:bg-[#20BA5A] transition-all duration-300">
            WhatsApp Order
          </span>
        </a>
      )}

      {/* ── CART DRAWER ─────────────────────────────────────────────────────── */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-50 flex justify-end transition-all duration-300">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-250">
            <div className="bg-slate-950 text-white p-5 flex justify-between items-center shadow-lg border-b border-white/5">
              <h3 className="text-base font-black flex items-center font-outfit tracking-tight"><ShoppingCart className="h-5 w-5 mr-2 text-slate-400" />{t.cart}</h3>
              <button onClick={() => setIsCartOpen(false)} className="text-slate-400 hover:text-white transition p-1.5 rounded-xl hover:bg-white/10 cursor-pointer"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {cart.length === 0 ? (
                <div className="py-20 text-center space-y-3">
                  <span className="text-5xl animate-pulse inline-block">🛒</span>
                  <p className="text-slate-400 text-sm font-black tracking-tight">{t.emptyCart}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map(item => {
                    const p = item.product;
                    return (
                      <div key={p.id} className="bg-slate-50/50 hover:bg-slate-50 border border-slate-200/80 p-4 rounded-3xl transition duration-300 space-y-3 text-xs shadow-sm">
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0 flex-1">
                            <h4 className="font-extrabold text-slate-800 truncate leading-snug">{language === 'en' ? p.nameEn : p.nameSi}</h4>
                            <p className="text-[10.5px] text-slate-450 font-bold mt-0.5">Rs. {p.retailPrice.toLocaleString()} {p.isWeighted && '/kg'}</p>
                          </div>
                          <button onClick={() => removeFromCart(p.id)} className="text-slate-400 hover:text-rose-500 p-1.5 hover:bg-rose-50 rounded-xl transition cursor-pointer shrink-0"><Trash2 className="h-4 w-4" /></button>
                        </div>
                        <div className="flex justify-between items-center pt-2.5 border-t border-slate-200/60">
                          <div className="flex items-center space-x-1.5 bg-white border border-slate-200/80 rounded-xl p-1 shadow-sm">
                            <button onClick={() => updateCartQty(p.id, p.isWeighted ? -0.25 : -1)} className="w-7 h-7 flex items-center justify-center text-slate-500 hover:bg-slate-100 rounded-lg font-black transition cursor-pointer">-</button>
                            <span className="font-black text-slate-800 text-center w-11 text-xs">{item.quantity}</span>
                            <button onClick={() => updateCartQty(p.id, p.isWeighted ? 0.25 : 1)} className="w-7 h-7 flex items-center justify-center text-slate-500 hover:bg-slate-100 rounded-lg font-black transition cursor-pointer">+</button>
                          </div>
                          <span className="font-black text-slate-900 text-sm font-outfit">Rs. {(p.retailPrice * item.quantity).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            {cart.length > 0 && (
              <div className="bg-white p-6 border-t border-slate-100 space-y-4 shadow-[0_-8px_30px_rgb(0,0,0,0.02)]">
                <div className="space-y-2 text-xs font-bold">
                  <div className="flex justify-between text-slate-500"><span>{t.subtotal}:</span><span className="font-extrabold text-slate-800">Rs. {cartTotals.subtotal.toLocaleString()}</span></div>
                  {cartTotals.totalTax > 0 && (<div className={`flex justify-between ${theme.text}`}><span>Taxes (VAT + SSCL):</span><span className="font-extrabold">Rs. {cartTotals.totalTax.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>)}
                  <div className="flex justify-between font-black text-slate-900 text-base pt-2 border-t border-slate-150"><span>{t.total}:</span><span className={`${theme.text} font-outfit`}>Rs. {cartTotals.total.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>
                </div>

                {/* Proceed to Checkout */}
                <button
                  onClick={() => setIsCheckoutOpen(true)}
                  className={`w-full ${theme.bg} ${theme.hoverBg} text-white py-3.5 rounded-2xl text-xs font-black shadow-lg ${theme.shadow} transition-all duration-300 flex items-center justify-center uppercase tracking-wider cursor-pointer active:scale-95`}
                >
                  <span>{t.checkout}</span><ArrowRight className="h-4 w-4 ml-2" />
                </button>

                {/* Proceed to WhatsApp */}
                {settings.onlinePhone && (
                  <a
                    href={(() => {
                      const storeName = settings.onlineStoreName || settings.shopName;
                      const lines = cart.map(item => {
                        const name = language === 'en' ? item.product.nameEn : (item.product.nameSi || item.product.nameEn);
                        return `• ${name} × ${item.quantity} — Rs. ${(item.product.retailPrice * item.quantity).toLocaleString()}`;
                      });
                      const msg = [
                        `🛒 *New Order — ${storeName}*`,
                        '',
                        ...lines,
                        '',
                        `━━━━━━━━━━━━━━━`,
                        `*Total: Rs. ${cartTotals.total.toLocaleString(undefined, { maximumFractionDigits: 2 })}*`,
                        '',
                        `_(Sent via ${storeName} Online Store)_`
                      ].join('\n');
                      return `https://wa.me/${settings.onlinePhone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`;
                    })()}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      // Clear cart and close drawers after WhatsApp order
                      setTimeout(() => {
                        setCart([]);
                        setIsCartOpen(false);
                      }, 400);
                    }}
                    className="w-full bg-[#25D366] hover:bg-[#20BA5A] text-white py-3.5 rounded-2xl text-xs font-black shadow-lg shadow-emerald-500/30 transition-all duration-300 flex items-center justify-center gap-2.5 uppercase tracking-wider cursor-pointer active:scale-95 border border-[#20BA5A]/40"
                  >
                    {/* WhatsApp SVG icon inline */}
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 shrink-0">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    <span>Proceed to WhatsApp</span>
                    <ArrowRight className="h-4 w-4 shrink-0" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── CHECKOUT MODAL ──────────────────────────────────────────────────── */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-all duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-100">
            <div className="bg-slate-950 text-white p-5 flex justify-between items-center border-b border-white/5">
              <h3 className="text-base font-black flex items-center font-outfit tracking-tight"><ShoppingCart className="h-5 w-5 mr-2 text-slate-400" />{t.customerDetails}</h3>
              <button onClick={() => setIsCheckoutOpen(false)} className="text-slate-400 hover:text-white transition p-1.5 rounded-xl hover:bg-white/10 cursor-pointer"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleCheckout} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-500 flex items-center tracking-wide uppercase"><User className="h-3.5 w-3.5 mr-1.5 text-slate-400" />{t.fullName} *</label>
                <input type="text" required value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="e.g. Nimal Silva" className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-transparent focus:border-slate-400 text-slate-800 font-bold transition duration-200`} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-500 flex items-center tracking-wide uppercase"><Phone className="h-3.5 w-3.5 mr-1.5 text-slate-400" />{t.phoneNumber} *</label>
                <input type="tel" required value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="e.g. 0771234567" className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-transparent focus:border-slate-400 text-slate-800 font-bold transition duration-200`} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-500 flex items-center tracking-wide uppercase"><User className="h-3.5 w-3.5 mr-1.5 text-slate-400" />{t.emailAddress}</label>
                <input type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} placeholder="e.g. nimal@gmail.com" className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-transparent focus:border-slate-400 text-slate-800 font-semibold transition duration-200`} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-500 flex items-center tracking-wide uppercase"><MapPin className="h-3.5 w-3.5 mr-1.5 text-slate-400" />{t.deliveryAddress}</label>
                <textarea value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} placeholder="e.g. 123, Galle Road, Colombo 03" rows={2} className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-transparent focus:border-slate-400 text-slate-800 font-semibold transition duration-200`} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-500 flex items-center tracking-wide uppercase"><CreditCard className="h-3.5 w-3.5 mr-1.5 text-slate-400" />{t.paymentMethod}</label>
                <div className="grid grid-cols-3 gap-2">
                  {([{ key: 'Cash' as const, label: language === 'en' ? 'COD' : 'මුදල්' }, { key: 'Card' as const, label: language === 'en' ? 'Card' : 'කාඩ්' }, { key: 'Online Transfer' as const, label: language === 'en' ? 'Bank' : 'බැංකු' }]).map(pay => {
                    const isSelected = paymentMethod === pay.key;
                    return (
                      <button 
                        key={pay.key} 
                        type="button" 
                        onClick={() => setPaymentMethod(pay.key)} 
                        className={`py-3 px-3 rounded-2xl text-xs font-black border transition-all cursor-pointer ${
                          isSelected 
                            ? `${theme.bg} text-white ${theme.border} shadow-md ${theme.shadow}/30` 
                            : 'bg-slate-50 text-slate-650 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {pay.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="bg-slate-50/50 p-4.5 rounded-3xl border border-slate-150 flex justify-between items-center"><span className="text-xs font-black text-slate-550 tracking-wider uppercase">{t.total}:</span><span className={`text-xl font-black ${theme.text} font-outfit`}>Rs. {cartTotals.total.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>
              <div className="flex space-x-3.5 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsCheckoutOpen(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-3 rounded-2xl text-xs font-black transition cursor-pointer">{t.cancel}</button>
                <button type="submit" className={`flex-1 ${theme.bg} ${theme.hoverBg} text-white py-3 rounded-2xl text-xs font-black shadow-lg ${theme.shadow} transition cursor-pointer active:scale-95`}>{t.placeOrder}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── RECEIPT MODAL ───────────────────────────────────────────────────── */}
      {completedSale && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-all duration-350">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-100">
            <div className="bg-emerald-600 text-white p-6 text-center space-y-2 relative">
              {/* Decorative circles to mimic paper holes */}
              <div className="absolute bottom-0 left-0 right-0 h-1.5 flex justify-between px-3 overflow-hidden opacity-20">
                {Array.from({ length: 15 }).map((_, i) => (
                  <span key={i} className="w-2.5 h-2.5 bg-white rounded-full -mb-1 inline-block"></span>
                ))}
              </div>
              <CheckCircle className="h-11 w-11 mx-auto animate-bounce text-white drop-shadow-md" />
              <h3 className="text-xl font-black font-outfit tracking-tight">{t.orderSuccess}</h3>
              <p className="text-xs text-emerald-100 font-bold uppercase tracking-wider">{t.orderId}: {completedSale.id}</p>
            </div>
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto bg-slate-50/30" id="printable-receipt">
              <div className="text-center border-b border-dashed border-slate-200 pb-4">
                <h4 className="text-base font-black text-slate-800 font-outfit tracking-tight">{settings.onlineStoreName || settings.shopName}</h4>
                <p className="text-[10px] text-slate-450 font-semibold mt-0.5">{settings.shopAddress || 'Online Store'} • {settings.onlinePhone || settings.shopPhone}</p>
                <p className="text-[10px] text-slate-450 font-semibold">{new Date(completedSale.createdAt).toLocaleString()}</p>
              </div>
              <div className="text-[11px] text-slate-655 space-y-1 font-medium bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex justify-between"><span>{t.fullName}:</span> <span className="font-extrabold text-slate-800">{completedSale.customerName}</span></div>
                <div className="flex justify-between"><span>{t.phoneNumber}:</span> <span className="font-extrabold text-slate-800">{customerPhone}</span></div>
                <div className="flex justify-between"><span>{t.paymentMethod}:</span> <span className="font-extrabold text-slate-800">{completedSale.paymentMethod}</span></div>
              </div>
              
              {/* Items */}
              <div className="border-t border-b border-dashed border-slate-205 py-3 space-y-2">
                <div className="grid grid-cols-12 text-[10px] font-black tracking-wider uppercase text-slate-400">
                  <span className="col-span-6">ITEM</span>
                  <span className="col-span-2 text-center">QTY</span>
                  <span className="col-span-4 text-right">PRICE</span>
                </div>
                {completedSale.items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 text-[11px] text-slate-750 font-bold">
                    <span className="col-span-6 truncate">{language === 'en' ? item.productNameEn : item.productNameSi}</span>
                    <span className="col-span-2 text-center">{item.quantity}</span>
                    <span className="col-span-4 text-right">Rs. {(item.price * item.quantity).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  </div>
                ))}
              </div>

              {/* Subtotals */}
              <div className="space-y-1.5 text-xs font-bold bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex justify-between text-slate-500"><span>{t.subtotal}:</span><span>Rs. {completedSale.subtotal.toLocaleString()}</span></div>
                {completedSale.totalTax > 0 && (
                  <div className={`flex justify-between ${theme.text}`}>
                    <span>VAT + SSCL Taxes:</span>
                    <span>Rs. {completedSale.totalTax.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-slate-900 text-sm pt-2 border-t border-slate-150">
                  <span>{t.total}:</span>
                  <span className={`${theme.text} font-outfit`}>Rs. {completedSale.total.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className={`${theme.lightBg} p-3.5 rounded-2xl border ${theme.lightBorder} text-[10.5px] ${theme.lightText} font-black text-center leading-relaxed font-outfit uppercase tracking-wider`}>
                {t.thankYou}
              </div>
            </div>
            <div className="bg-slate-50 p-4 border-t border-slate-100 flex space-x-3.5">
              <button 
                onClick={() => { const printContents = document.getElementById('printable-receipt')?.innerHTML; const originalContents = document.body.innerHTML; if (printContents) { document.body.innerHTML = printContents; window.print(); document.body.innerHTML = originalContents; window.location.reload(); } }} 
                className="flex-1 bg-slate-800 hover:bg-slate-900 text-white py-3 rounded-2xl text-xs font-black transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-md hover:shadow-lg active:scale-95"
              >
                <Printer className="h-4 w-4" />
                <span>{t.printReceipt}</span>
              </button>
              <button 
                onClick={() => {
                  setCompletedSale(null);
                  setCart([]);
                  setIsCartOpen(false);
                  setIsCheckoutOpen(false);
                  setCustomerName('');
                  setCustomerPhone('');
                  setCustomerEmail('');
                  setCustomerAddress('');
                  setPaymentMethod('Cash');
                }} 
                className={`flex-1 ${theme.bg} ${theme.hoverBg} text-white py-3 rounded-2xl text-xs font-black transition cursor-pointer shadow-md hover:shadow-lg active:scale-95`}
              >
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PRODUCT DETAIL PORTAL (PDP MODAL) ────────────────────────────────── */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-slate-955/75 backdrop-blur-md z-50 flex items-end sm:items-center justify-center sm:p-4 transition-all duration-300">
          <div 
            ref={modalScrollRef}
            className="bg-white w-full sm:max-w-4xl sm:rounded-3xl rounded-t-3xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 animate-in fade-in slide-in-from-bottom-8 sm:zoom-in-95 duration-250 flex flex-col"
          >
            {/* Mobile bottom-sheet drag handle */}
            <div className="sm:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-slate-200 rounded-full"></div>
            </div>

            {/* Header: Title & Close Button */}
            <div className="flex justify-between items-center px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 sticky top-0 bg-white/95 backdrop-blur-md z-10">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                {selectedProduct.category}
              </span>
              <button 
                onClick={() => setSelectedProduct(null)} 
                className="w-8 h-8 rounded-full bg-slate-50 hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center text-slate-500 transition-colors border border-slate-100 cursor-pointer"
                title={language === 'en' ? 'Close' : 'වසා දමන්න'}
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="p-4 md:p-8 space-y-5 md:space-y-8 flex-1">
              {/* Product Grid */}
              <div className="grid md:grid-cols-2 gap-4 md:gap-8 items-start">
                
                {/* Left Column: Image Container */}
                <div className="bg-slate-50/50 border border-slate-100 rounded-2xl md:rounded-3xl p-3 md:p-4 flex items-center justify-center overflow-hidden relative group" style={{minHeight: '160px', maxHeight: '240px'}}>
                  {selectedProduct.imageUrl ? (
                    <img 
                      src={selectedProduct.imageUrl} 
                      alt={selectedProduct.nameEn} 
                      className="max-h-48 md:max-h-80 w-auto object-contain rounded-xl md:rounded-2xl shadow-sm transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="text-slate-300 py-16">
                      {getCategoryIcon(selectedProduct.category, "w-24 h-24")}
                    </div>
                  )}
                  {/* Stock status indicator */}
                  {selectedProduct.stock !== 'Unlimited' && selectedProduct.stock <= 0 && (
                    <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] flex items-center justify-center">
                      <span className="bg-rose-600 text-white text-xs font-black tracking-widest uppercase px-5 py-2.5 rounded-full shadow-lg border border-rose-500/30">
                        {language === 'en' ? 'SOLD OUT' : 'තොග අවසන්'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Right Column: Details & Actions */}
                <div className="space-y-5">
                  <div className="space-y-2">
                    {selectedProduct.brand && (
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                        {selectedProduct.brand}
                      </span>
                    )}
                    <h2 className="text-base md:text-2xl font-black text-slate-800 leading-tight font-outfit">
                      {language === 'si' ? (selectedProduct.nameSi || selectedProduct.nameEn) : selectedProduct.nameEn}
                    </h2>
                    
                     {/* Stars & Reviews */}
                    {(() => {
                      const productReviews = reviews.filter(r => r.productId === selectedProduct.id);
                      const reviewCount = productReviews.length;
                      const averageRating = reviewCount > 0
                        ? Math.round((productReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount) * 10) / 10
                        : (((selectedProduct.id.charCodeAt(3) || 4) % 2 === 0) ? 4 : 5);
                      return (
                        <div className="flex items-center space-x-2 pt-1">
                          {renderStars(Math.round(averageRating))}
                          <span className="text-[10px] text-slate-500 font-black">
                            {averageRating.toFixed(1)} / 5.0
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold">
                            ({reviewCount} {language === 'en' ? 'Reviews' : 'විචාරණ'})
                          </span>
                        </div>
                      );
                    })()}

                    {/* Product Description */}
                    {(language === 'si' ? selectedProduct.descriptionSi : selectedProduct.descriptionEn) && (
                      <p className="text-xs text-slate-600 leading-relaxed font-medium bg-slate-50/50 p-4.5 rounded-2xl border border-slate-100/50 mt-3 whitespace-pre-line">
                        {language === 'si' ? selectedProduct.descriptionSi : selectedProduct.descriptionEn}
                      </p>
                    )}
                  </div>

                  {/* Pricing Info */}
                  <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{language === 'en' ? 'Price' : 'මිල'}</div>
                      <div className="flex items-baseline space-x-2.5 mt-0.5">
                        <span className={`text-lg md:text-2xl font-black ${theme.text} font-outfit`}>
                          Rs. {selectedProduct.retailPrice.toLocaleString()}
                        </span>
                        <span className="text-xs text-slate-400 line-through font-semibold">
                          Rs. {Math.round(selectedProduct.retailPrice * 1.18).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      {selectedProduct.stock === 'Unlimited' || selectedProduct.stock > 3 ? (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                          {language === 'en' ? 'In Stock' : 'තොග ඇත'}
                        </span>
                      ) : selectedProduct.stock > 0 ? (
                        <span className="bg-amber-50 text-amber-700 border border-amber-100 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mr-1.5 animate-pulse"></span>
                          {language === 'en' ? `Only ${selectedProduct.stock} Left` : `ඉතිරි ${selectedProduct.stock}`}
                        </span>
                      ) : (
                        <span className="bg-rose-50 text-rose-700 border border-rose-100 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-500 mr-1.5 animate-ping"></span>
                          {language === 'en' ? 'Out of Stock' : 'තොග අවසන්'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      onClick={() => addToCart(selectedProduct)}
                      disabled={selectedProduct.stock !== 'Unlimited' && selectedProduct.stock <= 0}
                      className={`flex-1 py-3 px-6 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                        selectedProduct.stock !== 'Unlimited' && selectedProduct.stock <= 0
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : `${theme.bg} ${theme.hoverBg} text-white shadow-lg ${theme.shadow} hover:shadow-xl active:scale-95 cursor-pointer`
                      }`}
                    >
                      <ShoppingCart className="h-4 w-4" />
                      <span>{t.addToCart}</span>
                    </button>
                    
                    <a
                      href={`https://wa.me/${(settings.onlinePhone || settings.shopPhone || '+94 71 83 00 589').replace(/[^0-9]/g, '').replace(/^0/, '94')}?text=${encodeURIComponent(
                        language === 'en'
                          ? `Hello! I want to order the following product:\n- Product: ${selectedProduct.nameEn}\n- Price: Rs. ${selectedProduct.retailPrice.toLocaleString()}\n- ID: ${selectedProduct.id}\nThank you!`
                          : `ආයුබෝවන්! මට මෙම භාණ්ඩය ඇණවුම් කිරීමට අවශ්‍යයි:\n- භාණ්ඩය: ${selectedProduct.nameSi || selectedProduct.nameEn}\n- මිල: Rs. ${selectedProduct.retailPrice.toLocaleString()}\n- අංකය: ${selectedProduct.id}\nස්තූතියි!`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white py-3 px-6 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 cursor-pointer text-center"
                    >
                      <span className="text-lg leading-none">💬</span>
                      <span>WhatsApp Order</span>
                    </a>
                  </div>

                  {/* Delivery details banner */}
                  <div className="border border-slate-100 bg-slate-50/30 rounded-2xl p-4 space-y-2.5">
                    <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-0.5">
                      Delivery & Returns
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[10px] font-bold text-slate-600">
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-[11px]">🚚</span>
                        <span>Islandwide Delivery</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-[11px]">💵</span>
                        <span>Cash On Delivery</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-[11px]">↩️</span>
                        <span>7 Days Returns</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Customer Reviews Section */}
              <div className="border-t border-slate-100 pt-8 mt-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider font-outfit">
                      {language === 'en' ? 'Customer Reviews' : 'පාරිභෝගික ප්‍රතිචාර'}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                      {language === 'en' ? 'Real feedback from verified buyers' : 'මිලදී ගත් පාරිභෝගිකයින්ගේ සැබෑ ප්‍රතිචාර'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setIsWriteReviewOpen(!isWriteReviewOpen);
                      setReviewError('');
                      setReviewSuccess('');
                    }}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
                      isWriteReviewOpen 
                        ? 'bg-slate-100 text-slate-600' 
                        : `${theme.bg} ${theme.hoverBg} text-white shadow-md ${theme.shadow}`
                    }`}
                  >
                    {isWriteReviewOpen 
                      ? (language === 'en' ? 'Close Review Form' : 'පියවන්න') 
                      : (language === 'en' ? 'Write a Review' : 'ප්‍රතිචාරයක් ලියන්න')}
                  </button>
                </div>

                {/* Review Success / Error alerts */}
                {reviewSuccess && (
                  <div className="p-4 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-2xl border border-emerald-100 animate-in fade-in slide-in-from-top-2 duration-200">
                    {reviewSuccess}
                  </div>
                )}

                {/* Write a Review Form */}
                {isWriteReviewOpen && (
                  <form onSubmit={handleAddReview} className="bg-slate-50/50 p-5 rounded-3xl border border-slate-150 space-y-4 animate-in fade-in slide-in-from-top-3 duration-250">
                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                      {language === 'en' ? 'Submit Your Feedback' : 'ප්‍රතිචාර පෝරමය'}
                    </h4>
                    
                    {reviewError && (
                      <div className="p-3.5 bg-rose-50 text-rose-800 text-xs font-bold rounded-xl border border-rose-100">
                        {reviewError}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-450 uppercase tracking-wider">{language === 'en' ? 'Your Name' : 'ඔබගේ නම'} *</label>
                        <input
                          type="text"
                          required
                          value={reviewName}
                          onChange={e => setReviewName(e.target.value)}
                          placeholder="e.g. Nimal Silva"
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400 text-xs font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-450 uppercase tracking-wider">{language === 'en' ? 'Phone Number (For verification)' : 'දුරකථන අංකය (සත්‍යාපනය සඳහා)'} *</label>
                        <input
                          type="tel"
                          required
                          value={reviewPhone}
                          onChange={e => setReviewPhone(e.target.value)}
                          placeholder="e.g. 0771234567"
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400 text-xs font-bold"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-450 uppercase tracking-wider block">{language === 'en' ? 'Rating' : 'තරු ප්‍රමාණය'} *</label>
                      <div className="flex items-center space-x-2">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewRating(star)}
                            className="text-2xl transition hover:scale-110 focus:outline-none"
                          >
                            <span className={star <= reviewRating ? 'text-amber-400' : 'text-slate-250'}>★</span>
                          </button>
                        ))}
                        <span className="text-xs text-slate-400 font-bold ml-2">({reviewRating} / 5)</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-450 uppercase tracking-wider">{language === 'en' ? 'Your Review' : 'ප්‍රතිචාරය'} *</label>
                      <textarea
                        required
                        rows={3}
                        value={reviewComment}
                        onChange={e => setReviewComment(e.target.value)}
                        placeholder={language === 'en' ? 'Share your experience with this product...' : 'මෙම භාණ්ඩය පිළිබඳ ඔබේ අදහස ලියන්න...'}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400 text-xs font-medium"
                      />
                    </div>

                    <button
                      type="submit"
                      className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-wider text-white transition-all shadow-md active:scale-95 ${theme.bg} ${theme.hoverBg}`}
                    >
                      {language === 'en' ? 'Submit Review' : 'ප්‍රතිචාරය යොමු කරන්න'}
                    </button>
                  </form>
                )}

                {/* Rating breakdown summary block */}
                {(() => {
                  const productReviews = reviews.filter(r => r.productId === selectedProduct.id);
                  const reviewCount = productReviews.length;
                  const averageRating = reviewCount > 0
                    ? Math.round((productReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount) * 10) / 10
                    : 4.8;
                  
                  // Calculate star counts
                  const starCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
                  productReviews.forEach(r => {
                    if (r.rating >= 1 && r.rating <= 5) {
                      starCounts[r.rating as 5|4|3|2|1]++;
                    }
                  });

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center bg-slate-50/20 p-5 rounded-3xl border border-slate-100">
                      {/* Big Average Score */}
                      <div className="text-center md:border-r border-slate-100 md:pr-6 space-y-1">
                        <div className="text-4xl font-black text-slate-800 font-outfit leading-none">
                          {averageRating.toFixed(1)}
                        </div>
                        <div className="flex justify-center py-1">
                          {renderStars(Math.round(averageRating))}
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          {reviewCount} {language === 'en' ? 'Verified Reviews' : 'විචාරණ එකතුව'}
                        </div>
                      </div>

                      {/* Progress Bars */}
                      <div className="md:col-span-2 space-y-2">
                        {([5, 4, 3, 2, 1] as const).map(stars => {
                          const count = starCounts[stars] || 0;
                          const percentage = reviewCount > 0 ? (count / reviewCount) * 100 : 0;
                          return (
                            <div key={stars} className="flex items-center text-[10px] font-bold text-slate-600">
                              <span className="w-12 text-right mr-3 flex items-center justify-end">{stars} ★</span>
                              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${theme.bg} rounded-full`}
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                              <span className="w-10 text-left ml-3 text-slate-450 font-semibold">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Review listing */}
                {(() => {
                  const productReviews = reviews.filter(r => r.productId === selectedProduct.id);
                  if (productReviews.length === 0) {
                    return (
                      <div className="text-center py-8 text-slate-400 text-xs font-semibold">
                        {language === 'en' ? 'No reviews yet for this product.' : 'මෙම භාණ්ඩය සඳහා තවමත් ප්‍රතිචාර නොමැත.'}
                      </div>
                    );
                  }
                  return (
                    <div className="space-y-4">
                      {productReviews.map(rev => (
                        <div key={rev.id} className="bg-white border border-slate-100 p-4.5 rounded-2xl shadow-sm hover:border-slate-150 transition space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <div className="flex items-center space-x-2">
                                <span className="text-xs font-black text-slate-800">{rev.customerName}</span>
                                {rev.isVerified && (
                                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider inline-flex items-center">
                                    ✓ {language === 'en' ? 'Verified Buyer' : 'මිලදී ගත් අයෙකි'}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center space-x-1.5">
                                {renderStars(rev.rating)}
                                <span className="text-[9px] text-slate-400 font-semibold">
                                  {new Date(rev.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                            </div>
                          </div>
                          <p className="text-xs text-slate-650 font-medium leading-relaxed">
                            {rev.comment}
                          </p>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Related Products shelf */}
              {relatedProducts.length > 0 && (
                <div className="border-t border-slate-100 pt-8 space-y-4">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider font-outfit">
                    {language === 'en' ? 'Related Products' : 'සම්බන්ධිත භාණ්ඩ'}
                  </h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {relatedProducts.map(p => {
                      const discountPct = Math.round(((Math.round(p.retailPrice * 1.18) - p.retailPrice) / Math.round(p.retailPrice * 1.18)) * 100);
                      return (
                        <div
                          key={p.id}
                          onClick={() => setSelectedProduct(p)}
                          className="bg-white border border-slate-100 hover:border-slate-205 p-3 rounded-2xl cursor-pointer hover:shadow-md transition duration-300 flex flex-col justify-between group h-full"
                        >
                          <div className="space-y-2">
                            <div className="h-28 bg-slate-50 rounded-xl overflow-hidden flex items-center justify-center p-2 relative">
                              {p.imageUrl ? (
                                <img src={p.imageUrl} alt={p.nameEn} className="h-full w-auto object-contain group-hover:scale-105 transition-transform duration-300" />
                              ) : (
                                <div className="text-slate-350">{getCategoryIcon(p.category, "w-8 h-8")}</div>
                              )}
                              {discountPct > 5 && (
                                <span className="absolute top-1.5 left-1.5 bg-rose-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-sm">
                                  -{discountPct}%
                                </span>
                              )}
                            </div>
                            <h4 className="text-[11px] font-extrabold text-slate-700 line-clamp-2 leading-snug group-hover:text-slate-900 transition-colors">
                              {language === 'si' ? (p.nameSi || p.nameEn) : p.nameEn}
                            </h4>
                          </div>
                          
                          <div className="flex items-baseline space-x-1.5 mt-2 pt-2 border-t border-slate-100">
                            <span className={`text-xs font-black ${theme.text}`}>Rs. {p.retailPrice.toLocaleString()}</span>
                            <span className="text-[9px] text-slate-400 line-through">Rs. {Math.round(p.retailPrice * 1.18).toLocaleString()}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>

            {/* Bottom Actions footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                onClick={() => setSelectedProduct(null)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-750 px-6 py-2.5 rounded-xl text-xs font-black transition cursor-pointer w-full sm:w-auto"
              >
                {t.close}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
