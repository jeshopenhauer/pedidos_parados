# Gestor de Pedidos Parados

Esta aplicación permite cargar, filtrar y visualizar datos de pedidos parados desde archivos CSV.

## Características

- Carga de archivos CSV
- Filtrado automático por estado "More information needed" o "To be approved"
- Visualización de datos en tablas interactivas
- Almacenamiento de reportes para acceso multiusuario
- Impresión de reportes

## Instalación

1. Clona este repositorio
2. Instala las dependencias del servidor:

```bash
npm install express multer cors fs-extra
```

3. Inicia el servidor:

```bash
node server.js
```

4. Accede a la aplicación en `http://localhost:3000`

## Estructura de Archivos

- `index.html` - Interfaz de usuario principal
- `style.css` - Estilos de la aplicación
- `script.js` - Lógica del cliente
- `server.js` - API del servidor para almacenamiento multiusuario

## Uso

1. Haz clic en "Seleccionar Archivo" para cargar un CSV
2. El archivo se procesará y filtrará automáticamente
3. Haz clic en un reporte de la lista para ver sus detalles
4. Utiliza los botones de acción para imprimir o eliminar reportes

## Notas para Implementación

El archivo `server.js` proporciona una implementación básica del servidor para manejar el almacenamiento de archivos y reportes. En un entorno de producción, considera:

1. Implementar autenticación de usuarios
2. Configurar una base de datos para un almacenamiento más robusto
3. Añadir validación adicional para los archivos CSV
4. Configurar HTTPS para conexiones seguras
