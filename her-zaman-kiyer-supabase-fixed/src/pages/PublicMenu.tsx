import { useState, useEffect, type FormEvent } from 'react';
import { api } from '../lib/api';
import { formatCurrency, cn } from '../lib/utils';
import { Utensils, Edit2, Trash2, Plus, X, Image as ImageIcon, Check, Moon, Sun, Search, Sparkles, Flame, Coffee, GlassWater } from 'lucide-react';

const PRESET_IMAGES = [
  { label: '🍔 Hamburger', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80' },
  { label: '🥩 Köfte', url: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=500&auto=format&fit=crop&q=80' },
  { label: '🥪 Tost', url: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80' },
  { label: '🍳 Menemen', url: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=500&auto=format&fit=crop&q=80' },
  { label: '🍟 Patates', url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&auto=format&fit=crop&q=80' },
  { label: '🥤 Coca-Cola', url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80' },
  { label: '🍊 Fanta', url: 'https://images.unsplash.com/photo-1624517452488-04869289c4ca?w=500&auto=format&fit=crop&q=80' },
  { label: '🧃 Fuse Tea', url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500&auto=format&fit=crop&q=80' },
  { label: '🥛 Ayran', url: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=500&auto=format&fit=crop&q=80' },
  { label: '☕ Kahve', url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=80' },
  { label: '💧 Su', url: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=500&auto=format&fit=crop&q=80' },
];

export default function PublicMenu() {
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('TÜMÜ');

  // Dark Mode State
  const [isDark, setIsDark] = useState<boolean>(() => localStorage.getItem('theme') === 'dark');

  // Auth state
  const [user, setUser] = useState<any>(null);

  // Edit mode states
  const [isEditMode, setIsEditMode] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleDarkMode = () => setIsDark(prev => !prev);

  const fetchData = async () => {
    setLoading(true);
    const data = await api.getMenu();
    setMenuItems(data);
    setLoading(false);
  };

  const categories = ['TÜMÜ', ...new Set(menuItems.map(item => item.category))];
  const canEdit = user?.role === 'admin' || user?.role === 'manager';

  const handleOpenModal = (item: any = null, category: string = 'YEMEKLER') => {
    setEditingItem(item || { name: '', price: '', category: category, image: '', isAvailable: true });
    setIsModalOpen(true);
  };

  const handleSaveItem = async (e: FormEvent) => {
    e.preventDefault();
    if (editingItem.id) {
      await api.updateMenuItem(editingItem.id, editingItem);
    } else {
      await api.createMenuItem(editingItem);
    }
    setIsModalOpen(false);
    fetchData();
  };

  const handleDeleteItem = async (id: string) => {
    if (confirm('Bu ürünü silmek istediğinize emin misiniz?')) {
      await api.deleteMenuItem(id);
      fetchData();
    }
  };

  if (loading && menuItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  const filteredMenuItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'TÜMÜ' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className={cn(
      "min-h-screen font-sans pb-24 relative transition-colors duration-300",
      isDark ? "bg-slate-950 text-slate-100 dark" : "bg-gradient-to-br from-amber-50/50 via-stone-100 to-orange-50/50 text-stone-900"
    )}>
      {/* Hero Header Banner */}
      <div className="relative h-72 md:h-80 bg-stone-900 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay scale-105 transition-transform duration-1000" />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/60 to-transparent" />

        {/* Top Header Controls (Dark Mode & Personnel Portal) */}
        <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-20">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-amber-500 text-stone-950 font-black rounded-full text-xs uppercase tracking-widest shadow-lg">
              Lezzet Durağınız
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleDarkMode}
              className="p-2.5 rounded-full bg-stone-800/80 backdrop-blur-md text-amber-400 border border-stone-700 hover:bg-stone-700 transition-all shadow-xl"
              title="Gece / Gündüz Modu"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <a
              href="/login"
              className="px-4 py-2 rounded-full bg-stone-800/80 backdrop-blur-md text-white border border-stone-700 text-xs font-black uppercase tracking-wider hover:bg-stone-700 transition-all shadow-xl"
            >
              Personel Girişi
            </a>
          </div>
        </div>

        <div className="relative z-10 text-center px-4 mt-6">
          <div className="w-16 h-16 bg-gradient-to-tr from-amber-500 to-orange-500 rounded-3xl flex items-center justify-center mx-auto mb-3 shadow-2xl shadow-amber-500/50 text-white">
            <Utensils className="w-9 h-9" />
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white uppercase bg-gradient-to-r from-amber-200 via-white to-amber-400 bg-clip-text text-transparent">
            HER ZAMAN KIYER
          </h1>
          <p className="text-amber-400 text-sm md:text-base font-extrabold tracking-widest uppercase mt-2">
            Nefis Yemekler & Buz Gibi İçecekler
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-10 relative z-20 space-y-6">
        
        {/* Search Bar & Category Filter Card */}
        <div className={cn(
          "p-4 md:p-6 rounded-3xl shadow-xl border space-y-4 backdrop-blur-xl",
          isDark ? "bg-slate-900/90 border-slate-800" : "bg-white/90 border-stone-100"
        )}>
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-5 h-5 absolute left-4 top-3.5 text-stone-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Lezzetli bir şey arayın... (Köfte, Burger, Kola, Ayran, Ice Tea)"
              className={cn(
                "w-full pl-12 pr-4 py-3 rounded-2xl border font-bold text-sm outline-none focus:ring-2 focus:ring-amber-500",
                isDark ? "bg-slate-800 border-slate-700" : "bg-stone-50 border-stone-200"
              )}
            />
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider whitespace-nowrap transition-all shadow-sm flex items-center gap-2",
                  selectedCategory === cat 
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white scale-[1.03] shadow-amber-500/30" 
                    : isDark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-stone-100 text-stone-700 hover:bg-amber-100/50"
                )}
              >
                {cat === 'SOĞUK İÇECEKLER' && <GlassWater className="w-4 h-4" />}
                {cat === 'KAHVE' && <Coffee className="w-4 h-4" />}
                {cat === 'YEMEKLER' && <Utensils className="w-4 h-4" />}
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Items Showcase Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
          {filteredMenuItems.map(item => (
            <div 
              key={item.id} 
              className={cn(
                "p-4 rounded-3xl border shadow-lg flex items-center gap-4 transition-all hover:scale-[1.01] relative overflow-hidden group",
                isDark ? "bg-slate-900 border-slate-800" : "bg-white border-stone-100"
              )}
            >
              {/* Image */}
              {item.image ? (
                <img 
                  src={item.image} 
                  alt={item.name} 
                  className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-2xl shadow-md shrink-0 group-hover:scale-105 transition-transform duration-300" 
                />
              ) : (
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-stone-100 dark:bg-slate-800 flex items-center justify-center text-stone-400 shrink-0">
                  <Utensils className="w-8 h-8" />
                </div>
              )}

              {/* Item Info */}
              <div className="flex-1 min-w-0 py-1">
                <span className={cn(
                  "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider inline-block mb-1",
                  item.category === 'SOĞUK İÇECEKLER' ? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20" :
                  item.category === 'KAHVE' ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20" :
                  "bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20"
                )}>
                  {item.category}
                </span>

                <h3 className="font-black text-lg leading-snug truncate">
                  {item.name}
                </h3>

                <div className="flex items-center justify-between mt-2 pt-1">
                  <span className="font-black text-2xl text-amber-500">
                    {formatCurrency(item.price)}
                  </span>

                  {!item.isAvailable && (
                    <span className="text-xs font-black text-rose-500 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-1 rounded-full border border-rose-200 dark:border-rose-800">
                      TÜKENDİ
                    </span>
                  )}
                </div>
              </div>

              {/* Edit Mode Quick Action Overlay */}
              {isEditMode && (
                <div className="absolute top-2 right-2 flex gap-1 z-10 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-700 backdrop-blur-md">
                  <button 
                    onClick={() => handleOpenModal(item, item.category)}
                    className="p-2 bg-blue-600 text-white rounded-xl shadow-md hover:bg-blue-700 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-2 bg-rose-600 text-white rounded-xl shadow-md hover:bg-rose-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}

          {filteredMenuItems.length === 0 && (
            <div className="col-span-full text-center py-16 text-stone-400 font-bold">
              Bu kategoride ürün bulunamadı.
            </div>
          )}
        </div>

        {/* Add Product Button (In Edit Mode) */}
        {isEditMode && (
          <div className="pt-6 text-center">
            <button 
              onClick={() => handleOpenModal(null, selectedCategory === 'TÜMÜ' ? 'YEMEKLER' : selectedCategory)}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl font-black text-base shadow-xl shadow-amber-500/30 hover:brightness-110 active:scale-95 transition-all"
            >
              <Plus className="w-6 h-6" />
              Yeni Ürün Ekle
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="pt-12 text-center text-stone-400 text-xs font-bold space-y-2">
          <p>© {new Date().getFullYear()} HER ZAMAN KIYER — Nefis Menü & Hızlı Servis</p>
        </div>
      </div>

      {/* Floating Edit Mode Toggle (Visible if Admin/Manager) */}
      {canEdit && (
        <button
          onClick={() => setIsEditMode(!isEditMode)}
          className={cn(
            "fixed bottom-6 right-6 z-50 flex items-center gap-2 px-6 py-3.5 rounded-full shadow-2xl font-black text-sm transition-all transform hover:scale-105 active:scale-95",
            isEditMode 
              ? "bg-rose-600 text-white ring-4 ring-rose-600/30" 
              : "bg-stone-900 dark:bg-amber-500 text-white dark:text-stone-950 ring-4 ring-stone-900/30 dark:ring-amber-500/30"
          )}
        >
          {isEditMode ? (
            <>
              <Check className="w-5 h-5" />
              Düzenlemeyi Bitir
            </>
          ) : (
            <>
              <Edit2 className="w-5 h-5" />
              Sayfayı Düzenle
            </>
          )}
        </button>
      )}

      {/* Edit/Create Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className={cn(
            "rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border",
            isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-stone-200 text-stone-900"
          )}>
            <div className="flex justify-between items-center p-6 border-b border-stone-200/20 bg-gradient-to-r from-amber-500/10 to-orange-500/10">
              <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                <Utensils className="w-6 h-6 text-amber-500" />
                {editingItem?.id ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-400">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSaveItem} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-stone-400 mb-1">Ürün Adı</label>
                <input 
                  type="text" 
                  required
                  placeholder="Örn: Coca-Cola Kutu, Köfte Ekmek..."
                  value={editingItem?.name || ''}
                  onChange={e => setEditingItem({...editingItem, name: e.target.value})}
                  className={cn(
                    "w-full px-4 py-3 rounded-2xl border font-bold text-base outline-none focus:ring-2 focus:ring-amber-500",
                    isDark ? "bg-slate-800 border-slate-700" : "bg-stone-50 border-stone-200"
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-stone-400 mb-1">Fiyat (TL)</label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    value={editingItem?.price || ''}
                    onChange={e => setEditingItem({...editingItem, price: parseFloat(e.target.value) || 0})}
                    className={cn(
                      "w-full px-4 py-3 rounded-2xl border font-bold text-base outline-none focus:ring-2 focus:ring-amber-500",
                      isDark ? "bg-slate-800 border-slate-700" : "bg-stone-50 border-stone-200"
                    )}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-stone-400 mb-1">Kategori</label>
                  <select 
                    value={editingItem?.category || 'YEMEKLER'}
                    onChange={e => setEditingItem({...editingItem, category: e.target.value})}
                    className={cn(
                      "w-full px-4 py-3 rounded-2xl border font-bold text-base outline-none focus:ring-2 focus:ring-amber-500 uppercase",
                      isDark ? "bg-slate-800 border-slate-700" : "bg-stone-50 border-stone-200"
                    )}
                  >
                    <option value="YEMEKLER">YEMEKLER</option>
                    <option value="SOĞUK İÇECEKLER">SOĞUK İÇECEKLER</option>
                    <option value="KAHVE">KAHVE</option>
                    <option value="TATLILAR">TATLILAR</option>
                  </select>
                </div>
              </div>

              {/* Image URL & Presets */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-stone-400 mb-1">Görsel URL</label>
                <div className="relative mb-2">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <ImageIcon className="h-5 w-5" />
                  </div>
                  <input 
                    type="url" 
                    value={editingItem?.image || ''}
                    onChange={e => setEditingItem({...editingItem, image: e.target.value})}
                    placeholder="https://..."
                    className={cn(
                      "w-full pl-11 pr-4 py-3 rounded-2xl border font-medium text-sm outline-none focus:ring-2 focus:ring-amber-500",
                      isDark ? "bg-slate-800 border-slate-700" : "bg-stone-50 border-stone-200"
                    )}
                  />
                </div>

                {/* Quick Presets */}
                <div className="space-y-1">
                  <span className="text-[11px] font-extrabold text-amber-500 uppercase">Hızlı Görsel Seçimi:</span>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1">
                    {PRESET_IMAGES.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setEditingItem({ ...editingItem, image: preset.url })}
                        className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500 hover:text-white text-amber-600 dark:text-amber-300 rounded-xl text-xs font-extrabold transition-all"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center pt-2">
                <input 
                  type="checkbox" 
                  id="isAvailablePublic"
                  checked={editingItem?.isAvailable ?? true}
                  onChange={e => setEditingItem({...editingItem, isAvailable: e.target.checked})}
                  className="w-5 h-5 text-amber-500 rounded-lg accent-amber-500"
                />
                <label htmlFor="isAvailablePublic" className="ml-3 text-sm font-bold cursor-pointer">
                  Stokta Var (Menüde Aktif Görünsün)
                </label>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={cn(
                    "flex-1 py-3.5 rounded-2xl font-black text-sm transition-colors",
                    isDark ? "bg-slate-800 hover:bg-slate-700" : "bg-stone-100 hover:bg-stone-200"
                  )}
                >
                  İptal
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl font-black text-sm shadow-lg shadow-amber-500/30 hover:brightness-110 active:scale-95 transition-all"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
