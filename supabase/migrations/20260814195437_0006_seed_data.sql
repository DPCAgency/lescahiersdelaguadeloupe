/*
# Seed Data: Categories, Territories, Issue N°02, Issue Pages, Site Settings, Feature Flags

## Purpose
Populates the database with initial demo data for the editorial CMS:
1. Six editorial categories (matching the site's rubrics)
2. Nine Guadeloupe territories (communes)
3. Issue N°02 — "Qui gouverne réellement Le Gosier ?" (Août 2026)
4. 11 issue pages for N°02 (couverture + first page free, rest paid)
5. Site settings (site name, tagline, colors, editorial signature)
6. Feature flags (subscriptions disabled, page/full purchase enabled, AI import disabled)

## Data Sources
All editorial content comes from the validated project data — no invented facts,
figures, or quotes. Only metadata that already exists in the project's demo data
files is used here.

## Tables Populated
- categories (6 rows)
- territories (9 rows)
- issues (1 row — N°02)
- issue_pages (11 rows for N°02)
- site_settings (multiple rows)

## Idempotency
All inserts use ON CONFLICT DO NOTHING so re-running is safe.
*/

-- =========================================================
-- CATEGORIES
-- =========================================================
INSERT INTO categories (name, slug, description, position, is_active) VALUES
  ('Politique & Institutions', 'politique-institutions', 'Pouvoirs publics, décisions, institutions et gouvernance locale.', 1, true),
  ('Économie', 'economie', 'Entreprises, tourisme, emploi, finances publiques et développement local.', 2, true),
  ('Société', 'societe', 'Santé, éducation, jeunesse, vie quotidienne et services publics.', 3, true),
  ('Territoires', 'territoires', 'Le traitement territorial de la Guadeloupe, commune par commune.', 4, true),
  ('Environnement', 'environnement', 'Eau, pollution, déchets, énergie, littoral et biodiversité.', 5, true),
  ('Culture', 'culture', 'Patrimoine, musique, littérature, identité, création et mémoire.', 6, true)
ON CONFLICT (slug) DO NOTHING;

-- =========================================================
-- TERRITORIES
-- =========================================================
INSERT INTO territories (name, slug, type, description, is_active) VALUES
  ('Le Gosier', 'le-gosier', 'commune', 'Pôle économique et résidentiel majeur.', true),
  ('Les Abymes', 'les-abymes', 'commune', 'Commune la plus peuplée de l''archipel.', true),
  ('Pointe-à-Pitre', 'pointe-a-pitre', 'commune', 'Cœur économique et commercial.', true),
  ('Baie-Mahault', 'baie-mahault', 'commune', 'Zone industrielle et d''activité.', true),
  ('Petit-Bourg', 'petit-bourg', 'commune', 'Porte d''entrée de Basse-Terre.', true),
  ('Sainte-Anne', 'sainte-anne', 'commune', 'Tourisme et littoral.', true),
  ('Saint-François', 'saint-francois', 'commune', 'Tourisme et activités nautiques.', true),
  ('Basse-Terre', 'basse-terre', 'commune', 'Préfecture et chef-lieu.', true),
  ('Petit-Canal', 'petit-canal', 'commune', 'Commune de Grande-Terre.', true)
ON CONFLICT (slug) DO NOTHING;

-- =========================================================
-- ISSUE N°02
-- =========================================================
INSERT INTO issues (
  issue_number, slug, title, subtitle, description, publication_date,
  cover_image_path, page_count, status, price_per_page, full_download_price,
  pdf_file_path, subscriptions_allowed
) VALUES (
  '02',
  'numero-02',
  'Qui gouverne réellement Le Gosier ?',
  'Enquête sur la gouvernance locale',
  'Ce cahier ne désigne pas de coupables. Il pose une question : qui exerce réellement l''influence dans la fabrication de la décision publique au Gosier ?',
  '2026-08-15',
  'https://images.pexels.com/photos/38129343/pexels-photo-38129343.jpeg?auto=compress&cs=tinysrgb&w=800',
  11,
  'published',
  0.30,
  2.90,
  '/assets/pdf/N°2_-_LES_CAHIERS_DE_LA_GUADELOUPE_2026.pdf',
  false
)
ON CONFLICT (slug) DO NOTHING;

-- =========================================================
-- ISSUE PAGES FOR N°02
-- =========================================================
INSERT INTO issue_pages (issue_id, page_number, position, title, preview_image_path, is_free, individual_price, ocr_status)
SELECT
  i.id,
  pn.page_number,
  pn.page_number,
  pn.title,
  COALESCE(pn.preview_image, ''),
  pn.is_free,
  CASE WHEN pn.is_free THEN NULL ELSE 0.30 END,
  'pending'
FROM issues i
CROSS JOIN (VALUES
  (1, 'Couverture', 'https://images.pexels.com/photos/38129343/pexels-photo-38129343.jpeg?auto=compress&cs=tinysrgb&w=600', true),
  (2, 'Une question de gouvernance', 'https://images.pexels.com/photos/25637102/pexels-photo-25637102.jpeg?auto=compress&cs=tinysrgb&w=600', true),
  (3, 'Le Gosier : un territoire aux enjeux économiques importants', '', false),
  (4, 'Les gouvernances municipales depuis 2021', '', false),
  (5, 'Regarder la mécanique', '', false),
  (6, 'Directeur de cabinet et entrepreneur', '', false),
  (7, 'De la campagne à la subvention', '', false),
  (8, 'De l''argent politique à l''argent public', '', false),
  (9, 'Laupen–Simonnot', '', false),
  (10, 'Une question centrale', '', false),
  (11, 'Conclusion', '', false)
) AS pn(page_number, title, preview_image, is_free)
WHERE i.slug = 'numero-02'
  AND NOT EXISTS (
    SELECT 1 FROM issue_pages ip WHERE ip.issue_id = i.id AND ip.page_number = pn.page_number
  );

-- =========================================================
-- SITE SETTINGS
-- =========================================================
INSERT INTO site_settings (key, value_json) VALUES
  ('site_name', '"Les Cahiers de la Guadeloupe"'),
  ('site_tagline', '"Revue d''analyse et d''investigation"'),
  ('editorial_signature', '"Enquêter • Comprendre • Éclairer • Débattre"'),
  ('primary_color', '"#1aa6a6"'),
  ('primary_color_dark', '"#147f82"'),
  ('contact_email', '"contact@lescahiersdelaguadeloupe.fr"'),
  ('subscriptions_enabled', 'false'),
  ('page_purchase_enabled', 'true'),
  ('full_issue_purchase_enabled', 'true'),
  ('pdf_download_enabled', 'true'),
  ('ai_import_enabled', 'false'),
  ('social_links', '{"twitter": "", "facebook": "", "instagram": "", "linkedin": ""}')
ON CONFLICT (key) DO NOTHING;
