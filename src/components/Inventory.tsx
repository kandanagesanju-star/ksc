import React, { useState, useMemo, useRef } from 'react';
import { Product, Category, ProductSource, ShopSettings } from '../types';
import { translations } from '../lib/translations';
import { Plus, Search, Edit, Copy, Trash2, AlertTriangle, Check, RefreshCw, X, Laptop, ChevronLeft, ChevronRight, Upload, Download, FileText, QrCode, Image, Printer } from 'lucide-react';

interface InventoryProps {
  language: 'en' | 'si';
  products: Product[];
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  categories: string[];
  onAddCategory: (cat: string) => void;
  onBulkProductsImport?: (products: Product[]) => void;
  settings: ShopSettings;
}

export const Inventory: React.FC<InventoryProps> = ({
  language,
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  categories,
  onAddCategory,
  onBulkProductsImport,
  settings
}) => {
  const t = translations[language];

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');

  // Pagination State (Pages 1, 2, 3...)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25; // Balanced list size for comprehensive inventory view

  // Form states
  const [isModalOpen, setIsNewModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Barcode Printing & Multiselect states
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [labelWidth, setLabelWidth] = useState(160);
  const [labelHeight, setLabelHeight] = useState(90);
  const [labelFontSize, setLabelFontSize] = useState(9);
  const [labelColumns, setLabelColumns] = useState(3);
  const [labelQuantities, setLabelQuantities] = useState<Record<string, number>>({});

  // Form fields
  const [id, setId] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [nameSi, setNameSi] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [descriptionSi, setDescriptionSi] = useState('');
  const [category, setCategory] = useState<Category>('Phone Accessories');
  const [source, setSource] = useState<ProductSource>('Supplier Purchased');
  const [costPrice, setCostPrice] = useState<number>(0);
  const [retailPrice, setRetailPrice] = useState<number>(0);
  const [wholesalePrice, setWholesalePrice] = useState<number>(0);
  const [wholesaleMinQty, setWholesaleMinQty] = useState<number>(5);
  const [stockType, setStockType] = useState<'Limited' | 'Unlimited'>('Limited');
  const [stockQty, setStockQty] = useState<number>(10);
  const [lowStockAlert, setLowStockAlert] = useState<number>(3);
  const [brand, setBrand] = useState('Generic');
  const [rackLocation, setRackLocation] = useState('Counter');
  const [isWeighted, setIsWeighted] = useState(false);
  const [isTaxable, setIsTaxable] = useState(true);
  const [imageUrl, setImageUrl] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [imageTab, setImageTab] = useState<'url' | 'upload'>('url');
  const [batches, setBatches] = useState<{ id: string; expiryDate: string; qty: number; }[]>([]);
  const imageFileRef = useRef<HTMLInputElement>(null);
  const csvImportRef = useRef<HTMLInputElement>(null);

  // Generate LK tax-compliant product code: LK-{CAT_ABBR}-{5-digit random}
  const generateProductCode = (cat: string) => {
    const abbr = cat.replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 3).padEnd(3, 'X');
    const num = Math.floor(10000 + Math.random() * 90000);
    return `LK-${abbr}-${num}`;
  };

  const addBatchRow = () => {
    setBatches(prev => [
      ...prev,
      {
        id: `BATCH-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        qty: 10
      }
    ]);
  };

  const updateBatchRow = (index: number, field: 'expiryDate' | 'qty', value: any) => {
    setBatches(prev => prev.map((b, idx) => idx === index ? { ...b, [field]: value } : b));
  };

  const removeBatchRow = (index: number) => {
    setBatches(prev => prev.filter((_, idx) => idx !== index));
  };



  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      const matchesSearch = 
        p.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.nameSi.includes(searchQuery) ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Paginated Products
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPage]);

  // Reset to first page on search/filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

  // Open modal for new product
  const openNewModal = () => {
    setEditingProduct(null);
    setId(generateProductCode('Phone Accessories'));
    setNameEn('');
    setNameSi('');
    setDescriptionEn('');
    setDescriptionSi('');
    setCategory('Phone Accessories');
    setSource('Supplier Purchased');
    setCostPrice(0);
    setRetailPrice(0);
    setWholesalePrice(0);
    setWholesaleMinQty(5);
    setStockType('Limited');
    setStockQty(10);
    setLowStockAlert(3);
    setBrand('Generic');
    setRackLocation('Counter');
    setIsWeighted(false);
    setIsTaxable(true);
    setImageUrl('');
    setQrCode('');
    setImageTab('url');
    setBatches([]);
    setIsNewModalOpen(true);
  };

  // Open modal for editing
  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setId(product.id);
    setNameEn(product.nameEn);
    setNameSi(product.nameSi);
    setDescriptionEn(product.descriptionEn || '');
    setDescriptionSi(product.descriptionSi || '');
    setCategory(product.category);
    setSource(product.source);
    setCostPrice(product.costPrice);
    setRetailPrice(product.retailPrice);
    setWholesalePrice(product.wholesalePrice);
    setWholesaleMinQty(product.wholesaleMinQty);
    setStockType(product.stock === 'Unlimited' ? 'Unlimited' : 'Limited');
    setStockQty(product.stock === 'Unlimited' ? 0 : product.stock);
    setLowStockAlert(product.lowStockAlert);
    setBrand(product.brand || 'Generic');
    setRackLocation(product.rackLocation || 'Counter');
    setIsWeighted(product.isWeighted || false);
    setIsTaxable(product.isTaxable !== undefined ? product.isTaxable : true);
    setImageUrl(product.imageUrl || '');
    setQrCode((product as any).qrCode || '');
    if (product.imageUrl && product.imageUrl.startsWith('data:image')) {
      setImageTab('upload');
    } else {
      setImageTab('url');
    }
    setBatches(product.batches || []);
    setIsNewModalOpen(true);
  };

  // Open modal with copied data to duplicate/clone product
  const openDuplicateModal = (product: Product) => {
    setEditingProduct(null); // Save as NEW product
    setId(generateProductCode(product.category));
    setNameEn(`${product.nameEn} (Copy)`);
    setNameSi(`${product.nameSi} (පිටපත)`);
    setDescriptionEn(product.descriptionEn || '');
    setDescriptionSi(product.descriptionSi || '');
    setCategory(product.category);
    setSource(product.source);
    setCostPrice(product.costPrice);
    setRetailPrice(product.retailPrice);
    setWholesalePrice(product.wholesalePrice);
    setWholesaleMinQty(product.wholesaleMinQty);
    setStockType(product.stock === 'Unlimited' ? 'Unlimited' : 'Limited');
    setStockQty(product.stock === 'Unlimited' ? 0 : product.stock);
    setLowStockAlert(product.lowStockAlert);
    setBrand(product.brand || 'Generic');
    setRackLocation(product.rackLocation || 'Counter');
    setIsWeighted(product.isWeighted || false);
    setIsTaxable(product.isTaxable !== undefined ? product.isTaxable : true);
    setImageUrl(product.imageUrl || '');
    setQrCode('');
    if (product.imageUrl && product.imageUrl.startsWith('data:image')) {
      setImageTab('upload');
    } else {
      setImageTab('url');
    }
    setBatches(product.batches || []);
    setIsNewModalOpen(true);
  };

  // Handle Form Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameEn.trim() || !nameSi.trim()) {
      alert(language === 'en' ? 'Product names are required!' : 'භාණ්ඩයේ නම ඇතුළත් කිරීම අනිවාර්ය වේ!');
      return;
    }

    const calculatedStockQty = (stockType === 'Limited' && batches.length > 0)
      ? batches.reduce((sum, b) => sum + Number(b.qty), 0)
      : stockQty;

    const targetStock = stockType === 'Unlimited' ? 'Unlimited' : calculatedStockQty;

    const productData: Product = {
      id,
      nameEn: nameEn.trim(),
      nameSi: nameSi.trim(),
      descriptionEn: descriptionEn.trim() || undefined,
      descriptionSi: descriptionSi.trim() || undefined,
      category,
      source,
      costPrice,
      retailPrice,
      wholesalePrice,
      wholesaleMinQty,
      stock: targetStock,
      lowStockAlert,
      brand,
      rackLocation,
      isWeighted,
      isTaxable,
      imageUrl: imageUrl.trim() || undefined,
      batches: stockType === 'Limited' && batches.length > 0 ? batches : undefined,
      ...(qrCode.trim() ? { qrCode: qrCode.trim() } : {})
    };

    if (editingProduct) {
      onUpdateProduct(productData);
    } else {
      onAddProduct(productData);
    }

    setIsNewModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-lg font-bold text-slate-800 flex items-center">
          <Laptop className="h-5 w-5 mr-2 text-blue-600 animate-pulse" />
          {t.inventoryTitle}
        </h2>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={openNewModal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-md flex items-center"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            {t.addProduct}
          </button>

          {/* CSV Import */}
          <button
            onClick={() => csvImportRef.current?.click()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl text-xs font-bold transition shadow-md flex items-center gap-1.5"
            title="Import products from CSV/Excel"
          >
            <Upload className="h-4 w-4" />
            Import CSV
          </button>

          {selectedProductIds.length > 0 && (
            <button
              onClick={() => {
                const qtys: Record<string, number> = {};
                selectedProductIds.forEach(id => {
                  qtys[id] = 1;
                });
                setLabelQuantities(qtys);
                setShowPrintModal(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-xl text-xs font-bold transition shadow-md flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>Print Barcodes ({selectedProductIds.length})</span>
            </button>
          )}
          <input ref={csvImportRef} type="file" accept=".csv,.xlsx,.txt" className="hidden" onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
              const text = ev.target?.result as string;
              const lines = text.split('\n').filter(l => l.trim());
              if (lines.length === 0) return;
              
              const firstLine = lines[0];
              const separator = firstLine.includes(';') ? ';' : ',';
              const headers = firstLine.split(separator).map(h => h.trim().toLowerCase().replace(/["\r\uFEFF]/g, ''));
              
              let importedCount = 0;
              let updatedCount = 0;
              const parsedProductsList: Product[] = [];
              const seenIdsInImport = new Set<string>();
              
              const existingProductsMap = new Map<string, Product>();
              products.forEach(p => existingProductsMap.set(p.id, p));
              
              for (let i = 1; i < lines.length; i++) {
                const cols = lines[i].split(separator).map(c => c.trim().replace(/["\r]/g, ''));
                const get = (key: string) => cols[headers.indexOf(key)] || '';
                
                const nameEn = get('nameen') || get('name') || get('product name');
                if (!nameEn) continue; // Skip items without English name
                
                const categoryVal = get('category') || 'General';
                const productId = get('id') || get('code') || get('product id') || generateProductCode(categoryVal);
                
                // Skip duplicates in the CSV file itself
                if (seenIdsInImport.has(productId)) {
                  continue;
                }
                seenIdsInImport.add(productId);

                // Sanitize and default numbers to 0
                const costPriceVal = Math.max(0, Number(get('costprice') || get('cost')) || 0);
                const retailPriceVal = Math.max(0, Number(get('retailprice') || get('price') || get('retail')) || 0);
                const wholesalePriceVal = Math.max(0, Number(get('wholesaleprice') || get('wholesale')) || 0);
                const wholesaleMinQtyVal = Math.max(1, Number(get('wholesaleminqty') || get('minqty')) || 5);
                const lowStockAlertVal = Math.max(0, Number(get('lowstockalert') || get('lowstock')) || 3);
                
                let stockVal: 'Unlimited' | number = 0;
                const rawStock = get('stock') || get('qty') || get('quantity');
                if (rawStock === 'Unlimited') {
                  stockVal = 'Unlimited';
                } else {
                  stockVal = Math.max(0, Number(rawStock) || 0);
                }

                const newProd: Product = {
                  id: productId,
                  nameEn,
                  nameSi: get('namesi') || get('sinhala') || nameEn,
                  category: categoryVal,
                  source: (get('source') as any) || 'Supplier Purchased',
                  costPrice: costPriceVal,
                  retailPrice: retailPriceVal,
                  wholesalePrice: wholesalePriceVal,
                  wholesaleMinQty: wholesaleMinQtyVal,
                  stock: stockVal,
                  lowStockAlert: lowStockAlertVal,
                  brand: get('brand') || 'Generic',
                  rackLocation: get('racklocation') || get('rack') || 'Counter',
                  isWeighted: get('isweighted') === 'true' || get('isweighted') === 'yes',
                  isTaxable: get('istaxable') !== 'false' && get('istaxable') !== 'no',
                  imageUrl: get('imageurl') || undefined,
                };
                
                parsedProductsList.push(newProd);
                if (existingProductsMap.has(productId)) {
                  updatedCount++;
                } else {
                  importedCount++;
                }
              }
              
              if (parsedProductsList.length > 0) {
                if (onBulkProductsImport) {
                  onBulkProductsImport(parsedProductsList);
                } else {
                  parsedProductsList.forEach(p => {
                    if (existingProductsMap.has(p.id)) {
                      onUpdateProduct(p);
                    } else {
                      onAddProduct(p);
                    }
                  });
                }
              }
              
              alert(
                language === 'en'
                  ? `Successfully processed inventory data!\nAdded: ${importedCount} new products.\nUpdated: ${updatedCount} existing products.`
                  : `තොග දත්ත සාර්ථකව සකසන ලදී!\nනව භාණ්ඩ: ${importedCount} ඇතුළත් කරන ලදී.\\nපවතින භාණ්ඩ: ${updatedCount} යාවත්කාලීන කරන ලදී.`
              );
            };
            reader.readAsText(file);
            e.target.value = '';
          }} />

          {/* Download CSV Template */}
          <button
            onClick={() => {
              const headers = ['ID','NameEn','NameSi','Category','Brand','CostPrice','RetailPrice','WholesalePrice','WholesaleMinQty','Stock','LowStockAlert','RackLocation','IsWeighted','IsTaxable','ImageUrl'];
              const sampleRow = ['LK-PHN-10023','Tempered Glass S23','ටෙම්පර්ඩ් ග්ලාස් S23','Phone Accessories','Anker','150','350','280','5','25','3','Drawer A','false','true',''];
              const csv = [headers, sampleRow].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
              const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a'); a.href = url; a.download = 'inventory_template.csv'; a.click();
            }}
            className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-205 px-3 py-2 rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5"
            title="Download blank CSV template for Excel"
          >
            <Download className="h-4 w-4 text-blue-500" />
            Template
          </button>

          {/* Export CSV */}
          <button
            onClick={() => {
              const headers = ['ID','NameEn','NameSi','Category','Brand','CostPrice','RetailPrice','WholesalePrice','WholesaleMinQty','Stock','LowStockAlert','RackLocation','IsWeighted','IsTaxable','ImageUrl'];
              const rows = products.map(p => [
                p.id, p.nameEn, p.nameSi, p.category, p.brand,
                p.costPrice, p.retailPrice, p.wholesalePrice, p.wholesaleMinQty,
                p.stock, p.lowStockAlert, p.rackLocation,
                p.isWeighted ? 'true' : 'false',
                p.isTaxable ? 'true' : 'false',
                p.imageUrl || ''
              ]);
              const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
              const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a'); a.href = url; a.download = 'inventory_export.csv'; a.click();
            }}
            className="bg-slate-700 hover:bg-slate-805 text-white px-3 py-2 rounded-xl text-xs font-bold transition shadow-md flex items-center gap-1.5"
          >
            <Download className="h-4 w-4 text-slate-300" />
            Export CSV
          </button>

          {/* Export PDF */}
          <button
            onClick={() => {
              const rows = products.map(p => `<tr><td>${p.id}</td><td>${p.nameEn}</td><td>${p.nameSi}</td><td>${p.category}</td><td>Rs.${p.retailPrice}</td><td>Rs.${p.wholesalePrice}</td><td>${p.stock}</td></tr>`).join('');
              const html = `<!DOCTYPE html><html><head><title>Inventory Report</title><style>body{font-family:Arial;font-size:11px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:4px 8px;text-align:left}th{background:#1e293b;color:white}tr:nth-child(even){background:#f8fafc}h2{color:#1e293b}</style></head><body><h2>Inventory Report</h2><p>${new Date().toLocaleString()}</p><table><tr><th>ID</th><th>Name (EN)</th><th>Name (SI)</th><th>Category</th><th>Retail Price</th><th>Wholesale Price</th><th>Stock</th></tr>${rows}</table></body></html>`;
              const w = window.open('', '_blank');
              if (w) { w.document.write(html); w.document.close(); w.focus(); setTimeout(() => w.print(), 500); }
            }}
            className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-2 rounded-xl text-xs font-bold transition shadow-md flex items-center gap-1.5"
          >
            <FileText className="h-4 w-4" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder={language === 'en' ? 'Search by name, ID or category...' : 'නම, අංකය හෝ වර්ගයෙන් සොයන්න...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-xs font-bold text-slate-800"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value as any)}
          className="bg-slate-50 border border-slate-200 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
        >
          <option value="All">{t.allCategories}</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{(t as any)[cat] || cat}</option>
          ))}
        </select>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-400 font-extrabold text-[10px] tracking-wider border-b border-slate-100">
                <th className="py-4 px-4 text-center w-10">
                  <input
                    type="checkbox"
                    checked={selectedProductIds.length === paginatedProducts.length && paginatedProducts.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedProductIds(paginatedProducts.map(p => p.id));
                      } else {
                        setSelectedProductIds([]);
                      }
                    }}
                    className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="py-4 px-6">ID</th>
                <th className="py-4 px-6">PRODUCT NAME</th>
                <th className="py-4 px-6">BRAND & LOCATION</th>
                <th className="py-4 px-6">TAX & WEIGHT</th>
                <th className="py-4 px-6 text-right">COST</th>
                <th className="py-4 px-6 text-right">RETAIL</th>
                <th className="py-4 px-6 text-right">WHOLESALE</th>
                <th className="py-4 px-6 text-center">STOCK</th>
                <th className="py-4 px-6 text-center">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 font-medium">
                    No products found matching filters.
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((p) => {
                  const isLowStock = p.stock !== 'Unlimited' && p.stock <= p.lowStockAlert;
                  const isOutOfStock = p.stock !== 'Unlimited' && p.stock <= 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-4 px-4 text-center w-10">
                        <input
                          type="checkbox"
                          checked={selectedProductIds.includes(p.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProductIds(prev => [...prev, p.id]);
                            } else {
                              setSelectedProductIds(prev => prev.filter(id => id !== p.id));
                            }
                          }}
                          className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-400">{p.id}</td>
                      <td className="py-4 px-6 min-w-[200px]">
                        <div className="font-bold text-slate-800">{p.nameEn}</div>
                        <div className="text-[10px] text-slate-400">{p.nameSi}</div>
                        <div className="flex flex-wrap items-center gap-1 mt-1">
                          <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[9px] font-bold inline-block">
                            {(t as any)[p.category]}
                          </span>
                          {p.batches && p.batches.length > 0 && p.batches.map((b, idx) => (
                            <span key={idx} className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded text-[8px] font-extrabold border border-amber-200 whitespace-nowrap">
                              Exp: {b.expiryDate} ({b.qty})
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-slate-800 font-bold">{p.brand}</div>
                        <div className="text-[10px] text-slate-400">Rack: {p.rackLocation}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col space-y-0.5">
                          <span className={`text-[9px] font-bold ${p.isTaxable ? 'text-blue-600' : 'text-slate-400'}`}>
                            {p.isTaxable ? 'VAT/SSCL Subject' : 'Tax Exempt'}
                          </span>
                          <span className={`text-[9px] font-bold ${p.isWeighted ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {p.isWeighted ? 'Sold by Weight (kg)' : 'Sold by Unit'}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right font-medium text-slate-500">Rs. {p.costPrice.toLocaleString()}</td>
                      <td className="py-4 px-6 text-right font-bold text-slate-800">Rs. {p.retailPrice.toLocaleString()}</td>
                      <td className="py-4 px-6 text-right font-bold text-blue-600">
                        Rs. {p.wholesalePrice.toLocaleString()}
                        <div className="text-[9px] text-slate-400 font-medium">Min: {p.wholesaleMinQty}</div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        {p.stock === 'Unlimited' ? (
                          <span className="text-purple-600 font-extrabold text-xs">∞ {t.unlimited}</span>
                        ) : (
                          <div className="flex flex-col items-center">
                            <span className={`font-extrabold text-sm ${isOutOfStock ? 'text-rose-600' : isLowStock ? 'text-amber-500' : 'text-slate-800'}`}>
                              {p.stock}
                            </span>
                            {isLowStock && (
                              <span className="text-[9px] text-rose-500 font-bold flex items-center animate-pulse mt-0.5">
                                <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                                {p.stock === 0 ? 'Out' : 'Low'}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-1.5 bg-slate-100 hover:bg-blue-100 text-slate-500 hover:text-blue-600 rounded-lg transition"
                            title={t.editProduct}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => openDuplicateModal(p)}
                            className="p-1.5 bg-slate-100 hover:bg-amber-100 text-slate-500 hover:text-amber-600 rounded-lg transition"
                            title={language === 'en' ? 'Duplicate Product' : 'පිටපතක් සාදන්න (Duplicate)'}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(language === 'en' ? 'Are you sure you want to delete this product?' : 'මෙම භාණ්ඩය මකා දැමීමට ඔබට විශ්වාසද?')) {
                                onDeleteProduct(p.id);
                              }
                            }}
                            className="p-1.5 bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 rounded-lg transition"
                            title={t.delete}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2 p-4 bg-slate-50 border-t border-slate-100">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 bg-white border rounded-lg text-xs font-bold hover:bg-slate-50 disabled:opacity-50 transition"
            >
              {language === 'en' ? 'Previous' : 'පෙර'}
            </button>

            {Array.from({ length: totalPages }).map((_, idx) => {
              const pNum = idx + 1;
              return (
                <button
                  key={pNum}
                  onClick={() => setCurrentPage(pNum)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold border transition ${
                    currentPage === pNum 
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : 'bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  {pNum}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 bg-white border rounded-lg text-xs font-bold hover:bg-slate-50 disabled:opacity-50 transition"
            >
              {language === 'en' ? 'Next' : 'මීළඟ'}
            </button>
          </div>
        )}
      </div>

      {/* ADD / EDIT PRODUCT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="bg-slate-950 text-white p-4 flex justify-between items-center">
              <h3 className="text-xs font-bold flex items-center">
                <Laptop className="h-4 w-4 mr-1 text-blue-400" />
                {editingProduct ? t.editProduct : t.addProduct}
              </h3>
              <button onClick={() => setIsNewModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-semibold overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Product ID / Code | QR Code | Category — 3-column balanced row */}
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
                  
                  {/* Product ID/Code - LK tax-compliant */}
                  <div className="space-y-1 flex flex-col justify-between h-full">
                    <label className="font-bold text-slate-500 flex items-center gap-1 h-4">
                      Product ID/Code
                      <span className="text-[8px] bg-blue-50 text-blue-600 border border-blue-200 px-1 py-0.5 rounded font-bold">LK Tax</span>
                    </label>
                    <div className="flex gap-1 h-8">
                      <input
                        type="text"
                        required
                        disabled={editingProduct !== null}
                        value={id}
                        onChange={(e) => setId(e.target.value)}
                        placeholder="LK-PHN-12345"
                        className="w-full px-2 py-1 border border-slate-200 rounded-lg text-slate-800 font-bold bg-slate-50 disabled:opacity-75 text-xs h-full"
                      />
                      {!editingProduct && (
                        <button
                          type="button"
                          onClick={() => setId(generateProductCode(category))}
                          className="w-8 h-full bg-blue-55 border border-blue-200 rounded-lg text-blue-600 hover:bg-blue-100 transition flex items-center justify-center shrink-0"
                          title="Auto-generate"
                        >
                          <RefreshCw className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                    <p className="text-[8px] text-slate-450 leading-tight">Format: LK-CAT-12345 (IRD compliant)</p>
                  </div>

                  {/* QR Code */}
                  <div className="space-y-1 flex flex-col justify-between h-full">
                    <label className="font-bold text-slate-500 flex items-center gap-1 h-4">
                      <QrCode className="h-3 w-3" /> Product QR
                    </label>
                    <div className="flex gap-1 h-8">
                      <input
                        type="text"
                        value={qrCode}
                        onChange={(e) => setQrCode(e.target.value)}
                        placeholder="e.g. barcode scan value"
                        className="w-full px-2 py-1 border border-slate-200 rounded-lg text-slate-800 font-medium text-xs h-full"
                      />
                      <button
                        type="button"
                        onClick={() => setQrCode(id)}
                        className="w-8 h-full bg-blue-55 border border-blue-200 rounded-lg text-blue-600 hover:bg-blue-100 transition flex items-center justify-center shrink-0"
                        title={language === 'en' ? 'Sync with Product ID' : 'ID එක QR එක ලෙස ලබාගන්න'}
                      >
                        <RefreshCw className="h-3 w-3" />
                      </button>
                    </div>
                    <p className="text-[8px] text-slate-450 leading-tight">Barcode / QR scanner reading value</p>
                  </div>

                  {/* Category */}
                  <div className="space-y-1 flex flex-col justify-between h-full">
                    <label className="font-bold text-slate-500 h-4">{t.category}</label>
                    <div className="flex gap-1 h-8">
                      <select
                        value={category}
                        onChange={(e) => { setCategory(e.target.value); if (!editingProduct) setId(generateProductCode(e.target.value)); }}
                        className="w-full px-2 py-1 border border-slate-200 rounded-lg text-slate-800 font-bold bg-white text-xs h-full"
                      >
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{(t as any)[cat] || cat}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          const newCat = prompt(
                            language === 'en' 
                              ? 'Enter new category name:' 
                              : 'නව වර්ගීකරණයේ නම ඇතුළත් කරන්න:'
                          );
                          if (newCat) {
                            onAddCategory(newCat);
                            setCategory(newCat);
                          }
                        }}
                        className="w-8 h-full bg-blue-55 hover:bg-blue-100 active:scale-95 text-blue-600 border border-blue-200 rounded-lg font-bold transition flex items-center justify-center shrink-0"
                        title={language === 'en' ? 'Add New Category' : 'නව වර්ගීකරණයක් එක් කරන්න'}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="text-[8px] text-slate-450 leading-tight">Product inventory classification category</p>
                  </div>
                </div>

                {/* Name EN */}
                <div className="space-y-1 md:col-span-2">
                  <label className="font-bold text-slate-500">{t.productNameEn} *</label>
                  <input
                    type="text"
                    required
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    placeholder="e.g. Samsung Fast Charger"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-bold"
                  />
                </div>

                {/* Name SI */}
                <div className="space-y-1 md:col-span-2">
                  <label className="font-bold text-slate-500">{t.productNameSi} *</label>
                  <input
                    type="text"
                    required
                    value={nameSi}
                    onChange={(e) => setNameSi(e.target.value)}
                    placeholder="උදා: සැම්සුන්ග් වේගවත් චාජරය"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-bold"
                  />
                </div>

                {/* Description EN */}
                <div className="space-y-1 md:col-span-2">
                  <label className="font-bold text-slate-500">English Description (for PDP storefront)</label>
                  <textarea
                    rows={2}
                    value={descriptionEn}
                    onChange={(e) => setDescriptionEn(e.target.value)}
                    placeholder="Provide a detailed product description in English..."
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-medium text-xs font-sans"
                  />
                </div>

                {/* Description SI */}
                <div className="space-y-1 md:col-span-2">
                  <label className="font-bold text-slate-500">Sinhala Description (for PDP storefront)</label>
                  <textarea
                    rows={2}
                    value={descriptionSi}
                    onChange={(e) => setDescriptionSi(e.target.value)}
                    placeholder="භාණ්ඩය පිළිබඳ විස්තරය සිංහලෙන් ඇතුළත් කරන්න..."
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-medium text-xs font-sans"
                  />
                </div>

                {/* Brand */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Brand Name</label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="e.g. Anker"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                  />
                </div>

                {/* Rack Location */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Rack / Cabinet Location</label>
                  <input
                    type="text"
                    value={rackLocation}
                    onChange={(e) => setRackLocation(e.target.value)}
                    placeholder="e.g. Rack A-1"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                  />
                </div>

                {/* Weighted Toggle */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Sold by Weight (Groceries/Veg)?</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button" onClick={() => setIsWeighted(true)}
                      className={`py-1.5 rounded-lg border transition ${
                        isWeighted ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      Yes (by kg)
                    </button>
                    <button
                      type="button" onClick={() => setIsWeighted(false)}
                      className={`py-1.5 rounded-lg border transition ${
                        !isWeighted ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      No (by unit)
                    </button>
                  </div>
                </div>

                {/* Taxable Toggle */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Taxable (VAT + SSCL)?</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button" onClick={() => setIsTaxable(true)}
                      className={`py-1.5 rounded-lg border transition ${
                        isTaxable ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      Yes (VAT/SSCL)
                    </button>
                    <button
                      type="button" onClick={() => setIsTaxable(false)}
                      className={`py-1.5 rounded-lg border transition ${
                        !isTaxable ? 'bg-slate-800 text-white border-slate-800' : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      No (Tax Exempt)
                    </button>
                  </div>
                </div>

                {/* Source */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">{t.source}</label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value as ProductSource)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-bold bg-white"
                  >
                    <option value="Supplier Purchased">{t.supplierPurchased}</option>
                    <option value="Self-Manufactured">{t.selfManufactured}</option>
                    <option value="Service (Unlimited)">{t.unlimitedService}</option>
                  </select>
                </div>

                {/* Image URL + File Upload Tabs */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 flex items-center gap-1">
                    <Image className="h-3 w-3" /> Product Image (Optional)
                  </label>
                  
                  {/* Tab headers */}
                  <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setImageTab('url')}
                      className={`flex-1 py-1 text-[10px] font-bold rounded-md transition ${
                        imageTab === 'url' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Web Image URL
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageTab('upload')}
                      className={`flex-1 py-1 text-[10px] font-bold rounded-md transition ${
                        imageTab === 'upload' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Upload File
                    </button>
                  </div>

                  {/* Tab content */}
                  {imageTab === 'url' ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={imageUrl.startsWith('data:image') ? '' : imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-medium text-xs h-8"
                      />
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => imageFileRef.current?.click()}
                        className="w-full h-8 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-600 rounded-lg font-bold transition flex items-center justify-center gap-1 text-xs"
                        title="Select image from device"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        Select Image File
                      </button>
                      <input
                        ref={imageFileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            setImageUrl(ev.target?.result as string);
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </div>
                  )}

                  {/* Preview section */}
                  {imageUrl && (
                    <div className="flex items-center gap-2 mt-1.5 p-1.5 bg-slate-50 border border-slate-200 rounded-xl animate-in fade-in duration-100">
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-slate-200 bg-white shrink-0">
                        <img src={imageUrl} alt="preview" className="w-full h-full object-cover" onError={() => setImageUrl('')} />
                        <button 
                          type="button" 
                          onClick={() => setImageUrl('')} 
                          className="absolute top-0.5 right-0.5 bg-rose-500 text-white rounded-full p-0.5 hover:bg-rose-600 transition"
                        >
                          <X className="h-2 w-2" />
                        </button>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[9px] font-bold text-slate-500 truncate">{imageUrl.startsWith('data:image') ? 'Uploaded Local Image File' : imageUrl}</p>
                        <p className="text-[8px] text-slate-400">Image loaded successfully</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Cost Price */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">{t.costPrice} *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={costPrice || ''}
                    onChange={(e) => setCostPrice(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-bold"
                  />
                </div>

                {/* Retail Price */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">{t.sellingPriceRetail} *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={retailPrice || ''}
                    onChange={(e) => setRetailPrice(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-bold"
                  />
                </div>

                {/* Wholesale Price */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">{t.sellingPriceWholesale} *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={wholesalePrice || ''}
                    onChange={(e) => setWholesalePrice(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-bold"
                  />
                </div>

                {/* Wholesale Min Qty */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">{t.minWholesaleQty}</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={wholesaleMinQty || ''}
                    onChange={(e) => setWholesaleMinQty(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-bold"
                  />
                </div>

                {/* Stock Type Toggle */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Stock Tracking Mode</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setStockType('Limited')}
                      className={`py-1.5 rounded-lg border transition ${
                        stockType === 'Limited'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      Track Inventory
                    </button>
                    <button
                      type="button"
                      onClick={() => setStockType('Unlimited')}
                      className={`py-1.5 rounded-lg border transition ${
                        stockType === 'Unlimited'
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      {t.unlimited}
                    </button>
                  </div>
                </div>

                {/* Stock Quantity */}
                {stockType === 'Limited' ? (
                  <div className="space-y-1">
                    <label className="font-bold text-slate-500">{t.stockQty}</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={stockQty}
                      onChange={(e) => setStockQty(Number(e.target.value))}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-bold"
                    />
                  </div>
                ) : (
                  <div className="space-y-1 bg-purple-50 p-2 rounded-lg border border-purple-100 flex items-center justify-center text-center text-purple-700 text-[11px]">
                    Unlimited Stock enabled. Perfect for Photocopying, Typing, and Reload services.
                  </div>
                )}

                {/* Low Stock Alert Level */}
                {stockType === 'Limited' && (
                  <div className="space-y-1">
                    <label className="font-bold text-slate-500">{t.lowStockThreshold}</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={lowStockAlert}
                      onChange={(e) => setLowStockAlert(Number(e.target.value))}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-bold"
                    />
                  </div>
                )}
                
                {/* Expiry Batches Section */}
                {stockType === 'Limited' && (
                  <div className="md:col-span-2 space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                      <div>
                        <h4 className="font-extrabold text-slate-800">Product Expiry Batches</h4>
                        <p className="text-[10px] text-slate-400 font-medium">Add multiple batches of this product with different expiry dates.</p>
                      </div>
                      <button
                        type="button"
                        onClick={addBatchRow}
                        className="px-2.5 py-1 bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 rounded-lg font-bold text-[10px] transition"
                      >
                        + Add Batch
                      </button>
                    </div>

                    {batches.length > 0 ? (
                      <div className="space-y-2">
                        {batches.map((batch, index) => (
                          <div key={batch.id} className="flex items-center space-x-2 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                            <div className="flex-1 space-y-1">
                              <label className="text-[9px] font-bold text-slate-450 uppercase">Expiry Date</label>
                              <input
                                type="date"
                                required
                                value={batch.expiryDate}
                                onChange={(e) => updateBatchRow(index, 'expiryDate', e.target.value)}
                                className="w-full px-2 py-1 border border-slate-205 rounded text-slate-800 font-bold bg-white"
                              />
                            </div>
                            <div className="w-24 space-y-1">
                              <label className="text-[9px] font-bold text-slate-450 uppercase">Qty</label>
                              <input
                                type="number"
                                required
                                min="1"
                                value={batch.qty}
                                onChange={(e) => updateBatchRow(index, 'qty', Number(e.target.value))}
                                className="w-full px-2 py-1 border border-slate-205 rounded text-slate-800 font-bold bg-white"
                              />
                            </div>
                            <div className="pt-4">
                              <button
                                type="button"
                                onClick={() => removeBatchRow(index)}
                                className="p-1 text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded border border-rose-100 transition"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                        <div className="text-[10px] text-indigo-550 font-bold bg-indigo-50/50 p-2 rounded-lg border border-indigo-100/40 text-center">
                          Total stock from batches will be automatically calculated: <span className="text-xs font-extrabold text-indigo-700">{batches.reduce((sum, b) => sum + Number(b.qty), 0)}</span> units
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-slate-450 font-medium">
                        No active batches. Stock will rely on the standard stock field above.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-2.5 rounded-xl font-bold transition"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold shadow-md transition"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* BARCODE PRINT PREVIEW & BUILDER MODAL */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:p-0 print:bg-white">
          <style>{`
            @media print {
              body * {
                visibility: hidden;
              }
              #barcode-print-sheet, #barcode-print-sheet * {
                visibility: visible;
              }
              #barcode-print-sheet {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                margin: 0;
                padding: 0;
                box-shadow: none;
                background: white;
              }
            }
          `}</style>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden print:hidden text-xs">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800 shrink-0">
              <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-1.5">
                <Printer className="h-4.5 w-4.5 text-blue-455" />
                Barcode Sticker Label Builder
              </h3>
              <button
                onClick={() => setShowPrintModal(false)}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Layout controls & live preview */}
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 text-slate-300">
              
              {/* LEFT: Adjuster Sliders (lg:col-span-4) */}
              <div className="lg:col-span-4 space-y-4 bg-slate-950/50 p-4 rounded-2xl border border-slate-850">
                <h4 className="font-extrabold text-slate-200 uppercase tracking-wider text-[10px] border-b border-slate-850 pb-1">
                  Sticker Label Layout
                </h4>

                <div className="space-y-1.5">
                  <div className="flex justify-between font-bold text-slate-400">
                    <span>Label Width</span>
                    <span>{labelWidth}px</span>
                  </div>
                  <input
                    type="range" min="100" max="300" step="5"
                    value={labelWidth} onChange={(e) => setLabelWidth(Number(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between font-bold text-slate-400">
                    <span>Label Height</span>
                    <span>{labelHeight}px</span>
                  </div>
                  <input
                    type="range" min="40" max="200" step="5"
                    value={labelHeight} onChange={(e) => setLabelHeight(Number(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between font-bold text-slate-400">
                    <span>Text Size</span>
                    <span>{labelFontSize}px</span>
                  </div>
                  <input
                    type="range" min="8" max="18" step="1"
                    value={labelFontSize} onChange={(e) => setLabelFontSize(Number(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between font-bold text-slate-400">
                    <span>Columns Count</span>
                    <span>{labelColumns} columns</span>
                  </div>
                  <input
                    type="range" min="1" max="5" step="1"
                    value={labelColumns} onChange={(e) => setLabelColumns(Number(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>

                {/* Individual Quantities adjustments */}
                <div className="space-y-2 border-t border-slate-850 pt-3 max-h-[220px] overflow-y-auto">
                  <h5 className="font-bold text-slate-400 text-[10px]">Print Quantities:</h5>
                  {selectedProductIds.map(id => {
                    const prod = products.find(p => p.id === id);
                    if (!prod) return null;
                    const qty = labelQuantities[id] || 1;
                    return (
                      <div key={id} className="flex justify-between items-center gap-2 p-1.5 bg-slate-900 rounded-lg">
                        <span className="font-extrabold truncate text-slate-300 w-24">
                          {language === 'en' ? prod.nameEn : prod.nameSi}
                        </span>
                        <div className="flex items-center space-x-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => setLabelQuantities(prev => ({...prev, [id]: Math.max(1, qty - 1)}))}
                            className="w-5 h-5 flex items-center justify-center bg-slate-800 text-slate-400 rounded hover:bg-slate-700 font-extrabold"
                          >
                            -
                          </button>
                          <span className="w-6 text-center font-black text-white">{qty}</span>
                          <button
                            type="button"
                            onClick={() => setLabelQuantities(prev => ({...prev, [id]: qty + 1}))}
                            className="w-5 h-5 flex items-center justify-center bg-slate-800 text-slate-400 rounded hover:bg-slate-700 font-extrabold"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* RIGHT: Live Preview (lg:col-span-8) */}
              <div className="lg:col-span-8 space-y-3 flex flex-col h-[50vh] lg:h-[60vh]">
                <h4 className="font-extrabold text-slate-400 uppercase tracking-wider text-[10px] shrink-0">
                  Live Sticker Sheet Preview
                </h4>
                
                <div className="flex-1 bg-slate-950 rounded-2xl border border-slate-850 p-6 overflow-auto flex justify-center items-start shadow-inner">
                  <div
                    id="barcode-print-sheet"
                    className="grid gap-4 bg-white p-4 rounded shadow-lg text-black font-sans"
                    style={{
                      gridTemplateColumns: `repeat(${labelColumns}, minmax(0, 1fr))`,
                    }}
                  >
                    {selectedProductIds.flatMap(id => {
                      const prod = products.find(p => p.id === id);
                      if (!prod) return [];
                      const qty = labelQuantities[id] || 1;
                      const stickers = [];
                      for (let i = 0; i < qty; i++) {
                        stickers.push(
                          <div
                            key={`${id}-${i}`}
                            className="border border-slate-350 p-2 flex flex-col justify-between items-center text-center overflow-hidden bg-white shadow-sm rounded"
                            style={{
                              width: `${labelWidth}px`,
                              height: `${labelHeight}px`,
                              fontSize: `${labelFontSize}px`,
                            }}
                          >
                            <span className="font-black uppercase text-[7px] text-slate-500 block w-full truncate border-b border-dashed border-slate-200 pb-0.5 mb-0.5">
                              {settings.shopName}
                            </span>
                            
                            <span className="font-bold text-[7px] text-slate-400 block tracking-wider uppercase mb-0.5">
                              CODE: {prod.id}
                            </span>

                            <div className="font-extrabold text-slate-900 leading-tight w-full truncate">
                              {prod.nameEn}
                            </div>
                            <div className="text-[7.5px] font-bold text-slate-500 leading-tight w-full truncate mb-0.5">
                              {prod.nameSi}
                            </div>

                            <div className="flex flex-col items-center w-full my-0.5">
                              <div className="flex items-center space-x-[1px] justify-center h-4 w-full px-2 overflow-hidden">
                                {[...Array(24)].map((_, idx) => (
                                  <div
                                    key={idx}
                                    className="bg-black"
                                    style={{
                                      width: idx % 3 === 0 ? '2px' : '1px',
                                      height: '100%',
                                    }}
                                  />
                                ))}
                              </div>
                            </div>

                            <div className="font-black text-slate-950 mt-0.5 w-full truncate">
                              Rs. {prod.retailPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                          </div>
                        );
                      }
                      return stickers;
                    })}
                  </div>
                </div>
              </div>

            </div>

            {/* Footer Buttons */}
            <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 shrink-0 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-350 rounded-xl font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition shadow flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Printer className="h-4 w-4" />
                Print Sticker Sheet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
