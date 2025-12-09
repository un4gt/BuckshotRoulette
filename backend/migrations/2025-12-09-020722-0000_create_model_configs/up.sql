-- Create model_configs table
CREATE TABLE model_configs (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    provider TEXT NOT NULL CHECK (provider IN ('gemini', 'openai', 'anthropic', 'deepseek', 'grok', 'openrouter', 'openai-compatible')),
    model TEXT NOT NULL,
    api_key TEXT NOT NULL,
    base_url TEXT,
    enabled INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Create index for enabled models
CREATE INDEX idx_model_configs_enabled ON model_configs(enabled);
