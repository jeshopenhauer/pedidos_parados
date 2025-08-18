# 🚀 SERVIDOR LOCAL - Pedidos Parados

## 📋 INFORMACIÓN RÁPIDA

### 🌐 **Link para tu oficina:**
```
http://10.252.15.122:3001
```
## modo visualizacion
http://10.252.15.122:3001?viewer=true


## ⚡ CÓMO INICIAR EL SERVIDOR

### Opción 1: **Automático (Recomendado)**
1. Doble clic en: `iniciar-servidor.bat`
2. Espera a que aparezca el mensaje "Servidor listo"
3. ¡Listo! Ya puedes compartir el link

### Opción 2: **Manual**
```bash
# En PowerShell o Git Bash
cd ~/Desktop/pedidos_parados
~/Desktop/node/node.exe server.js





## 🔧 ADMINISTRACIÓN (SOLO TÚ)

### **Subir reportes:**
1. Ve a: `http://localhost:3000`
2. Haz clic en "Seleccionar Archivo"
3. Elige tu archivo CSV
4. ¡Automáticamente aparece para todos!

### **Eliminar reportes:**
- Haz clic en el icono de basura (🗑️) en cualquier reporte

### **Parar el servidor:**
- `Ctrl + C` en la ventana del servidor
- O cerrar la ventana

---

## 📁 ARCHIVOS DEL SISTEMA

```
pedidos_parados/
├── index.html          # Interfaz web
├── script-local.js     # Lógica del cliente
├── server.js           # Servidor backend
├── style.css           # Estilos de la aplicación
├── package.json        # Configuración Node.js
├── iniciar-servidor.bat # Script de inicio automático
├── reports.json        # Base de datos de reportes (se crea automáticamente)
└── data/               # Archivos CSV de ejemplo
```

---

## 🔄 USO DIARIO

### **Para iniciar cada día:**
1. Doble clic en `iniciar-servidor.bat`
2. Compartir: `http://10.252.15.122:3001`

### **Para detener:**
- `Ctrl + C` en la ventana del servidor

---

## 🚨 SOLUCIÓN DE PROBLEMAS

### **"No se puede conectar desde otros PCs"**
- Verifica que están en la misma red WiFi
- Usa exactamente esta IP: `10.252.15.122:3001`
- Temporalmente desactiva el firewall de Windows

### **"El servidor no inicia"**
- Verifica que Node.js esté en: `~/Desktop/node/`
- Ejecuta manualmente: `~/Desktop/node/node.exe server.js`

### **"No aparecen los reportes"**
- Espera 5 segundos (actualización automática)
- Refresca la página (F5)

---

## 💡 CÓMO FUNCIONA

1. **Tu PC = Servidor**
   - Almacena todos los reportes
   - Procesa archivos CSV
   - Sirve la aplicación web

2. **Otros PCs = Clientes**
   - Se conectan a tu PC
   - Ven reportes en tiempo real
   - Solo lectura

3. **Sincronización**
   - Actualización automática cada 5 segundos
   - Sin necesidad de refrescar manualmente

---

## 🎯 ¡LISTO PARA USAR!

✅ **Archivos limpiados y organizados**
✅ **README actualizado con instrucciones claras**
✅ **Script de inicio configurado para Node.js portátil**
✅ **Link específico para tu oficina: `http://10.252.15.122:3001`**

### **Próximo paso:**
Ejecuta `iniciar-servidor.bat` y comparte el link con tu equipo!
