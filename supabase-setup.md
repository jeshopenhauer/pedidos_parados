# Configuración Supabase para Pedidos Parados

## Pasos para configurar Supabase:

### 1. Crear cuenta y proyecto
- Ve a https://supabase.com
- Crea una cuenta gratuita
- Crea un nuevo proyecto

### 2. Configurar la base de datos
Ejecuta este SQL en el editor de Supabase:

```sql
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
```

### 3. Obtener credenciales
- Ve a Settings > API
- Copia la URL del proyecto
- Copia la clave pública (anon key)

### 4. Actualizar el código JavaScript
Reemplazar las funciones localStorage con llamadas a Supabase
