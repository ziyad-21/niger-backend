import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { ChefHat, Coffee, LogOut, BarChart3, Utensils, Moon, Sun, ExternalLink, Menu, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { useEffect, useState } from 'react';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<{name: string, role: string} | null>(null);
  const [isDark, setIsDark] = useState<boolean>(() => {
    return localStorage.getItem('theme') === 'dark';
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      navigate('/login');
    } else {
      setUser(JSON.parse(savedUser));
    }
  }, [navigate]);

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

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className={cn(
      "flex h-screen font-sans overflow-hidden transition-colors duration-300",
      isDark ? "bg-slate-950 text-slate-100 dark" : "bg-gradient-to-br from-amber-50/40 via-stone-100 to-amber-100/30 text-stone-900"
    )}>
      {/* Mobile Header Bar */}
      <div className={cn(
        "md:hidden flex items-center justify-between p-4 border-b z-30 fixed top-0 left-0 right-0",
        isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-amber-200 text-stone-900"
      )}>
        <div className="flex items-center gap-2">
          <Utensils className="w-7 h-7 text-amber-500" />
          <span className="font-black tracking-tight text-lg uppercase">HER ZAMAN KIYER</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleDarkMode}
            className={cn(
              "p-2 rounded-xl transition-colors",
              isDark ? "bg-slate-800 text-amber-400" : "bg-amber-100 text-amber-800"
            )}
            title="Gece / Gündüz Modu"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-amber-500 text-white font-bold"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      {/* Sidebar (Desktop + Mobile) */}
      <div className={cn(
        "w-72 border-r flex flex-col shadow-2xl z-50 transition-all duration-300",
        "fixed md:relative inset-y-0 left-0 transform",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        isDark ? "bg-slate-900/95 border-slate-800 backdrop-blur-xl text-slate-100" : "bg-white/95 border-amber-200/80 backdrop-blur-xl text-stone-900"
      )}>
        <div className="p-6 border-b border-stone-200/20 text-center relative bg-gradient-to-br from-amber-500/10 to-orange-500/10">
          <div className="w-14 h-14 bg-gradient-to-tr from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-500/30 text-white">
            <Utensils className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-black tracking-tight uppercase bg-gradient-to-r from-amber-600 via-orange-600 to-amber-500 bg-clip-text text-transparent">
            HER ZAMAN KIYER
          </h1>
          <p className={cn("text-xs font-bold tracking-widest uppercase mt-1", isDark ? "text-slate-400" : "text-amber-800/60")}>
            Personel Portalı
          </p>
        </div>

        {/* User Info Pill */}
        <div className="px-6 pt-4 pb-2">
          <div className={cn(
            "p-3 rounded-2xl flex items-center justify-between border shadow-sm",
            isDark ? "bg-slate-800/80 border-slate-700" : "bg-amber-50 border-amber-200/60"
          )}>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <div className="text-sm font-bold">{user.name}</div>
                <div className={cn("text-xs uppercase font-extrabold tracking-wider", isDark ? "text-amber-400" : "text-amber-700")}>
                  {user.role}
                </div>
              </div>
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className={cn(
                "p-2 rounded-xl transition-all active:scale-90",
                isDark ? "bg-slate-700 text-amber-300 hover:bg-slate-600" : "bg-amber-200/60 text-amber-900 hover:bg-amber-300/60"
              )}
              title="Gece / Gündüz Modu"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4 space-y-2.5 overflow-y-auto">
          <Link
            to="/waiter"
            onClick={() => setMobileMenuOpen(false)}
            className={cn(
              "flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-base font-bold transition-all shadow-sm",
              location.pathname === '/waiter' 
                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-amber-500/30 scale-[1.02]" 
                : isDark 
                  ? "text-slate-300 hover:bg-slate-800 hover:text-white" 
                  : "text-stone-700 hover:bg-amber-100/60 hover:text-amber-900"
            )}
          >
            <Coffee className="w-5 h-5" />
            Sipariş Yönetimi
          </Link>

          <Link
            to="/kitchen"
            onClick={() => setMobileMenuOpen(false)}
            className={cn(
              "flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-base font-bold transition-all shadow-sm",
              location.pathname === '/kitchen' 
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-500/30 scale-[1.02]" 
                : isDark 
                  ? "text-slate-300 hover:bg-slate-800 hover:text-white" 
                  : "text-stone-700 hover:bg-blue-50 hover:text-blue-900"
            )}
          >
            <ChefHat className="w-5 h-5" />
            Mutfak Ekranı
          </Link>

          <Link
            to="/admin"
            onClick={() => setMobileMenuOpen(false)}
            className={cn(
              "flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-base font-bold transition-all shadow-sm",
              location.pathname === '/admin' 
                ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-purple-500/30 scale-[1.02]" 
                : isDark 
                  ? "text-slate-300 hover:bg-slate-800 hover:text-white" 
                  : "text-stone-700 hover:bg-purple-50 hover:text-purple-900"
            )}
          >
            <BarChart3 className="w-5 h-5" />
            Raporlar & Menü
          </Link>

          <div className="pt-4 border-t border-stone-200/20">
            <Link
              to="/"
              target="_blank"
              className={cn(
                "flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all border",
                isDark
                  ? "bg-slate-800/50 border-slate-700 text-emerald-400 hover:bg-slate-800"
                  : "bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100"
              )}
            >
              <span className="flex items-center gap-2">
                <Utensils className="w-4 h-4" />
                Dijital Menüyü Gör
              </span>
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </nav>

        {/* Footer Logout */}
        <div className="p-4 border-t border-stone-200/20">
          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center justify-center gap-3 px-4 py-3.5 w-full rounded-2xl text-base font-black transition-all border-2 shadow-sm active:scale-95",
              isDark 
                ? "text-rose-400 border-rose-900/50 hover:bg-rose-950/50" 
                : "text-rose-600 border-rose-200 hover:bg-rose-50"
            )}
          >
            <LogOut className="w-5 h-5" />
            ÇIKIŞ YAP
          </button>
        </div>
      </div>

      {/* Main Content View */}
      <div className="flex-1 overflow-hidden flex flex-col pt-16 md:pt-0">
        <Outlet context={{ isDark }} />
      </div>
    </div>
  );
}

