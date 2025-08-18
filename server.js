const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Configuración de middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Configuración de multer para manejar uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Archivo para almacenar reportes (base de datos simple)
const reportsFile = path.join(__dirname, 'reports.json');

// Función para leer reportes del archivo
function readReports() {
  try {
    if (fs.existsSync(reportsFile)) {
      const data = fs.readFileSync(reportsFile, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Error leyendo reportes:', error);
    return [];
  }
}

// Función para escribir reportes al archivo
function writeReports(reports) {
  try {
    fs.writeFileSync(reportsFile, JSON.stringify(reports, null, 2));
    return true;
  } catch (error) {
    console.error('Error escribiendo reportes:', error);
    return false;
  }
}

// Función para procesar CSV
function processCSVData(csvData, fileName, reportId) {
  // Parsear CSV
  const rows = csvData.split('\n');
  const headers = parseCSVRow(rows[0]);
  
  // Filtrar solo por Status="More information needed" o "To be approved"
  const filteredData = [];
  for (let i = 1; i < rows.length; i++) {
    if (rows[i].trim() === '') continue;
    
    const rowData = parseCSVRow(rows[i]);
    const statusIndex = headers.indexOf('Status');
    const status = rowData[statusIndex];
    
    if (status === 'More information needed' || status === 'To be approved') {
      filteredData.push(rowData);
    }
  }
  
  // Columnas requeridas
  const requiredColumns = [
    'Requisition #', 
    'Status', 
    'Net total', 
    'Originated by', 
    'Date of last approval', 
    'Sent for approval date', 
    'Last approver of the document', 
    'Last approver to date',
    'Requisition #(Corcentric ID)'
  ];
  
  // Indices de las columnas requeridas
  const columnIndices = requiredColumns.map(col => headers.indexOf(col));
  
  // Extraer solo las columnas requeridas
  const finalData = filteredData.map(row => {
    return columnIndices.map(index => row[index] || '');
  });
  
  // Crear nuevo reporte
  const report = {
    id: reportId,
    name: `Reporte de pedidos parados - ${new Date().toLocaleDateString()}`,
    date: new Date().toLocaleString(),
    fileName: fileName,
    headers: requiredColumns,
    data: finalData,
    recordCount: finalData.length,
    created_at: new Date().toISOString()
  };
  
  return report;
}

// Función para parsear filas CSV
function parseCSVRow(row) {
  const result = [];
  let insideQuotes = false;
  let currentValue = '';
  
  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    
    if (char === '"' || char === "'") {
      insideQuotes = !insideQuotes;
    } else if (char === ',' && !insideQuotes) {
      result.push(currentValue.trim());
      currentValue = '';
    } else {
      currentValue += char;
    }
  }
  
  // Añadir el último valor
  result.push(currentValue.trim());
  
  return result;
}

// Rutas API

// Obtener todos los reportes
app.get('/api/reports', (req, res) => {
  try {
    const reports = readReports();
    res.json(reports);
  } catch (error) {
    console.error('Error obteniendo reportes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Subir archivo CSV y crear reporte
app.post('/api/upload-csv', upload.single('csvFile'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó archivo' });
    }

    const csvData = fs.readFileSync(req.file.path, 'utf8');
    const reportId = Date.now();
    
    // Procesar CSV
    const report = processCSVData(csvData, req.file.originalname, reportId);
    
    // Guardar reporte
    const reports = readReports();
    reports.push(report);
    
    if (writeReports(reports)) {
      // Limpiar archivo subido (opcional)
      fs.unlinkSync(req.file.path);
      
      res.json({ 
        success: true, 
        reportId: reportId,
        report: report 
      });
    } else {
      res.status(500).json({ error: 'Error guardando el reporte' });
    }
  } catch (error) {
    console.error('Error procesando archivo:', error);
    res.status(500).json({ error: 'Error procesando el archivo CSV' });
  }
});

// Eliminar un reporte específico
app.delete('/api/reports/:id', (req, res) => {
  try {
    const reportId = parseInt(req.params.id);
    const reports = readReports();
    const filteredReports = reports.filter(report => report.id !== reportId);
    
    if (writeReports(filteredReports)) {
      res.json({ success: true });
    } else {
      res.status(500).json({ error: 'Error eliminando el reporte' });
    }
  } catch (error) {
    console.error('Error eliminando reporte:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Eliminar todos los reportes
app.delete('/api/reports', (req, res) => {
  try {
    if (writeReports([])) {
      res.json({ success: true });
    } else {
      res.status(500).json({ error: 'Error eliminando los reportes' });
    }
  } catch (error) {
    console.error('Error eliminando todos los reportes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Ruta para servir la aplicación principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(50));
  console.log('🚀 SERVIDOR DE PEDIDOS PARADOS INICIADO');
  console.log('='.repeat(50));
  console.log(`📍 Dirección local: http://localhost:${PORT}`);
  console.log(`🌐 Dirección de red: http://[TU_IP]:${PORT}`);
  console.log('');
  console.log('📋 Para compartir con tu oficina:');
  console.log('   1. Encuentra tu IP con: ipconfig');
  console.log('   2. Comparte: http://[TU_IP]:3000');
  console.log('');
  console.log('⚡ Servidor listo para recibir conexiones...');
  console.log('='.repeat(50));
});

// Manejar cierre del servidor
process.on('SIGINT', () => {
  console.log('\n👋 Cerrando servidor...');
  process.exit(0);
});
