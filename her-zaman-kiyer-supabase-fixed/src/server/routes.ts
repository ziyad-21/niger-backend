import { Express, Request, Response, NextFunction } from 'express';
import { dbService } from './db';
import { isSupabaseConfigured } from './supabase';

// SSE client set for broadcasting real-time updates
const clients: Set<Response> = new Set();

function broadcastEvent(type: string, data: any) {
  const message = `data: ${JSON.stringify({ type, data })}\n\n`;
  clients.forEach(client => client.write(message));
}

// Helper to catch async errors and return clear 500 responses without falling back
const asyncHandler = (fn: (req: Request, res: Response, next?: NextFunction) => Promise<any>) => 
  (req: Request, res: Response, next?: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(err => {
      console.error('API Route Error:', err);
      res.status(500).json({ error: err.message || 'Server database error occurred.' });
    });
  };

export function registerRoutes(app: Express) {
  // --- Health Check ---
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      ok: true,
      database: isSupabaseConfigured ? 'supabase_postgresql' : 'unconfigured'
    });
  });

  // --- SSE Endpoint for Realtime Broadcasts ---
  app.get('/api/events', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    clients.add(res);
    req.on('close', () => {
      clients.delete(res);
    });
  });

  // --- DB Status & Migration Endpoints ---
  app.get('/api/admin/db-status', (req: Request, res: Response) => {
    res.json({
      isSupabaseConfigured,
      mode: isSupabaseConfigured ? 'supabase_postgresql' : 'unconfigured_error',
      persistentSourceOfTruth: 'Supabase PostgreSQL (Exclusive)'
    });
  });

  app.post('/api/admin/migrate-to-supabase', asyncHandler(async (req: Request, res: Response) => {
    const result = await dbService.migrateJsonToSupabase();
    res.json({ success: true, ...result });
  }));

  // --- Tables ---
  app.get('/api/tables', asyncHandler(async (req: Request, res: Response) => {
    const tables = await dbService.getRestaurantTables();
    res.json(tables);
  }));

  app.get('/api/admin/tables', asyncHandler(async (req: Request, res: Response) => {
    const tables = await dbService.getRestaurantTables();
    res.json(tables);
  }));

  // --- Auth ---
  app.post('/api/auth/login', asyncHandler(async (req: Request, res: Response) => {
    const { username } = req.body;
    const user = await dbService.getUserByUsername(username);
    if (user) {
      res.json({ token: 'fake-jwt-token', user });
    } else {
      res.status(401).json({ error: 'Kullanıcı bulunamadı.' });
    }
  }));

  // --- Menu Items ---
  app.get('/api/menu', asyncHandler(async (req: Request, res: Response) => {
    const items = await dbService.getMenuItems(true);
    res.json(items);
  }));

  app.get('/api/admin/menu', asyncHandler(async (req: Request, res: Response) => {
    const items = await dbService.getMenuItems(false);
    res.json(items);
  }));

  app.post('/api/admin/menu', asyncHandler(async (req: Request, res: Response) => {
    const newItem = await dbService.createMenuItem(req.body);
    broadcastEvent('menu_updated', newItem);
    res.json(newItem);
  }));

  app.put('/api/admin/menu/:id', asyncHandler(async (req: Request, res: Response) => {
    const updated = await dbService.updateMenuItem(req.params.id, req.body);
    if (updated) {
      broadcastEvent('menu_updated', updated);
      res.json(updated);
    } else {
      res.status(404).json({ error: 'Menu item not found' });
    }
  }));

  app.delete('/api/admin/menu/:id', asyncHandler(async (req: Request, res: Response) => {
    const success = await dbService.deleteMenuItem(req.params.id);
    if (success) {
      broadcastEvent('menu_updated', { deletedId: req.params.id });
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Menu item not found' });
    }
  }));

  // --- Orders ---
  app.get('/api/orders', asyncHandler(async (req: Request, res: Response) => {
    const orders = await dbService.getOrders();
    res.json(orders);
  }));

  app.post('/api/orders', asyncHandler(async (req: Request, res: Response) => {
    const { tableNumber, items, totalAmount, notes } = req.body;
    const newOrder = await dbService.createOrder({
      tableNumber: Number(tableNumber),
      items,
      totalAmount: Number(totalAmount),
      notes
    });
    broadcastEvent('order_created', newOrder);
    res.json(newOrder);
  }));

  app.delete('/api/orders/:id', asyncHandler(async (req: Request, res: Response) => {
    const success = await dbService.deleteOrder(req.params.id);
    if (success) {
      broadcastEvent('order_deleted', { deletedId: req.params.id });
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Order not found' });
    }
  }));

  app.put('/api/orders/:id/status', asyncHandler(async (req: Request, res: Response) => {
    const { status, paymentMethod } = req.body;
    const updated = await dbService.updateOrderStatus(req.params.id, status, paymentMethod);
    if (updated) {
      broadcastEvent('order_updated', updated);
      res.json(updated);
    } else {
      res.status(404).json({ error: 'Order not found' });
    }
  }));

  app.put('/api/orders/:id', asyncHandler(async (req: Request, res: Response) => {
    const updated = await dbService.updateOrder(req.params.id, req.body);
    if (updated) {
      broadcastEvent('order_updated', updated);
      res.json(updated);
    } else {
      res.status(404).json({ error: 'Order not found' });
    }
  }));

  // --- Stats ---
  app.get('/api/admin/stats', asyncHandler(async (req: Request, res: Response) => {
    const stats = await dbService.getStats();
    res.json(stats);
  }));
}
