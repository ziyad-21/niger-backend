import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { format } from 'date-fns';
import { Clock, CheckCircle, Edit2, Check, Trash2, RotateCcw, Volume2, VolumeX, Flame, BellRing } from 'lucide-react';
import { cn } from '../lib/utils';
import { useOutletContext } from 'react-router-dom';

type CardSize = 'sm' | 'md' | 'lg';

export default function KitchenDashboard() {
  const context = useOutletContext<{ isDark?: boolean }>();
  const isDark = context?.isDark ?? false;

  const [orders, setOrders] = useState<any[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [cardSize, setCardSize] = useState<CardSize>('sm'); // Default compact fit
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [mobileTab, setMobileTab] = useState<'new' | 'ready'>('new');

  useEffect(() => {
    fetchData();

    const eventSource = new EventSource('/api/events');
    eventSource.onmessage = (e) => {
      try {
        const eventData = JSON.parse(e.data);
        if (eventData.type === 'order_created' && soundEnabled) {
          playNewOrderSound();
        } else if (eventData.type === 'order_status_updated' && eventData.status === 'ready' && soundEnabled) {
          playReadyOrderSound();
        }
      } catch (err) {
        // ignore parse error
      }
      fetchData();
    };
    return () => eventSource.close();
  }, [soundEnabled]);

  const fetchData = async () => {
    const data = await api.getOrders();
    setOrders(data);
  };

  // High pitch chime for new orders
  const playNewOrderSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch (e) {
      // audio context fallback
    }
  };

  // Pleasant double chime for ready orders
  const playReadyOrderSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const now = audioCtx.currentTime;
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now); // C5
      gain1.gain.setValueAtTime(0.25, now);
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.2);

      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, now + 0.15); // E5
      gain2.gain.setValueAtTime(0.3, now + 0.15);
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.45);
    } catch (e) {
      // audio context fallback
    }
  };

  const updateStatus = async (id: string, status: string) => {
    await api.updateOrderStatus(id, status);
    if (status === 'ready' && soundEnabled) {
      playReadyOrderSound();
    }
    fetchData();
  };

  const handleDeleteOrder = async (id: string) => {
    if (confirm('Bu siparişi mutfaktan silmek istediğinize emin misiniz?')) {
      await api.deleteOrder(id);
      fetchData();
    }
  };

  // 2 Columns: "Yeni Siparişler" (new & preparing) vs "Hazır" (ready)
  const activeNewOrders = orders.filter(o => o.status === 'new' || o.status === 'preparing');
  const readyOrders = orders.filter(o => o.status === 'ready');

  // Size styling configuration
  const sizeConfig = {
    sm: {
      cardPadding: 'p-3',
      tableText: 'text-2xl font-black',
      itemText: 'text-sm font-bold',
      qtyBadge: 'text-xs px-2 py-0.5 font-black min-w-[32px]',
      btnPadding: 'py-2.5 text-xs font-black',
      iconSize: 'w-4 h-4',
      gap: 'space-y-2',
    },
    md: {
      cardPadding: 'p-4',
      tableText: 'text-3xl font-black',
      itemText: 'text-base font-bold',
      qtyBadge: 'text-sm px-2.5 py-1 font-black min-w-[38px]',
      btnPadding: 'py-3 text-sm font-black',
      iconSize: 'w-5 h-5',
      gap: 'space-y-3',
    },
    lg: {
      cardPadding: 'p-5',
      tableText: 'text-4xl font-black',
      itemText: 'text-lg font-extrabold',
      qtyBadge: 'text-base px-3 py-1 font-black min-w-[44px]',
      btnPadding: 'py-3.5 text-base font-black',
      iconSize: 'w-6 h-6',
      gap: 'space-y-3.5',
    },
  }[cardSize];

  const OrderCard = ({ order, isReadyColumn = false }: { order: any; isReadyColumn?: boolean; key?: any }) => {
    return (
      <div className={cn(
        "rounded-2xl border-2 transition-all shadow-md relative overflow-hidden flex flex-col shrink-0",
        sizeConfig.cardPadding,
        isDark ? "bg-slate-900 border-slate-700/80 text-white" : "bg-white border-stone-200 text-stone-900",
        !isReadyColumn && (isDark ? "ring-2 ring-blue-500/40 shadow-blue-900/20" : "ring-2 ring-blue-400/40 shadow-blue-100"),
        isReadyColumn && (isDark ? "ring-2 ring-emerald-500/40 shadow-emerald-900/20" : "ring-2 ring-emerald-400/40 shadow-emerald-100")
      )}>
        {/* Animated Accent Top Line */}
        {!isReadyColumn ? (
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-amber-500 animate-pulse" />
        ) : (
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400" />
        )}

        {/* Edit Mode Controls */}
        {isEditMode && (
          <div className="absolute top-1.5 right-1.5 p-1 flex gap-1 z-20 bg-slate-800/95 rounded-xl border border-slate-700 backdrop-blur-md">
            {isReadyColumn && (
              <button 
                onClick={() => updateStatus(order.id, 'new')}
                className="p-1.5 bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600 transition-colors"
                title="Yeni Siparişlere Geri Al"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
            <button 
              onClick={() => handleDeleteOrder(order.id)}
              className="p-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
              title="Siparişi Sil"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Card Header */}
        <div className="flex justify-between items-start pb-2.5 mb-2 border-b border-stone-200/20">
          <div>
            <div className="flex items-center gap-1.5">
              <span className={cn(
                "text-[10px] uppercase font-black tracking-widest px-2 py-0.5 rounded-full",
                isDark ? "bg-slate-800 text-amber-400" : "bg-amber-100 text-amber-900"
              )}>
                Masa
              </span>
            </div>
            <h3 className={cn(sizeConfig.tableText, "leading-none mt-1 tracking-tight")}>
              #{order.tableNumber}
            </h3>
          </div>

          <div className="text-right flex flex-col items-end">
            <span className="text-xs font-black tracking-wider opacity-60">
              Sipariş #{order.orderNumber}
            </span>
            <div className={cn(
              "flex items-center gap-1 font-bold mt-1 px-2.5 py-1 rounded-lg text-xs",
              isDark ? "bg-slate-800 text-slate-300" : "bg-stone-100 text-stone-700"
            )}>
              <Clock className="w-3.5 h-3.5" />
              {format(new Date(order.createdAt), 'HH:mm')}
            </div>
          </div>
        </div>

        {/* Items List (Strictly names & quantities, no images) */}
        <div className="flex-1 my-1">
          <ul className={sizeConfig.gap}>
            {order.items.map((item: any, i: number) => (
              <li key={i} className="flex flex-col gap-1 pb-1 border-b border-stone-200/10 last:border-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className={cn(
                      "rounded-xl text-center shrink-0 font-black",
                      sizeConfig.qtyBadge,
                      isDark ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "bg-stone-900 text-white"
                    )}>
                      {item.quantity}x
                    </span>
                    <span className={cn(sizeConfig.itemText, "leading-tight")}>
                      {item.name}
                    </span>
                  </div>
                </div>

                {/* Excluded ingredients or item customizations */}
                {item.customizations && item.customizations.length > 0 && (
                  <div className="pl-9 text-xs font-extrabold text-rose-500 dark:text-rose-400 flex flex-wrap gap-1">
                    {item.customizations.map((c: string, ci: number) => (
                      <span key={ci} className="bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                        ❌ {c}
                      </span>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>

          {/* Mutfak / Özel Sipariş Notu */}
          {order.notes && (
            <div className={cn(
              "mt-3 p-2.5 rounded-xl font-black text-xs border flex items-start gap-1.5 shadow-sm",
              isDark ? "bg-rose-950/60 text-rose-300 border-rose-800/80" : "bg-rose-50 text-rose-900 border-rose-200"
            )}>
              <Flame className="w-4 h-4 shrink-0 text-rose-500 animate-bounce" />
              <div>
                <span className="font-extrabold underline block">Özel Sipariş Notu:</span>
                <span className="font-bold">{order.notes}</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-3 pt-2 border-t border-stone-200/20">
          {!isReadyColumn ? (
            <button
              onClick={() => updateStatus(order.id, 'ready')}
              className={cn(
                "w-full rounded-xl text-white flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-500/25",
                sizeConfig.btnPadding,
                "bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:brightness-110"
              )}
            >
              <CheckCircle className={sizeConfig.iconSize} />
              SİPARİŞİ TAMAMLA (HAZIR)
            </button>
          ) : (
            <div className={cn(
              "w-full rounded-xl font-black text-xs flex items-center justify-center gap-2 border",
              sizeConfig.btnPadding,
              isDark ? "bg-emerald-950/60 text-emerald-300 border-emerald-800" : "bg-emerald-50 text-emerald-800 border-emerald-200"
            )}>
              <CheckCircle className={sizeConfig.iconSize} />
              GARSONA BİLDİRİLDİ (HAZIR)
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={cn(
      "flex flex-col h-full overflow-hidden transition-colors duration-300",
      isDark ? "bg-slate-950 text-slate-100" : "bg-stone-200/70 text-stone-900"
    )}>
      {/* Top Header Bar */}
      <div className={cn(
        "px-4 py-3 border-b flex flex-wrap items-center justify-between gap-3 shadow-sm z-10 shrink-0",
        isDark ? "bg-slate-900 border-slate-800" : "bg-white border-stone-300"
      )}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-md shadow-amber-500/30 font-black">
            M
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight uppercase">MUTFAK SİPARİŞ EKRANI</h1>
            <p className="text-[11px] font-bold text-stone-400">Canlı Mutfak Takip Paneli</p>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Card Size Selector (Small / Medium / Large) */}
          <div className={cn(
            "flex items-center p-1 rounded-xl border font-bold text-xs gap-1",
            isDark ? "bg-slate-800 border-slate-700 text-slate-300" : "bg-stone-100 border-stone-200 text-stone-700"
          )}>
            <span className="px-1.5 text-[10px] uppercase tracking-wider text-stone-400 font-black hidden sm:inline">Boyut:</span>
            <button
              onClick={() => setCardSize('sm')}
              className={cn(
                "px-2.5 py-1 rounded-lg transition-all font-black text-xs",
                cardSize === 'sm' ? "bg-amber-500 text-white shadow-sm" : "hover:bg-stone-200/50"
              )}
            >
              Küçük
            </button>
            <button
              onClick={() => setCardSize('md')}
              className={cn(
                "px-2.5 py-1 rounded-lg transition-all font-black text-xs",
                cardSize === 'md' ? "bg-amber-500 text-white shadow-sm" : "hover:bg-stone-200/50"
              )}
            >
              Orta
            </button>
            <button
              onClick={() => setCardSize('lg')}
              className={cn(
                "px-2.5 py-1 rounded-lg transition-all font-black text-xs",
                cardSize === 'lg' ? "bg-amber-500 text-white shadow-sm" : "hover:bg-stone-200/50"
              )}
            >
              Büyük
            </button>
          </div>

          {/* Sound Toggle Button */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={cn(
              "p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5",
              soundEnabled
                ? (isDark ? "bg-emerald-950/60 border-emerald-800 text-emerald-400" : "bg-emerald-50 border-emerald-200 text-emerald-800")
                : (isDark ? "bg-slate-800 border-slate-700 text-slate-400" : "bg-stone-100 border-stone-200 text-stone-500")
            )}
            title="Mutfak Sesli Bildirim"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-500" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{soundEnabled ? 'Ses Açık' : 'Ses Kapalı'}</span>
          </button>

          {/* Edit Mode Toggle */}
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all border shadow-sm",
              isEditMode 
                ? "bg-rose-600 text-white border-rose-700 shadow-rose-600/30" 
                : isDark
                  ? "bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700"
                  : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
            )}
          >
            {isEditMode ? (
              <><Check className="w-4 h-4" /> Tamam</>
            ) : (
              <><Edit2 className="w-4 h-4" /> Düzenle</>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Tab Switching Bar (for small screens) */}
      <div className={cn(
        "md:hidden flex p-2 border-b gap-2 text-xs font-black shrink-0",
        isDark ? "bg-slate-900 border-slate-800" : "bg-white border-stone-200"
      )}>
        <button
          onClick={() => setMobileTab('new')}
          className={cn(
            "flex-1 py-2.5 rounded-xl text-center flex items-center justify-center gap-2 transition-all",
            mobileTab === 'new'
              ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
              : "bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-300"
          )}
        >
          <BellRing className="w-4 h-4" />
          Yeni Siparişler ({activeNewOrders.length})
        </button>
        <button
          onClick={() => setMobileTab('ready')}
          className={cn(
            "flex-1 py-2.5 rounded-xl text-center flex items-center justify-center gap-2 transition-all",
            mobileTab === 'ready'
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
              : "bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-300"
          )}
        >
          <CheckCircle className="w-4 h-4" />
          Hazır Siparişler ({readyOrders.length})
        </button>
      </div>

      {/* Main 2-Column Grid Container (Fitting on screen without side-scrolling) */}
      <div className="flex-1 p-3 md:p-5 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 overflow-hidden">
        
        {/* COLUMN 1: YENİ SİPARİŞLER (New Orders) */}
        <div className={cn(
          "flex flex-col rounded-2xl md:rounded-3xl border-2 shadow-lg overflow-hidden h-full transition-all",
          mobileTab !== 'new' && "hidden md:flex",
          isDark 
            ? "bg-slate-900/90 border-blue-900/60" 
            : "bg-blue-50/60 border-blue-200"
        )}>
          <div className="p-3.5 md:p-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white font-black text-lg md:text-xl uppercase tracking-wider flex justify-between items-center shadow-md shrink-0">
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-white animate-ping" />
              Yeni Siparişler
            </span>
            <span className="bg-white text-blue-700 px-3 py-0.5 rounded-xl text-base font-black shadow-inner">
              {activeNewOrders.length}
            </span>
          </div>

          <div className="flex-1 p-3 md:p-4 overflow-y-auto space-y-3">
            {activeNewOrders.map(order => <OrderCard key={order.id} order={order} isReadyColumn={false} />)}
            {activeNewOrders.length === 0 && (
              <div className="text-center py-16 text-blue-400 font-bold text-sm">
                Bekleyen yeni sipariş bulunmuyor ✨
              </div>
            )}
          </div>
        </div>

        {/* COLUMN 2: HAZIR SİPARİŞLER (Ready Orders) */}
        <div className={cn(
          "flex flex-col rounded-2xl md:rounded-3xl border-2 shadow-lg overflow-hidden h-full transition-all",
          mobileTab !== 'ready' && "hidden md:flex",
          isDark 
            ? "bg-slate-900/90 border-emerald-900/60" 
            : "bg-emerald-50/60 border-emerald-200"
        )}>
          <div className="p-3.5 md:p-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white font-black text-lg md:text-xl uppercase tracking-wider flex justify-between items-center shadow-md shrink-0">
            <span className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Hazır (Servis Bekleyen)
            </span>
            <span className="bg-white text-emerald-700 px-3 py-0.5 rounded-xl text-base font-black shadow-inner">
              {readyOrders.length}
            </span>
          </div>

          <div className="flex-1 p-3 md:p-4 overflow-y-auto space-y-3">
            {readyOrders.map(order => <OrderCard key={order.id} order={order} isReadyColumn={true} />)}
            {readyOrders.length === 0 && (
              <div className="text-center py-16 text-emerald-500 font-bold text-sm">
                Servis bekleyen hazır sipariş yok
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
