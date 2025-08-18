https://jeshopenhauer.github.io/pedidos_parados/

# Gestor de Pedidos Parados

Esta aplicación permite cargar, filtrar y visualizar datos de pedidos parados desde archivos CSV con funcionalidad multiusuario usando Supabase.

## Características

- Carga de archivos CSV
- Filtrado automático por estado "More information needed" o "To be approved"
- Visualización de datos en tablas interactivas
- **Almacenamiento compartido** - Los reportes se guardan en Supabase para acceso multiusuario
- Impresión de reportes
- Interfaz moderna y responsive

## Estructura de Archivos

- `index.html` - Interfaz de usuario principal
- `style.css` - Estilos de la aplicación
- `script.js` - Lógica del cliente
- `supabase-client.js` - Cliente y configuración de Supabase
- `supabase-setup.sql` - Script SQL para configurar la base de datos
- `supabase-test-panel.html` - Panel de verificación de conexión Supabase
- `data/` - Archivos CSV de ejemplo
- `figures/` - Imágenes y capturas

## Uso

1. **Accede a la aplicación**: https://jeshopenhauer.github.io/pedidos_parados/
2. **Carga un archivo CSV** usando el botón "Seleccionar Archivo"
3. **El archivo se procesa automáticamente** y filtra registros con estado "More information needed" o "To be approved"
4. **El reporte se guarda en Supabase** y está disponible para todos los usuarios
5. **Otros usuarios pueden ver** los reportes subidos en tiempo real
6. **Usa los botones de acción** para ver detalles, imprimir o eliminar reportes

## Configuración Técnica

### Base de Datos (Supabase)
- **URL**: https://jyhgslhndkwmawzkawni.supabase.co
- **Tabla**: `reports` con columnas `id`, `created_at`, `name`, `headers`, `data`, `record_count`
- **Políticas RLS**: Configuradas para acceso público de lectura/escritura

### Verificación de Conexión
- **Panel de Test**: Abre `supabase-test-panel.html` para verificar la conexión
- **Diagnósticos**: El panel incluye tests de conexión, lectura, escritura y eliminación

## Funcionamiento Multiusuario

1. **Usuario A** sube un CSV → Se guarda en Supabase
2. **Usuario B** entra a la aplicación → Ve automáticamente el reporte de Usuario A
3. **Cualquier usuario** puede eliminar reportes
4. **Los cambios se sincronizan** automáticamente entre todos los usuarios
