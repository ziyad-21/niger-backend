import { useState, useEffect, type FormEvent } from 'react';
import { api } from '../lib/api';
import { formatCurrency, cn } from '../lib/utils';
import { 
  Plus, Minus, Send, Clock, Search, Banknote, CreditCard, Sparkles, 
  ShoppingBag, X, ChevronUp, Users, Calculator, CheckSquare, Trash2, Volume2, Check
} from 'lucide-react';
import { useOutletContext } from 'react-router-dom';

type OrderItemDraft = {
  draftId: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  customizations: string[];
  note?: string;
};

export default function WaiterDashboard() {
  const context = useOutletContext<{ isDark?: boolean }>();
  const isDark = context?.isDark ?? false;

  const [activeTab, setActiveTab] = useState<'new' | 'active'>('new');
  const [selectedCategory, setSelectedCategory] = useState<string>('TÜMÜ');
  const [searchQuery, setSearchQuery] = useState('');

  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  // New Order State
  const [tableNumber, setTableNumber] = useState<string>('');
  const [draftItems, setDraftItems] = useState<OrderItemDraft[]>([]);
  const [notes, setNotes] = useState('');

  // Custom Item Input State (Özel İstek / Özel Ekleme)
  const [customItemName, setCustomItemName] = useState('');
  const [customItemPrice, setCustomItemPrice] = useState('');

  // Mobile cart drawer sheet open state
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  // Payment Modal State
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<any | null>(null);
  const [paymentTab, setPaymentTab] = useState<'full' | 'split_equal' | 'split_items'>('full');
  
  // Full Payment & Change Calculator State
  const [cashGiven, setCashGiven] = useState<string>('');
  
  // Equal Split State
  const [personCount, setPersonCount] = useState<number>(2);

  // Item-by-item Split State (selected draft item indices or IDs to pay)
  const [selectedItemIndices, setSelectedItemIndices] = useState<number[]>([]);

  useEffect(() => {
    fetchData();

    const eventSource = new EventSource('/api/events');
    eventSource.onmessage = () => {
      fetchData();
    };
    return () => eventSource.close();
  }, []);

  const fetchData = async () => {
    const [menu, ordersData] = await Promise.all([
      api.getMenu(),
      api.getOrders()
    ]);
    setMenuItems(menu);
    setOrders(ordersData);
  };

  // Sound chime when order is sent to kitchen
  const playSendOrderSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = audioCtx.currentTime;

      // Note 1 (C5)
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.25);

      // Note 2 (E5)
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, now + 0.12);
      gain2.gain.setValueAtTime(0.35, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.45);

      // Note 3 (G5)
      const osc3 = audioCtx.createOscillator();
      const gain3 = audioCtx.createGain();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(783.99, now + 0.24);
      gain3.gain.setValueAtTime(0.4, now + 0.24);
      gain3.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
      osc3.connect(gain3);
      gain3.connect(audioCtx.destination);
      osc3.start(now + 0.24);
      osc3.stop(now + 0.6);
    } catch (e) {
      // Audio context fallback
    }
  };

  // Add individual item instance to draft (allowing distinct customizations per item)
  const handleAddItem = (item: any, customizationText?: string) => {
    const newDraftId = 'draft_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    setDraftItems(prev => [
      ...prev,
      {
        draftId: newDraftId,
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        customizations: customizationText ? [customizationText] : [],
        note: ''
      }
    ]);
  };

  // Remove a single item instance by draftId
  const handleRemoveDraftItem = (draftId: string) => {
    setDraftItems(prev => prev.filter(p => p.draftId !== draftId));
  };

  // Toggle ingredient exclusion tag for a specific item instance
  const handleToggleDraftCustomization = (draftId: string, tag: string) => {
    setDraftItems(prev => prev.map(item => {
      if (item.draftId !== draftId) return item;
      const current = item.customizations || [];
      const updated = current.includes(tag) 
        ? current.filter(t => t !== tag) 
        : [...current, tag];
      return { ...item, customizations: updated };
    }));
  };

  // Update item-specific note
  const handleUpdateDraftNote = (draftId: string, noteText: string) => {
    setDraftItems(prev => prev.map(item => {
      if (item.draftId !== draftId) return item;
      return { ...item, note: noteText };
    }));
  };

  // Add Special Custom Request / Addition to Order
  const handleAddCustomRequest = (e: FormEvent) => {
    e.preventDefault();
    if (!customItemName.trim() || !customItemPrice) return;

    const priceNum = parseFloat(customItemPrice) || 0;
    const newDraftId = 'custom_' + Date.now();

    setDraftItems(prev => [
      ...prev,
      {
        draftId: newDraftId,
        menuItemId: newDraftId,
        name: `★ ${customItemName.trim()}`,
        price: priceNum,
        quantity: 1,
        customizations: [],
        note: ''
      }
    ]);

    setCustomItemName('');
    setCustomItemPrice('');
  };

  const totalAmount = draftItems.reduce((sum, item) => sum + item.price, 0);

  const handleSubmitOrder = async () => {
    if (!tableNumber || draftItems.length === 0) return;

    // Play chime audio notification on order submit
    playSendOrderSound();

    await api.createOrder({
      tableNumber: parseInt(tableNumber),
      items: draftItems,
      totalAmount,
      notes
    });

    setTableNumber('');
    setDraftItems([]);
    setNotes('');
    setIsMobileCartOpen(false);
    setActiveTab('active');
  };

  const activeOrders = orders.filter(o => !['completed', 'paid'].includes(o.status));

  // Dynamic Categories
  const categories = ['TÜMÜ', ...new Set(menuItems.map(item => item.category))];

  const filteredMenuItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'TÜMÜ' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Open Payment Modal
  const handleOpenPaymentModal = (order: any) => {
    setSelectedOrderForPayment(order);
    setPaymentTab('full');
    setCashGiven('');
    setPersonCount(2);
    setSelectedItemIndices([]);
  };

  // Process Full Payment
  const handleCompleteFullPayment = async (paymentMethod: 'cash' | 'card') => {
    if (!selectedOrderForPayment) return;
    await api.updateOrderStatus(selectedOrderForPayment.id, 'paid', paymentMethod);
    setSelectedOrderForPayment(null);
    fetchData();
  };

  // Process Equal Split Partial Payment (e.g. 1 Person's share)
  const handlePayEqualShare = async (paymentMethod: 'cash' | 'card') => {
    if (!selectedOrderForPayment || personCount <= 0) return;
    
    const perPersonShare = selectedOrderForPayment.totalAmount / personCount;
    const remainingAmount = Math.max(0, selectedOrderForPayment.totalAmount - perPersonShare);

    if (remainingAmount <= 1) {
      // Bill fully cleared
      await api.updateOrderStatus(selectedOrderForPayment.id, 'paid', paymentMethod);
    } else {
      // Update order with reduced total amount
      await api.updateOrder(selectedOrderForPayment.id, {
        totalAmount: remainingAmount,
        status: 'waiting_payment'
      });
    }

    // Adjust person count if > 1
    if (personCount > 1) {
      setPersonCount(personCount - 1);
    } else {
      setSelectedOrderForPayment(null);
    }

    fetchData();
  };

  // Process Selected Items Payment
  const handlePaySelectedItems = async (paymentMethod: 'cash' | 'card') => {
    if (!selectedOrderForPayment || selectedItemIndices.length === 0) return;

    const currentItems = [...selectedOrderForPayment.items];
    const remainingItems = currentItems.filter((_, idx) => !selectedItemIndices.includes(idx));
    const newTotal = remainingItems.reduce((acc, item) => acc + (item.price * (item.quantity || 1)), 0);

    if (remainingItems.length === 0 || newTotal <= 0) {
      await api.updateOrderStatus(selectedOrderForPayment.id, 'paid', paymentMethod);
      setSelectedOrderForPayment(null);
    } else {
      await api.updateOrder(selectedOrderForPayment.id, {
        items: remainingItems,
        totalAmount: newTotal,
        status: 'waiting_payment'
      });
      setSelectedItemIndices([]);
    }

    fetchData();
  };

  return (
    <div className={cn(
      "flex flex-col h-full overflow-hidden transition-colors duration-300 relative",
      isDark ? "bg-slate-950 text-slate-100" : "bg-stone-100 text-stone-900"
    )}>
      {/* Top Navigation Header Bar */}
      <div className={cn(
        "px-4 md:px-6 py-3 border-b flex justify-between items-center gap-3 shadow-sm z-20 shrink-0",
        isDark ? "bg-slate-900 border-slate-800" : "bg-white border-stone-200"
      )}>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('new')}
            className={cn(
              "px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm transition-all flex items-center gap-2 shadow-sm",
              activeTab === 'new' 
                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-amber-500/20" 
                : isDark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            )}
          >
            <Plus className="w-4 h-4" />
            Sipariş Al
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={cn(
              "px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm transition-all flex items-center gap-2 shadow-sm relative",
              activeTab === 'active' 
                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-amber-500/20" 
                : isDark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            )}
          >
            <Clock className="w-4 h-4" />
            Aktif Masalar
            {activeOrders.length > 0 && (
              <span className="bg-rose-500 text-white text-[11px] px-2 py-0.5 rounded-full font-black animate-pulse">
                {activeOrders.length}
              </span>
            )}
          </button>
        </div>

        {/* Quick table indicator if draft items exist */}
        {draftItems.length > 0 && (
          <div className="hidden sm:flex items-center gap-2 text-xs font-black text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20">
            <ShoppingBag className="w-4 h-4" />
            <span>{draftItems.length} Adet Ürün Seçildi</span>
          </div>
        )}
      </div>

      {activeTab === 'new' && (
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row relative">
          
          {/* Left Column: Menu Item Selection Catalog */}
          <div className="flex-1 p-3 sm:p-5 overflow-y-auto space-y-4 pb-24 md:pb-5">
            
            {/* SPECIAL CUSTOM REQUEST / ADDITION INPUT CARD */}
            <div className={cn(
              "p-3.5 sm:p-4 rounded-2xl border shadow-md relative overflow-hidden",
              isDark ? "bg-amber-950/40 border-amber-800/80" : "bg-amber-50 border-amber-200"
            )}>
              <div className="flex items-center gap-1.5 mb-2 text-amber-600 dark:text-amber-400 font-black text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Özel Sipariş / Ekstra İstek Ekle</span>
              </div>

              <form onSubmit={handleAddCustomRequest} className="flex flex-col sm:flex-row gap-2">
                <input 
                  type="text"
                  placeholder="İstek adını girin (Örn: Ekstra Sos, Çift Peynir, Soslu Ekmek)"
                  value={customItemName}
                  onChange={e => setCustomItemName(e.target.value)}
                  className={cn(
                    "flex-1 px-3.5 py-2.5 rounded-xl border text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500",
                    isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-amber-300 text-stone-900"
                  )}
                />
                <div className="flex gap-2">
                  <input 
                    type="number"
                    placeholder="Fiyat (₺)"
                    min="0"
                    value={customItemPrice}
                    onChange={e => setCustomItemPrice(e.target.value)}
                    className={cn(
                      "w-24 px-3 py-2.5 rounded-xl border text-xs font-black text-center outline-none focus:ring-2 focus:ring-amber-500",
                      isDark ? "bg-slate-900 border-slate-700 text-amber-300" : "bg-white border-amber-300 text-stone-900"
                    )}
                  />
                  <button
                    type="submit"
                    disabled={!customItemName.trim() || !customItemPrice}
                    className="px-4 py-2.5 bg-amber-500 text-white rounded-xl font-black text-xs hover:bg-amber-600 disabled:opacity-40 transition-all shrink-0 shadow-md shadow-amber-500/20"
                  >
                    + Siparişe Ekle
                  </button>
                </div>
              </form>
            </div>

            {/* Search Bar & Category Tabs */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-stone-400" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Ürün ara... (Kola, Ayran, Köfte, Tost)"
                  className={cn(
                    "w-full pl-10 pr-4 py-2.5 rounded-2xl border font-bold text-xs sm:text-sm outline-none focus:ring-2 focus:ring-amber-500",
                    isDark ? "bg-slate-900 border-slate-800" : "bg-white border-stone-200"
                  )}
                />
              </div>

              {/* Category Pills */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      "px-3.5 py-2 rounded-xl font-black text-[11px] uppercase tracking-wider whitespace-nowrap transition-all shadow-sm",
                      selectedCategory === cat 
                        ? "bg-amber-500 text-white shadow-amber-500/30 scale-[1.02]" 
                        : isDark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-white text-stone-700 hover:bg-stone-200"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Products List Catalog */}
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-2">
              {filteredMenuItems.map(item => {
                const addedCount = draftItems.filter(d => d.menuItemId === item.id).length;

                return (
                  <div
                    key={item.id}
                    className={cn(
                      "p-3 rounded-2xl border shadow-sm flex flex-col justify-between transition-all",
                      isDark ? "bg-slate-900 border-slate-800" : "bg-white border-stone-200/90",
                      addedCount > 0 && "ring-2 ring-amber-500 border-amber-500"
                    )}
                  >
                    {/* Item Title & Price Row */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-black uppercase text-stone-400 block tracking-wider">
                          {item.category}
                        </span>
                        <h4 className="font-extrabold text-sm sm:text-base leading-tight truncate">
                          {item.name}
                        </h4>
                      </div>
                      <div className="text-amber-500 font-black text-sm sm:text-base shrink-0">
                        {formatCurrency(item.price)}
                      </div>
                    </div>

                    {/* Quick Add Buttons */}
                    <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-stone-200/10">
                      <span className="text-[10px] font-extrabold text-stone-400">
                        {addedCount > 0 ? `${addedCount} Adet Sepette` : 'Tıkla & Ekle'}
                      </span>

                      <button
                        onClick={() => handleAddItem(item)}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 text-white flex items-center gap-1 font-extrabold text-xs hover:bg-amber-600 transition-all shadow-md shadow-amber-500/30 active:scale-95"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Siparişe Ekle</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Panel: Order Cart Drawer for Desktop / Collapsible for Mobile */}
          <div className={cn(
            "w-full md:w-96 border-t md:border-t-0 md:border-l flex flex-col shadow-2xl z-30 transition-all duration-300",
            isDark ? "bg-slate-900 border-slate-800" : "bg-white border-stone-200",
            "fixed md:relative bottom-0 left-0 right-0 max-h-[85vh] md:max-h-none",
            !isMobileCartOpen && "translate-y-full md:translate-y-0"
          )}>
            
            {/* Table Number & Drawer Header */}
            <div className="p-3.5 border-b border-stone-200/20 bg-amber-500/10 flex items-center justify-between gap-3 shrink-0">
              <div className="flex-1">
                <label className="block text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">
                  Masa Numarası
                </label>
                <input
                  type="number"
                  value={tableNumber}
                  onChange={e => setTableNumber(e.target.value)}
                  className={cn(
                    "w-full px-3 py-2 rounded-xl border-2 font-black text-lg outline-none focus:ring-2 focus:ring-amber-500 text-center",
                    isDark ? "bg-slate-800 border-amber-500/40 text-amber-300" : "bg-white border-amber-300 text-stone-900"
                  )}
                  placeholder="Masa No (Örn: 3)"
                />
              </div>

              {/* Mobile Close Sheet Button */}
              <button 
                onClick={() => setIsMobileCartOpen(false)}
                className="md:hidden p-2 text-stone-400 hover:text-stone-900"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Selected Items List (Individual customizable items) */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-3 min-h-[160px]">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black uppercase tracking-wider text-stone-400">
                  Sipariş Detayı ({draftItems.length} Parça)
                </h3>
                {draftItems.length > 0 && (
                  <button 
                    onClick={() => setDraftItems([])} 
                    className="text-[10px] font-black text-rose-500 hover:underline"
                  >
                    Temizle
                  </button>
                )}
              </div>
              
              {draftItems.length === 0 ? (
                <div className="text-center text-stone-400 py-10 font-bold text-xs">
                  Henüz sepete ürün eklenmedi
                </div>
              ) : (
                draftItems.map((item, index) => (
                  <div key={item.draftId} className="p-3 rounded-2xl bg-stone-50 dark:bg-slate-800/90 border border-stone-200/30 space-y-2 relative shadow-sm">
                    {/* Item Title, Price & Delete */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-black uppercase text-amber-500">
                          #{index + 1} Ürün
                        </span>
                        <h4 className="font-extrabold text-xs sm:text-sm">{item.name}</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-amber-500">{formatCurrency(item.price)}</span>
                        <button
                          onClick={() => handleRemoveDraftItem(item.draftId)}
                          className="p-1 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors"
                          title="Ürünü Çıkar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Individual Custom Exclusions (Soğansız, Domatessiz...) */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-extrabold text-stone-400 uppercase">Malzeme Çıkar / Ekle:</span>
                      <div className="flex flex-wrap gap-1">
                        {['Soğansız', 'Domatessiz', 'Soslu', 'Acılı', 'Peynirli'].map(tag => {
                          const isSelected = item.customizations?.includes(tag);
                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => handleToggleDraftCustomization(item.draftId, tag)}
                              className={cn(
                                "px-2 py-0.5 rounded-lg text-[10px] transition-all font-black border",
                                isSelected 
                                  ? "bg-rose-500 text-white border-rose-600 shadow-sm" 
                                  : isDark 
                                    ? "bg-slate-900 text-slate-400 border-slate-700 hover:text-white" 
                                    : "bg-white text-stone-600 border-stone-200 hover:bg-stone-100"
                              )}
                            >
                              {isSelected ? `❌ ${tag}` : `+ ${tag}`}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Specific Item Note */}
                    <div>
                      <input 
                        type="text"
                        placeholder="Özel istek (Örn: Az pişmiş, ayrı tabakta)"
                        value={item.note || ''}
                        onChange={e => handleUpdateDraftNote(item.draftId, e.target.value)}
                        className={cn(
                          "w-full px-2.5 py-1 rounded-xl text-[11px] font-bold border outline-none focus:ring-1 focus:ring-amber-500",
                          isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-stone-200 text-stone-900"
                        )}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Overall Notes & Send Bar */}
            <div className="p-3.5 border-t border-stone-200/20 space-y-2.5 shrink-0">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-stone-400 mb-1">
                  Mutfak Genel Notu
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className={cn(
                    "w-full px-3 py-2 rounded-xl border text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500",
                    isDark ? "bg-slate-800 border-slate-700" : "bg-stone-50 border-stone-200"
                  )}
                  placeholder="Hızlı hazırlansın, ekstra peçete..."
                />
              </div>

              <div className="flex justify-between items-center pt-1">
                <span className="text-xs font-black uppercase tracking-wider text-stone-400">Toplam Tutar</span>
                <span className="text-xl font-black text-amber-500">{formatCurrency(totalAmount)}</span>
              </div>

              <button
                onClick={handleSubmitOrder}
                disabled={!tableNumber || draftItems.length === 0}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white rounded-2xl font-black text-sm hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xl shadow-amber-500/30 active:scale-95 transition-all"
              >
                <Volume2 className="w-4 h-4" />
                <Send className="w-4 h-4" />
                MUTFAĞA GÖNDER
              </button>
            </div>
          </div>

          {/* Floating Mobile Cart Summary Bar */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 p-3 bg-slate-900 border-t border-slate-800 text-white z-20 flex items-center justify-between gap-3 shadow-2xl">
            <div>
              <span className="text-[10px] uppercase font-black text-amber-400 block">
                {draftItems.length} Ürün Seçildi
              </span>
              <span className="text-lg font-black text-white">{formatCurrency(totalAmount)}</span>
            </div>

            <button
              onClick={() => setIsMobileCartOpen(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-black text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/30"
            >
              <span>Siparişi İncele</span>
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}

      {/* ACTIVE TABLES TAB */}
      {activeTab === 'active' && (
        <div className="flex-1 p-4 md:p-6 overflow-y-auto">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            {activeOrders.map(order => (
              <div 
                key={order.id} 
                className={cn(
                  "rounded-3xl border p-4 sm:p-5 flex flex-col shadow-lg relative overflow-hidden",
                  isDark ? "bg-slate-900 border-slate-800" : "bg-white border-stone-200"
                )}
              >
                <div className="flex justify-between items-start mb-3 pb-3 border-b border-stone-200/20">
                  <div>
                    <h3 className="text-2xl font-black tracking-tight">Masa #{order.tableNumber}</h3>
                    <p className="text-xs font-bold text-stone-400">Sipariş No: #{order.orderNumber}</p>
                  </div>
                  <span className={cn(
                    "px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-sm",
                    order.status === 'new' && "bg-blue-500 text-white",
                    order.status === 'preparing' && "bg-amber-500 text-white",
                    order.status === 'ready' && "bg-emerald-500 text-white animate-pulse",
                    order.status === 'waiting_payment' && "bg-purple-600 text-white"
                  )}>
                    {order.status === 'new' && 'Mutfakta (Yeni)'}
                    {order.status === 'preparing' && 'Hazırlanıyor'}
                    {order.status === 'ready' && 'Hazır (Servis Et)'}
                    {order.status === 'waiting_payment' && 'Hesap İstendi'}
                  </span>
                </div>

                <div className="flex-1 mb-4 space-y-2">
                  <ul className="space-y-2 text-xs sm:text-sm font-bold">
                    {order.items.map((item: any, i: number) => (
                      <li key={i} className="flex flex-col border-b border-stone-200/10 pb-1.5">
                        <div className="flex justify-between items-center">
                          <span>{item.quantity || 1}x {item.name}</span>
                          <span className="text-stone-400 text-xs">{formatCurrency(item.price * (item.quantity || 1))}</span>
                        </div>
                        {item.customizations && item.customizations.length > 0 && (
                          <div className="text-[10px] text-rose-500 font-extrabold mt-0.5">
                            ❌ {item.customizations.join(', ')}
                          </div>
                        )}
                        {item.note && (
                          <div className="text-[10px] text-amber-500 font-extrabold italic">
                            💬 {item.note}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>

                  {order.notes && (
                    <div className="mt-2 p-2 bg-rose-500/10 text-rose-500 rounded-xl text-xs font-black border border-rose-500/20">
                      Not: {order.notes}
                    </div>
                  )}
                </div>

                <div className="border-t border-stone-200/20 pt-3 flex items-center justify-between mt-auto">
                  <div>
                    <span className="text-[10px] font-black uppercase text-stone-400 block">Kalan Tutar</span>
                    <span className="font-black text-lg sm:text-xl text-amber-500">{formatCurrency(order.totalAmount)}</span>
                  </div>

                  <div className="flex gap-2">
                    {order.status === 'ready' && (
                      <button 
                        onClick={() => api.updateOrderStatus(order.id, 'waiting_payment')}
                        className="px-3 py-2 bg-purple-600 text-white rounded-xl text-xs font-black shadow-md shadow-purple-600/30 hover:bg-purple-700 transition-colors"
                      >
                        Hesap İste
                      </button>
                    )}

                    <button 
                      onClick={() => handleOpenPaymentModal(order)}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-emerald-500/30 hover:brightness-110 transition-all"
                    >
                      <Calculator className="w-4 h-4" />
                      Hesap & Ödeme Al
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {activeOrders.length === 0 && (
              <div className="col-span-full text-center py-16 text-stone-400 font-bold">
                Aktif sipariş bulunmuyor.
              </div>
            )}
          </div>
        </div>
      )}

      {/* PAYMENT CALCULATOR & SPLIT BILL MODAL */}
      {selectedOrderForPayment && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4">
          <div className={cn(
            "rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border flex flex-col max-h-[90vh]",
            isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-stone-200 text-stone-900"
          )}>
            {/* Modal Header */}
            <div className="p-5 border-b border-stone-200/20 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                  <Calculator className="w-6 h-6 text-emerald-500" />
                  Masa #{selectedOrderForPayment.tableNumber} - Hesap & Ödeme
                </h3>
                <p className="text-xs font-bold text-stone-400">
                  Sipariş No: #{selectedOrderForPayment.orderNumber} • Toplam Tutar: <span className="text-emerald-500 font-black">{formatCurrency(selectedOrderForPayment.totalAmount)}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedOrderForPayment(null)}
                className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-400"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Payment Options Tabs */}
            <div className={cn(
              "p-2 border-b flex gap-1 font-black text-xs shrink-0",
              isDark ? "bg-slate-950 border-slate-800" : "bg-stone-100 border-stone-200"
            )}>
              <button
                onClick={() => setPaymentTab('full')}
                className={cn(
                  "flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5",
                  paymentTab === 'full' 
                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20" 
                    : "text-stone-500 hover:text-stone-900 dark:hover:text-white"
                )}
              >
                <Banknote className="w-4 h-4" />
                <span>Tam Ödeme & Para Üstü</span>
              </button>

              <button
                onClick={() => setPaymentTab('split_equal')}
                className={cn(
                  "flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5",
                  paymentTab === 'split_equal' 
                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20" 
                    : "text-stone-500 hover:text-stone-900 dark:hover:text-white"
                )}
              >
                <Users className="w-4 h-4" />
                <span>Eşit Bölüşüm (Kişi Başı)</span>
              </button>

              <button
                onClick={() => setPaymentTab('split_items')}
                className={cn(
                  "flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5",
                  paymentTab === 'split_items' 
                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20" 
                    : "text-stone-500 hover:text-stone-900 dark:hover:text-white"
                )}
              >
                <CheckSquare className="w-4 h-4" />
                <span>Tek Tek Ödeme (Parça)</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1">
              
              {/* TAB 1: FULL PAYMENT & CHANGE CALCULATOR */}
              {paymentTab === 'full' && (
                <div className="space-y-5">
                  <div className="text-center p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                    <span className="text-xs font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider block">Ödenecek Toplam Tutar</span>
                    <span className="text-3xl font-black text-emerald-500">{formatCurrency(selectedOrderForPayment.totalAmount)}</span>
                  </div>

                  {/* Cash Given & Change Calculation */}
                  <div className="space-y-3">
                    <label className="block text-xs font-black uppercase tracking-wider text-stone-400">
                      Müşteriden Alınan Nakit Miktarı (TL)
                    </label>
                    <input 
                      type="number" 
                      placeholder="Örn: 200, 500, 1000..."
                      value={cashGiven}
                      onChange={e => setCashGiven(e.target.value)}
                      className={cn(
                        "w-full px-4 py-3.5 rounded-2xl border-2 text-2xl font-black outline-none focus:ring-2 focus:ring-emerald-500 text-center",
                        isDark ? "bg-slate-800 border-slate-700 text-emerald-300" : "bg-stone-50 border-stone-200 text-stone-900"
                      )}
                    />

                    {/* Quick Shortcut Cash Buttons */}
                    <div className="flex flex-wrap gap-2 justify-center">
                      {[
                        selectedOrderForPayment.totalAmount,
                        50, 100, 200, 500, 1000
                      ].map((val, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setCashGiven(val.toString())}
                          className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-600 dark:text-emerald-400 font-extrabold text-xs transition-all border border-emerald-500/20"
                        >
                          {val === selectedOrderForPayment.totalAmount ? `Tam Tutar (${val}₺)` : `${val}₺`}
                        </button>
                      ))}
                    </div>

                    {/* Calculated Change To Return */}
                    {cashGiven && parseFloat(cashGiven) > 0 && (
                      <div className={cn(
                        "p-4 rounded-2xl border text-center space-y-1 transition-all",
                        parseFloat(cashGiven) >= selectedOrderForPayment.totalAmount 
                          ? "bg-amber-500/10 border-amber-500/30 text-amber-500" 
                          : "bg-rose-500/10 border-rose-500/30 text-rose-500"
                      )}>
                        <span className="text-xs font-black uppercase tracking-wider block">
                          {parseFloat(cashGiven) >= selectedOrderForPayment.totalAmount ? 'VERİLECEK PARA ÜSTÜ (الباقي)' : 'Eksik Kalan Miktar'}
                        </span>
                        <span className="text-3xl font-black">
                          {formatCurrency(Math.abs(parseFloat(cashGiven) - selectedOrderForPayment.totalAmount))}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Payment Actions */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => handleCompleteFullPayment('cash')}
                      className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 hover:brightness-110 active:scale-95 transition-all"
                    >
                      <Banknote className="w-5 h-5" />
                      Nakit İle Öde
                    </button>
                    <button
                      onClick={() => handleCompleteFullPayment('card')}
                      className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 hover:brightness-110 active:scale-95 transition-all"
                    >
                      <CreditCard className="w-5 h-5" />
                      Kart İle Öde
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: EQUAL SPLIT BILL (Kişi Başı Bölüşüm) */}
              {paymentTab === 'split_equal' && (
                <div className="space-y-5">
                  <div className="text-center p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                    <span className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider block">Hesap Bölüşümü</span>
                    <span className="text-2xl font-black text-indigo-500">{formatCurrency(selectedOrderForPayment.totalAmount)}</span>
                  </div>

                  {/* Person Count Selector */}
                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase tracking-wider text-stone-400 text-center">
                      Kaç Kişi Hesabı Paylaşacak?
                    </label>
                    <div className="flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => setPersonCount(Math.max(1, personCount - 1))}
                        className="w-10 h-10 rounded-2xl bg-stone-200 dark:bg-slate-800 text-stone-900 dark:text-white flex items-center justify-center font-black text-lg"
                      >
                        -
                      </button>
                      <span className="text-3xl font-black w-16 text-center text-amber-500">{personCount} Kişi</span>
                      <button
                        type="button"
                        onClick={() => setPersonCount(personCount + 1)}
                        className="w-10 h-10 rounded-2xl bg-stone-200 dark:bg-slate-800 text-stone-900 dark:text-white flex items-center justify-center font-black text-lg"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Calculated Amount Per Person */}
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center space-y-1">
                    <span className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                      Kişi Başı Düşen Miktar
                    </span>
                    <span className="text-3xl font-black text-amber-500">
                      {formatCurrency(selectedOrderForPayment.totalAmount / personCount)}
                    </span>
                  </div>

                  {/* Pay 1 Person Share Buttons */}
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-extrabold text-stone-400 block text-center uppercase">1 Kişinin Payını Öde:</span>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handlePayEqualShare('cash')}
                        className="flex-1 py-3.5 bg-emerald-500 text-white rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 hover:brightness-110 active:scale-95 transition-all"
                      >
                        <Banknote className="w-4 h-4" />
                        1 Kişi Nakit Öde ({formatCurrency(selectedOrderForPayment.totalAmount / personCount)})
                      </button>
                      <button
                        onClick={() => handlePayEqualShare('card')}
                        className="flex-1 py-3.5 bg-blue-600 text-white rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 hover:brightness-110 active:scale-95 transition-all"
                      >
                        <CreditCard className="w-4 h-4" />
                        1 Kişi Kart Öde ({formatCurrency(selectedOrderForPayment.totalAmount / personCount)})
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: ITEM-BY-ITEM INDIVIDUAL PAY (Ürün Bazlı / Parça Ödeme) */}
              {paymentTab === 'split_items' && (
                <div className="space-y-4">
                  <div className="text-xs font-extrabold text-stone-400 uppercase tracking-wider">
                    Ödenmek İstenen Ürünleri Seçin:
                  </div>

                  {/* Item List with Checkboxes */}
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {selectedOrderForPayment.items.map((item: any, idx: number) => {
                      const isChecked = selectedItemIndices.includes(idx);
                      const itemTotal = item.price * (item.quantity || 1);

                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            if (isChecked) {
                              setSelectedItemIndices(selectedItemIndices.filter(i => i !== idx));
                            } else {
                              setSelectedItemIndices([...selectedItemIndices, idx]);
                            }
                          }}
                          className={cn(
                            "p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all",
                            isChecked 
                              ? "bg-emerald-500/10 border-emerald-500 ring-1 ring-emerald-500" 
                              : isDark ? "bg-slate-800 border-slate-700 hover:bg-slate-700" : "bg-stone-50 border-stone-200 hover:bg-stone-100"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-6 h-6 rounded-lg border-2 flex items-center justify-center font-black transition-colors",
                              isChecked ? "bg-emerald-500 border-emerald-500 text-white" : "border-stone-400"
                            )}>
                              {isChecked && <Check className="w-4 h-4" />}
                            </div>
                            <div>
                              <div className="font-extrabold text-sm">{item.quantity || 1}x {item.name}</div>
                              {item.customizations && item.customizations.length > 0 && (
                                <div className="text-[10px] text-rose-500 font-extrabold">❌ {item.customizations.join(', ')}</div>
                              )}
                            </div>
                          </div>
                          <span className="font-black text-amber-500 text-sm">{formatCurrency(itemTotal)}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Selected Items Total */}
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex justify-between items-center">
                    <span className="text-xs font-black uppercase text-emerald-600 dark:text-emerald-400">Seçilen Ürünlerin Miktarı</span>
                    <span className="text-2xl font-black text-emerald-500">
                      {formatCurrency(
                        selectedItemIndices.reduce((sum, idx) => {
                          const it = selectedOrderForPayment.items[idx];
                          return sum + (it ? it.price * (it.quantity || 1) : 0);
                        }, 0)
                      )}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      disabled={selectedItemIndices.length === 0}
                      onClick={() => handlePaySelectedItems('cash')}
                      className="flex-1 py-3.5 bg-emerald-500 text-white rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 disabled:opacity-40 transition-all"
                    >
                      <Banknote className="w-4 h-4" />
                      Seçilenleri Nakit Öde
                    </button>
                    <button
                      disabled={selectedItemIndices.length === 0}
                      onClick={() => handlePaySelectedItems('card')}
                      className="flex-1 py-3.5 bg-blue-600 text-white rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 disabled:opacity-40 transition-all"
                    >
                      <CreditCard className="w-4 h-4" />
                      Seçilenleri Kart Öde
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
