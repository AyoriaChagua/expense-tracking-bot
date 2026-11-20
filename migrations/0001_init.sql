CREATE TABLE transactions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  app           TEXT    NOT NULL CHECK (app IN ('yape','plin')),
  direction     TEXT    NOT NULL CHECK (direction IN ('expense','income')),
  amount_cents  INTEGER NOT NULL,          -- S/ 25.50 -> 2550 (avoids float errors)
  counterparty  TEXT,
  occurred_at   TEXT    NOT NULL,          -- Lima time, 'YYYY-MM-DD HH:MM'
  operation_id  TEXT    UNIQUE,            -- prevents duplicates; may be NULL
  description   TEXT,                      -- caption sent with the photo
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_transactions_occurred_at ON transactions(occurred_at);
