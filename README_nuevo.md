# Gestor de Reportes CSV

Una aplicación web moderna para procesar y gestionar archivos CSV de requisiciones, con filtrado automático y almacenamiento local.

## ✨ Características

- **Procesamiento automático de CSV**: Filtra automáticamente las 6 columnas más importantes
- **Almacenamiento local**: Usa IndexedDB para guardar reportes localmente
- **Interfaz moderna**: Diseño limpio y responsivo
- **Gestión de reportes**: Ver, descargar y eliminar reportes procesados
- **Filtrado inteligente**: Selecciona automáticamente las columnas relevantes
- **Ordenamiento por fecha**: Los reportes se ordenan por fecha más reciente

## 🚀 Uso

1. **Abrir la aplicación**: Abre `index.html` en tu navegador
2. **Subir archivo CSV**: Haz clic en "Seleccionar Archivo" y elige tu archivo CSV
3. **Procesamiento automático**: La aplicación procesará el archivo y extraerá las columnas importantes
4. **Gestionar reportes**: 
   - Ver: Haz clic en cualquier reporte para verlo en una nueva ventana
   - Descargar: Usa el botón de descarga para obtener el CSV filtrado
   - Eliminar: Usa el botón de eliminar para borrar reportes individuales

## 📊 Columnas Procesadas

El sistema filtra automáticamente estas columnas del CSV original:
1. **Requisition #** - Número de requisición
2. **Name** - Nombre del ítem
3. **Date of document** - Fecha del documento
4. **Originated by** - Creado por
5. **Status** - Estado de la requisición
6. **Net total** - Total neto

## 🔧 Características Técnicas

- **Sin servidor requerido**: Funciona completamente en el navegador
- **Almacenamiento local**: Los datos se guardan en IndexedDB
- **Procesamiento CSV robusto**: Maneja comillas y caracteres especiales
- **Validación de errores**: Muestra mensajes claros en caso de errores
- **Responsive**: Funciona en dispositivos móviles y desktop

## 🐛 Solución de Problemas

### Error al procesar CSV
- Verifica que el archivo sea un CSV válido
- Asegúrate de que el archivo contenga las columnas esperadas
- Verifica que el archivo no esté vacío

### El reporte no se muestra
- Verifica que tu navegador soporte IndexedDB
- Intenta refrescar la página
- Revisa la consola del navegador para errores

## 💡 Mejoras Realizadas

- **Código simplificado**: Eliminadas redundancias y funciones innecesarias
- **Mejor manejo de errores**: Mensajes más claros y específicos
- **Interfaz en español**: Traducción completa de la interfaz
- **Validación mejorada**: Mejor validación de archivos CSV
- **Performance optimizada**: Código más eficiente y rápido
- **Menos dependencias**: Eliminadas funciones de screenshot innecesarias

## 📝 Estructura de Archivos

```
pedidos_parados/
├── index.html          # Página principal
├── script.js          # Lógica de la aplicación
├── style.css          # Estilos CSS
├── README.md          # Este archivo
└── data/              # Carpeta con archivos de ejemplo
    ├── Input.csv
    ├── filtered_output.csv
    └── Requisitions_Department_view.csv
```

## 🔄 Changelog

### Versión 2.0
- Código completamente reescrito y simplificado
- Eliminadas funcionalidades innecesarias (screenshots)
- Mejor manejo de errores CSV
- Interfaz traducida al español
- Performance mejorada
- Validación de archivos mejorada
