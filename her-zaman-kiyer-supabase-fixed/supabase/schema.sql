-- Supabase PostgreSQL Database Schema for Restaurant App

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'waiter', 'kitchen')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. menu_items Table
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  category TEXT NOT NULL,
  image TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. restaurant_tables Table
CREATE TABLE IF NOT EXISTS restaurant_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_number INTEGER UNIQUE NOT NULL,
  name TEXT,
  is_active BOOLEAN DEFAULT TRUE
);

-- 4. orders Table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number INTEGER UNIQUE NOT NULL,
  table_number INTEGER NOT NULL,
  total_amount NUMERIC NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('new', 'preparing', 'ready', 'waiting_payment', 'paid', 'completed')),
  payment_method TEXT CHECK (payment_method IN ('cash', 'card')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. order_items Table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  customizations JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sequence & Helper function for sequential order numbers starting at 100
CREATE SEQUENCE IF NOT EXISTS order_number_seq START WITH 100;

CREATE OR REPLACE FUNCTION get_next_order_number()
RETURNS INTEGER AS $$
DECLARE
  max_num INTEGER;
BEGIN
  SELECT MAX(order_number) INTO max_num FROM orders;
  IF max_num IS NULL THEN
    RETURN 100;
  ELSE
    RETURN max_num + 1;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Disable Row Level Security (RLS) for direct backend API access or grant policies
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_tables DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;

-- Grant permissions to standard Supabase API roles (anon, authenticated, service_role)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON TABLE users TO anon, authenticated, service_role;
GRANT ALL ON TABLE menu_items TO anon, authenticated, service_role;
GRANT ALL ON TABLE restaurant_tables TO anon, authenticated, service_role;
GRANT ALL ON TABLE orders TO anon, authenticated, service_role;
GRANT ALL ON TABLE order_items TO anon, authenticated, service_role;
GRANT ALL ON SEQUENCE order_number_seq TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_next_order_number() TO anon, authenticated, service_role;

-- If RLS is enabled in the Supabase Dashboard, create permissive policies for full-stack server operations
DO $$ 
BEGIN
  BEGIN
    CREATE POLICY "Allow all on users" ON users FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    CREATE POLICY "Allow all on menu_items" ON menu_items FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    CREATE POLICY "Allow all on restaurant_tables" ON restaurant_tables FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    CREATE POLICY "Allow all on orders" ON orders FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    CREATE POLICY "Allow all on order_items" ON order_items FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;
