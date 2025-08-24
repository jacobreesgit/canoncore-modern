-- Add indexes for enhanced search performance
-- These indexes will significantly improve the performance of ILIKE searches

-- Add GIN index for universe name and description search
-- GIN (Generalized Inverted Index) is optimal for full-text search
CREATE INDEX CONCURRENTLY IF NOT EXISTS universes_search_gin_idx 
ON universes USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Add B-tree indexes for common search patterns
-- These help with ILIKE queries and sorting
CREATE INDEX CONCURRENTLY IF NOT EXISTS universes_name_idx 
ON universes USING btree(name);

CREATE INDEX CONCURRENTLY IF NOT EXISTS universes_description_idx 
ON universes USING btree(description);

-- Composite index for public universes with sorting
-- This optimizes the common query pattern: public + sort by created_at
CREATE INDEX CONCURRENTLY IF NOT EXISTS universes_public_created_at_idx 
ON universes(is_public, created_at DESC) 
WHERE is_public = true;

-- Add text search configuration index for better full-text search
-- This allows for more sophisticated search queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS universes_full_text_idx 
ON universes USING gin((
  setweight(to_tsvector('english', name), 'A') ||
  setweight(to_tsvector('english', COALESCE(description, '')), 'B')
));