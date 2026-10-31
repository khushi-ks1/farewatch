-- FareWatch Initial Database Schema
-- Migration: 20261031000000_initial_schema.sql

-- 1. Profiles Table (linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Automatically create profile on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', '')
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      full_name = EXCLUDED.full_name,
      avatar_url = EXCLUDED.avatar_url,
      updated_at = timezone('utc'::text, now());
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 2. Watches Table
CREATE TABLE IF NOT EXISTS public.watches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  origin_code VARCHAR(3) NOT NULL,
  origin_city TEXT NOT NULL,
  destination_code VARCHAR(3) NOT NULL,
  destination_city TEXT NOT NULL,
  departure_date_start DATE NOT NULL,
  departure_date_end DATE, -- Nullable if single date
  rule_type TEXT NOT NULL CHECK (rule_type IN ('BELOW', 'BETWEEN')),
  target_price NUMERIC(10, 2) NOT NULL,
  target_price_upper NUMERIC(10, 2), -- Nullable unless rule_type = 'BETWEEN'
  is_non_stop_only BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_checked_at TIMESTAMPTZ,
  current_lowest_price NUMERIC(10, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.watches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own watches"
  ON public.watches FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own watches"
  ON public.watches FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    (SELECT count(*) FROM public.watches WHERE user_id = auth.uid() AND is_active = TRUE) < 5
  );

CREATE POLICY "Users can update own watches"
  ON public.watches FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own watches"
  ON public.watches FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_watches_user_active ON public.watches(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_watches_active_dates ON public.watches(is_active, departure_date_start, departure_date_end);


-- 3. Price Snapshots Table
CREATE TABLE IF NOT EXISTS public.price_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  watch_id UUID REFERENCES public.watches(id) ON DELETE CASCADE,
  origin_code VARCHAR(3) NOT NULL,
  destination_code VARCHAR(3) NOT NULL,
  flight_date DATE NOT NULL,
  airline TEXT NOT NULL,
  flight_number TEXT,
  departure_time TIMESTAMPTZ,
  arrival_time TIMESTAMPTZ,
  duration_mins INTEGER,
  stops INTEGER DEFAULT 0,
  price NUMERIC(10, 2) NOT NULL,
  booking_url TEXT,
  is_mock BOOLEAN DEFAULT FALSE,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.price_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view price snapshots of their watches"
  ON public.price_snapshots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.watches
      WHERE watches.id = price_snapshots.watch_id
      AND watches.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_snapshots_watch_date ON public.price_snapshots(watch_id, captured_at);
CREATE INDEX IF NOT EXISTS idx_snapshots_route_date ON public.price_snapshots(origin_code, destination_code, flight_date);


-- 4. Alerts Table (Deduplication & Spam prevention)
CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  watch_id UUID NOT NULL REFERENCES public.watches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  flight_number TEXT NOT NULL,
  flight_date DATE NOT NULL,
  airline TEXT NOT NULL,
  last_alert_price NUMERIC(10, 2) NOT NULL,
  last_alerted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own alerts"
  ON public.alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_alerts_watch_flight_date 
  ON public.alerts(watch_id, flight_number, flight_date);


-- 5. Search Cache Table (60 min cache across users)
CREATE TABLE IF NOT EXISTS public.search_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT NOT NULL UNIQUE,
  origin_code VARCHAR(3) NOT NULL,
  destination_code VARCHAR(3) NOT NULL,
  flight_date DATE NOT NULL,
  is_non_stop_only BOOLEAN NOT NULL DEFAULT FALSE,
  results_json JSONB NOT NULL,
  cached_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  expires_at TIMESTAMPTZ NOT NULL
);

ALTER TABLE public.search_cache ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_cache_key ON public.search_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_cache_expires ON public.search_cache(expires_at);


-- 6. Usage Table (Quota and Rate Limits tracking)
CREATE TABLE IF NOT EXISTS public.usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usage_date DATE NOT NULL UNIQUE,
  serpapi_searches_count INTEGER NOT NULL DEFAULT 0,
  emails_sent_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.usage ENABLE ROW LEVEL SECURITY;

-- Helper to increment SerpApi search count
CREATE OR REPLACE FUNCTION public.increment_serpapi_usage(p_date DATE, p_count INTEGER DEFAULT 1)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.usage (usage_date, serpapi_searches_count, emails_sent_count)
  VALUES (p_date, p_count, 0)
  ON CONFLICT (usage_date)
  DO UPDATE SET
    serpapi_searches_count = public.usage.serpapi_searches_count + p_count,
    updated_at = timezone('utc'::text, now());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper to increment email sent count
CREATE OR REPLACE FUNCTION public.increment_email_usage(p_date DATE, p_count INTEGER DEFAULT 1)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.usage (usage_date, serpapi_searches_count, emails_sent_count)
  VALUES (p_date, 0, p_count)
  ON CONFLICT (usage_date)
  DO UPDATE SET
    emails_sent_count = public.usage.emails_sent_count + p_count,
    updated_at = timezone('utc'::text, now());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
