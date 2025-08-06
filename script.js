// --- Database Functions ---
let db;

// Initialize IndexedDB
function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ScreenshotsDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };
    
    request.onupgradeneeded = (event) => {
      db = event.target.result;
      
      // Screenshots object store
      if (!db.objectStoreNames.contains('screenshots')) {
        const screenshotStore = db.createObjectStore('screenshots', { keyPath: 'id', autoIncrement: true });
        screenshotStore.createIndex('requisitionId', 'requisitionId', { unique: false });
        screenshotStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
      
      // Reports object store
      if (!db.objectStoreNames.contains('reports')) {
        const reportStore = db.createObjectStore('reports', { keyPath: 'id', autoIncrement: true });
        reportStore.createIndex('name', 'name', { unique: false });
        reportStore.createIndex('uploadDate', 'uploadDate', { unique: false });
      }
    };
  });
}

// Save screenshot to database
function saveScreenshot(requisitionId, imageData, filename) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['screenshots'], 'readwrite');
    const store = transaction.objectStore('screenshots');
    
    const screenshot = {
      requisitionId: requisitionId,
      imageData: imageData,
      filename: filename || 'screenshot.png',
      timestamp: new Date().toISOString(),
      uploadDate: new Date().toLocaleString()
    };
    
    const request = store.add(screenshot);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Get screenshots for a requisition
function getScreenshots(requisitionId) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['screenshots'], 'readonly');
    const store = transaction.objectStore('screenshots');
    const index = store.index('requisitionId');
    
    const request = index.getAll(requisitionId);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Delete screenshot from database
function deleteScreenshot(screenshotId) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['screenshots'], 'readwrite');
    const store = transaction.objectStore('screenshots');
    
    const request = store.delete(screenshotId);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Save report to database
function saveReport(reportData) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['reports'], 'readwrite');
    const store = transaction.objectStore('reports');
    
    const report = {
      name: reportData.name,
      csv: reportData.csv,
      filteredCsv: reportData.filteredCsv,
      originalFileName: reportData.originalFileName,
      size: reportData.size,
      uploadDate: new Date().toISOString(),
      createdAt: new Date().toLocaleString()
    };
    
    const request = store.add(report);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Get all reports from database
function getAllReports() {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['reports'], 'readonly');
    const store = transaction.objectStore('reports');
    
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Delete report from database
function deleteReportFromDB(reportId) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['reports'], 'readwrite');
    const store = transaction.objectStore('reports');
    
    const request = store.delete(reportId);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Update report in database
function updateReport(reportId, updatedData) {
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

// Initialize database when script loads
initDB().then(() => {
  console.log('Database initialized successfully');
  // Load reports from database on startup
  loadReportsFromDB();
}).catch(err => {
  console.error('Database initialization failed:', err);
});

// Load reports from database
function loadReportsFromDB() {
  getAllReports().then(dbReports => {
    // Convert database reports to the format expected by the UI
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
    console.log(`Loaded ${reports.length} reports from database`);
  }).catch(err => {
    console.error('Error loading reports from database:', err);
  });
}

// --- CSV Filter Function ---
function filterCsvColumns(csvText) {
  const lines = csvText.trim().split('\n');
  if (lines.length === 0) return '';
  
  // Function to parse CSV line respecting quotes
  function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current); // Add the last field
    return result;
  }
  
  // Parse header and get required columns
  const header = parseCSVLine(lines[0]);
  const selectedIndices = [0, 1, 2, 3, 4, 11]; // Requisition #, Name, Date, Originated by, Status, Net total
  
  // Create filtered header
  const filteredHeader = selectedIndices.map(i => header[i] || '').join(',');
  
  // Filter each row
  const filteredRows = lines.slice(1).map(line => {
    const cols = parseCSVLine(line);
    return selectedIndices.map(i => cols[i] || '').join(',');
  });
  
  return [filteredHeader, ...filteredRows].join('\n');
}

// --- State ---
let reports = []; // {name, csv, filteredCsv, date, size}

// --- DOM Elements ---
const csvInput = document.getElementById('csvInput');
const reportsList = document.getElementById('reportsList');
const reportsCount = document.getElementById('reportsCount');
const refreshBtn = document.querySelector('.refresh-btn');

// --- Utility Functions ---
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
    <span>${message}</span>
  `;
  
  // Add to body
  document.body.appendChild(notification);
  
  // Remove after 3 seconds
  setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => {
      if (notification.parentNode) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

// --- Event Handlers ---
csvInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  // Add loading state
  csvInput.disabled = true;
  const label = document.querySelector('.file-input-label');
  const originalText = label.innerHTML;
  label.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
  
  const reader = new FileReader();
  reader.onload = function(evt) {
    try {
      const csvText = evt.target.result;
      const filteredCsv = filterCsvColumns(csvText);
      const name = file.name.replace('.csv', '').replace(/[^a-zA-Z0-9_\-\s]/g, '_').toUpperCase();
      
      // Create report object
      const report = {
        name: name,
        csv: csvText,
        filteredCsv: filteredCsv,
        date: new Date(),
        size: file.size,
        originalFileName: file.name
      };
      
      // Save to database first
      saveReport(report).then(reportId => {
        // Add ID to the report object
        report.id = reportId;
        
        // Add to local reports array
        reports.push(report);
        renderReports();
        updateReportsCount();
        
        showNotification(`Successfully processed and saved "${file.name}"`, 'success');
      }).catch(err => {
        console.error('Error saving report to database:', err);
        showNotification('Error saving report to database', 'error');
      });
      
      // Reset input
      csvInput.value = '';
      
    } catch (error) {
      console.error('Error processing CSV:', error);
      showNotification('Error processing CSV file', 'error');
    } finally {
      // Remove loading state
      csvInput.disabled = false;
      label.innerHTML = originalText;
    }
  };
  
  reader.onerror = function() {
    showNotification('Error reading file', 'error');
    csvInput.disabled = false;
    label.innerHTML = originalText;
  };
  
  reader.readAsText(file);
});

// Refresh button
if (refreshBtn) {
  refreshBtn.addEventListener('click', () => {
    renderReports();
    showNotification('Reports refreshed', 'info');
  });
}

// --- Render Functions ---
function updateReportsCount() {
  const count = reports.length;
  if (reportsCount) {
    reportsCount.textContent = `${count} report${count !== 1 ? 's' : ''}`;
  }
}

function renderReports() {
  reportsList.innerHTML = '';
  
  if (reports.length === 0) {
    reportsList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">
          <i class="fas fa-inbox"></i>
        </div>
        <h3 class="empty-state-title">No reports yet</h3>
        <p class="empty-state-description">Upload a CSV file to get started</p>
      </div>
    `;
    return;
  }

  reports.forEach((report, idx) => {
    const entry = document.createElement('div');
    entry.className = 'report-entry';
    entry.onclick = () => openReport(idx);

    // Report info
    const reportInfo = document.createElement('div');
    reportInfo.className = 'report-info';
    
    const title = document.createElement('div');
    title.className = 'report-title';
    title.textContent = report.name;
    
    const meta = document.createElement('div');
    meta.className = 'report-meta';
    meta.innerHTML = `
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
        <span>6 columns</span>
      </div>
    `;

    reportInfo.appendChild(title);
    reportInfo.appendChild(meta);

    // Actions
    const actions = document.createElement('div');
    actions.className = 'report-actions';

    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'report-btn download-btn';
    downloadBtn.title = 'Download filtered CSV';
    downloadBtn.innerHTML = '<i class="fas fa-download"></i>';
    downloadBtn.onclick = (e) => { 
      e.stopPropagation(); 
      downloadReport(idx); 
    };

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'report-btn delete-btn';
    deleteBtn.title = 'Delete report';
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.onclick = (e) => { 
      e.stopPropagation(); 
      deleteReport(idx); 
    };

    actions.appendChild(downloadBtn);
    actions.appendChild(deleteBtn);

    entry.appendChild(reportInfo);
    entry.appendChild(actions);

    reportsList.appendChild(entry);
  });
}

// --- Action Functions ---
function deleteReport(idx) {
  const report = reports[idx];
  if (confirm(`Are you sure you want to delete "${report.name}"?`)) {
    // Delete from database if it has an ID
    if (report.id) {
      deleteReportFromDB(report.id).then(() => {
        // Remove from local array
        const reportName = report.name;
        reports.splice(idx, 1);
        renderReports();
        updateReportsCount();
        showNotification(`Deleted "${reportName}" from database`, 'success');
      }).catch(err => {
        console.error('Error deleting report from database:', err);
        showNotification('Error deleting report from database', 'error');
      });
    } else {
      // Fallback for reports without ID (shouldn't happen with new system)
      const reportName = report.name;
      reports.splice(idx, 1);
      renderReports();
      updateReportsCount();
      showNotification(`Deleted "${reportName}"`, 'success');
    }
  }
}

function downloadReport(idx) {
  const report = reports[idx];
  const blob = new Blob([report.filteredCsv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `${report.name}_filtered.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
  
  showNotification(`Downloaded "${report.name}_filtered.csv"`, 'success');
}

function openReport(idx) {
  const report = reports[idx];
  
  // Parse CSV data into table
  const lines = report.filteredCsv.split('\n');
  const headers = lines[0].split(',');
  let rows = lines.slice(1).filter(line => line.trim() !== '');
  
  // Find the date column index (should be index 2 for "Date of document")
  const dateColumnIndex = 2;
  
  // Sort rows by date (most recent first)
  rows.sort((a, b) => {
    const rowA = a.split(',');
    const rowB = b.split(',');
    const dateA = new Date(rowA[dateColumnIndex] || '1900-01-01');
    const dateB = new Date(rowB[dateColumnIndex] || '1900-01-01');
    return dateB - dateA; // Descending order (most recent first)
  });
  
  // Create HTML table
  let tableHTML = '<table class="csv-table">';
  
  // Table header
  tableHTML += '<thead><tr>';
  headers.forEach((header, headerIndex) => {
    let headerContent = header.trim();
    
    // Add sort indicator for date column
    if (headerIndex === dateColumnIndex) {
      headerContent += ' <i class="fas fa-sort-down" style="margin-left: 5px; opacity: 0.7;"></i>';
    }
    
    tableHTML += `<th>${headerContent}</th>`;
  });
  // Add Actions column
  tableHTML += '<th style="text-align: center; width: 120px;">Actions</th>';
  tableHTML += '</tr></thead>';
  
  // Table body
  tableHTML += '<tbody>';
  rows.forEach((row, rowIndex) => {
    const cells = row.split(',');
    const requisitionId = cells[0] ? cells[0].trim() : `Row_${rowIndex + 1}`;
    tableHTML += '<tr>';
    cells.forEach((cell, cellIndex) => {
      let cellContent = cell.trim();
      let cellClass = '';
      
      // Format date column for better readability
      if (cellIndex === dateColumnIndex && cellContent) {
        try {
          const date = new Date(cellContent);
          if (!isNaN(date.getTime())) {
            cellContent = date.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            });
          }
        } catch (e) {
          // Keep original format if date parsing fails
        }
      }
      
      // Add special class for "More information needed" status
      if (cellContent.toLowerCase().includes('more information needed')) {
        cellClass = ' class="status-info-needed"';
      }
      
      tableHTML += `<td${cellClass}>${cellContent}</td>`;
    });
    
    // Add Actions column
    tableHTML += `
      <td style="text-align: center; padding: 8px;">
        <div class="action-buttons">
          <button class="action-btn view-btn" onclick="viewEntry('${requisitionId}')" title="View Details">
            <i class="fas fa-eye"></i>
          </button>
          <button class="action-btn screenshot-btn" onclick="addScreenshot('${requisitionId}')" title="Add Screenshot">
            <i class="fas fa-camera"></i>
          </button>
        </div>
      </td>
    `;
    
    tableHTML += '</tr>';
  });
  tableHTML += '</tbody></table>';
  
  const win = window.open('', '_blank');
  win.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${report.name} - CSV Report</title>
      <meta charset="UTF-8">
      <style>
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
          position: relative;
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
        
        .csv-table tbody tr:nth-child(even):hover {
          background-color: #f3f4f6;
        }
        
        .status-info-needed {
          background-color: #2196f3 !important;
          color: white !important;
          font-weight: 600;
          text-align: center;
          border-radius: 4px;
          padding: 8px 12px !important;
        }
        
        .csv-table tbody tr:hover .status-info-needed {
          background-color: #1976d2 !important;
        }
        
        .action-buttons {
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
        
        .view-btn {
          color: #2563eb;
        }
        
        .view-btn:hover {
          background: #dbeafe;
          border-color: #3b82f6;
        }
        
        .screenshot-btn {
          color: #059669;
        }
        
        .screenshot-btn:hover {
          background: #d1fae5;
          border-color: #10b981;
        }
        
        /* Responsive table */
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
      </style>
      <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1><i class="fas fa-file-csv"></i> ${report.name}</h1>
          <div class="meta">
            <div class="meta-item">
              <i class="fas fa-calendar"></i>
              <span>Generated: ${new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</span>
            </div>
            <div class="meta-item">
              <i class="fas fa-file"></i>
              <span>Original: ${report.originalFileName}</span>
            </div>
            <div class="meta-item">
              <i class="fas fa-database"></i>
              <span>${rows.length} records</span>
            </div>
          </div>
        </div>
        
        ${tableHTML}
      </div>
      
      <script>
        // Functions for action buttons
        function viewEntry(requisitionId) {
          // Get screenshots for this requisition
          getScreenshots(requisitionId).then(screenshots => {
            const modal = document.createElement('div');
            modal.style.cssText = 
              'position: fixed;' +
              'top: 0;' +
              'left: 0;' +
              'width: 100%;' +
              'height: 100%;' +
              'background: rgba(0, 0, 0, 0.5);' +
              'display: flex;' +
              'justify-content: center;' +
              'align-items: center;' +
              'z-index: 1000;';
            
            const modalContent = document.createElement('div');
            modalContent.style.cssText = 
              'background: white;' +
              'padding: 30px;' +
              'border-radius: 12px;' +
              'max-width: 800px;' +
              'width: 90%;' +
              'max-height: 80vh;' +
              'overflow-y: auto;' +
              'text-align: center;' +
              'box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);';
            
            let screenshotsHTML = '';
            if (screenshots.length > 0) {
              screenshotsHTML = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 20px;">';
              screenshots.forEach(screenshot => {
                screenshotsHTML += 
                  '<div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px; background: #f9fafb;">' +
                    '<img src="' + screenshot.imageData + '" style="width: 100%; height: 150px; object-fit: cover; border-radius: 4px; margin-bottom: 8px;">' +
                    '<div style="font-size: 12px; color: #666; margin-bottom: 8px;">' + screenshot.uploadDate + '</div>' +
                    '<button onclick="deleteScreenshotFromView(' + screenshot.id + ', \'' + requisitionId + '\')" style="background: #ef4444; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px;">' +
                      '<i class="fas fa-trash"></i> Delete' +
                    '</button>' +
                  '</div>';
              });
              screenshotsHTML += '</div>';
            } else {
              screenshotsHTML = '<p style="color: #666; margin-top: 20px;">No screenshots available for this requisition.</p>';
            }
            
            modalContent.innerHTML = 
              '<h3 style="margin-top: 0; color: #1565c0;">Details for ' + requisitionId + '</h3>' +
              '<p style="color: #666; margin-bottom: 20px;">Screenshots and information for this requisition:</p>' +
              screenshotsHTML +
              '<button id="closeDetails" style="background: #6b7280; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; margin-top: 20px;">Close</button>';
            
            modal.appendChild(modalContent);
            document.body.appendChild(modal);
            
            // Add global function for deleting screenshots
            window.deleteScreenshotFromView = function(screenshotId, reqId) {
              if (confirm('Are you sure you want to delete this screenshot?')) {
                deleteScreenshot(screenshotId).then(() => {
                  document.body.removeChild(modal);
                  viewEntry(reqId); // Refresh the view
                }).catch(err => {
                  alert('Error deleting screenshot: ' + err.message);
                });
              }
            };
            
            document.getElementById('closeDetails').onclick = function() {
              document.body.removeChild(modal);
            };
            
            modal.onclick = function(e) {
              if (e.target === modal) {
                document.body.removeChild(modal);
              }
            };
          }).catch(err => {
            alert('Error loading screenshots: ' + err.message);
          });
        }
        
        function addScreenshot(requisitionId) {
          // Create modal for screenshot upload
          const modal = document.createElement('div');
          modal.style.cssText = 
            'position: fixed;' +
            'top: 0;' +
            'left: 0;' +
            'width: 100%;' +
            'height: 100%;' +
            'background: rgba(0, 0, 0, 0.5);' +
            'display: flex;' +
            'justify-content: center;' +
            'align-items: center;' +
            'z-index: 1000;';
          
          const modalContent = document.createElement('div');
          modalContent.style.cssText = 
            'background: white;' +
            'padding: 30px;' +
            'border-radius: 12px;' +
            'max-width: 500px;' +
            'width: 90%;' +
            'text-align: center;' +
            'box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);';
          
          modalContent.innerHTML = 
            '<h3 style="margin-top: 0; color: #1565c0;">Add Screenshot for ' + requisitionId + '</h3>' +
            '<p style="color: #666; margin-bottom: 20px;">Choose how you want to add your screenshot:</p>' +
            
            '<div style="display: flex; flex-direction: column; gap: 15px;">' +
              '<button id="uploadFromPC" style="background: #2563eb; color: white; border: none; padding: 15px 20px; border-radius: 8px; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; gap: 10px;">' +
                '<i class="fas fa-upload"></i> Upload from Computer' +
              '</button>' +
              
              '<button id="pasteFromClipboard" style="background: #059669; color: white; border: none; padding: 15px 20px; border-radius: 8px; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; gap: 10px;">' +
                '<i class="fas fa-paste"></i> Paste from Clipboard' +
              '</button>' +
              
              '<button id="cancelUpload" style="background: #6b7280; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-size: 14px;">' +
                'Cancel' +
              '</button>' +
            '</div>' +
            
            '<div id="previewArea" style="margin-top: 20px; padding: 20px; border: 2px dashed #e5e7eb; border-radius: 8px; display: none;">' +
              '<img id="imagePreview" style="max-width: 100%; max-height: 200px; border-radius: 4px;">' +
              '<div style="margin-top: 10px;">' +
                '<button id="saveImage" style="background: #10b981; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; margin-right: 10px;">Save Screenshot</button>' +
                '<button id="cancelImage" style="background: #ef4444; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">Cancel</button>' +
              '</div>' +
            '</div>' +
            
            '<input type="file" id="fileInput" accept="image/*" style="display: none;">';
          
          modal.appendChild(modalContent);
          document.body.appendChild(modal);
          
          // Handle file upload from PC
          document.getElementById('uploadFromPC').onclick = function() {
            document.getElementById('fileInput').click();
          };
          
          document.getElementById('fileInput').onchange = function(e) {
            const file = e.target.files[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = function(e) {
                showImagePreview(e.target.result);
              };
              reader.readAsDataURL(file);
            }
          };
          
          // Handle paste from clipboard
          document.getElementById('pasteFromClipboard').onclick = function() {
            navigator.clipboard.read().then(function(clipboardItems) {
              for (let i = 0; i < clipboardItems.length; i++) {
                const clipboardItem = clipboardItems[i];
                for (let j = 0; j < clipboardItem.types.length; j++) {
                  const type = clipboardItem.types[j];
                  if (type.startsWith('image/')) {
                    clipboardItem.getType(type).then(function(blob) {
                      const reader = new FileReader();
                      reader.onload = function(e) {
                        showImagePreview(e.target.result);
                      };
                      reader.readAsDataURL(blob);
                    });
                    return;
                  }
                }
              }
              alert('No image found in clipboard. Please copy an image first.');
            }).catch(function(err) {
              alert('Could not access clipboard. Please use the upload option instead.');
            });
          };
          
          function showImagePreview(imageSrc) {
            document.getElementById('imagePreview').src = imageSrc;
            document.getElementById('previewArea').style.display = 'block';
            
            document.getElementById('saveImage').onclick = function() {
              const timestamp = new Date().toLocaleString();
              
              // Save to database
              saveScreenshot(requisitionId, imageSrc, 'screenshot_' + Date.now() + '.png').then(() => {
                alert('Screenshot saved successfully for ' + requisitionId + '\\nTime: ' + timestamp);
                document.body.removeChild(modal);
              }).catch(err => {
                alert('Error saving screenshot: ' + err.message);
              });
            };
            
            document.getElementById('cancelImage').onclick = function() {
              document.getElementById('previewArea').style.display = 'none';
            };
          }
          
          // Handle cancel and close
          document.getElementById('cancelUpload').onclick = function() {
            document.body.removeChild(modal);
          };
          
          modal.onclick = function(e) {
            if (e.target === modal) {
              document.body.removeChild(modal);
            }
          };
        }
        
        // Add some interactivity
        document.addEventListener('DOMContentLoaded', function() {
          const rows = document.querySelectorAll('.csv-table tbody tr');
          rows.forEach((row, index) => {
            row.addEventListener('click', function(e) {
              // Don't trigger row selection if clicking on action buttons
              if (e.target.closest('.action-btn')) return;
              
              // Remove previous selection
              rows.forEach(r => r.style.background = '');
              // Highlight selected row
              this.style.background = '#dbeafe';
              console.log('Selected row:', index + 1);
            });
          });
        });
      </script>
    </body>
    </html>
  `);
}

// --- Global action handlers ---
const editBtn = document.querySelector('.edit-btn');
if (editBtn) {
  editBtn.addEventListener('click', () => {
    if (reports.length === 0) {
      showNotification('No reports to edit', 'info');
      return;
    }
    
    // Show list of reports to edit
    let reportsList = reports.map((report, idx) => `${idx + 1}. ${report.name}`).join('\n');
    let selection = prompt(`Select a report to edit:\n\n${reportsList}\n\nEnter the number (1-${reports.length}):`);
    
    if (selection) {
      let idx = parseInt(selection) - 1;
      if (idx >= 0 && idx < reports.length) {
        editReport(idx);
      } else {
        showNotification('Invalid selection', 'error');
      }
    }
  });
}

function editReport(idx) {
  const currentReport = reports[idx];
  const currentName = currentReport.name;
  const newName = prompt('Edit report name:', currentName);
  if (newName && newName.trim() !== '' && newName !== currentName) {
    const updatedName = newName.trim().toUpperCase();
    
    // Update in database if it has an ID
    if (currentReport.id) {
      updateReport(currentReport.id, { name: updatedName }).then(() => {
        // Update local array
        reports[idx].name = updatedName;
        renderReports();
        updateReportsCount();
        showNotification(`Report renamed to "${updatedName}"`, 'success');
      }).catch(err => {
        console.error('Error updating report in database:', err);
        showNotification('Error updating report in database', 'error');
      });
    } else {
      // Fallback for reports without ID (shouldn't happen with new system)
      reports[idx].name = updatedName;
      renderReports();
      updateReportsCount();
      showNotification(`Report renamed to "${updatedName}"`, 'success');
    }
  }
}

const deleteBtn = document.querySelector('.delete-btn');
if (deleteBtn) {
  deleteBtn.addEventListener('click', () => {
    if (reports.length === 0) {
      showNotification('No reports to delete', 'info');
      return;
    }
    
    if (confirm('Delete all reports from database? This action cannot be undone.')) {
      const count = reports.length;
      
      // Delete all reports from database
      const deletePromises = reports
        .filter(report => report.id) // Only delete reports with IDs
        .map(report => deleteReportFromDB(report.id));
      
      Promise.all(deletePromises).then(() => {
        // Clear local array
        reports = [];
        renderReports();
        updateReportsCount();
        showNotification(`Deleted ${count} report${count !== 1 ? 's' : ''} from database`, 'success');
      }).catch(err => {
        console.error('Error deleting reports from database:', err);
        showNotification('Error deleting some reports from database', 'error');
        // Still clear local array even if some deletions failed
        reports = [];
        renderReports();
        updateReportsCount();
      });
    }
  });
}

// --- Initial render ---
// Don't render immediately, wait for database to load
// renderReports();
// updateReportsCount();

// The database initialization will call loadReportsFromDB() which handles the initial render

// --- Add notification styles ---
const notificationStyles = `
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
  
  .notification-success {
    border-left-color: #10b981;
  }
  
  .notification-error {
    border-left-color: #ef4444;
  }
  
  .notification-success i {
    color: #10b981;
  }
  
  .notification-error i {
    color: #ef4444;
  }
  
  .notification i {
    color: #2563eb;
  }
  
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

// Add notification styles to head
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);