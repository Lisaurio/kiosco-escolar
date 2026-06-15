const ADMIN_REPORTES = {
  charts: {},

  async render(content, title) {
    title.textContent = 'Estadísticas';
    content.innerHTML = '<div class="loading"><div class="spinner spinner-lg"></div><span>Cargando estadísticas...</span></div>';

    try {
      const dashboard = await API.getDashboard();
      const estadisticas = await API.getEstadisticas();

      content.innerHTML = `
        <div class="stats-grid">
          <div class="stat-card primary">
            <span class="stat-icon">💰</span>
            <div class="stat-label">Ventas Totales (Período)</div>
            <div class="stat-value">$${estadisticas.totalVentas.toLocaleString()}</div>
          </div>
          <div class="stat-card success">
            <span class="stat-icon">📦</span>
            <div class="stat-label">Total de Compras</div>
            <div class="stat-value">${estadisticas.totalCompras}</div>
          </div>
          <div class="stat-card warning">
            <span class="stat-icon">💳</span>
            <div class="stat-label">Saldo en Circulación</div>
            <div class="stat-value">$${dashboard.totalCargado.toLocaleString()}</div>
          </div>
          <div class="stat-card">
            <span class="stat-icon">👶</span>
            <div class="stat-label">Alumnos Activos</div>
            <div class="stat-value">${dashboard.alumnosActivos}</div>
          </div>
        </div>

        <div class="grid grid-2">
          <div class="card">
            <div class="card-title mb-1">Ventas por Día</div>
            <canvas id="ventasChart" height="200"></canvas>
          </div>

          <div class="card">
            <div class="card-title mb-1">Ventas por Escuela</div>
            <canvas id="escuelasChart" height="200"></canvas>
          </div>
        </div>

        <div class="card mt-2">
          <div class="card-title mb-1">Productos Más Vendidos</div>
          ${dashboard.masVendidos && dashboard.masVendidos.length ? `
          <div class="table-container">
            <table>
              <thead><tr><th>#</th><th>Producto</th><th>Cantidad</th></tr></thead>
              <tbody>
                ${dashboard.masVendidos.map((p, i) => `
                  <tr><td>${i + 1}</td><td><strong>${p.nombre}</strong></td><td>${p.cantidad}</td></tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ` : '<div class="empty-state"><p>Sin datos</p></div>'}
        </div>
      `;

      this.renderCharts(estadisticas);
    } catch (e) {
      content.innerHTML = `<div class="alert alert-danger">Error: ${e.message}</div>`;
    }
  },

  renderCharts(estadisticas) {
    Object.values(this.charts).forEach(c => c.destroy());
    this.charts = {};

    const dias = Object.keys(estadisticas.ventasPorDia);
    const valores = Object.values(estadisticas.ventasPorDia);

    if (dias.length && typeof Chart !== 'undefined') {
      this.charts.ventas = new Chart(document.getElementById('ventasChart'), {
        type: 'bar',
        data: {
          labels: dias.map(d => new Date(d).toLocaleDateString()),
          datasets: [{
            label: 'Ventas ($)',
            data: valores,
            backgroundColor: '#4F46E5',
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, ticks: { callback: v => '$' + v.toLocaleString() } }
          }
        }
      });
    }

    const escuelas = Object.keys(estadisticas.porEscuela);
    const valoresEsc = Object.values(estadisticas.porEscuela);

    if (escuelas.length && typeof Chart !== 'undefined') {
      const colors = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
      this.charts.escuelas = new Chart(document.getElementById('escuelasChart'), {
        type: 'doughnut',
        data: {
          labels: escuelas,
          datasets: [{
            data: valoresEsc,
            backgroundColor: escuelas.map((_, i) => colors[i % colors.length])
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'bottom' }
          }
        }
      });
    }
  }
};

window.ADMIN_REPORTES = ADMIN_REPORTES;
