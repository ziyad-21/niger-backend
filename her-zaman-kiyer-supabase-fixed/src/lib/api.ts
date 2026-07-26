export const api = {
  getMenu: async () => {
    const res = await fetch('/api/menu', { cache: 'no-store' });
    const data = await res.json().catch(() => null);
    if (!res.ok || (data && data.error)) {
      throw new Error(data?.error || `Menü alınamadı (${res.status})`);
    }
    return Array.isArray(data) ? data : [];
  },

  getAdminMenu: async () => {
    const res = await fetch('/api/admin/menu', { cache: 'no-store' });
    const data = await res.json().catch(() => null);
    if (!res.ok || (data && data.error)) {
      throw new Error(data?.error || `Admin menüsü alınamadı (${res.status})`);
    }
    return Array.isArray(data) ? data : [];
  },
  getOrders: async () => {
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      if (data && data.error) {
        console.error('getOrders API error:', data.error);
        return [];
      }
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.error('getOrders network error:', e);
      return [];
    }
  },
  getTables: async () => {
    try {
      const res = await fetch('/api/tables');
      const data = await res.json();
      if (data && data.error) {
        console.error('getTables API error:', data.error);
        return [];
      }
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.error('getTables network error:', e);
      return [];
    }
  },
  createOrder: async (data: any) => {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  updateOrderStatus: async (id: string, status: string, paymentMethod?: string) => {
    const res = await fetch(`/api/orders/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, paymentMethod })
    });
    return res.json();
  },
  updateOrder: async (id: string, data: any) => {
    const res = await fetch(`/api/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  deleteOrder: async (id: string) => {
    const res = await fetch(`/api/orders/${id}`, { method: 'DELETE' });
    return res.json();
  },
  createMenuItem: async (data: any) => {
    const res = await fetch('/api/admin/menu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  updateMenuItem: async (id: string, data: any) => {
    const res = await fetch(`/api/admin/menu/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  deleteMenuItem: async (id: string) => {
    const res = await fetch(`/api/admin/menu/${id}`, { method: 'DELETE' });
    return res.json();
  },
  getDbStatus: async () => {
    try {
      const res = await fetch('/api/admin/db-status');
      return await res.json();
    } catch (e) {
      return null;
    }
  },
  migrateToSupabase: async () => {
    const res = await fetch('/api/admin/migrate-to-supabase', { method: 'POST' });
    return res.json();
  }
};


