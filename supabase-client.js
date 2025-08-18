// Configuración de Supabase
// PASO 1: Ve a Settings > API en tu proyecto de Supabase
// PASO 2: Copia la URL del proyecto y la API Key (anon, public)
// PASO 3: Reemplaza las siguientes líneas:

const SUPABASE_URL = 'https://jyhgslhndkwmawzkawni.supabase.co'; // Reemplaza con tu URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5aGdzbGhuZGt3bWF3emthd25pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1MTEwNTUsImV4cCI6MjA3MTA4NzA1NX0.19RtsJxGGrSzLiD8GL0jwHpd-vj8rNhLEx03eG5AcLQ'; // Reemplaza con tu API Key anon

// Verificar que Supabase esté disponible
if (!window.supabase) {
  console.error('Supabase library not loaded');
}

// Inicializar cliente de Supabase
let supabaseClient;
try {
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  console.log('Supabase client initialized successfully');
} catch (error) {
  console.error('Error initializing Supabase client:', error);
}

// Funciones para manejar reportes en Supabase
class SupabaseReportManager {
  
  // Guardar reporte en Supabase
  static async saveReport(report) {
    try {
      if (!supabaseClient) {
        throw new Error('Supabase client not initialized');
      }
      
      console.log('Saving report to Supabase:', report.name);
      
      const { data, error } = await supabaseClient
        .from('reports')
        .insert([{
          name: report.name,
          headers: JSON.stringify(report.headers),
          data: JSON.stringify(report.data),
          record_count: report.recordCount || 0
        }]);
      
      if (error) throw error;
      
      console.log('Reporte guardado exitosamente:', data);
      return data;
    } catch (error) {
      console.error('Error guardando reporte:', error);
      throw error;
    }
  }
  
  // Obtener todos los reportes
  static async getAllReports() {
    try {
      if (!supabaseClient) {
        throw new Error('Supabase client not initialized');
      }
      
      console.log('Fetching reports from Supabase');
      
      const { data, error } = await supabaseClient
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Procesar los datos JSON
      const processedData = data.map(report => ({
        ...report,
        headers: typeof report.headers === 'string' ? JSON.parse(report.headers) : report.headers,
        data: typeof report.data === 'string' ? JSON.parse(report.data) : report.data,
        recordCount: report.record_count || 0
      }));
      
      return processedData;
    } catch (error) {
      console.error('Error obteniendo reportes:', error);
      throw error;
    }
  }
  
  // Eliminar un reporte
  static async deleteReport(reportId) {
    try {
      if (!supabaseClient) {
        throw new Error('Supabase client not initialized');
      }
      
      const { error } = await supabaseClient
        .from('reports')
        .delete()
        .eq('id', reportId);
      
      if (error) throw error;
      
      console.log('Reporte eliminado exitosamente');
    } catch (error) {
      console.error('Error eliminando reporte:', error);
      throw error;
    }
  }
  
  // Eliminar todos los reportes
  static async deleteAllReports() {
    try {
      const { error } = await supabaseClient
        .from('reports')
        .delete()
        .neq('id', 0); // Eliminar todos los registros
      
      if (error) throw error;
      
      console.log('Todos los reportes eliminados exitosamente');
    } catch (error) {
      console.error('Error eliminando todos los reportes:', error);
      throw error;
    }
  }
  
  // Suscribirse a cambios en tiempo real
  static subscribeToReports(callback) {
    return supabaseClient
      .channel('reports')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'reports' }, 
        callback
      )
      .subscribe();
  }
}

// Función para mostrar loading
function showLoading(message = 'Cargando...') {
  const reportsList = document.getElementById('reportsList');
  reportsList.innerHTML = `
    <div class="loading">
      <i class="fas fa-spinner"></i>
      ${message}
    </div>
  `;
}

// Función para mostrar errores
function showError(message) {
  const reportsList = document.getElementById('reportsList');
  reportsList.innerHTML = `
    <div class="error-state">
      <div class="error-icon">
        <i class="fas fa-exclamation-triangle"></i>
      </div>
      <h3 class="error-title">Error</h3>
      <p class="error-description">${message}</p>
    </div>
  `;
}
