// src/js/dashboardController.js

function actualizarIndicadorAvance(formulariosCompletados, totalFormularios) {
    const circulo = document.querySelector('.progreso-circular');
    const texto = document.getElementById('porcentaje-texto');
    const subtitulo = document.querySelector('.indicador-avance small');

    // Si no existe el indicador en el DOM, salir sin error
    if (!circulo || !texto || !subtitulo) return;

    const porcentaje = (formulariosCompletados / totalFormularios) * 100;
    const porcentajeRedondeado = Math.round(porcentaje);

    circulo.style.setProperty('--porcentaje', porcentajeRedondeado);
    texto.textContent = `${porcentajeRedondeado}%`;
    subtitulo.textContent = `${formulariosCompletados} de ${totalFormularios} formularios completados`;

    if (porcentajeRedondeado === 100) {
        circulo.style.setProperty('--progreso-color', '#00B8D4');
    }
}

// Ejemplo de uso al cargar el dashboard:
// Supongamos que esta función se llama después de recibir los datos del modelo
// actualizarIndicadorAvance(7, 10);

document.addEventListener('DOMContentLoaded', () => {
  console.log('[dashboard.js] DOM listo');

  const btn = document.getElementById('btn-consultar-panel');
  const selVigencia = document.getElementById('vigencia');
  const content = document.getElementById('content-panel');

  if (!btn || !selVigencia || !content) {
    console.error('[dashboard.js] Faltan elementos del DOM', { btn, selVigencia, content });
    return;
  }

  btn.addEventListener('click', async () => {
    const vigencia = selVigencia.value;
    console.log('[dashboard.js] Consultar clic', { vigencia });

    if (!vigencia) {
      content.innerHTML = '<p class="error">Seleccione una vigencia</p>';
      return;
    }

    content.innerHTML = '<p class="loading">Consultando...</p>';

    try {
      const url = `/api/dashboard/avance?vigencia=${encodeURIComponent(vigencia)}`;
      console.log('[dashboard.js] Fetch URL:', url);
      const resp = await fetch(url, { credentials: 'same-origin' });

      if (!resp.ok) {
        const text = await resp.text();
        console.error('[dashboard.js] Respuesta no OK', resp.status, text);
        content.innerHTML = `<p class="error">Error ${resp.status} al consultar</p>`;
        return;
      }

      const data = await resp.json();
      console.log('[dashboard.js] Datos recibidos:', data);

      if (!data.success) {
        content.innerHTML = `<p class="error">${data.message || 'Error al consultar'}</p>`;
        return;
      }

      renderDashboard(content, data);
    } catch (e) {
      console.error('[dashboard.js] Error fetch:', e);
      content.innerHTML = '<p class="error">Error de conexión</p>';
    }
  });

  function renderDashboard(container, data) {
    const NOMBRES = {
      usuarios: 'Suscriptores', continuidad: 'Continuidad', pqr: 'PQR', micromedicion: 'Micromedición',
      caudal: 'Caudal', vertimiento: 'Vertimiento', lodos: 'Lodos', redacueducto: 'Red de Acueducto',
      redalcantarillado: 'Red de Alcantarillado', energia: 'Energía', personal: 'Personal',
      financiero: 'Financiero', eventos_climaticos: 'Eventos Climáticos', poir: 'POIR',
      tarifa_acu: 'Tarifa Acueducto', tarifa_alc: 'Tarifa Alcantarillado', irca: 'IRCA',
      metas_calidad: 'Metas de Calidad', cuestionario: 'Cuestionario'
    };

    const html = `
      <div class="dashboard-container">
        <div class="avance-header">
          <h2>AVANCE</h2>
          <div class="avance-porcentaje">${data.avance ?? 0}%</div>
        </div>
        <div class="avance-info">
          <p>Variables reportadas: <strong>${data.variables_reportadas ?? 0}</strong> de <strong>${data.total_variables ?? 0}</strong></p>
          <p>Vigencia: <strong>${data.vigencia ?? ''}</strong></p>
        </div>
        <div class="variables-grid">
          ${(data.detalle || []).map(item => `
            <div class="variable-card ${item.estado === 'reportado' ? 'reportado' : 'no-reportado'}">
              <div class="variable-nombre">${NOMBRES[item.variable] || item.variable}</div>
              <div class="variable-estado">
                <span class="estado-badge ${item.estado === 'reportado' ? 'badge-success' : 'badge-warning'}">
                  ${item.estado === 'reportado' ? 'Reportado' : 'No Reportado'}
                </span>
              </div>
              <div class="variable-registros">${item.registros} registro${item.registros !== 1 ? 's' : ''}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    container.innerHTML = html;

    // Después de hacer fetch del HTML y hacer container.innerHTML = html;
    if (window.DashboardPanel && typeof window.DashboardPanel.init === 'function') {
      window.DashboardPanel.init();
    }
  }
});

(function () {
  let bound = false;

  async function consultarDashboard() {
    const selVigencia = document.getElementById('vigencia');
    const content = document.getElementById('content-panel');
    if (!selVigencia || !content) return;

    const vigencia = selVigencia.value;
    if (!vigencia) {
      content.innerHTML = '<p class="error">Seleccione una vigencia</p>';
      return;
    }

    content.innerHTML = '<p class="loading">Consultando...</p>';
    try {
      const resp = await fetch(`/api/dashboard/avance?vigencia=${encodeURIComponent(vigencia)}`, { credentials: 'same-origin' });
      if (!resp.ok) {
        content.innerHTML = `<p class="error">Error ${resp.status} al consultar</p>`;
        return;
      }
      const data = await resp.json();
      if (!data.success) {
        content.innerHTML = `<p class="error">${data.message || 'Error al consultar'}</p>`;
        return;
      }
      renderDashboard(content, data);
    } catch (e) {
      console.error('[dashboard] fetch error:', e);
      content.innerHTML = '<p class="error">Error de conexión</p>';
    }
  }

  function renderDashboard(container, data) {
    const N = {
      usuarios: 'Suscriptores', continuidad: 'Continuidad', pqr: 'PQR', micromedicion: 'Micromedición',
      caudal: 'Caudal', vertimiento: 'Vertimiento', lodos: 'Lodos', redacueducto: 'Red de Acueducto',
      redalcantarillado: 'Red de Alcantarillado', energia: 'Energía', personal: 'Personal',
      financiero: 'Financiero', eventos_climaticos: 'Eventos Climáticos', poir: 'POIR',
      tarifa_acu: 'Tarifa Acueducto', tarifa_alc: 'Tarifa Alcantarillado', irca: 'IRCA',
      metas_calidad: 'Metas de Calidad', cuestionario: 'Cuestionario'
    };
    container.innerHTML = `
      <div class="dashboard-container">
        <div class="avance-header">
          <h2>AVANCE</h2>
          <div class="avance-porcentaje">${data.avance ?? 0}%</div>
        </div>
        <div class="avance-info">
          <p>Variables reportadas: <strong>${data.variables_reportadas ?? 0}</strong> de <strong>${data.total_variables ?? 0}</strong></p>
          <p>Vigencia: <strong>${data.vigencia ?? ''}</strong></p>
        </div>
        <div class="variables-grid">
          ${(data.detalle || []).map(item => `
            <div class="variable-card ${item.estado === 'reportado' ? 'reportado' : 'no-reportado'}">
              <div class="variable-nombre">${N[item.variable] || item.variable}</div>
              <div class="variable-estado">
                <span class="estado-badge ${item.estado === 'reportado' ? 'badge-success' : 'badge-warning'}">
                  ${item.estado === 'reportado' ? 'Reportado' : 'No Reportado'}
                </span>
              </div>
              <div class="variable-registros">${item.registros} registro${item.registros !== 1 ? 's' : ''}</div>
            </div>
          `).join('')}
        </div>
      </div>`;
  }

  function bindDelegado() {
    if (bound) return;
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('#btn-consultar-panel');
      if (btn) consultarDashboard();
    });
    bound = true;
  }

  function init() {
    bindDelegado(); // listeners sobreviven aunque se reinyecte el HTML
  }

  window.DashboardPanel = { init };
  // inicializa al cargar el script por si el panel ya está presente
  document.addEventListener('DOMContentLoaded', init);
})();