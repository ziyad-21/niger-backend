import { useState, useEffect, type FormEvent } from 'react';
import { api } from '../lib/api';
import { formatCurrency, cn } from '../lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { UtensilsCrossed, Plus, Edit2, Trash2, X, Image as ImageIcon, DollarSign, Wallet, CreditCard, ShoppingBag, Sparkles, BarChart3, ChevronDown, ChevronUp } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';

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

export default function AdminDashboard() {
  const context = useOutletContext<{ isDark?: boolean }>();
  const isDark = context?.isDark ?? false;

  const [stats, setStats] = useState<any>(null);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [dbStatus, setDbStatus] = useState<{ isSupabaseConfigured: boolean; mode: string } | null>(null);
  const [migrating, setMigrating] = useState(false);
  const [migrationMessage, setMigrationMessage] = useState('');

  // Secret / Hidden Stats Drawer toggle
  const [showStats, setShowStats] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>({
    name: '',
    price: '',
    category: 'YEMEKLER',
    image: '',
    isAvailable: true
  });

  useEffect(() => {
    fetchData();

    const eventSource = new EventSource('/api/events');
    eventSource.onmessage = () => fetchData();
    return () => eventSource.close();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, menuRes, ordersRes, statusRes] = await Promise.all([
        fetch('/api/admin/stats').then(r => r.json()).catch(() => null),
        api.getAdminMenu(),
        api.getOrders(),
        api.getDbStatus()
      ]);
      setStats(statsRes && !statsRes.error ? statsRes : null);
      setMenuItems(Array.isArray(menuRes) ? menuRes : []);
      setOrders(Array.isArray(ordersRes) ? ordersRes : []);
      setDbStatus(statusRes);
    } catch (e) {
      console.error('AdminDashboard fetchData error:', e);
    }
  };

  const handleMigrate = async () => {
    setMigrating(true);
    setMigrationMessage('Aktarım yapılıyor...');
    try {
      const res = await api.migrateToSupabase();
      if (res.success) {
        setMigrationMessage(`✅ Veriler Supabase'e aktarıldı! (${res.menuItemsMigrated} Menü, ${res.ordersMigrated} Sipariş, ${res.usersMigrated} Kullanıcı)`);
      } else {
        setMigrationMessage(`❌ Aktarım hatası: ${res.error}`);
      }
    } catch (err: any) {
      setMigrationMessage('❌ Aktarım sırasında hata oluştu.');
    } finally {
      setMigrating(false);
      fetchData();
    }
  };


  const handleOpenAddModal = () => {
    setEditingItem({
      name: '',
      price: '',
      category: 'YEMEKLER',
      image: '',
      isAvailable: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: any) => {
    setEditingItem({ ...item });
    setIsModalOpen(true);
  };

  const handleSaveItem = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingItem.name || !editingItem.price) return;

    if (editingItem.id) {
      await api.updateMenuItem(editingItem.id, editingItem);
    } else {
      await api.createMenuItem(editingItem);
    }
    setIsModalOpen(false);
    fetchData();
  };

  const handleDeleteItem = async (id: string) => {
    if (confirm('Bu ürünü menüden silmek istediğinize emin misiniz?')) {
      await api.deleteMenuItem(id);
      fetchData();
    }
  };

  // Process data for charts
  const getChartData = () => {
    const dailyData: Record<string, number> = {};
    const paidOrders = orders.filter(o => o.status === 'paid' || o.status === 'completed');
    
    paidOrders.forEach(order => {
      const date = order.createdAt.split('T')[0];
      if (!dailyData[date]) dailyData[date] = 0;
      dailyData[date] += order.totalAmount;
    });

    const entries = Object.entries(dailyData);
    if (entries.length === 0) {
      const today = new Date().toISOString().split('T')[0];
      return [{ date: today, total: stats?.todaysRevenue || 0 }];
    }

    return entries
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-7);
  };

  const chartData = getChartData();

  return (
    <div className={cn(
      "flex flex-col h-full overflow-hidden transition-colors duration-300",
      isDark ? "bg-slate-950 text-slate-100" : "bg-stone-100 text-stone-900"
    )}>
      {/* Top Header */}
      <div className={cn(
        "px-6 py-4 border-b flex justify-between items-center gap-4 shadow-sm z-10 shrink-0",
        isDark ? "bg-slate-900 border-slate-800" : "bg-white border-stone-200"
      )}>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight uppercase">MENÜ YÖNETİM PANELİ</h1>
            <p className="text-xs font-bold text-stone-400">Ürün ekleyin, fiyatları ve stok durumunu güncelleyin</p>
          </div>
        </div>

        <button 
          onClick={handleOpenAddModal}
          className="px-5 py-3 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-500/30 hover:brightness-110 active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5" />
          + Yeni Ürün Ekle
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-8">
        
        {/* MAIN MENU TABLE */}
        <div className="max-w-6xl mx-auto space-y-4">
          <div className={cn(
            "rounded-3xl border shadow-xl overflow-hidden",
            isDark ? "bg-slate-900 border-slate-800" : "bg-white border-stone-200"
          )}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className={cn(
                  "border-b font-extrabold uppercase text-xs tracking-wider",
                  isDark ? "bg-slate-800/80 border-slate-700 text-slate-400" : "bg-stone-50 border-stone-200 text-stone-500"
                )}>
                  <tr>
                    <th className="px-6 py-4">Görsel</th>
                    <th className="px-6 py-4">Ürün Adı</th>
                    <th className="px-6 py-4">Kategori</th>
                    <th className="px-6 py-4">Fiyat</th>
                    <th className="px-6 py-4">Durum</th>
                    <th className="px-6 py-4 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200/20 font-bold">
                  {menuItems.map(item => (
                    <tr key={item.id} className={cn("transition-colors", isDark ? "hover:bg-slate-800/50" : "hover:bg-stone-50")}>
                      <td className="px-6 py-3">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded-xl shadow-sm" />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-stone-100 dark:bg-slate-800 flex items-center justify-center text-stone-400">
                            <UtensilsCrossed className="w-5 h-5" />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 font-black text-base">{item.name}</td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider",
                          item.category === 'SOĞUK İÇECEKLER' ? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400" :
                          item.category === 'KAHVE' ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" :
                          "bg-orange-500/10 text-orange-600 dark:text-orange-400"
                        )}>
                          {item.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-black text-base text-amber-500">{formatCurrency(item.price)}</td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-xs font-black",
                          item.isAvailable 
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" 
                            : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                        )}>
                          {item.isAvailable ? 'Satışta (Aktif)' : 'Tükendi'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleOpenEditModal(item)}
                            className="px-3 py-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 rounded-xl font-black text-xs flex items-center gap-1 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" /> Düzenle
                          </button>
                          <button 
                            onClick={() => handleDeleteItem(item.id)}
                            className="px-3 py-1.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 rounded-xl font-black text-xs flex items-center gap-1 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Sil
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

        {/* SECRET / DISCREET BOTTOM DEVELOPER LINK FOR SALES STATS & DATABASE STATUS */}
        <div className="max-w-6xl mx-auto pt-6 pb-12 border-t border-stone-200/30 flex flex-col items-center gap-4">
          <div className="flex flex-wrap items-center justify-center gap-3">
            {dbStatus && (
              <div className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-black border flex items-center gap-2 shadow-sm",
                dbStatus.isSupabaseConfigured 
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400" 
                  : "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
              )}>
                <span className={cn("w-2 h-2 rounded-full", dbStatus.isSupabaseConfigured ? "bg-emerald-500 animate-pulse" : "bg-amber-500")} />
                <span>Veritabanı: {dbStatus.isSupabaseConfigured ? 'Supabase PostgreSQL (Aktif)' : 'Yerel JSON (db.json)'}</span>
              </div>
            )}

            {dbStatus?.isSupabaseConfigured && (
              <button
                onClick={handleMigrate}
                disabled={migrating}
                className="px-3.5 py-1.5 rounded-full bg-indigo-500/10 hover:bg-indigo-500 hover:text-white border border-indigo-500/30 text-indigo-600 dark:text-indigo-300 font-black text-xs transition-all disabled:opacity-50"
              >
                {migrating ? 'Aktarılıyor...' : '🔄 db.json → Supabase Veri Aktar'}
              </button>
            )}

            <button
              onClick={() => setShowStats(!showStats)}
              className="text-xs font-black text-stone-400 hover:text-amber-500 transition-colors flex items-center gap-1.5 py-1.5 px-4 rounded-full bg-stone-200/50 dark:bg-slate-900 border border-stone-300 dark:border-slate-800 shadow-sm"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>⚡ Satış İstatistikleri Raporu</span>
              {showStats ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {migrationMessage && (
            <p className="text-xs font-black text-amber-500 bg-amber-500/10 px-4 py-2 rounded-xl border border-amber-500/20">
              {migrationMessage}
            </p>
          )}


          {/* HIDDEN STATS SECTION (Expanded on click) */}
          {showStats && stats && (
            <div className="w-full mt-6 space-y-6 animate-fadeIn">
              <div className="text-center mb-2">
                <h3 className="text-xl font-black tracking-tight">Satış & Ciro Performans Raporu</h3>
                <p className="text-xs text-stone-400 font-bold">Gözden uzak özel sistem raporu</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Today's Sales */}
                <div className={cn(
                  "p-5 rounded-3xl border shadow-md flex flex-col justify-between",
                  isDark ? "bg-slate-900 border-slate-800" : "bg-white border-amber-200/80"
                )}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-amber-500">Bugünkü Satış</span>
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                      <DollarSign className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-2xl font-black tracking-tight">{formatCurrency(stats.todaysRevenue)}</p>
                </div>

                {/* Total Revenue */}
                <div className={cn(
                  "p-5 rounded-3xl border shadow-md flex flex-col justify-between",
                  isDark ? "bg-slate-900 border-slate-800" : "bg-white border-indigo-200/80"
                )}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-indigo-500">Toplam Ciro</span>
                    <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-2xl font-black tracking-tight">{formatCurrency(stats.totalRevenue)}</p>
                </div>

                {/* Cash Total */}
                <div className={cn(
                  "p-5 rounded-3xl border shadow-md flex flex-col justify-between",
                  isDark ? "bg-slate-900 border-slate-800" : "bg-white border-emerald-200/80"
                )}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-emerald-500">Nakit Tahsilat</span>
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                      <Wallet className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-2xl font-black tracking-tight text-emerald-500">{formatCurrency(stats.cashTotal)}</p>
                </div>

                {/* Card Total */}
                <div className={cn(
                  "p-5 rounded-3xl border shadow-md flex flex-col justify-between",
                  isDark ? "bg-slate-900 border-slate-800" : "bg-white border-blue-200/80"
                )}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-blue-500">Kart Tahsilat</span>
                    <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                      <CreditCard className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-2xl font-black tracking-tight text-blue-500">{formatCurrency(stats.cardTotal)}</p>
                </div>
              </div>

              {/* Sales Chart */}
              <div className={cn(
                "p-5 rounded-3xl border shadow-lg",
                isDark ? "bg-slate-900 border-slate-800" : "bg-white border-stone-200"
              )}>
                <h3 className="text-base font-black mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Son Satış Trendi (TL)
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#e2e8f0'} />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} stroke={isDark ? '#94a3b8' : '#64748b'} />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false}
                        stroke={isDark ? '#94a3b8' : '#64748b'}
                        tickFormatter={(value) => `${value}₺`}
                      />
                      <Tooltip 
                        formatter={(value: number) => [formatCurrency(value), 'Satış']}
                        contentStyle={{
                          backgroundColor: isDark ? '#1e293b' : '#ffffff',
                          borderColor: isDark ? '#475569' : '#cbd5e1',
                          borderRadius: '12px',
                          fontWeight: 'bold',
                        }}
                      />
                      <Line type="monotone" dataKey="total" stroke="#f59e0b" strokeWidth={3} dot={{ r: 5, fill: '#f59e0b' }} activeDot={{ r: 7 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className={cn(
            "rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border",
            isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-stone-200 text-stone-900"
          )}>
            <div className="flex justify-between items-center p-6 border-b border-stone-200/20 bg-gradient-to-r from-amber-500/10 to-orange-500/10">
              <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                <UtensilsCrossed className="w-6 h-6 text-amber-500" />
                {editingItem?.id ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-400"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-stone-400 mb-1">Ürün Adı</label>
                <input 
                  type="text" 
                  required
                  placeholder="Örn: Coca-Cola, Köfte Porsiyon..."
                  value={editingItem.name}
                  onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
                  className={cn(
                    "w-full px-4 py-3 rounded-2xl border font-bold text-base outline-none focus:ring-2 focus:ring-amber-500",
                    isDark ? "bg-slate-800 border-slate-700" : "bg-stone-50 border-stone-200"
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-stone-400 mb-1">Fiyat (₺)</label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    placeholder="70"
                    value={editingItem.price}
                    onChange={e => setEditingItem({ ...editingItem, price: parseFloat(e.target.value) || 0 })}
                    className={cn(
                      "w-full px-4 py-3 rounded-2xl border font-bold text-base outline-none focus:ring-2 focus:ring-amber-500",
                      isDark ? "bg-slate-800 border-slate-700" : "bg-stone-50 border-stone-200"
                    )}
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-stone-400 mb-1">Kategori</label>
                  <select 
                    value={editingItem.category}
                    onChange={e => setEditingItem({ ...editingItem, category: e.target.value })}
                    className={cn(
                      "w-full px-4 py-3 rounded-2xl border font-bold text-base outline-none focus:ring-2 focus:ring-amber-500",
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

              {/* Image URL & Quick Preset Selector */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-stone-400 mb-1">Görsel URL</label>
                <div className="relative mb-2">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <input 
                    type="url" 
                    placeholder="https://..."
                    value={editingItem.image || ''}
                    onChange={e => setEditingItem({ ...editingItem, image: e.target.value })}
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

              {/* In Stock Toggle */}
              <div className="flex items-center pt-2">
                <input 
                  type="checkbox" 
                  id="modalIsAvailable"
                  checked={editingItem.isAvailable ?? true}
                  onChange={e => setEditingItem({ ...editingItem, isAvailable: e.target.checked })}
                  className="w-5 h-5 text-amber-500 rounded-lg accent-amber-500"
                />
                <label htmlFor="modalIsAvailable" className="ml-3 text-sm font-bold cursor-pointer">
                  Stokta Var (Menüde Aktif Görünsün)
                </label>
              </div>

              {/* Actions */}
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
                  {editingItem?.id ? 'Güncelle' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
