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
  
  // Event Listeners
  csvInput.addEventListener('change', handleFileUpload);
  document.querySelector('.refresh-btn').addEventListener('click', refreshReports);
  document.querySelector('.delete-btn').addEventListener('click', deleteAllReports);
  
  // Cargar reportes desde Supabase (solo multiusuario)
  loadReportsFromSupabase();
  
  // Funciones principales
  function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
      const csvData = e.target.result;
      
      // Mostrar indicador de carga
      reportsList.innerHTML = `
        <div class="loading">
          <i class="fas fa-spinner"></i>
          Procesando archivo...
        </div>
      `;
      
      // Procesar y guardar en el servidor
      uploadToServer(file, csvData);
    };
    reader.readAsText(file);
  }
  
  function uploadToServer(file, csvData) {
    // Crear FormData para enviar al servidor
    const formData = new FormData();
    formData.append('csvFile', file);
    formData.append('fileName', file.name);
    
    // Mostrar mensaje de carga
    reportsList.innerHTML = `
      <div class="loading">
        <i class="fas fa-spinner"></i>
        Subiendo archivo al servidor...
      </div>
    `;
    
    // Aquí simularemos la llamada al servidor, en un entorno real usarías fetch o XMLHttpRequest
    // Por ejemplo:
    /*
    fetch('/api/upload-csv', {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      processCSVData(csvData, file.name, data.reportId);
    })
    .catch(error => {
      console.error('Error:', error);
      alert('Error al subir el archivo. Por favor, inténtalo de nuevo.');
      loadReportsFromServer();
    });
    */
    
    // Simulación de envío al servidor (eliminar en implementación real)
    setTimeout(() => {
      const reportId = Date.now();
      processCSVData(csvData, file.name, reportId);
      
      // Resetear input de archivo
      csvInput.value = '';
    }, 1000);
  }
  
  function processCSVData(csvData, fileName, reportId) {
    // Parsear CSV
    const rows = csvData.split('\n');
    const headers = parseCSVRow(rows[0]);
    
    // Filtrar solo por Status="More information needed" o "To be approved"
    const filteredData = [];
    for (let i = 1; i < rows.length; i++) {
      if (rows[i].trim() === '') continue;
      
      const rowData = parseCSVRow(rows[i]);
      const status = rowData[headers.indexOf('Status')];
      
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
    
    // Debug: mostrar las columnas que se van a usar
    console.log('Columnas requeridas:', requiredColumns);
    console.log('Headers encontrados en CSV:', headers);
    
    // Indices de las columnas requeridas
    const columnIndices = requiredColumns.map(col => headers.indexOf(col));
    console.log('Indices de columnas:', columnIndices);
    
    // Extraer solo las columnas requeridas
    const finalData = filteredData.map(row => {
      return columnIndices.map(index => row[index] || '');
    });
    
    // Crear nuevo reporte
    const report = {
      id: reportId,
      name: `Reporte de pedidos parados - ${new Date().toLocaleDateString()}`,
      date: new Date().toLocaleString(),
      headers: requiredColumns,
      data: finalData,
      recordCount: finalData.length
    };
    
    // En un entorno real, enviaríamos los datos procesados al servidor
    // Guardar en Supabase
    saveReportToSupabase(report);
  }
  
  async function saveReportToSupabase(report) {
    try {
      showLoading('Guardando reporte...');
      
      // Guardar en Supabase para acceso multiusuario
      await SupabaseReportManager.saveReport(report);
      console.log('Report saved to Supabase successfully');
      
      // Recargar reportes después de guardar
      await loadReportsFromSupabase();
      
    } catch (error) {
      console.error('Error guardando reporte:', error);
      showError('Error al guardar el reporte. Verifica tu conexión a internet.');
    }
  }
  
  async function loadReportsFromSupabase() {
    try {
      showLoading('Cargando reportes...');
      
      const data = await SupabaseReportManager.getAllReports();
      reports = data || [];
      
      renderReportsList();
      updateReportsCount();
      
    } catch (error) {
      console.error('Error cargando reportes:', error);
      showError('No se pudieron cargar los reportes desde el servidor');
    }
  }
  
  async function loadReportsFromLocalStorage() {
    try {
      showLoading('Cargando reportes...');
      
      const data = await LocalReportManager.getAllReports();
      reports = data || [];
      
      renderReportsList();
      updateReportsCount();
      
    } catch (error) {
      console.error('Error cargando reportes desde localStorage:', error);
      showError('No se pudieron cargar los reportes locales');
    }
  }
  
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
          <button class="action-btn delete-report-btn" title="Eliminar">
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
    tableFileName.textContent = report.name;
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
          // Usar "REQUESTID" literal y Corcentric ID para el último número
          const corcentricId = cell; // Requisition #(Corcentric ID)
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
    if (confirm('¿Estás seguro de que deseas eliminar este reporte?')) {
      try {
        showLoading('Eliminando reporte...');
        
        await SupabaseReportManager.deleteReport(reportId);
        
        // Recargar reportes después de eliminar
        await loadReportsFromSupabase();
        
        // Si la tabla del reporte está abierta, cerrarla
        if (tableSection.style.display !== 'none') {
          closeTable();
        }
        
      } catch (error) {
        console.error('Error eliminando reporte:', error);
        showError('No se pudo eliminar el reporte. Por favor, inténtalo de nuevo.');
      }
    }
  }
  
  async function deleteAllReports() {
    if (reports.length === 0) return;
    
    if (confirm('¿Estás seguro de que deseas eliminar todos los reportes?')) {
      try {
        showLoading('Eliminando todos los reportes...');
        
        await SupabaseReportManager.deleteAllReports();
        
        // Recargar reportes después de eliminar
        await loadReportsFromSupabase();
        
        closeTable();
        
      } catch (error) {
        console.error('Error eliminando todos los reportes:', error);
        showError('No se pudieron eliminar los reportes. Por favor, inténtalo de nuevo.');
      }
    }
  }
  
  async function refreshReports() {
    await loadReportsFromSupabase();
  }
  
  function closeTable() {
    tableSection.style.display = 'none';
  }
  
  function printTable() {
    window.print();
  }
  
  // Exponer funciones al ámbito global para los onclick del HTML
  window.closeTable = closeTable;
  window.printTable = printTable;
});
