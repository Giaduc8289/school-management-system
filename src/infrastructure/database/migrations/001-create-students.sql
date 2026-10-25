CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  date_of_birth TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive'))
);
