// === CONFIGURACIÓN ===
const CONFIG = {
  SELECTED_COLUMNS: [0, 1, 2, 3, 4, 11], // Requisition #, Name, Date, Originated by, Status, Net total
  COLUMN_NAMES: ['Requisition #', 'Name', 'Date of document', 'Originated by', 'Status', 'Net total'],
  DATE_COLUMN_INDEX: 2,
  STATUS_COLUMN_INDEX: 4,
  NET_TOTAL_COLUMN_INDEX: 5
};

// === ESTADO GLOBAL ===
let db;
let reports = [];
let isInitialized = false;

// === ELEMENTOS DOM ===
const elements = {
  csvInput: null,
  reportsList: null,
  reportsCount: null,
  refreshBtn: null,
  editBtn: null,
  deleteBtn: null
};

// === INICIALIZACIÓN DE BASE DE DATOS ===
async function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('CSVReportsDB', 2);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };
    
    request.onupgradeneeded = (event) => {
      db = event.target.result;
      
      // Reports store
      if (!db.objectStoreNames.contains('reports')) {
        const reportStore = db.createObjectStore('reports', { keyPath: 'id', autoIncrement: true });
        reportStore.createIndex('name', 'name', { unique: false });
        reportStore.createIndex('uploadDate', 'uploadDate', { unique: false });
      }
      
      // Screenshots store
      if (!db.objectStoreNames.contains('screenshots')) {
        const screenshotStore = db.createObjectStore('screenshots', { keyPath: 'id', autoIncrement: true });
        screenshotStore.createIndex('requisitionId', 'requisitionId', { unique: false });
        screenshotStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

// === OPERACIONES DE BASE DE DATOS ===
async function saveReport(reportData) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['reports'], 'readwrite');
    const store = transaction.objectStore('reports');
    
    const report = {
      ...reportData,
      uploadDate: new Date().toISOString(),
      createdAt: new Date().toLocaleString()
    };
    
    const request = store.add(report);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getAllReports() {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['reports'], 'readonly');
    const store = transaction.objectStore('reports');
    
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function deleteReportFromDB(reportId) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['reports'], 'readwrite');
    const store = transaction.objectStore('reports');
    
    const request = store.delete(reportId);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function updateReport(reportId, updatedData) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['reports'], 'readwrite');
    const store = transaction.objectStore('reports');
    
    const getRequest = store.get(reportId);
    getRequest.onsuccess = () => {
      const report = getRequest.result;
      if (report) {
        Object.assign(report, updatedData);
        const putRequest = store.put(report);
        putRequest.onsuccess = () => resolve(putRequest.result);
        putRequest.onerror = () => reject(putRequest.error);
      } else {
        reject(new Error('Report not found'));
      }
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
}

// === OPERACIONES DE CAPTURAS ===
async function saveScreenshot(requisitionId, imageBlob, filename) {
window.saveScreenshot = saveScreenshot;
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['screenshots'], 'readwrite');
    const store = transaction.objectStore('screenshots');
    
    const reader = new FileReader();
    reader.onload = function() {
      const screenshot = {
        requisitionId: requisitionId,
        imageData: reader.result, // Base64 data URL
        filename: filename || 'screenshot.png',
        timestamp: new Date().toISOString(),
        uploadDate: new Date().toLocaleString()
      };
      
      const request = store.add(screenshot);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    };
    reader.onerror = () => reject(new Error('Error reading image file'));
    reader.readAsDataURL(imageBlob);
  });
}

async function getScreenshots(requisitionId) {
window.getScreenshots = getScreenshots;
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['screenshots'], 'readonly');
    const store = transaction.objectStore('screenshots');
    const index = store.index('requisitionId');
    
    const request = index.getAll(requisitionId);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function deleteScreenshot(screenshotId) {
window.deleteScreenshot = deleteScreenshot;
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['screenshots'], 'readwrite');
    const store = transaction.objectStore('screenshots');
    
    const request = store.delete(screenshotId);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// === PROCESAMIENTO DE CSV ===
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

function filterCSVColumns(csvText) {
  try {
    const lines = csvText.trim().split('\n').filter(line => line.trim());
    if (lines.length === 0) throw new Error('El archivo CSV está vacío');
    
    // Parsear cabecera
    const header = parseCSVLine(lines[0]);
    const filteredHeader = CONFIG.SELECTED_COLUMNS.map(i => header[i] || '').join(',');
    
    // Procesar filas
    const filteredRows = lines.slice(1)
      .map(line => {
        const cols = parseCSVLine(line);
        return CONFIG.SELECTED_COLUMNS.map(i => cols[i] || '').join(',');
      })
      .filter(row => row.trim() !== ',,,,,' && row.trim() !== ''); // Filtrar filas vacías
    
    if (filteredRows.length === 0) {
      throw new Error('No se encontraron datos válidos en el CSV');
    }
    
    return [filteredHeader, ...filteredRows].join('\n');
  } catch (error) {
    console.error('Error filtering CSV:', error);
    throw new Error(`Error procesando CSV: ${error.message}`);
  }
}

// === UTILIDADES ===
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatCurrency(value) {
  // Limpiar el valor para extraer solo números
  const cleanValue = value.toString().replace(/[^0-9.-]/g, '');
  const numericValue = parseFloat(cleanValue);
  
  if (isNaN(numericValue)) {
    return value; // Retornar valor original si no es un número
  }
  
  // Formatear como moneda europea
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numericValue);
}

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  
  const icon = type === 'success' ? 'check-circle' : 
               type === 'error' ? 'exclamation-circle' : 
               'info-circle';
  
  notification.innerHTML = `
    <i class="fas fa-${icon}"></i>
    <span>${message}</span>
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => {
      if (notification.parentNode) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

function generateReportName(fileName) {
  return fileName
    .replace('.csv', '')
    .replace(/[^a-zA-Z0-9_\-\s]/g, '_')
    .toUpperCase()
    .substring(0, 50); // Limitar longitud
}

// Función para crear carpeta y guardar captura (simulado en navegador)
async function saveScreenshotToFolder(imageBlob, requisitionId, filename) {
  try {
    // Crear un enlace de descarga automática
    const url = URL.createObjectURL(imageBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `figures/${requisitionId}_${filename}`;
    
    // Simular clic para descargar
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Limpiar URL
    URL.revokeObjectURL(url);
    
    showNotification(`Captura guardada: ${link.download}`, 'success');
    return true;
  } catch (error) {
    console.error('Error guardando captura:', error);
    showNotification('Error guardando captura localmente', 'error');
    return false;
  }
}

// === INICIALIZACIÓN DOM ===
function initializeDOM() {
  const elementIds = [
    'csvInput', 'reportsList', 'reportsCount'
  ];
  
  for (const id of elementIds) {
    elements[id] = document.getElementById(id);
    if (!elements[id]) {
      console.error(`Elemento ${id} no encontrado`);
      return false;
    }
  }
  
  // Elementos opcionales
  elements.refreshBtn = document.querySelector('.refresh-btn');
  elements.editBtn = document.querySelector('.edit-btn');
  elements.deleteBtn = document.querySelector('.delete-btn');
  
  return true;
}

// === CARGA DE REPORTES ===
async function loadReportsFromDB() {
  try {
    const dbReports = await getAllReports();
    reports = dbReports.map(dbReport => ({
      id: dbReport.id,
      name: dbReport.name,
      csv: dbReport.csv,
      filteredCsv: dbReport.filteredCsv,
      date: new Date(dbReport.uploadDate),
      size: dbReport.size,
      originalFileName: dbReport.originalFileName
    }));
    
    renderReports();
    updateReportsCount();
    console.log(`Cargados ${reports.length} reportes desde la base de datos`);
  } catch (error) {
    console.error('Error cargando reportes:', error);
    showNotification('Error cargando reportes desde la base de datos', 'error');
  }
}

// === RENDERIZADO ===
function updateReportsCount() {
  const count = reports.length;
  if (elements.reportsCount) {
    elements.reportsCount.textContent = `${count} reporte${count !== 1 ? 's' : ''}`;
  }
}

function renderReports() {
  if (!elements.reportsList) return;
  
  elements.reportsList.innerHTML = '';
  
  if (reports.length === 0) {
    elements.reportsList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">
          <i class="fas fa-inbox"></i>
        </div>
        <h3 class="empty-state-title">No hay reportes</h3>
        <p class="empty-state-description">Sube un archivo CSV para comenzar</p>
      </div>
    `;
    return;
  }

  reports.forEach((report, idx) => {
    const entry = document.createElement('div');
    entry.className = 'report-entry';
    entry.onclick = () => openReport(idx);

    entry.innerHTML = `
      <div class="report-info">
        <div class="report-title">${report.name}</div>
        <div class="report-meta">
          <div class="report-meta-item">
            <i class="fas fa-calendar"></i>
            <span>${formatDate(report.date)}</span>
          </div>
          <div class="report-meta-item">
            <i class="fas fa-file"></i>
            <span>${formatFileSize(report.size)}</span>
          </div>
          <div class="report-meta-item">
            <i class="fas fa-filter"></i>
            <span>${CONFIG.COLUMN_NAMES.length} columnas</span>
          </div>
        </div>
      </div>
      <div class="report-actions">
        <button class="report-btn download-btn" onclick="event.stopPropagation(); downloadReport(${idx});" title="Descargar CSV filtrado">
          <i class="fas fa-download"></i>
        </button>
        <button class="report-btn delete-btn" onclick="event.stopPropagation(); deleteReport(${idx});" title="Eliminar reporte">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;

    elements.reportsList.appendChild(entry);
  });
}

// === ACCIONES ===
async function processCSVFile(file) {
  if (!file.name.toLowerCase().endsWith('.csv')) {
    throw new Error('Por favor selecciona un archivo CSV válido');
  }
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async function(event) {
      try {
        const csvText = event.target.result;
        if (!csvText || csvText.trim().length === 0) {
          throw new Error('El archivo CSV está vacío');
        }
        
        const filteredCsv = filterCSVColumns(csvText);
        const name = generateReportName(file.name);
        
        const report = {
          name: name,
          csv: csvText,
          filteredCsv: filteredCsv,
          size: file.size,
          originalFileName: file.name
        };
        
        const reportId = await saveReport(report);
        report.id = reportId;
        report.date = new Date();
        
        reports.push(report);
        renderReports();
        updateReportsCount();
        
        showNotification(`Archivo "${file.name}" procesado exitosamente`, 'success');
        resolve(report);
        
      } catch (error) {
        console.error('Error procesando archivo:', error);
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Error leyendo el archivo'));
    reader.readAsText(file, 'UTF-8');
  });
}

async function deleteReport(idx) {
  const report = reports[idx];
  if (confirm(`¿Estás seguro de que quieres eliminar "${report.name}"?`)) {
    try {
      if (report.id) {
        await deleteReportFromDB(report.id);
      }
      
      const reportName = report.name;
      reports.splice(idx, 1);
      renderReports();
      updateReportsCount();
      showNotification(`Reporte "${reportName}" eliminado`, 'success');
    } catch (error) {
      console.error('Error eliminando reporte:', error);
      showNotification('Error eliminando el reporte', 'error');
    }
  }
}

function downloadReport(idx) {
  const report = reports[idx];
  const blob = new Blob([report.filteredCsv], { type: 'text/csv;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `${report.name}_filtrado.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
  
  showNotification(`Descargado "${report.name}_filtrado.csv"`, 'success');
}

function openReport(idx) {
  const report = reports[idx];
  
  try {
    const lines = report.filteredCsv.split('\n').filter(line => line.trim());
    const headers = parseCSVLine(lines[0]);
    let rows = lines.slice(1).filter(line => line.trim() !== '');
    
    // Ordenar por fecha (más reciente primero)
    rows.sort((a, b) => {
      const rowA = parseCSVLine(a);
      const rowB = parseCSVLine(b);
      const dateA = new Date(rowA[CONFIG.DATE_COLUMN_INDEX] || '1900-01-01');
      const dateB = new Date(rowB[CONFIG.DATE_COLUMN_INDEX] || '1900-01-01');
      return dateB - dateA;
    });
    
    // Crear tabla HTML
    let tableHTML = `
      <table class="csv-table">
        <thead>
          <tr>
            ${headers.map((header, idx) => {
              let headerContent = header.trim();
              if (idx === CONFIG.DATE_COLUMN_INDEX) {
                headerContent += ' <i class="fas fa-sort-down" style="margin-left: 5px; opacity: 0.7;"></i>';
              }
              return `<th>${headerContent}</th>`;
            }).join('')}
            <th style="text-align: center; width: 150px;">Gestionar Capturas</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map((row, rowIndex) => {
            const cells = parseCSVLine(row);
            const requisitionId = cells[0] ? cells[0].trim() : `Row_${rowIndex + 1}`;
            return `
              <tr>
                ${cells.map((cell, cellIndex) => {
                  let cellContent = cell.trim();
                  let cellClass = '';
                  
                  // Formatear fecha
                  if (cellIndex === CONFIG.DATE_COLUMN_INDEX && cellContent) {
                    try {
                      const date = new Date(cellContent);
                      if (!isNaN(date.getTime())) {
                        cellContent = date.toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        });
                      }
                    } catch (e) {
                      // Mantener formato original si falla el parseo
                    }
                  }
                  
                  // Formatear Net total como moneda
                  if (cellIndex === CONFIG.NET_TOTAL_COLUMN_INDEX && cellContent) {
                    cellContent = formatCurrency(cellContent);
                    cellClass = ' class="currency-cell"';
                  }
                  
                  // Resaltar estado "More information needed"
                  if (cellIndex === CONFIG.STATUS_COLUMN_INDEX && 
                      cellContent.toLowerCase().includes('more information needed')) {
                    cellClass = ' class="status-info-needed"';
                  }
                  
                  return `<td${cellClass}>${cellContent}</td>`;
                }).join('')}
                <td style="text-align: center; padding: 8px;">
                  <div class="screenshot-actions">
                    <button class="action-btn view-screenshots-btn" data-requisition="${requisitionId}" title="Ver/Gestionar Capturas">
                      <i class="fas fa-images"></i>
                    </button>
                  </div>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;

    // Mostrar la tabla en la página principal
    document.getElementById('tableReportName').textContent = report.name;
    document.getElementById('tableGeneratedDate').textContent = formatDate(new Date());
    document.getElementById('tableFileName').textContent = report.originalFileName;
    document.getElementById('tableRecordCount').textContent = `${rows.length} registros`;
    document.getElementById('tableContainer').innerHTML = tableHTML;
    document.getElementById('tableSection').style.display = 'flex';

    // Configurar event listeners para los botones de captura
    setupScreenshotButtons();
    
    // Configurar event listener para cerrar al hacer click fuera del modal
    setupModalCloseListener();
    
  } catch (error) {
    console.error('Error abriendo reporte:', error);
    showNotification('Error abriendo el reporte', 'error');
  }
}

// Función para cerrar la tabla
function closeTable() {
  const tableSection = document.getElementById('tableSection');
  tableSection.style.animation = 'fadeOut 0.3s ease-out';
  setTimeout(() => {
    tableSection.style.display = 'none';
    tableSection.style.animation = '';
  }, 300);
}

// Función para configurar el cierre del modal al hacer click fuera
function setupModalCloseListener() {
  const tableSection = document.getElementById('tableSection');
  const tableCard = tableSection.querySelector('.table-card');
  
  // Remover listener anterior si existe
  tableSection.removeEventListener('click', handleModalClick);
  
  // Agregar nuevo listener
  tableSection.addEventListener('click', handleModalClick);
  
  function handleModalClick(e) {
    // Si el click fue en el fondo del modal (no en la card), cerrar
    if (e.target === tableSection) {
      closeTable();
    }
  }
  
  // También permitir cerrar con ESC
  function handleKeyPress(e) {
    if (e.key === 'Escape' && tableSection.style.display === 'flex') {
      closeTable();
    }
  }
  
  // Remover listener anterior y agregar nuevo
  document.removeEventListener('keydown', handleKeyPress);
  document.addEventListener('keydown', handleKeyPress);
}

// Función para imprimir la tabla
function printTable() {
  const tableContent = document.getElementById('tableContainer').innerHTML;
  const reportName = document.getElementById('tableReportName').textContent;
  const generatedDate = document.getElementById('tableGeneratedDate').textContent;
  const fileName = document.getElementById('tableFileName').textContent;
  const recordCount = document.getElementById('tableRecordCount').textContent;
  
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <title>${reportName} - Reporte CSV</title>
      <meta charset="UTF-8">
      <style>
        body { 
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
          margin: 20px; 
          color: #0f172a;
        }
        .header { 
          text-align: center; 
          margin-bottom: 30px; 
          border-bottom: 2px solid #e2e8f0; 
          padding-bottom: 20px;
        }
        .header h1 { 
          color: #4983ff; 
          margin-bottom: 10px; 
        }
        .meta { 
          display: flex; 
          justify-content: center; 
          gap: 20px; 
          font-size: 0.9rem; 
          color: #64748b;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          font-size: 0.8rem; 
        }
        th, td { 
          border: 1px solid #e2e8f0; 
          padding: 8px; 
          text-align: left; 
        }
        th { 
          background: #f1f5f9; 
          font-weight: 600; 
        }
        .currency-cell { 
          font-weight: 600; 
          color: #10b981; 
          text-align: right; 
        }
        .status-info-needed { 
          background: rgba(245, 158, 11, 0.1); 
          color: #f59e0b; 
        }
        .screenshot-actions { 
          text-align: center; 
          color: #64748b; 
          font-style: italic; 
        }
        @media print {
          body { margin: 0; }
          .screenshot-actions { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${reportName}</h1>
        <div class="meta">
          <span>Generado: ${generatedDate}</span>
          <span>Original: ${fileName}</span>
          <span>${recordCount}</span>
        </div>
      </div>
      ${tableContent}
    </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

// Función para configurar los event listeners de los botones de captura
function setupScreenshotButtons() {
  // Solo botones de ver capturas (que ahora incluyen añadir)
  document.querySelectorAll('.view-screenshots-btn').forEach((btn, index) => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      const requisitionId = this.getAttribute('data-requisition');
      if (requisitionId) {
        window.open(`screenshots.html?id=${encodeURIComponent(requisitionId)}`, '_blank');
      } else {
        showNotification('ID de requisición no encontrado', 'error');
      }
    });
  });
}

function getReportStyles() {
  return `
    body { 
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
      margin: 0; 
      padding: 20px; 
      background: #e3f2fd;
      min-height: 100vh;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: rgba(255, 255, 255, 0.98);
      border-radius: 12px;
      padding: 30px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .header { 
      text-align: center;
      margin-bottom: 30px; 
      padding-bottom: 20px;
      border-bottom: 2px solid #e2e8f0;
    }
    
    .header h1 { 
      margin: 0; 
      color: #1565c0; 
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 10px;
    }
    
    .header .meta { 
      color: #546e7a; 
      font-size: 1.1rem;
      display: flex;
      justify-content: center;
      gap: 30px;
      flex-wrap: wrap;
    }
    
    .meta-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .meta-item i {
      color: #1976d2;
    }
    
    .csv-table { 
      width: 100%; 
      border-collapse: collapse; 
      margin-top: 20px;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      border: 1px solid #e0e7ff;
    }
    
    .csv-table th { 
      background: #f8fafc; 
      color: #374151; 
      padding: 12px 16px; 
      text-align: left; 
      font-weight: 600;
      font-size: 0.875rem;
      border-bottom: 2px solid #e5e7eb;
    }
    
    .csv-table td { 
      padding: 12px 16px; 
      border-bottom: 1px solid #f3f4f6; 
      font-size: 0.875rem;
      vertical-align: middle;
    }
    
    .csv-table tbody tr:hover { 
      background-color: #f8fafc; 
    }
    
    .csv-table tbody tr:nth-child(odd) {
      background-color: #ffffff;
    }
    
    .csv-table tbody tr:nth-child(even) {
      background-color: #f9fafb;
    }
    
    .status-info-needed {
      background-color: #2196f3 !important;
      color: white !important;
      font-weight: 600;
      text-align: center;
      border-radius: 4px;
      padding: 8px 12px !important;
    }
    
    .currency-cell {
      text-align: right !important;
      font-weight: 600;
      color: #059669 !important;
      background-color: #f0fdf4 !important;
      font-family: 'Courier New', monospace;
    }
    
    .screenshot-actions {
      display: flex;
      gap: 5px;
      justify-content: center;
    }
    
    .action-btn {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 6px 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 0.75rem;
    }
    
    .action-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
  
    
  
    
    @media (max-width: 768px) {
      .container {
        margin: 10px;
        padding: 20px;
      }
      
      .header h1 {
        font-size: 2rem;
      }
      
      .header .meta {
        flex-direction: column;
        gap: 10px;
      }
      
      .csv-table {
        font-size: 0.8rem;
      }
      
      .csv-table th,
      .csv-table td {
        padding: 8px 6px;
      }
    }
  `;
}

// === MÓDULO DE GESTIÓN DE IMÁGENES ===
// Sistema simplificado para ver y cargar imágenes desde carpeta figures/

// Módulo de gestión de imágenes (simple y funcional)
window.viewScreenshots = async function(requisitionId) {
  try {
    const screenshots = await getScreenshots(requisitionId);
    const modal = document.createElement('div');
    modal.className = 'image-modal-overlay';
    modal.innerHTML = `
      <div class="image-modal-content">
        <h2 style="margin:0 0 20px 0; color:#1565c0;">Capturas de ${requisitionId}</h2>
        <div style="margin-bottom:20px;">
          <input type="file" id="figuresFileInput" accept="image/*" multiple style="display:none;">
          <button id="selectFromFigures" style="background:#0ea5e9;color:white;padding:10px 20px;border:none;border-radius:8px;cursor:pointer;font-size:16px;">Añadir imagen</button>
        </div>
        <div id="imagesGrid">
          ${screenshots.length > 0 ? screenshots.map(s => `
            <div style='display:inline-block;margin:10px;text-align:center;'>
              <img src='${s.imageData}' style='width:180px;height:120px;object-fit:cover;border-radius:8px;box-shadow:0 2px 8px #0002;cursor:pointer;' onclick='window.openImageFullscreen("${s.imageData}")'>
              <div style='margin:5px 0;font-size:13px;color:#64748b;'>${s.uploadDate}</div>
              <button onclick='window.deleteScreenshotFromView(${s.id},"${requisitionId}")' style='background:#ef4444;color:white;border:none;padding:5px 12px;border-radius:6px;cursor:pointer;font-size:13px;'>Eliminar</button>
            </div>
          `).join('') : `<div style='padding:40px;text-align:center;color:#64748b;'>No hay capturas</div>`}
        </div>
        <div style="margin-top:30px;text-align:center;">
          <button id="closeModal" style="background:#6b7280;color:white;padding:10px 24px;border:none;border-radius:8px;cursor:pointer;font-size:16px;">Cerrar</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('selectFromFigures').onclick = () => document.getElementById('figuresFileInput').click();
    document.getElementById('figuresFileInput').onchange = async function(e) {
      const files = Array.from(e.target.files);
      for (const file of files) {
        if (file.type.startsWith('image/')) {
          await saveScreenshot(requisitionId, file, file.name);
        }
      }
      document.body.removeChild(modal);
      window.viewScreenshots(requisitionId);
    };
    document.getElementById('closeModal').onclick = () => document.body.removeChild(modal);
    modal.onclick = e => { if (e.target === modal) document.body.removeChild(modal); };
  } catch (err) {
    showNotification('Error mostrando capturas', 'error');
  }
};
window.openImageFullscreen = function(imageSrc) {
  const fullscreenModal = document.createElement('div');
  fullscreenModal.className = 'fullscreen-modal';
  fullscreenModal.innerHTML = `
    <div style='display:flex;align-items:center;justify-content:center;height:100vh;'>
      <img src='${imageSrc}' style='max-width:90vw;max-height:90vh;border-radius:10px;box-shadow:0 20px 50px #0008;'>
      <button onclick='document.body.removeChild(this.parentElement.parentElement)' style='position:absolute;top:30px;right:30px;background:#333;color:white;border:none;border-radius:50%;width:40px;height:40px;font-size:1.2rem;cursor:pointer;'>✖️</button>
    </div>
  `;
  fullscreenModal.onclick = e => { if (e.target === fullscreenModal) document.body.removeChild(fullscreenModal); };
  document.body.appendChild(fullscreenModal);
};
window.deleteScreenshotFromView = async function(screenshotId, requisitionId) {
  if (confirm('¿Eliminar esta captura?')) {
    await deleteScreenshot(screenshotId);
    document.querySelector('.image-modal-overlay')?.remove();
    window.viewScreenshots(requisitionId);
    showNotification('Captura eliminada', 'success');
  }
};

// === EVENTOS ===
function setupEventListeners() {
  if (!elements.csvInput) {
    console.error('No se pueden configurar los eventos: elementos DOM no encontrados');
    return;
  }
  
  // Input de archivo CSV
  elements.csvInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
/*     // Estado de carga
    elements.csvInput.disabled = true;
    const label = document.querySelector('.file-input-label');
    const originalText = label.innerHTML;
    label.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...'; */
    
    try {
      await processCSVFile(file);
      elements.csvInput.value = ''; // Limpiar input
    } catch (error) {
      console.error('Error procesando archivo:', error);
      showNotification(error.message, 'error');
    } finally {
      // Restaurar estado
      elements.csvInput.disabled = false;
      label.innerHTML = originalText;
    }
  });

  // Botón de refrescar
  if (elements.refreshBtn) {
    elements.refreshBtn.addEventListener('click', () => {
      renderReports();
      showNotification('Reportes actualizados', 'info');
    });
  }

  // Botón de eliminar todos
  if (elements.deleteBtn) {
    elements.deleteBtn.addEventListener('click', async () => {
      if (reports.length === 0) {
        showNotification('No hay reportes para eliminar', 'info');
        return;
      }
      
      if (confirm(`¿Eliminar todos los reportes (${reports.length})? Esta acción no se puede deshacer.`)) {
        try {
          const deletePromises = reports
            .filter(report => report.id)
            .map(report => deleteReportFromDB(report.id));
          
          await Promise.all(deletePromises);
          
          const count = reports.length;
          reports = [];
          renderReports();
          updateReportsCount();
          showNotification(`${count} reporte${count !== 1 ? 's' : ''} eliminado${count !== 1 ? 's' : ''}`, 'success');
        } catch (error) {
          console.error('Error eliminando reportes:', error);
          showNotification('Error eliminando algunos reportes', 'error');
        }
      }
    });
  }
}

// === INICIALIZACIÓN PRINCIPAL ===
async function initializeApplication() {
  console.log('Inicializando aplicación...');
  
  try {
    // Inicializar DOM
    if (!initializeDOM()) {
      throw new Error('Error inicializando elementos DOM');
    }
    
    // Inicializar base de datos
    await initDB();
    console.log('Base de datos inicializada');
    
    // Cargar reportes existentes
    await loadReportsFromDB();
    
    // Configurar eventos
    setupEventListeners();
    
    isInitialized = true;
    console.log('Aplicación inicializada correctamente');
    
  } catch (error) {
    console.error('Error inicializando aplicación:', error);
    showNotification('Error inicializando la aplicación', 'error');
    
    // Intentar configurar funcionalidad básica
    if (initializeDOM()) {
      setupEventListeners();
    }
  }
}

// === ESTILOS DE NOTIFICACIONES ===
function addNotificationStyles() {
  const styles = `
    .notification {
      position: fixed;
      top: 20px;
      right: 20px;
      background: white;
      border-radius: 8px;
      padding: 16px 20px;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      z-index: 1000;
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 300px;
      opacity: 0;
      transform: translateX(100%);
      animation: slideInRight 0.3s ease forwards;
      border-left: 4px solid #2563eb;
    }
    
    .notification-success { border-left-color: #10b981; }
    .notification-error { border-left-color: #ef4444; }
    
    .notification-success i { color: #10b981; }
    .notification-error i { color: #ef4444; }
    .notification i { color: #2563eb; }
    
    .notification.fade-out {
      animation: slideOutRight 0.3s ease forwards;
    }
    
    @keyframes slideInRight {
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
    
    @keyframes slideOutRight {
      to {
        opacity: 0;
        transform: translateX(100%);
      }
    }
  `;
  
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

// === INICIO ===
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    addNotificationStyles();
    // Solo inicializar la app si NO estamos en screenshots.html
    if (!window.location.pathname.endsWith('screenshots.html')) {
      initializeApplication();
    } else {
      // Solo inicializar la base de datos para capturas
      initDB();
    }
  });
} else {
  addNotificationStyles();
  if (!window.location.pathname.endsWith('screenshots.html')) {
    initializeApplication();
  } else {
    initDB();
  }
}

// Exponer funciones globales para uso en HTML
window.downloadReport = downloadReport;
window.deleteReport = deleteReport;
window.openReport = openReport;
// window.addScreenshot = addScreenshot; // Eliminada - funcionalidad integrada en viewScreenshots
window.viewScreenshots = viewScreenshots;
