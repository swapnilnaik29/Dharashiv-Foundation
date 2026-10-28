-- ==============================================================================
-- Dharashiv Foundation - Seed Data & Initial Configuration
-- Migration: 20261028000004_seed_data.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Business & Industry Categories
-- ------------------------------------------------------------------------------
INSERT INTO public.categories (name, slug, description, icon) VALUES
('Agriculture & Agri-Tech', 'agriculture-agri-tech', 'Farming, organic produce, drip irrigation, agri-processing, dairy, and cold storage.', 'seedling'),
('Manufacturing & Engineering', 'manufacturing-engineering', 'Industrial fabrications, auto parts, textile manufacturing, and metal works.', 'factory'),
('Information Technology & Software', 'information-technology', 'Web development, mobile apps, IT consulting, cloud infrastructure, and AI solutions.', 'laptop'),
('Healthcare & Pharmaceuticals', 'healthcare-pharmaceuticals', 'Hospitals, medical clinics, pathology labs, diagnostics, and pharmaceutical supply.', 'hospital'),
('Education & Skill Training', 'education-skill-training', 'Schools, coaching academies, technical vocational institutes, and competitive exam centers.', 'graduation-cap'),
('Retail & Wholesale Trade', 'retail-wholesale', 'Consumer goods, electronics, hardware, textiles, and FMCG wholesale distribution.', 'shopping-bag'),
('Renewable Energy & Solar', 'renewable-energy', 'Solar rooftop installations, bio-energy, solar water pumps, and clean energy systems.', 'sun'),
('Construction & Real Estate', 'construction-real-estate', 'Civil construction, architectural design, building materials, and land development.', 'building'),
('Hospitality & Tourism', 'hospitality-tourism', 'Hotels, heritage tourism, pilgrimage services around Tuljapur, and restaurants.', 'utensils'),
('Professional & Financial Services', 'financial-services', 'Chartered accountants, legal advisors, taxation consultants, and insurance services.', 'briefcase')
ON CONFLICT (slug) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 2. Platform Settings
-- ------------------------------------------------------------------------------
INSERT INTO public.platform_settings (key, value, description) VALUES
('community_guidelines', '{"title": "Dharashiv Foundation Code of Conduct", "version": "1.0", "summary": "Foster regional collaboration, respect community heritage, support local entrepreneurs, and prohibit spam or inappropriate content."}', 'Community standards for posting and networking.'),
('feature_flags', '{"enable_direct_messaging": true, "enable_job_board": true, "enable_s3_uploads": true, "require_profile_completion": true}', 'Toggle core system capabilities.'),
('region_talukas', '["Dharashiv", "Tuljapur", "Omerga", "Paranda", "Bhoom", "Kalamb", "Washi", "Lohara"]', 'Official talukas of Dharashiv district.')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
