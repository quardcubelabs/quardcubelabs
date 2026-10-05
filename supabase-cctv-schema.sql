-- ==============================================================================
-- QUARDCUBE CCTV MANAGEMENT SYSTEM - DATABASE SCHEMA
-- ==============================================================================

-- 1. CCTV Site Surveys Table
CREATE TABLE IF NOT EXISTS public.cctv_site_surveys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_number VARCHAR(64) NOT NULL UNIQUE,
    customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(64),
    customer_address TEXT,
    
    site_name VARCHAR(255) NOT NULL,
    site_address TEXT NOT NULL,
    building_type VARCHAR(100) DEFAULT 'Commercial',
    number_of_buildings INTEGER DEFAULT 1,
    number_of_floors INTEGER DEFAULT 1,
    environment VARCHAR(50) DEFAULT 'Mixed',
    
    -- Infrastructure & Requirements
    internet_available BOOLEAN DEFAULT true,
    internet_speed_mbps INTEGER DEFAULT 20,
    remote_viewing_required BOOLEAN DEFAULT true,
    existing_cctv BOOLEAN DEFAULT false,
    existing_cctv_details TEXT,
    existing_nvr_dvr BOOLEAN DEFAULT false,
    existing_network BOOLEAN DEFAULT true,
    power_available BOOLEAN DEFAULT true,
    ups_required BOOLEAN DEFAULT true,
    monitor_required BOOLEAN DEFAULT true,
    
    estimated_camera_count INTEGER DEFAULT 4,
    special_requirements TEXT,
    notes TEXT,
    technician_name VARCHAR(255),
    survey_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'in_progress', 'completed', 'converted_to_project', 'cancelled')),
    
    project_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. CCTV Site Survey Items (Camera Locations)
CREATE TABLE IF NOT EXISTS public.cctv_site_survey_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_id UUID NOT NULL REFERENCES public.cctv_site_surveys(id) ON DELETE CASCADE,
    location_name VARCHAR(255) NOT NULL,
    area_type VARCHAR(100) DEFAULT 'Entrance',
    indoor_outdoor VARCHAR(50) DEFAULT 'Outdoor',
    camera_type VARCHAR(100) DEFAULT 'Turret',
    required_resolution VARCHAR(100) DEFAULT '4MP (2K)',
    lens_requirement VARCHAR(100) DEFAULT '2.8mm (Wide 100°)',
    night_vision_required BOOLEAN DEFAULT true,
    colorvu_required BOOLEAN DEFAULT true,
    audio_required BOOLEAN DEFAULT false,
    ptz_required BOOLEAN DEFAULT false,
    varifocal_required BOOLEAN DEFAULT false,
    analytics_required BOOLEAN DEFAULT true,
    target_distance_meters NUMERIC(6,2) DEFAULT 15.0,
    coverage_notes TEXT,
    estimated_cable_length_meters NUMERIC(6,2) DEFAULT 30.0,
    quantity INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. CCTV Projects Table
CREATE TABLE IF NOT EXISTS public.cctv_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_number VARCHAR(64) NOT NULL UNIQUE,
    customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(64),
    customer_address TEXT,
    site_survey_id UUID REFERENCES public.cctv_site_surveys(id) ON DELETE SET NULL,
    site_name VARCHAR(255) NOT NULL,
    project_type VARCHAR(100) DEFAULT 'commercial',
    camera_count INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'planning', 'quoted', 'approved', 'in_progress', 'completed', 'cancelled')),
    
    recording_type VARCHAR(50) DEFAULT 'IP/NVR',
    recommended_nvr VARCHAR(255),
    recommended_storage_tb NUMERIC(6,2) DEFAULT 4.0,
    retention_days INTEGER DEFAULT 30,
    total_cable_meters NUMERIC(8,2) DEFAULT 0,
    
    equipment_cost NUMERIC(12,2) DEFAULT 0,
    services_cost NUMERIC(12,2) DEFAULT 0,
    discount_amount NUMERIC(12,2) DEFAULT 0,
    tax_rate_percent NUMERIC(5,2) DEFAULT 18.0,
    tax_amount NUMERIC(12,2) DEFAULT 0,
    grand_total NUMERIC(12,2) DEFAULT 0,
    
    quotation_id UUID REFERENCES public.quotations(id) ON DELETE SET NULL,
    quotation_number VARCHAR(64),
    sales_order_id UUID,
    invoice_id UUID,
    
    notes TEXT,
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. CCTV Project Items
CREATE TABLE IF NOT EXISTS public.cctv_project_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.cctv_projects(id) ON DELETE CASCADE,
    product_id BIGINT REFERENCES public.products(id) ON DELETE SET NULL,
    item_type VARCHAR(50) DEFAULT 'product' CHECK (item_type IN ('product', 'service', 'custom')),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) DEFAULT 'Cameras',
    quantity INTEGER DEFAULT 1,
    unit_cost NUMERIC(12,2) DEFAULT 0,
    markup_percentage NUMERIC(5,2) DEFAULT 20.0,
    unit_price NUMERIC(12,2) DEFAULT 0,
    discount NUMERIC(12,2) DEFAULT 0,
    tax NUMERIC(12,2) DEFAULT 0,
    subtotal NUMERIC(12,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. CCTV Product Metadata (Extends existing products table without duplicate product records)
CREATE TABLE IF NOT EXISTS public.cctv_product_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id BIGINT NOT NULL UNIQUE REFERENCES public.products(id) ON DELETE CASCADE,
    brand VARCHAR(100) DEFAULT 'Hikvision',
    cctv_category VARCHAR(100) NOT NULL,
    camera_type VARCHAR(100),
    resolution_mp NUMERIC(4,1),
    lens_mm VARCHAR(50),
    indoor_outdoor VARCHAR(50) DEFAULT 'Outdoor',
    ip_rating VARCHAR(50) DEFAULT 'IP67',
    night_vision_ir_meters INTEGER,
    colorvu BOOLEAN DEFAULT false,
    acusense BOOLEAN DEFAULT false,
    audio BOOLEAN DEFAULT false,
    ptz BOOLEAN DEFAULT false,
    varifocal BOOLEAN DEFAULT false,
    poe_supported BOOLEAN DEFAULT true,
    
    -- Recording & Network specs
    nvr_channels INTEGER,
    incoming_bandwidth_mbps INTEGER,
    poe_ports INTEGER,
    poe_power_budget_watts INTEGER,
    hdd_bays INTEGER,
    max_hdd_capacity_tb INTEGER,
    analog_channels INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for maximum performance
CREATE INDEX IF NOT EXISTS idx_cctv_site_surveys_customer ON public.cctv_site_surveys(customer_id);
CREATE INDEX IF NOT EXISTS idx_cctv_site_surveys_status ON public.cctv_site_surveys(status);
CREATE INDEX IF NOT EXISTS idx_cctv_site_surveys_created_at ON public.cctv_site_surveys(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cctv_survey_items_survey ON public.cctv_site_survey_items(survey_id);

CREATE INDEX IF NOT EXISTS idx_cctv_projects_customer ON public.cctv_projects(customer_id);
CREATE INDEX IF NOT EXISTS idx_cctv_projects_survey ON public.cctv_projects(site_survey_id);
CREATE INDEX IF NOT EXISTS idx_cctv_projects_quotation ON public.cctv_projects(quotation_id);
CREATE INDEX IF NOT EXISTS idx_cctv_projects_status ON public.cctv_projects(status);

CREATE INDEX IF NOT EXISTS idx_cctv_project_items_project ON public.cctv_project_items(project_id);
CREATE INDEX IF NOT EXISTS idx_cctv_project_items_product ON public.cctv_project_items(product_id);

CREATE INDEX IF NOT EXISTS idx_cctv_product_metadata_product ON public.cctv_product_metadata(product_id);
CREATE INDEX IF NOT EXISTS idx_cctv_product_metadata_brand ON public.cctv_product_metadata(brand);
CREATE INDEX IF NOT EXISTS idx_cctv_product_metadata_category ON public.cctv_product_metadata(cctv_category);

-- Row Level Security (RLS)
ALTER TABLE public.cctv_site_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cctv_site_survey_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cctv_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cctv_project_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cctv_product_metadata ENABLE ROW LEVEL SECURITY;

-- Service Role full access
DROP POLICY IF EXISTS "Service role full access cctv_site_surveys" ON public.cctv_site_surveys;
CREATE POLICY "Service role full access cctv_site_surveys" ON public.cctv_site_surveys
    FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access cctv_site_survey_items" ON public.cctv_site_survey_items;
CREATE POLICY "Service role full access cctv_site_survey_items" ON public.cctv_site_survey_items
    FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access cctv_projects" ON public.cctv_projects;
CREATE POLICY "Service role full access cctv_projects" ON public.cctv_projects
    FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access cctv_project_items" ON public.cctv_project_items;
CREATE POLICY "Service role full access cctv_project_items" ON public.cctv_project_items
    FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access cctv_product_metadata" ON public.cctv_product_metadata;
CREATE POLICY "Service role full access cctv_product_metadata" ON public.cctv_product_metadata
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Authenticated Users access
DROP POLICY IF EXISTS "Auth users view cctv_site_surveys" ON public.cctv_site_surveys;
CREATE POLICY "Auth users view cctv_site_surveys" ON public.cctv_site_surveys
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Auth users modify cctv_site_surveys" ON public.cctv_site_surveys;
CREATE POLICY "Auth users modify cctv_site_surveys" ON public.cctv_site_surveys
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Auth users view cctv_site_survey_items" ON public.cctv_site_survey_items;
CREATE POLICY "Auth users view cctv_site_survey_items" ON public.cctv_site_survey_items
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Auth users modify cctv_site_survey_items" ON public.cctv_site_survey_items;
CREATE POLICY "Auth users modify cctv_site_survey_items" ON public.cctv_site_survey_items
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Auth users view cctv_projects" ON public.cctv_projects;
CREATE POLICY "Auth users view cctv_projects" ON public.cctv_projects
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Auth users modify cctv_projects" ON public.cctv_projects;
CREATE POLICY "Auth users modify cctv_projects" ON public.cctv_projects
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Auth users view cctv_project_items" ON public.cctv_project_items;
CREATE POLICY "Auth users view cctv_project_items" ON public.cctv_project_items
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Auth users modify cctv_project_items" ON public.cctv_project_items;
CREATE POLICY "Auth users modify cctv_project_items" ON public.cctv_project_items
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Auth users view cctv_product_metadata" ON public.cctv_product_metadata;
CREATE POLICY "Auth users view cctv_product_metadata" ON public.cctv_product_metadata
    FOR ALL TO authenticated USING (true);

