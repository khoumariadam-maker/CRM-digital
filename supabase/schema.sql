-- ==============================================================================
-- DIGITAL PRODUCTS CRM - POSTGRESQL SCHEMA FOR SUPABASE FREE TIER
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    cost_price_usd NUMERIC(10, 2) DEFAULT 0,
    cost_price_dzd NUMERIC(12, 2) DEFAULT 0,
    selling_price_dzd NUMERIC(12, 2) NOT NULL,
    selling_price_usd NUMERIC(10, 2) DEFAULT 0,
    stock_type TEXT DEFAULT 'keys',
    stock_keys TEXT[] DEFAULT ARRAY[]::TEXT[],
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    social_handle TEXT,
    wilaya TEXT,
    orders_count INTEGER DEFAULT 0,
    total_spent_dzd NUMERIC(12, 2) DEFAULT 0,
    last_order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT NOT NULL UNIQUE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_social TEXT,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'pending_payment', 'paid', 'delivered', 'completed', 'cancelled')),
    payment_method TEXT DEFAULT 'baridimob',
    selling_price_dzd NUMERIC(12, 2) NOT NULL,
    cost_price_usd NUMERIC(10, 2) DEFAULT 0,
    exchange_rate_used NUMERIC(10, 2) DEFAULT 242,
    delivered_key_or_account TEXT,
    handled_by TEXT DEFAULT 'Adem',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. META ADS SPEND TABLE
CREATE TABLE IF NOT EXISTS public.meta_ad_spend (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_name TEXT NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT,
    amount_usd NUMERIC(10, 2) NOT NULL,
    amount_dzd NUMERIC(12, 2) NOT NULL,
    spend_date DATE NOT NULL DEFAULT CURRENT_DATE,
    platform TEXT DEFAULT 'meta',
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. SETTINGS & APP STATE TABLE
CREATE TABLE IF NOT EXISTS public.crm_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Realtime publication enablement for Supabase
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.meta_ad_spend;
ALTER PUBLICATION supabase_realtime ADD TABLE public.customers;

-- Enable Row Level Security (RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_ad_spend ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users full access
CREATE POLICY "Allow all access to authenticated users" ON public.products FOR ALL USING (true);
CREATE POLICY "Allow all access to authenticated users" ON public.orders FOR ALL USING (true);
CREATE POLICY "Allow all access to authenticated users" ON public.meta_ad_spend FOR ALL USING (true);
CREATE POLICY "Allow all access to authenticated users" ON public.customers FOR ALL USING (true);
