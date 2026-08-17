/*
# Commerce Tables: Products, Orders, Order Items, Entitlements, Reading Progress, Downloads

## Purpose
Creates the structural minimum for future payment integration (Stripe).
No payment is connected in this phase — these tables prepare the data model
for per-page purchases, full-issue purchases, user entitlements, reading
progress tracking, and download tracking.

## New Tables

### products
- `id` (uuid, PK)
- `type` (text, not null) — one of: issue_page, issue_full, pdf, epub, subscription
- `resource_id` (uuid) — ID of the issue or issue_page this product grants access to
- `name` (text) — product display name
- `description` (text)
- `price` (numeric, 10,2) — price in EUR
- `currency` (text, default 'EUR')
- `is_active` (boolean, default true)
- `external_price_id` (text) — future Stripe Price ID
- `created_at`, `updated_at` (timestamptz)

### orders
- `id` (uuid, PK)
- `user_id` (uuid, FK → auth.users, ON DELETE CASCADE)
- `status` (text, default 'pending') — one of: pending, paid, failed, refunded, cancelled
- `total_amount` (numeric, 10,2)
- `currency` (text, default 'EUR')
- `payment_provider` (text) — e.g. "stripe" (nullable until connected)
- `external_payment_id` (text) — Stripe payment/checkout ID
- `created_at`, `updated_at` (timestamptz)

### order_items
- `id` (uuid, PK)
- `order_id` (uuid, FK → orders, ON DELETE CASCADE)
- `product_id` (uuid, FK → products, ON DELETE SET NULL)
- `resource_type` (text) — one of: issue_page, issue_full, pdf, epub, subscription
- `resource_id` (uuid) — ID of the actual resource
- `unit_price` (numeric, 10,2)
- `quantity` (int, default 1)
- `total_price` (numeric, 10,2)
- `created_at` (timestamptz)

### entitlements
- `id` (uuid, PK)
- `user_id` (uuid, FK → auth.users, ON DELETE CASCADE)
- `resource_type` (text) — one of: issue, issue_page
- `resource_id` (uuid) — ID of the issue or issue_page
- `source_type` (text) — one of: purchase, gift, admin, promotion
- `source_id` (uuid) — ID of the order or admin action (nullable)
- `starts_at` (timestamptz, default now())
- `expires_at` (timestamptz) — nullable for permanent access
- `created_at` (timestamptz)

### reading_progress
- `id` (uuid, PK)
- `user_id` (uuid, FK → auth.users, ON DELETE CASCADE)
- `issue_id` (uuid, FK → issues, ON DELETE CASCADE)
- `last_page` (int, default 1)
- `progress_percent` (numeric, 5,2, default 0)
- `updated_at` (timestamptz)

### downloads
- `id` (uuid, PK)
- `user_id` (uuid, FK → auth.users, ON DELETE CASCADE)
- `issue_id` (uuid, FK → issues, ON DELETE CASCADE)
- `file_type` (text) — one of: pdf, epub
- `downloaded_at` (timestamptz, default now())
- `metadata_json` (jsonb)

## Security
- RLS enabled on all tables.
- products: public read when is_active = true; admin write.
- orders: authenticated users can read/update only their own orders; admin full access.
- order_items: authenticated users can read items from their own orders; admin full access.
- entitlements: authenticated users can read only their own entitlements; admin full access.
- reading_progress: authenticated users can CRUD only their own progress; admin full access.
- downloads: authenticated users can read only their own downloads; admin full access.

## Notes
1. No Stripe integration is connected — these are structural placeholders.
2. The `subscription` product type exists only to prepare the future model; subscriptions are disabled.
3. user_id columns on owner-scoped tables default to auth.uid() so inserts from the client work.
*/

-- =========================================================
-- PRODUCTS
-- =========================================================
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  resource_id uuid,
  name text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'EUR',
  is_active boolean NOT NULL DEFAULT true,
  external_price_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products_public_read" ON products;
CREATE POLICY "products_public_read" ON products FOR SELECT
  TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS "products_admin_write" ON products;
CREATE POLICY "products_admin_write" ON products FOR ALL
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('editor', 'admin', 'super_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('editor', 'admin', 'super_admin')));

CREATE TRIGGER set_updated_at_products
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =========================================================
-- ORDERS
-- =========================================================
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  total_amount numeric(10,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'EUR',
  payment_provider text,
  external_payment_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders_select_own" ON orders;
CREATE POLICY "orders_select_own" ON orders FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "orders_insert_own" ON orders;
CREATE POLICY "orders_insert_own" ON orders FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "orders_update_own" ON orders;
CREATE POLICY "orders_update_own" ON orders FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "orders_admin_all" ON orders;
CREATE POLICY "orders_admin_all" ON orders FOR ALL
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')));

CREATE TRIGGER set_updated_at_orders
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);

-- =========================================================
-- ORDER_ITEMS
-- =========================================================
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  unit_price numeric(10,2) NOT NULL DEFAULT 0,
  quantity int NOT NULL DEFAULT 1,
  total_price numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "order_items_select_own" ON order_items;
CREATE POLICY "order_items_select_own" ON order_items FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "order_items_admin_all" ON order_items;
CREATE POLICY "order_items_admin_all" ON order_items FOR ALL
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')));

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- =========================================================
-- ENTITLEMENTS
-- =========================================================
CREATE TABLE IF NOT EXISTS entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_type text NOT NULL,
  resource_id uuid NOT NULL,
  source_type text NOT NULL DEFAULT 'purchase',
  source_id uuid,
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE entitlements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "entitlements_select_own" ON entitlements;
CREATE POLICY "entitlements_select_own" ON entitlements FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "entitlements_admin_all" ON entitlements;
CREATE POLICY "entitlements_admin_all" ON entitlements FOR ALL
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')));

CREATE INDEX IF NOT EXISTS idx_entitlements_user ON entitlements(user_id);
CREATE INDEX IF NOT EXISTS idx_entitlements_resource ON entitlements(resource_type, resource_id);

-- =========================================================
-- READING_PROGRESS
-- =========================================================
CREATE TABLE IF NOT EXISTS reading_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  issue_id uuid NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  last_page int NOT NULL DEFAULT 1,
  progress_percent numeric(5,2) NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reading_progress_select_own" ON reading_progress;
CREATE POLICY "reading_progress_select_own" ON reading_progress FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "reading_progress_insert_own" ON reading_progress;
CREATE POLICY "reading_progress_insert_own" ON reading_progress FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "reading_progress_update_own" ON reading_progress;
CREATE POLICY "reading_progress_update_own" ON reading_progress FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "reading_progress_delete_own" ON reading_progress;
CREATE POLICY "reading_progress_delete_own" ON reading_progress FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "reading_progress_admin_all" ON reading_progress;
CREATE POLICY "reading_progress_admin_all" ON reading_progress FOR ALL
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')));

CREATE UNIQUE INDEX IF NOT EXISTS idx_reading_progress_user_issue ON reading_progress(user_id, issue_id);

-- =========================================================
-- DOWNLOADS
-- =========================================================
CREATE TABLE IF NOT EXISTS downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  issue_id uuid NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  file_type text NOT NULL,
  downloaded_at timestamptz NOT NULL DEFAULT now(),
  metadata_json jsonb
);

ALTER TABLE downloads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "downloads_select_own" ON downloads;
CREATE POLICY "downloads_select_own" ON downloads FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "downloads_insert_own" ON downloads;
CREATE POLICY "downloads_insert_own" ON downloads FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "downloads_admin_all" ON downloads;
CREATE POLICY "downloads_admin_all" ON downloads FOR ALL
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')));

CREATE INDEX IF NOT EXISTS idx_downloads_user ON downloads(user_id);
