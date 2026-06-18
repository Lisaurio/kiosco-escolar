const KIOSQUERO_VENTAS = {
  async render(content, title) {
    title.textContent = 'Ventas del Día';
    content.innerHTML = '<div class="loading"><div class="spinner spinner-lg"></div><span>Cargando ventas...</span></div>';

    try {
      const [ventasDia, ranking] = await Promise.all([
        API.getVentasDia(),
        API.getRanking()
      ]);

      content.innerHTML = `
        <div class="stats-grid">
          <div class="stat-card primary">
            <span class="stat-icon">💰</span>
            <div class="stat-label">Total Ventas Hoy</div>
            <div class="stat-value">$${ventasDia.total.toLocaleString()}</div>
          </div>
          <div class="stat-card success">
            <span class="stat-icon">📦</span>
            <div class="stat-label">Cantidad de Ventas</div>
            <div class="stat-value">${ventasDia.cantidad}</div>
          </div>
        </div>

        <div class="grid grid-2">
          <div class="card">
            <div class="card-title mb-1">Ventas del Día</div>
            ${ventasDia.ventas && ventasDia.ventas.length ? `
            <div class="table-container">
              <table>
                <thead>
                  <tr><th>Hora</th><th>Items</th><th>Total</th></tr>
                </thead>
                <tbody>
                  ${ventasDia.ventas.map(v => `
                    <tr>
                      <td>${new Date(v.fecha).toLocaleTimeString()}</td>
                      <td>${v.productos.map(i => i.nombre).join(', ')}</td>
                      <td><strong>$${v.total.toLocaleString()}</strong></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            ` : '<div class="empty-state"><p>Sin ventas hoy</p></div>'}
          </div>

          <div class="card">
            <div class="card-title mb-1">Ranking de Productos</div>
            ${ranking.length ? `
            <div class="table-container">
              <table>
                <thead>
                  <tr><th>#</th><th>Producto</th><th>Cantidad</th><th>Total</th></tr>
                </thead>
                <tbody>
                  ${ranking.slice(0, 10).map((p, i) => `
                    <tr>
                      <td>${i + 1}</td>
                      <td><strong>${p.nombre}</strong></td>
                      <td>${p.cantidad}</td>
                      <td>—</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            ` : '<div class="empty-state"><p>Sin datos de ventas</p></div>'}
          </div>
        </div>
      `;
    } catch (e) {
      content.innerHTML = `<div class="alert alert-danger">Error: ${e.message}</div>`;
    }
  }
};

window.KIOSQUERO_VENTAS = KIOSQUERO_VENTAS;
