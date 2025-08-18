document.addEventListener('DOMContentLoaded', function() {
  // Referencias a elementos del DOM
  const csvInput = document.getElementById('csvInput');
  const reportsList = document.getElementById('reportsList');
  const tableSection = document.getElementById('tableSection');
  const reportsCount = document.getElementById('reportsCount');
  const tableReportName = document.getElementById('tableReportName');
  const tableGeneratedDate = document.getElementById('tableGeneratedDate');
  const tableFileName = document.getElementById('tableFileName');
  const tableRecordCount = document.getElementById('tableRecordCount');
  const tableContainer = document.getElementById('tableContainer');
  
  // Estado de la aplicación
  let reports = [];
  let isAdmin = false;
  
  // Detectar rol del usuario y configurar interfaz
  detectUserRole();
  
  // Event Listeners
  if (csvInput) {
    csvInput.addEventListener('change', handleFileUpload);
  }
  document.querySelector('.refresh-btn').addEventListener('click', refreshReports);
  
  const deleteBtn = document.querySelector('.delete-btn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', deleteAllReports);
  }
  
  // Cargar reportes desde el servidor
  loadReportsFromServer();
  
  // Polling para actualizar reportes cada 5 segundos
  setInterval(loadReportsFromServer, 5000);
  
  // Función para detectar si es administrador o usuario de solo visualización
  function detectUserRole() {
    const hostname = window.location.hostname;
    const roleStatus = document.getElementById('roleStatus');
    const roleText = document.getElementById('roleText');
    const uploadSection = document.getElementById('uploadSection');
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      // Usuario administrador (acceso local)
      isAdmin = true;
      roleStatus.className = 'status-dot admin';
      roleText.textContent = 'Administrador';
      roleText.className = 'role-text admin';
      
      if (uploadSection) uploadSection.style.display = 'block';
      
      document.body.classList.remove('viewer-mode');
      
    } else {
      // Usuario de solo visualización (acceso por IP de red)
      isAdmin = false;
      roleStatus.className = 'status-dot viewer';
      roleText.textContent = 'Solo Visualización';
      roleText.className = 'role-text viewer';
      
      if (uploadSection) uploadSection.style.display = 'none';
      
      document.body.classList.add('viewer-mode');
    }
  }
  
  // Funciones principales
  function handleFileUpload(event) {
    if (!isAdmin) {
      alert('No tienes permisos para subir archivos. Solo puedes visualizar reportes.');
      return;
    }
    
    const file = event.target.files[0];
    if (!file) return;
    
    // Mostrar indicador de carga
    showLoading('Procesando archivo...');
    
    // Subir archivo al servidor
    uploadToServer(file);
  }
  
  async function uploadToServer(file) {
    try {
      showLoading('Subiendo archivo al servidor...');
      
      const formData = new FormData();
      formData.append('csvFile', file);
      formData.append('fileName', file.name);
      
      const response = await fetch('/api/upload-csv', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Resetear input de archivo
        csvInput.value = '';
        
        // Recargar reportes
        await loadReportsFromServer();
        
        showSuccess('Archivo procesado exitosamente');
      } else {
        throw new Error(result.error || 'Error desconocido');
      }
      
    } catch (error) {
      console.error('Error uploading file:', error);
      showError('Error al subir el archivo: ' + error.message);
      loadReportsFromServer(); // Recargar reportes en caso de error
    }
  }
  
  async function loadReportsFromServer() {
    try {
      const response = await fetch('/api/reports');
      
      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status}`);
      }
      
      const data = await response.json();
      reports = data || [];
      
      renderReportsList();
      updateReportsCount();
      
    } catch (error) {
      console.error('Error loading reports:', error);
      
      // Solo mostrar error si es la primera carga
      if (reports.length === 0) {
        showError('No se pudieron cargar los reportes desde el servidor');
      }
    }
  }
  
  function updateReportsCount() {
    reportsCount.textContent = `${reports.length} reportes`;
  }

  function renderReportsList() {
    updateReportsCount();
    
    // Verificar si hay reportes
    if (reports.length === 0) {
      reportsList.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">
            <i class="fas fa-inbox"></i>
          </div>
          <h3 class="empty-state-title">No hay reportes aún</h3>
          <p class="empty-state-description">Sube un archivo CSV para comenzar</p>
        </div>
      `;
      return;
    }
    
    // Ordenar reportes por fecha (más recientes primero)
    const sortedReports = [...reports].sort((a, b) => b.id - a.id);
    
    // Renderizar lista de reportes
    reportsList.innerHTML = sortedReports.map(report => `
      <div class="report-item" data-id="${report.id}">
        <div class="report-icon">
          <i class="fas fa-file-alt"></i>
        </div>
        <div class="report-details">
          <h3 class="report-name">${report.name}</h3>
          <div class="report-meta">
            <span class="meta-date"><i class="fas fa-calendar"></i> ${report.date}</span>
            <span class="meta-records"><i class="fas fa-table"></i> ${report.recordCount} registros</span>
          </div>
        </div>
        <div class="report-actions">
          <button class="action-btn delete-report-btn admin-only" title="Eliminar">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `).join('');
    
    // Añadir event listeners a los botones de cada reporte
    document.querySelectorAll('.delete-report-btn').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        const reportItem = e.target.closest('.report-item');
        const reportId = parseInt(reportItem.dataset.id);
        deleteReport(reportId);
      });
    });
    
    // Añadir event listener para ver reporte al hacer clic en toda la fila
    document.querySelectorAll('.report-item').forEach(item => {
      item.addEventListener('click', function() {
        const reportId = parseInt(this.dataset.id);
        showReportTable(reportId);
      });
    });
  }
  
  function showReportTable(reportId) {
    const report = reports.find(r => r.id === reportId);
    if (!report) return;
    
    // Actualizar metadatos de la tabla
    tableReportName.textContent = report.name;
    tableGeneratedDate.textContent = report.date;
    tableFileName.textContent = report.fileName || report.filename || report.name;
    tableRecordCount.textContent = `${report.recordCount} registros`;
    
    // Generar tabla HTML
    let tableHTML = '<table>';
    
    // Encabezados
    tableHTML += '<thead><tr>';
    report.headers.forEach(header => {
      tableHTML += `<th>${header}</th>`;
    });
    tableHTML += '</tr></thead>';
    
    // Cuerpo de la tabla
    tableHTML += '<tbody>';
    report.data.forEach(row => {
      tableHTML += '<tr>';
      row.forEach((cell, index) => {
        // Añadir atributo data-status a las celdas de estado para estilizarlas
        if (index === 1) { // Columna Status
          tableHTML += `<td data-status="${cell}">${cell}</td>`;
        } else if (index === 8 && cell) { // Columna Requisition #(Corcentric ID)
          // Crear enlace clickeable para el Corcentric ID
          const corcentricId = cell;
          const url = `https://valeo.determine.com/t/ui/md/REQUESTID/item/${corcentricId}`;
          tableHTML += `<td><a href="${url}" target="_blank" class="corcentric-link">${cell}</a></td>`;
        } else {
          tableHTML += `<td>${cell}</td>`;
        }
      });
      tableHTML += '</tr>';
    });
    tableHTML += '</tbody></table>';
    
    // Insertar tabla
    tableContainer.innerHTML = tableHTML;
    
    // Mostrar sección de tabla
    tableSection.style.display = 'block';
    
    // Scroll a la tabla
    tableSection.scrollIntoView({ behavior: 'smooth' });
  }
  
  async function deleteReport(reportId) {
    if (!isAdmin) {
      alert('No tienes permisos para eliminar reportes. Solo puedes visualizar.');
      return;
    }
    
    if (confirm('¿Estás seguro de que deseas eliminar este reporte?')) {
      try {
        showLoading('Eliminando reporte...');
        
        const response = await fetch(`/api/reports/${reportId}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          throw new Error(`Error del servidor: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
          // Recargar reportes después de eliminar
          await loadReportsFromServer();
          
          // Si la tabla del reporte está abierta, cerrarla
          if (tableSection && tableSection.style.display !== 'none') {
            closeTable();
          }
          
          showSuccess('Reporte eliminado exitosamente');
        } else {
          throw new Error(result.error || 'Error desconocido');
        }
        
      } catch (error) {
        console.error('Error deleting report:', error);
        showError('No se pudo eliminar el reporte: ' + error.message);
      }
    }
  }
  
  async function deleteAllReports() {
    if (!isAdmin) {
      alert('No tienes permisos para eliminar reportes. Solo puedes visualizar.');
      return;
    }
    
    if (reports.length === 0) return;
    
    if (confirm('¿Estás seguro de que deseas eliminar todos los reportes?')) {
      try {
        showLoading('Eliminando todos los reportes...');
        
        const response = await fetch('/api/reports', {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          throw new Error(`Error del servidor: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
          // Recargar reportes después de eliminar
          await loadReportsFromServer();
          
          closeTable();
          
          showSuccess('Todos los reportes eliminados exitosamente');
        } else {
          throw new Error(result.error || 'Error desconocido');
        }
        
      } catch (error) {
        console.error('Error deleting all reports:', error);
        showError('No se pudieron eliminar los reportes: ' + error.message);
      }
    }
  }
  
  async function refreshReports() {
    await loadReportsFromServer();
  }
  
  function closeTable() {
    tableSection.style.display = 'none';
  }
  
  function printTable() {
    window.print();
  }
  
  // Funciones de utilidad para mostrar mensajes
  function showLoading(message) {
    reportsList.innerHTML = `
      <div class="loading">
        <i class="fas fa-spinner fa-spin"></i>
        ${message}
      </div>
    `;
  }
  
  function showError(message) {
    reportsList.innerHTML = `
      <div class="error-state">
        <div class="error-state-icon">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        <h3 class="error-state-title">Error</h3>
        <p class="error-state-description">${message}</p>
        <button class="retry-btn" onclick="loadReportsFromServer()">
          <i class="fas fa-redo"></i>
          Reintentar
        </button>
      </div>
    `;
  }
  
  function showSuccess(message) {
    // Mostrar mensaje temporal de éxito
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.innerHTML = `
      <i class="fas fa-check-circle"></i>
      ${message}
    `;
    
    document.body.appendChild(successDiv);
    
    // Remover después de 3 segundos
    setTimeout(() => {
      document.body.removeChild(successDiv);
    }, 3000);
  }
  
  // Exponer funciones al ámbito global para los onclick del HTML
  window.closeTable = closeTable;
  window.printTable = printTable;
  window.loadReportsFromServer = loadReportsFromServer;
});
