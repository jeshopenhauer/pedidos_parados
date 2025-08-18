-- Configuración de tabla reports en Supabase
-- Ejecuta este código en el SQL Editor de Supabase

-- 1. Crear tabla reports si no existe
CREATE TABLE IF NOT EXISTS public.reports (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    headers TEXT,
    data TEXT,
    record_count INTEGER DEFAULT 0
);

-- 2. Habilitar Row Level Security
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- 3. Crear política para permitir lectura a todos los usuarios
CREATE POLICY "Allow public read access on reports" ON public.reports
    FOR SELECT USING (true);

-- 4. Crear política para permitir inserción a todos los usuarios
CREATE POLICY "Allow public insert access on reports" ON public.reports
    FOR INSERT WITH CHECK (true);

-- 5. Crear política para permitir actualización a todos los usuarios
CREATE POLICY "Allow public update access on reports" ON public.reports
    FOR UPDATE USING (true);

-- 6. Crear política para permitir eliminación a todos los usuarios
CREATE POLICY "Allow public delete access on reports" ON public.reports
    FOR DELETE USING (true);

-- 7. Verificar la tabla
SELECT * FROM public.reports LIMIT 5;
