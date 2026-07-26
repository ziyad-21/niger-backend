import fs from 'fs';
import path from 'path';
import { supabase, isSupabaseConfigured } from './supabase';

const dbPath = path.join(process.cwd(), 'db.json');

export type User = {
  id: string;
  username: string;
  role: 'admin' | 'waiter' | 'kitchen';
  name: string;
};

export type MenuItem = {
  id: string;
  name: string;
  price: number;
  category: string;
  image?: string;
  isAvailable: boolean;
};

export type OrderItem = {
  draftId?: string;
  menuItemId?: string;
  quantity: number;
  name: string;
  price: number;
  customizations?: string[];
  note?: string;
};

export type Order = {
  id: string;
  orderNumber: number;
  tableNumber: number;
  items: OrderItem[];
  totalAmount: number;
  status: 'new' | 'preparing' | 'ready' | 'waiting_payment' | 'paid' | 'completed';
  paymentMethod?: 'cash' | 'card';
  paymentStatus?: 'pending' | 'paid';
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type DbSchema = {
  users: User[];
  menuItems: MenuItem[];
  orders: Order[];
  metadata: {
    lastOrderNumber: number;
  };
};

export const defaultData: DbSchema = {
  users: [
    { id: '1', username: 'admin', role: 'admin', name: 'Yönetici' },
    { id: '2', username: 'garson', role: 'waiter', name: 'Garson Ali' },
    { id: '3', username: 'mutfak', role: 'kitchen', name: 'Aşçı Veli' },
  ],
  menuItems: [
    { id: 'm1', name: 'Köfte Ekmek', price: 400, category: 'YEMEKLER', image: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=500&auto=format&fit=crop&q=80', isAvailable: true },
    { id: 'm2', name: 'Köfte Porsiyon', price: 500, category: 'YEMEKLER', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=80', isAvailable: true },
    { id: 'm3', name: 'Hamburger', price: 300, category: 'YEMEKLER', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80', isAvailable: true },
    { id: 'm4', name: 'Balık Ekmek', price: 400, category: 'YEMEKLER', image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=500&auto=format&fit=crop&q=80', isAvailable: true },
    { id: 'm5', name: 'Gözleme', price: 250, category: 'YEMEKLER', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&auto=format&fit=crop&q=80', isAvailable: true },
    { id: 'm6', name: 'Patates Kızartması', price: 200, category: 'YEMEKLER', image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&auto=format&fit=crop&q=80', isAvailable: true },
    { id: 'm7', name: 'Sosisli Patso', price: 180, category: 'YEMEKLER', image: 'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?w=500&auto=format&fit=crop&q=80', isAvailable: true },
    { id: 'm8', name: 'Kahvaltı Tabağı', price: 400, category: 'YEMEKLER', image: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=500&auto=format&fit=crop&q=80', isAvailable: true },
    { id: 'm9', name: 'Menemen', price: 250, category: 'YEMEKLER', image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=500&auto=format&fit=crop&q=80', isAvailable: true },
    { id: 'm10', name: 'Tost Karışık', price: 250, category: 'YEMEKLER', image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80', isAvailable: true },
    { id: 'm11', name: 'Tost Kaşarlı', price: 200, category: 'YEMEKLER', image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80', isAvailable: true },
    { id: 'm12', name: 'Soğuk Sandwich', price: 250, category: 'YEMEKLER', image: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=80', isAvailable: true },
    
    // SOĞUK İÇECEKLER
    { id: 'c1', name: 'Coca-Cola Kutu (330ml)', price: 70, category: 'SOĞUK İÇECEKLER', image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80', isAvailable: true },
    { id: 'c2', name: 'Coca-Cola Zero', price: 70, category: 'SOĞUK İÇECEKLER', image: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=500&auto=format&fit=crop&q=80', isAvailable: true },
    { id: 'c3', name: 'Fanta Portakal', price: 70, category: 'SOĞUK İÇECEKLER', image: 'https://images.unsplash.com/photo-1624517452488-04869289c4ca?w=500&auto=format&fit=crop&q=80', isAvailable: true },
    { id: 'c4', name: 'Fuse Tea Şeftali (Ice Tea)', price: 70, category: 'SOĞUK İÇECEKLER', image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500&auto=format&fit=crop&q=80', isAvailable: true },
    { id: 'c5', name: 'Fuse Tea Limon (Ice Tea)', price: 70, category: 'SOĞUK İÇECEKLER', image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500&auto=format&fit=crop&q=80', isAvailable: true },
    { id: 'c6', name: 'Yayık Ayranı', price: 50, category: 'SOĞUK İÇECEKLER', image: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=500&auto=format&fit=crop&q=80', isAvailable: true },
    { id: 'c7', name: 'Niğde Gazozu', price: 60, category: 'SOĞUK İÇECEKLER', image: 'https://images.unsplash.com/photo-1581006852262-e4307cf6283a?w=500&auto=format&fit=crop&q=80', isAvailable: true },
    { id: 'c8', name: 'Maden Suyu (Soda)', price: 40, category: 'SOĞUK İÇECEKLER', image: 'https://images.unsplash.com/photo-1603569283847-aa295f0d016a?w=500&auto=format&fit=crop&q=80', isAvailable: true },
    { id: 'c9', name: 'Şalgam Suyu', price: 50, category: 'SOĞUK İÇECEKLER', image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=80', isAvailable: true },
    { id: 'c10', name: 'Su (500ml)', price: 25, category: 'SOĞUK İÇECEKLER', image: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=500&auto=format&fit=crop&q=80', isAvailable: true },

    // KAHVE & SICAK
    { id: 'd1', name: 'Espresso', price: 100, category: 'KAHVE', image: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=500&auto=format&fit=crop&q=80', isAvailable: true },
    { id: 'd2', name: 'Americano', price: 130, category: 'KAHVE', image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=80', isAvailable: true },
    { id: 'd3', name: 'Latte', price: 170, category: 'KAHVE', image: 'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?w=500&auto=format&fit=crop&q=80', isAvailable: true },
    { id: 'd4', name: 'Mocha', price: 170, category: 'KAHVE', image: 'https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=500&auto=format&fit=crop&q=80', isAvailable: true },
    { id: 'd5', name: 'Cappuccino', price: 170, category: 'KAHVE', image: 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=500&auto=format&fit=crop&q=80', isAvailable: true },
    { id: 'd6', name: 'Ice Latte', price: 170, category: 'KAHVE', image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500&auto=format&fit=crop&q=80', isAvailable: true },
    { id: 'd7', name: 'Ice Mocha', price: 170, category: 'KAHVE', image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=500&auto=format&fit=crop&q=80', isAvailable: true },
    { id: 'd8', name: 'Türk Kahvesi', price: 120, category: 'KAHVE', image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=80', isAvailable: true },
  ],
  orders: [],
  metadata: { lastOrderNumber: 100 },
};

function readDb(): DbSchema {
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
  try {
    const data: DbSchema = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    let updated = false;
    defaultData.menuItems.forEach(defaultItem => {
      const existing = data.menuItems.find(m => m.id === defaultItem.id);
      if (!existing) {
        data.menuItems.push(defaultItem);
        updated = true;
      } else if (!existing.image && defaultItem.image) {
        existing.image = defaultItem.image;
        updated = true;
      }
    });

    if (updated) {
      fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    }
    return data;
  } catch (err) {
    console.error('Error reading DB:', err);
    return defaultData;
  }
}

function writeDb(data: DbSchema) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

let dbCache: DbSchema | null = null;

export const localDb = {
  get data(): DbSchema {
    if (!dbCache) {
      dbCache = readDb();
    }
    return dbCache;
  },
  save() {
    if (dbCache) {
      writeDb(dbCache);
    }
  }
};

// Helper: strictly enforce Supabase persistence for production
function getSupabaseClient() {
  if (!supabase || !isSupabaseConfigured) {
    throw new Error('Supabase project credentials (SUPABASE_URL, SUPABASE_SECRET_KEY) not configured or unavailable. Production data must be persisted exclusively in Supabase PostgreSQL.');
  }
  return supabase;
}

// Helper: validate standard UUID format
function isValidUUID(str?: string): boolean {
  if (!str || typeof str !== 'string') return false;
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);
}

// --- MAIN PERSISTENT DB SERVICE LAYER (SUPABASE EXCLUSIVE) ---
export const dbService = {
  // USERS
  async getUserByUsername(username: string): Promise<User | null> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('users')
      .select('*')
      .eq('username', username)
      .maybeSingle();

    if (error) {
      console.error('Supabase getUserByUsername error:', error);
      throw new Error(`Veritabanı hatası: ${error.message}`);
    }
    if (!data) return null;
    return {
      id: data.id,
      username: data.username,
      role: data.role as any,
      name: data.name
    };
  },

  async getUsers(): Promise<User[]> {
    const client = getSupabaseClient();
    const { data, error } = await client.from('users').select('*').order('created_at', { ascending: true });
    if (error) {
      console.error('Supabase getUsers error:', error);
      throw new Error(`Kullanıcılar alınamadı: ${error.message}`);
    }
    return (data || []).map(u => ({
      id: u.id,
      username: u.username,
      role: u.role as any,
      name: u.name
    }));
  },

  // MENU ITEMS
  async getMenuItems(onlyAvailable = false): Promise<MenuItem[]> {
    const client = getSupabaseClient();
    let query = client.from('menu_items').select('*').order('created_at', { ascending: true });
    if (onlyAvailable) {
      query = query.eq('is_available', true);
    }
    const { data, error } = await query;
    if (error) {
      console.error('Supabase getMenuItems error:', error);
      throw new Error(`Menü öğeleri alınamadı: ${error.message}`);
    }
    return (data || []).map(item => ({
      id: item.id,
      name: item.name,
      price: Number(item.price),
      category: item.category,
      image: item.image || undefined,
      isAvailable: Boolean(item.is_available)
    }));
  },

  async createMenuItem(item: Omit<MenuItem, 'id'>): Promise<MenuItem> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('menu_items')
      .insert({
        name: item.name,
        price: item.price,
        category: item.category,
        image: item.image || null,
        is_available: item.isAvailable ?? true
      })
      .select()
      .single();

    if (error || !data) {
      console.error('Supabase createMenuItem error:', error);
      throw new Error(`Menü öğesi oluşturulamadı: ${error?.message || 'Bilinmeyen hata'}`);
    }
    return {
      id: data.id,
      name: data.name,
      price: Number(data.price),
      category: data.category,
      image: data.image || undefined,
      isAvailable: Boolean(data.is_available)
    };
  },

  async updateMenuItem(id: string, itemData: Partial<MenuItem>): Promise<MenuItem | null> {
    const client = getSupabaseClient();
    const payload: any = { updated_at: new Date().toISOString() };
    if (itemData.name !== undefined) payload.name = itemData.name;
    if (itemData.price !== undefined) payload.price = itemData.price;
    if (itemData.category !== undefined) payload.category = itemData.category;
    if (itemData.image !== undefined) payload.image = itemData.image;
    if (itemData.isAvailable !== undefined) payload.is_available = itemData.isAvailable;

    const { data, error } = await client
      .from('menu_items')
      .update(payload)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Supabase updateMenuItem error:', error);
      throw new Error(`Menü öğesi güncellenemedi: ${error.message}`);
    }
    if (!data) return null;
    return {
      id: data.id,
      name: data.name,
      price: Number(data.price),
      category: data.category,
      image: data.image || undefined,
      isAvailable: Boolean(data.is_available)
    };
  },

  async deleteMenuItem(id: string): Promise<boolean> {
    const client = getSupabaseClient();
    const { error } = await client.from('menu_items').delete().eq('id', id);
    if (error) {
      console.error('Supabase deleteMenuItem error:', error);
      throw new Error(`Menü öğesi silinemedi: ${error.message}`);
    }
    return true;
  },

  // RESTAURANT TABLES
  async getRestaurantTables(): Promise<{ id: string; tableNumber: number; name?: string; isActive: boolean }[]> {
    const client = getSupabaseClient();
    const { data, error } = await client.from('restaurant_tables').select('*').order('table_number', { ascending: true });
    if (error) {
      console.error('Supabase getRestaurantTables error:', error);
      throw new Error(`Masalar alınamadı: ${error.message}`);
    }
    return (data || []).map(t => ({
      id: t.id,
      tableNumber: t.table_number,
      name: t.name || undefined,
      isActive: Boolean(t.is_active)
    }));
  },

  // ORDERS
  async getOrders(): Promise<Order[]> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('orders')
      .select(`
        *,
        items:order_items(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase getOrders error:', error);
      throw new Error(`Siparişler alınamadı: ${error.message}`);
    }
    return (data || []).map(o => ({
      id: o.id,
      orderNumber: o.order_number,
      tableNumber: o.table_number,
      totalAmount: Number(o.total_amount),
      status: o.status as any,
      paymentMethod: o.payment_method || undefined,
      paymentStatus: o.payment_status as any,
      notes: o.notes || undefined,
      createdAt: o.created_at,
      updatedAt: o.updated_at,
      items: (o.items || []).map((it: any) => ({
        draftId: it.id,
        menuItemId: it.menu_item_id || undefined,
        name: it.name,
        price: Number(it.price),
        quantity: it.quantity || 1,
        customizations: it.customizations || [],
        note: it.notes || undefined
      }))
    }));
  },

  async createOrder(data: { tableNumber: number; items: OrderItem[]; totalAmount: number; notes?: string }): Promise<Order> {
    const client = getSupabaseClient();
    
    // Determine next sequential order number
    let nextOrderNum = 100;
    try {
      const { data: seqNum, error: seqErr } = await client.rpc('get_next_order_number');
      if (!seqErr && typeof seqNum === 'number') {
        nextOrderNum = seqNum;
      } else {
        const { data: maxRows } = await client
          .from('orders')
          .select('order_number')
          .order('order_number', { ascending: false })
          .limit(1);
        nextOrderNum = maxRows && maxRows.length > 0 ? (maxRows[0].order_number + 1) : 100;
      }
    } catch (e) {
      const { data: maxRows } = await client
        .from('orders')
        .select('order_number')
        .order('order_number', { ascending: false })
        .limit(1);
      nextOrderNum = maxRows && maxRows.length > 0 ? (maxRows[0].order_number + 1) : 100;
    }

    const { data: newOrderRow, error: orderErr } = await client
      .from('orders')
      .insert({
        order_number: nextOrderNum,
        table_number: data.tableNumber,
        total_amount: data.totalAmount,
        status: 'new',
        payment_status: 'pending',
        notes: data.notes || null,
      })
      .select()
      .single();

    if (orderErr || !newOrderRow) {
      console.error('Supabase createOrder error:', orderErr);
      throw new Error(`Sipariş oluşturulamadı: ${orderErr?.message || 'Bilinmeyen hata'}`);
    }

    // Insert items safely mapping menu item IDs
    if (data.items && data.items.length > 0) {
      const { data: allMenuItems } = await client.from('menu_items').select('id, name');
      const nameToUuid = new Map<string, string>();
      if (allMenuItems) {
        allMenuItems.forEach(m => nameToUuid.set(m.name, m.id));
      }

      const itemRows = data.items.map(it => {
        let menuItemId: string | null = null;
        if (isValidUUID(it.menuItemId)) {
          menuItemId = it.menuItemId!;
        } else if (nameToUuid.has(it.name)) {
          menuItemId = nameToUuid.get(it.name)!;
        }
        return {
          order_id: newOrderRow.id,
          menu_item_id: menuItemId,
          name: it.name,
          price: it.price,
          quantity: it.quantity || 1,
          notes: it.note || null,
          customizations: it.customizations || []
        };
      });

      const { error: itemsErr } = await client.from('order_items').insert(itemRows);
      if (itemsErr) {
        console.error('Supabase createOrder items error:', itemsErr);
        throw new Error(`Sipariş kalemleri eklenemedi: ${itemsErr.message}`);
      }
    }

    return {
      id: newOrderRow.id,
      orderNumber: newOrderRow.order_number,
      tableNumber: newOrderRow.table_number,
      totalAmount: Number(newOrderRow.total_amount),
      status: newOrderRow.status as any,
      paymentStatus: newOrderRow.payment_status as any,
      notes: newOrderRow.notes || undefined,
      createdAt: newOrderRow.created_at,
      updatedAt: newOrderRow.updated_at,
      items: data.items
    };
  },

  async updateOrderStatus(id: string, status: string, paymentMethod?: string): Promise<Order | null> {
    const client = getSupabaseClient();
    const payload: any = {
      status,
      updated_at: new Date().toISOString()
    };
    if (paymentMethod) {
      payload.payment_method = paymentMethod;
    }
    if (status === 'paid' || status === 'completed') {
      payload.payment_status = 'paid';
    }

    const { data, error } = await client
      .from('orders')
      .update(payload)
      .eq('id', id)
      .select(`*, items:order_items(*)`)
      .maybeSingle();

    if (error) {
      console.error('Supabase updateOrderStatus error:', error);
      throw new Error(`Sipariş durumu güncellenemedi: ${error.message}`);
    }
    if (!data) return null;
    return {
      id: data.id,
      orderNumber: data.order_number,
      tableNumber: data.table_number,
      totalAmount: Number(data.total_amount),
      status: data.status as any,
      paymentMethod: data.payment_method || undefined,
      paymentStatus: data.payment_status as any,
      notes: data.notes || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      items: (data.items || []).map((it: any) => ({
        draftId: it.id,
        menuItemId: it.menu_item_id || undefined,
        name: it.name,
        price: Number(it.price),
        quantity: it.quantity || 1,
        customizations: it.customizations || [],
        note: it.notes || undefined
      }))
    };
  },

  async updateOrder(id: string, updateData: Partial<Order>): Promise<Order | null> {
    const client = getSupabaseClient();
    const payload: any = { updated_at: new Date().toISOString() };
    if (updateData.status) {
      payload.status = updateData.status;
      if (updateData.status === 'paid' || updateData.status === 'completed') {
        payload.payment_status = 'paid';
      }
    }
    if ((updateData as any).paymentStatus) {
      payload.payment_status = (updateData as any).paymentStatus;
    }
    if (updateData.totalAmount !== undefined) payload.total_amount = updateData.totalAmount;
    if (updateData.paymentMethod) payload.payment_method = updateData.paymentMethod;
    if (updateData.notes !== undefined) payload.notes = updateData.notes;

    const { error } = await client.from('orders').update(payload).eq('id', id);
    if (error) {
      console.error('Supabase updateOrder error:', error);
      throw new Error(`Sipariş güncellenemedi: ${error.message}`);
    }

    if (updateData.items) {
      await client.from('order_items').delete().eq('order_id', id);

      const { data: allMenuItems } = await client.from('menu_items').select('id, name');
      const nameToUuid = new Map<string, string>();
      if (allMenuItems) {
        allMenuItems.forEach(m => nameToUuid.set(m.name, m.id));
      }

      const itemRows = updateData.items.map(it => {
        let menuItemId: string | null = null;
        if (isValidUUID(it.menuItemId)) {
          menuItemId = it.menuItemId!;
        } else if (nameToUuid.has(it.name)) {
          menuItemId = nameToUuid.get(it.name)!;
        }
        return {
          order_id: id,
          menu_item_id: menuItemId,
          name: it.name,
          price: it.price,
          quantity: it.quantity || 1,
          notes: it.note || null,
          customizations: it.customizations || []
        };
      });

      const { error: itemsErr } = await client.from('order_items').insert(itemRows);
      if (itemsErr) {
        console.error('Supabase updateOrder items error:', itemsErr);
        throw new Error(`Sipariş kalemleri güncellenemedi: ${itemsErr.message}`);
      }
    }

    const { data: refreshed, error: refErr } = await client
      .from('orders')
      .select(`*, items:order_items(*)`)
      .eq('id', id)
      .maybeSingle();

    if (refErr) {
      console.error('Supabase updateOrder refresh error:', refErr);
      throw new Error(`Sipariş bilgisi alınamadı: ${refErr.message}`);
    }
    if (!refreshed) return null;

    return {
      id: refreshed.id,
      orderNumber: refreshed.order_number,
      tableNumber: refreshed.table_number,
      totalAmount: Number(refreshed.total_amount),
      status: refreshed.status as any,
      paymentMethod: refreshed.payment_method || undefined,
      paymentStatus: refreshed.payment_status as any,
      notes: refreshed.notes || undefined,
      createdAt: refreshed.created_at,
      updatedAt: refreshed.updated_at,
      items: (refreshed.items || []).map((it: any) => ({
        draftId: it.id,
        menuItemId: it.menu_item_id || undefined,
        name: it.name,
        price: Number(it.price),
        quantity: it.quantity || 1,
        customizations: it.customizations || [],
        note: it.notes || undefined
      }))
    };
  },

  async deleteOrder(id: string): Promise<boolean> {
    const client = getSupabaseClient();
    const { error } = await client.from('orders').delete().eq('id', id);
    if (error) {
      console.error('Supabase deleteOrder error:', error);
      throw new Error(`Sipariş silinemedi: ${error.message}`);
    }
    return true;
  },

  // STATS
  async getStats() {
    const orders = await this.getOrders();
    const today = new Date().toISOString().split('T')[0];

    const completedOrders = orders.filter(o => o.status === 'completed' || o.status === 'paid');
    const todaysOrders = completedOrders.filter(o => o.createdAt.startsWith(today));

    const todaysRevenue = todaysOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalRevenue = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const cashTotal = completedOrders.filter(o => o.paymentMethod === 'cash').reduce((sum, o) => sum + o.totalAmount, 0);
    const cardTotal = completedOrders.filter(o => o.paymentMethod === 'card').reduce((sum, o) => sum + o.totalAmount, 0);

    return {
      todaysRevenue,
      totalRevenue,
      totalOrdersCount: completedOrders.length,
      cashTotal,
      cardTotal
    };
  },

  // MIGRATION HELPER (JSON -> Supabase)
  async migrateJsonToSupabase() {
    const client = getSupabaseClient();
    const currentJson = readDb();
    const results = {
      usersMigrated: 0,
      menuItemsMigrated: 0,
      tablesMigrated: 0,
      ordersMigrated: 0
    };

    // 1. Migrate Users
    if (currentJson.users && currentJson.users.length > 0) {
      for (const u of currentJson.users) {
        const { error } = await client.from('users').upsert({
          username: u.username,
          name: u.name,
          role: u.role
        }, { onConflict: 'username' });
        if (!error) results.usersMigrated++;
        else console.error('Migrate user error:', error.message);
      }
    }

    // 2. Migrate Menu Items
    if (currentJson.menuItems && currentJson.menuItems.length > 0) {
      for (const item of currentJson.menuItems) {
        const { data: existing } = await client.from('menu_items').select('id').eq('name', item.name).maybeSingle();
        if (!existing) {
          const { error } = await client.from('menu_items').insert({
            name: item.name,
            price: item.price,
            category: item.category,
            image: item.image || null,
            is_available: item.isAvailable ?? true
          });
          if (!error) results.menuItemsMigrated++;
          else console.error('Migrate menu insert error:', error.message);
        } else {
          const { error } = await client.from('menu_items').update({
            price: item.price,
            category: item.category,
            image: item.image || null,
            is_available: item.isAvailable ?? true
          }).eq('id', existing.id);
          if (!error) results.menuItemsMigrated++;
          else console.error('Migrate menu update error:', error.message);
        }
      }
    }

    // 3. Migrate Restaurant Tables if available (or generate default 10 tables)
    const tablesToMigrate = (currentJson as any).tables || (currentJson as any).restaurantTables || [
      { tableNumber: 1, name: 'Masa 1', isActive: true },
      { tableNumber: 2, name: 'Masa 2', isActive: true },
      { tableNumber: 3, name: 'Masa 3', isActive: true },
      { tableNumber: 4, name: 'Masa 4', isActive: true },
      { tableNumber: 5, name: 'Masa 5', isActive: true },
      { tableNumber: 6, name: 'Masa 6', isActive: true },
      { tableNumber: 7, name: 'Masa 7', isActive: true },
      { tableNumber: 8, name: 'Masa 8', isActive: true },
      { tableNumber: 9, name: 'Masa 9', isActive: true },
      { tableNumber: 10, name: 'Masa 10', isActive: true },
    ];
    for (const t of tablesToMigrate) {
      const { error } = await client.from('restaurant_tables').upsert({
        table_number: t.tableNumber || t.table_number,
        name: t.name || `Masa ${t.tableNumber || t.table_number}`,
        is_active: t.isActive !== undefined ? t.isActive : (t.is_active !== undefined ? t.is_active : true)
      }, { onConflict: 'table_number' });
      if (!error) results.tablesMigrated++;
      else console.error('Migrate table error:', error.message);
    }

    // 4. Migrate Orders and Order Items
    if (currentJson.orders && currentJson.orders.length > 0) {
      const { data: allMenuItems } = await client.from('menu_items').select('id, name');
      const nameToUuid = new Map<string, string>();
      if (allMenuItems) {
        allMenuItems.forEach(m => nameToUuid.set(m.name, m.id));
      }

      for (const o of currentJson.orders) {
        const { data: newOrderRow, error: orderErr } = await client.from('orders').upsert({
          order_number: o.orderNumber,
          table_number: o.tableNumber,
          total_amount: o.totalAmount,
          status: o.status,
          payment_method: o.paymentMethod || null,
          payment_status: (o.status === 'paid' || o.status === 'completed') ? 'paid' : 'pending',
          notes: o.notes || null,
          created_at: o.createdAt || new Date().toISOString(),
          updated_at: o.updatedAt || new Date().toISOString()
        }, { onConflict: 'order_number' }).select().single();

        if (!orderErr && newOrderRow) {
          results.ordersMigrated++;
          if (o.items && o.items.length > 0) {
            await client.from('order_items').delete().eq('order_id', newOrderRow.id);
            const itemRows = o.items.map(it => {
              let menuItemId: string | null = null;
              if (isValidUUID(it.menuItemId)) {
                menuItemId = it.menuItemId!;
              } else if (nameToUuid.has(it.name)) {
                menuItemId = nameToUuid.get(it.name)!;
              }
              return {
                order_id: newOrderRow.id,
                menu_item_id: menuItemId,
                name: it.name,
                price: it.price,
                quantity: it.quantity || 1,
                notes: it.note || null,
                customizations: it.customizations || []
              };
            });
            await client.from('order_items').insert(itemRows);
          }
        } else {
          console.error('Migrate order error:', orderErr?.message);
        }
      }
    }

    return results;
  }
};

// Export legacy db object for backward compatibility (read-only from disk, never written to by production runtime)
export const db = localDb;
