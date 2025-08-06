# 📊 Report Manager - Pedidos Parados

Una aplicación web moderna para gestionar y visualizar reportes CSV de requisiciones, con funcionalidad de screenshots y seguimiento colaborativo.

## 🚀 Características

- **📁 Procesamiento de CSV**: Filtrado automático de columnas relevantes
- **📱 Interfaz moderna**: Diseño responsive con tema azul claro
- **📷 Gestión de Screenshots**: Subida desde PC o portapapeles
- **🗄️ Base de datos local**: Almacenamiento persistente con IndexedDB
- **👥 Multiusuario**: Acceso colaborativo sin autenticación compleja
- **📈 Ordenamiento inteligente**: Datos ordenados por fecha más reciente
- **🎨 Estados visuales**: Resaltado de "More information needed" en azul

## 🛠️ Instalación

1. Clona el repositorio:
```bash
git clone https://github.com/jeshopenhauer/pedidos_parados.git
cd pedidos_parados
```

2. Abre `index.html` en tu navegador web

¡No se requiere instalación de dependencias adicionales!

## 📋 Uso

### Subir CSV
1. Haz clic en "Choose File" en la sección de upload
2. Selecciona tu archivo CSV
3. El sistema filtrará automáticamente las columnas:
   - Requisition #
   - Name
   - Date of document
   - Originated by
   - Status
   - Net total

### Ver Reportes
1. Haz clic en cualquier reporte de la lista
2. Se abrirá una nueva ventana con la tabla completa
3. Los datos están ordenados por fecha (más recientes primero)

### Gestionar Screenshots
- **👁️ Ver detalles**: Haz clic en el ícono del ojo para ver screenshots existentes
- **📷 Añadir screenshot**: 
  - Haz clic en el ícono de cámara
  - Elige "Upload from Computer" o "Paste from Clipboard"
  - Confirma la imagen en la vista previa
- **🗑️ Eliminar**: En la vista de detalles, usa el botón "Delete" de cada screenshot

## 🗂️ Estructura del Proyecto

```
pedidos_parados/
├── index.html          # Página principal
├── style.css           # Estilos CSS
├── script.js           # Lógica JavaScript y base de datos
├── Input.csv           # Archivo CSV de ejemplo
├── README.md           # Este archivo
└── filterCsvColumns.js # Función de filtrado (opcional)
```

## 🔧 Tecnologías Utilizadas

- **HTML5**: Estructura y semántica
- **CSS3**: Diseño moderno con variables CSS y gradientes
- **JavaScript ES6+**: Lógica de aplicación
- **IndexedDB**: Base de datos local del navegador
- **FontAwesome**: Iconografía
- **Google Fonts**: Tipografía Inter

## 📊 Funcionalidades de la Base de Datos

La aplicación usa IndexedDB para almacenar:
- **Screenshots**: Imágenes en formato base64
- **Metadatos**: Fecha, hora, nombre de archivo
- **Asociación**: Vínculo con Requisition ID
- **Persistencia**: Los datos se mantienen entre sesiones

## 🌐 Compatibilidad

- ✅ Chrome 58+
- ✅ Firefox 55+
- ✅ Safari 11+
- ✅ Edge 79+

## 🤝 Contribución

1. Fork el proyecto
2. Crea tu feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Columnas CSV Soportadas

El sistema extrae automáticamente estas columnas:
- `Requisition #` (índice 0)
- `Name` (índice 1)  
- `Date of document` (índice 2)
- `Originated by` (índice 3)
- `Status` (índice 4)
- `Net total` (índice 11)

## 🎨 Personalización

### Cambiar colores del tema:
Edita las variables CSS en `style.css`:
```css
:root {
  --primary-color: #1565c0;
  --background-color: #e3f2fd;
  --accent-color: #2196f3;
}
```

### Modificar columnas filtradas:
En `script.js`, línea 29:
```javascript
const selectedIndices = [0, 1, 2, 3, 4, 11]; // Modifica estos índices
```

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 👨‍💻 Autor

- **jeshopenhauer** - *Trabajo inicial* - [GitHub](https://github.com/jeshopenhauer)

## 🙏 Agradecimientos

- FontAwesome por los iconos
- Google Fonts por la tipografía Inter
- Comunidad de desarrolladores por inspiration y feedback

---

⭐ ¡No olvides dar una estrella si este proyecto te fue útil!
