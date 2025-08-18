# Instrucciones para hacer tu app multi-usuario con Supabase

## Pasos para convertir tu app en multi-usuario:

### 1. Crear proyecto en Supabase
1. Ve a https://supabase.com
2. Regístrate con tu email
3. Crea un nuevo proyecto
4. Espera que se configure (2-3 minutos)

### 2. Configurar la base de datos
1. Ve a "SQL Editor" en el panel izquierdo
2. Pega y ejecuta este código SQL:

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
1. Ve a "Settings" > "API" en el panel izquierdo
2. Copia:
   - Project URL
   - Project API Key (anon, public)

### 4. Configurar tu código
1. Abre el archivo `supabase-client.js`
2. Reemplaza:
   - `TU_SUPABASE_URL_AQUI` con tu Project URL
   - `TU_SUPABASE_ANON_KEY_AQUI` con tu API Key

### 5. Actualizar script.js
Necesitas reemplazar las funciones localStorage con llamadas a Supabase.

### 6. Desplegar
Opciones fáciles:
- **Netlify**: Arrastra la carpeta completa
- **Vercel**: Conecta tu GitHub
- **GitHub Pages**: Activa en Settings del repo

## Alternativas más simples:

### Opción A: Firebase (Google)
- Ve a https://firebase.google.com
- Similar a Supabase pero de Google

### Opción B: Netlify con formularios
- Usar Netlify Forms para guardar datos
- Más limitado pero muy fácil

### Opción C: GitHub + JSON
- Usar GitHub como base de datos JSON
- Muy simple pero limitado

¿Cuál prefieres que implementemos?
