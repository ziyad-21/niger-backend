import { useNavigate, Link } from 'react-router-dom';
import type { FormEvent } from 'react';
import { ArrowLeft, Utensils } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    localStorage.setItem('user', JSON.stringify({ name: 'Personel', role: 'staff' }));
    navigate('/waiter');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 px-4 relative font-sans">
      <Link to="/" className="absolute top-6 left-6 flex items-center gap-2 text-stone-600 hover:text-stone-900 transition-colors font-bold bg-white px-5 py-3 rounded-2xl shadow-sm border-2 border-stone-200">
        <ArrowLeft className="w-5 h-5" />
        MENÜYE DÖN
      </Link>
      <div className="w-full max-w-sm bg-white p-10 rounded-3xl shadow-xl shadow-stone-200/50 border-2 border-stone-100 text-center">
        <div className="mb-8">
          <Utensils className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-3xl font-black tracking-tight text-stone-900 uppercase">
            PERSONEL
          </h1>
          <p className="text-stone-400 font-bold tracking-widest mt-2 uppercase text-sm">Sisteme Giriş</p>
        </div>

        <button
          onClick={handleLogin}
          className="w-full py-4 bg-stone-900 text-white rounded-2xl font-black text-lg hover:bg-stone-800 transition-colors shadow-lg shadow-stone-900/20 active:scale-95"
        >
          SİSTEME GİR
        </button>
      </div>
    </div>
  );
}
