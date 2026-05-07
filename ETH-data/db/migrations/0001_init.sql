CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    name_ko TEXT NOT NULL,
    name_en TEXT NOT NULL,
    event_date DATE NOT NULL,
    category TEXT NOT NULL,
    region TEXT NOT NULL,
    description TEXT NOT NULL,
    source_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT events_category_check CHECK (category IN ('crash', 'rally', 'crisis', 'mania', 'regulation')),
    CONSTRAINT events_region_check CHECK (region IN ('global', 'kr'))
);

CREATE TABLE IF NOT EXISTS whale_transfers (
    week_start DATE NOT NULL,
    asset TEXT NOT NULL,
    transfer_count BIGINT NOT NULL,
    total_volume_native NUMERIC(38, 8) NOT NULL,
    total_volume_usd NUMERIC(20, 2) NOT NULL,
    unique_senders INTEGER,
    unique_receivers INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (week_start, asset),
    CONSTRAINT whale_transfers_volume_check CHECK (total_volume_usd >= 0)
);

CREATE TABLE IF NOT EXISTS cex_flows (
    flow_date DATE NOT NULL,
    asset TEXT NOT NULL,
    direction TEXT NOT NULL,
    transfer_count BIGINT NOT NULL,
    total_volume_native NUMERIC(38, 8) NOT NULL,
    total_volume_usd NUMERIC(20, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (flow_date, asset, direction),
    CONSTRAINT cex_flows_direction_check CHECK (direction IN ('inflow', 'outflow'))
);

CREATE TABLE IF NOT EXISTS prices (
    price_date DATE NOT NULL,
    asset TEXT NOT NULL,
    price_usd NUMERIC(20, 8) NOT NULL,
    volume_usd NUMERIC(24, 2),
    market_cap_usd NUMERIC(24, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (price_date, asset),
    CONSTRAINT prices_price_check CHECK (price_usd > 0)
);

CREATE TABLE IF NOT EXISTS fear_greed_index (
    index_date DATE PRIMARY KEY,
    value INTEGER NOT NULL,
    classification TEXT NOT NULL,
    crawled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fear_greed_value_check CHECK (value BETWEEN 0 AND 100)
);

CREATE TABLE IF NOT EXISTS crawl_jobs (
    job_id TEXT PRIMARY KEY,
    event_id TEXT REFERENCES events (id) ON DELETE RESTRICT,
    source TEXT NOT NULL,
    request_payload JSONB NOT NULL,
    status TEXT NOT NULL,
    pages_crawled INTEGER,
    error_message TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    CONSTRAINT crawl_jobs_status_check CHECK (status IN ('submitted', 'running', 'done', 'errored', 'cancelled'))
);

CREATE TABLE IF NOT EXISTS event_windows (
    event_id TEXT NOT NULL REFERENCES events (id) ON DELETE CASCADE,
    day_offset INTEGER NOT NULL,
    whale_volume_usd NUMERIC(20, 2),
    cex_inflow_usd NUMERIC(20, 2),
    cex_outflow_usd NUMERIC(20, 2),
    eth_price_usd NUMERIC(20, 8),
    btc_price_usd NUMERIC(20, 8),
    fear_greed_value INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (event_id, day_offset),
    CONSTRAINT event_windows_day_offset_check CHECK (day_offset BETWEEN -7 AND 7),
    CONSTRAINT event_windows_fear_greed_check CHECK (fear_greed_value IS NULL OR fear_greed_value BETWEEN 0 AND 100)
);

CREATE TABLE IF NOT EXISTS news_articles (
    id BIGSERIAL PRIMARY KEY,
    event_id TEXT NOT NULL REFERENCES events (id) ON DELETE RESTRICT,
    source TEXT NOT NULL,
    url TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    summary TEXT,
    published_at TIMESTAMPTZ,
    language TEXT,
    crawled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    crawl_job_id TEXT REFERENCES crawl_jobs (job_id) ON DELETE SET NULL,
    CONSTRAINT news_articles_language_check CHECK (language IS NULL OR language IN ('ko', 'en'))
);
