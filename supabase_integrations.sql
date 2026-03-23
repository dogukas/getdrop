-- E-Ticaret Entegrasyon Ayarları Tablosu
CREATE TABLE IF NOT EXISTS public.integration_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform TEXT NOT NULL UNIQUE, -- 'trendyol', 'hepsiburada', 'shopify'
    is_active BOOLEAN DEFAULT false,
    api_key TEXT,
    api_secret TEXT,
    seller_id TEXT,
    last_sync_at TIMESTAMPTZ,
    branch_id UUID REFERENCES public.branches(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sadece adminlerin görmesi için RLS Politikaları
ALTER TABLE public.integration_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Adminler entegrasyon ayarlarını görebilir"
ON public.integration_settings FOR SELECT
USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY "Adminler entegrasyon ayarlarını güncelleyebilir"
ON public.integration_settings FOR ALL
USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- Ekleme izni
CREATE POLICY "Adminler entegrasyon ayarı ekleyebilir"
ON public.integration_settings FOR INSERT
WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
