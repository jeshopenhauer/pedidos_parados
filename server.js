/**
 * Este es un ejemplo de implementación del servidor para gestionar
 * la carga, almacenamiento y recuperación de archivos CSV y reportes.
 * 
 * Para usarlo, necesitarás:
 *   1. Node.js instalado en tu servidor
 *   2. Instalar dependencias: npm install express multer cors fs-extra
 * 
 * Ejecución: node server.js
 */

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Configuración de middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Configuración de almacenamiento para archivos subidos
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    fs.ensureDirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    // Guardar con timestamp para evitar duplicados
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Directorio para almacenar los reportes procesados
const reportsDir = path.join(__dirname, 'reports');
fs.ensureDirSync(reportsDir);

// Rutas API

// Subida de archivos CSV
app.post('/api/upload-csv', upload.single('csvFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó ningún archivo' });
    }
    
    const reportId = Date.now();
    
    // En una implementación real, aquí procesarías el CSV
    // Por ahora, solo devolvemos el ID del reporte
    
    res.json({ 
      success: true, 
      message: 'Archivo subido correctamente',
      reportId: reportId,
      filePath: req.file.path 
    });
  } catch (error) {
    console.error('Error al subir archivo:', error);
    res.status(500).json({ error: 'Error al procesar el archivo' });
  }
});

// Guardar reporte procesado
app.post('/api/save-report', async (req, res) => {
  try {
    const report = req.body;
    
    if (!report || !report.id) {
      return res.status(400).json({ error: 'Datos de reporte inválidos' });
    }
    
    // Guardar el reporte como un archivo JSON
    const reportPath = path.join(reportsDir, `report-${report.id}.json`);
    await fs.writeJson(reportPath, report, { spaces: 2 });
    
    res.json({ 
      success: true, 
      message: 'Reporte guardado correctamente' 
    });
  } catch (error) {
    console.error('Error al guardar reporte:', error);
    res.status(500).json({ error: 'Error al guardar el reporte' });
  }
});

// Obtener todos los reportes
app.get('/api/get-reports', async (req, res) => {
  try {
    // Leer todos los archivos de reporte
    const files = await fs.readdir(reportsDir);
    const reportFiles = files.filter(file => file.startsWith('report-') && file.endsWith('.json'));
    
    // Cargar cada reporte
    const reports = [];
    for (const file of reportFiles) {
      const reportPath = path.join(reportsDir, file);
      const reportData = await fs.readJson(reportPath);
      reports.push(reportData);
    }
    
    res.json(reports);
  } catch (error) {
    console.error('Error al obtener reportes:', error);
    res.status(500).json({ error: 'Error al obtener los reportes' });
  }
});

// Eliminar un reporte específico
app.delete('/api/delete-report/:id', async (req, res) => {
  try {
    const reportId = req.params.id;
    const reportPath = path.join(reportsDir, `report-${reportId}.json`);
    
    // Verificar si el reporte existe
    if (await fs.pathExists(reportPath)) {
      await fs.remove(reportPath);
      res.json({ success: true, message: 'Reporte eliminado correctamente' });
    } else {
      res.status(404).json({ error: 'Reporte no encontrado' });
    }
  } catch (error) {
    console.error('Error al eliminar reporte:', error);
    res.status(500).json({ error: 'Error al eliminar el reporte' });
  }
});

// Eliminar todos los reportes
app.delete('/api/delete-all-reports', async (req, res) => {
  try {
    // Leer todos los archivos de reporte
    const files = await fs.readdir(reportsDir);
    const reportFiles = files.filter(file => file.startsWith('report-') && file.endsWith('.json'));
    
    // Eliminar cada archivo
    for (const file of reportFiles) {
      await fs.remove(path.join(reportsDir, file));
    }
    
    res.json({ success: true, message: 'Todos los reportes fueron eliminados' });
  } catch (error) {
    console.error('Error al eliminar reportes:', error);
    res.status(500).json({ error: 'Error al eliminar los reportes' });
  }
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor ejecutándose en http://localhost:${port}`);
  console.log(`Directorio de reportes: ${reportsDir}`);
  console.log(`Directorio de uploads: ${path.join(__dirname, 'uploads')}`);
});
