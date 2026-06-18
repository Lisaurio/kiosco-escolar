const PADRE_DASHBOARD = {
  charts: {},

  async render(content, title) {
    title.textContent = 'Dashboard';
    content.innerHTML = '<div class="loading"><div class="spinner spinner-lg"></div><span>Cargando dashboard...</span></div>';

    try {
      const fresh = await API.me();
      const hijos = fresh.user.hijos || [];
      let totalSaldo = 0;
      let totalGastadoHoy = 0;
      let allCompras = [];

      for (const hid of hijos) {
        const alumno = await API.getUsuario(hid);
        totalSaldo += alumno.saldo || 0;

        const compras = await API.getHistorial(`?alumnoId=${hid}`);
        allCompras = allCompras.concat(compras);

        const hoy = new Date().toDateString();
        totalGastadoHoy += compras
          .filter(c => c.fecha && new Date(c.fecha).toDateString() === hoy)
          .reduce((s, c) => s + (c.total || 0), 0);
      }

      const totalCompras = allCompras.length;
      const ultimas = allCompras.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).slice(0, 5);

      content.innerHTML = `
        <div class="stats-grid">
          <div class="stat-card primary">
            <span class="stat-icon">💰</span>
            <div class="stat-label">Saldo Total</div>
            <div class="stat-value">$${totalSaldo.toLocaleString()}</div>
          </div>
          <div class="stat-card success">
            <span class="stat-icon">🛒</span>
            <div class="stat-label">Gastado Hoy</div>
            <div class="stat-value">$${totalGastadoHoy.toLocaleString()}</div>
          </div>
          <div class="stat-card warning">
            <span class="stat-icon">📦</span>
            <div class="stat-label">Compras Totales</div>
            <div class="stat-value">${totalCompras}</div>
          </div>
          <div class="stat-card">
            <span class="stat-icon">👶</span>
            <div class="stat-label">Hijos</div>
            <div class="stat-value">${hijos.length}</div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Últimas Compras</div>
              <div class="card-subtitle">Actividad reciente de tus hijos</div>
            </div>
            <a href="#/padre/historial" class="btn btn-sm btn-outline">Ver más</a>
          </div>
          ${ultimas.length ? `
          <div class="table-container">
            <table>
              <thead>
                <tr><th>Alumno</th><th>Productos</th><th>Total</th><th>Fecha</th></tr>
              </thead>
              <tbody>
                  ${ultimas.map(c => `
                    <tr>
                      <td><strong>${c.alumnoNombre || '—'}</strong></td>
                      <td>${(c.productos || []).map(i => i.nombre).join(', ')}</td>
                      <td><strong>$${c.total.toLocaleString()}</strong></td>
                      <td>${new Date(c.fecha).toLocaleString()}</td>
                    </tr>
                  `).join('')}
              </tbody>
            </table>
          </div>
          ` : '<div class="empty-state"><span class="empty-icon">🛒</span><p>Sin compras aún</p></div>'}
        </div>
      `;
    } catch (e) {
      content.innerHTML = `<div class="alert alert-danger">Error: ${e.message}</div>`;
    }
  }
};

window.PADRE_DASHBOARD = PADRE_DASHBOARD;
