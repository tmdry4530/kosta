CREATE INDEX IF NOT EXISTS idx_events_event_date ON events (event_date);
CREATE INDEX IF NOT EXISTS idx_events_category ON events (category);
CREATE INDEX IF NOT EXISTS idx_events_region ON events (region);

CREATE INDEX IF NOT EXISTS idx_whale_transfers_week_start ON whale_transfers (week_start);
CREATE INDEX IF NOT EXISTS idx_cex_flows_flow_date ON cex_flows (flow_date);
CREATE INDEX IF NOT EXISTS idx_event_windows_event_id ON event_windows (event_id);
CREATE INDEX IF NOT EXISTS idx_news_articles_event_published_at ON news_articles (event_id, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_articles_source ON news_articles (source);
CREATE INDEX IF NOT EXISTS idx_news_articles_language ON news_articles (language);
CREATE UNIQUE INDEX IF NOT EXISTS idx_crawl_jobs_event_source_submitted_date ON crawl_jobs (event_id, source, ((submitted_at AT TIME ZONE 'UTC')::date));
