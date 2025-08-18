// Gestor de reportes temporal usando localStorage como fallback
class LocalReportManager {
  
  static async saveReport(report) {
    try {
      console.log('Saving report to localStorage:', report.name);
      
      // Obtener reportes existentes
      const existingReports = JSON.parse(localStorage.getItem('reports') || '[]');
      
      // Agregar nuevo reporte con timestamp
      const reportWithTimestamp = {
        ...report,
        id: Date.now().toString(),
        created_at: new Date().toISOString()
      };
      
      existingReports.push(reportWithTimestamp);
      
      // Guardar en localStorage
      localStorage.setItem('reports', JSON.stringify(existingReports));
      
      console.log('Report saved successfully to localStorage');
      return [reportWithTimestamp];
    } catch (error) {
      console.error('Error saving report to localStorage:', error);
      throw error;
    }
  }
  
  static async getAllReports() {
    try {
      console.log('Fetching reports from localStorage');
      
      const reports = JSON.parse(localStorage.getItem('reports') || '[]');
      
      // Procesar los datos para mantener compatibilidad
      const processedData = reports.map(report => ({
        ...report,
        headers: typeof report.headers === 'string' ? JSON.parse(report.headers) : report.headers,
        data: typeof report.data === 'string' ? JSON.parse(report.data) : report.data,
        recordCount: report.record_count || report.recordCount || 0
      }));
      
      console.log('Found reports in localStorage:', processedData.length);
      return processedData;
    } catch (error) {
      console.error('Error fetching reports from localStorage:', error);
      return [];
    }
  }
  
  static async deleteReport(reportId) {
    try {
      console.log('Deleting report from localStorage:', reportId);
      
      const existingReports = JSON.parse(localStorage.getItem('reports') || '[]');
      const filteredReports = existingReports.filter(report => report.id !== reportId);
      
      localStorage.setItem('reports', JSON.stringify(filteredReports));
      
      console.log('Report deleted successfully from localStorage');
      return true;
    } catch (error) {
      console.error('Error deleting report from localStorage:', error);
      throw error;
    }
  }
}
