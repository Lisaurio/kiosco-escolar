const KIOSQUERO_DASHBOARD = {
  async render(content, title) {
    title.textContent = 'Kiosco';
    content.innerHTML = '<div class="loading"><div class="spinner spinner-lg"></div><span>Cargando...</span></div>';

    try {
      const dashboard = await API.getDashboard();

      content.innerHTML = `
        <a href="#/kiosquero/escanear" class="btn btn-success btn-block" style="font-size:1.8rem;padding:1.8rem 1rem;border-radius:var(--radius);margin-bottom:1rem;box-shadow:0 4px 20px rgba(16,185,129,0.3);font-weight:800;letter-spacing:-0.02em">
          🛒 NUEVA VENTA
        </a>

        <div class="stats-grid" style="margin-bottom:1rem">
          <div class="stat-card success">
            <span class="stat-icon">💰</span>
            <div class="stat-label">Ventas Hoy</div>
            <div class="stat-value">$${dashboard.ventasHoy.toLocaleString()}</div>
          </div>
          <div class="stat-card primary">
            <span class="stat-icon">📦</span>
            <div class="stat-label">Compras Hoy</div>
            <div class="stat-value">${dashboard.comprasCount || 0}</div>
          </div>
          <div class="stat-card warning">
            <span class="stat-icon">📈</span>
            <div class="stat-label">Ventas del Mes</div>
            <div class="stat-value">$${dashboard.ventasMes.toLocaleString()}</div>
          </div>
          <div class="stat-card">
            <span class="stat-icon">👶</span>
            <div class="stat-label">Alumnos Activos</div>
            <div class="stat-value">${dashboard.alumnosActivos}</div>
          </div>
        </div>

        <div class="grid grid-2">
          <div class="card">
            <div class="card-title mb-1">Productos Más Vendidos</div>
            ${dashboard.masVendidos && dashboard.masVendidos.length ? `
            <div class="table-container">
              <table>
                <thead><tr><th>Producto</th><th>Cantidad</th></tr></thead>
                <tbody>
                  ${dashboard.masVendidos.map((p, i) => `
                    <tr>
                      <td>${i + 1}. ${p.nombre}</td>
                      <td><strong>${p.cantidad}</strong></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            ` : '<div class="empty-state"><p>Sin ventas aún</p></div>'}
          </div>

          <div class="card">
            <div class="card-title mb-1">Accesos Rápidos</div>
            <div class="flex flex-col gap-1">
              <a href="#/kiosquero/buscar" class="btn btn-outline btn-lg btn-block">🔍 Buscar Alumno</a>
              <a href="#/kiosquero/ventas" class="btn btn-outline btn-lg btn-block">📋 Ventas del Día</a>
            </div>
          </div>
        </div>
      `;
    } catch (e) {
      content.innerHTML = `<div class="alert alert-danger">Error: ${e.message}</div>`;
    }
  }
};

window.KIOSQUERO_DASHBOARD = KIOSQUERO_DASHBOARD;
