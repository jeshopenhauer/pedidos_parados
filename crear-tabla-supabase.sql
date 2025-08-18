-- EJECUTA ESTE SQL EN SUPABASE SQL EDITOR

-- Crear tabla para reportes
CREATE TABLE reports (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  date TIMESTAMP DEFAULT NOW(),
  fileName TEXT NOT NULL,
  headers JSONB NOT NULL,
  data JSONB NOT NULL,
  recordCount INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Habilitar Row Level Security
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Política para permitir a todos leer reportes
CREATE POLICY "Allow public read access" ON reports
  FOR SELECT USING (true);

-- Política para permitir a todos insertar reportes
CREATE POLICY "Allow public insert access" ON reports
  FOR INSERT WITH CHECK (true);

-- Política para permitir a todos eliminar reportes
CREATE POLICY "Allow public delete access" ON reports
  FOR DELETE USING (true);
