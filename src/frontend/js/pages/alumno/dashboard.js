const ALUMNO_DASHBOARD = {
  async render(content, title) {
    title.textContent = 'Mi Cuenta';
    content.innerHTML = '<div class="loading"><div class="spinner spinner-lg"></div><span>Cargando...</span></div>';

    try {
      const fresh = await API.me();
      const user = fresh.user;
      const compras = await API.getHistorial(`?alumnoId=${user.id}`);

      const ultimas = compras.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).slice(0, 5);

      content.innerHTML = `
        <div class="stats-grid">
          <div class="stat-card primary">
            <span class="stat-icon">💰</span>
            <div class="stat-label">Saldo Disponible</div>
            <div class="stat-value">$${(user.saldo || 0).toLocaleString()}</div>
          </div>
          <div class="stat-card success">
            <span class="stat-icon">🛒</span>
            <div class="stat-label">Compras Hoy</div>
            <div class="stat-value">${compras.filter(c => c.fecha && new Date(c.fecha).toDateString() === new Date().toDateString()).length}</div>
          </div>
          <div class="stat-card warning">
            <span class="stat-icon">📦</span>
            <div class="stat-label">Total Compras</div>
            <div class="stat-value">${compras.length}</div>
          </div>
          ${user.limiteDiario ? `
          <div class="stat-card danger">
            <span class="stat-icon">📏</span>
            <div class="stat-label">Límite Diario</div>
            <div class="stat-value">$${user.limiteDiario.toLocaleString()}</div>
          </div>` : ''}
        </div>

        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Últimas Compras</div>
            </div>
            <a href="#/alumno/historial" class="btn btn-sm btn-outline" style="display:none">Ver todo</a>
          </div>
          ${ultimas.length ? `
          <div class="table-container">
            <table>
              <thead><tr><th>Productos</th><th>Total</th><th>Fecha</th></tr></thead>
              <tbody>
                  ${ultimas.map(c => `
                    <tr>
                      <td>${(c.productos || []).map(i => i.nombre).join(', ')}</td>
                      <td><strong>$${c.total.toLocaleString()}</strong></td>
                      <td>${new Date(c.fecha).toLocaleString()}</td>
                    </tr>
                  `).join('')}
              </tbody>
            </table>
          </div>
          ` : '<div class="empty-state"><span class="empty-icon">🛒</span><p>No hiciste compras aún</p></div>'}
        </div>

        ${user.congelado ? '<div class="alert alert-danger mt-2">⚠️ Tu cuenta está congelada. Consultá con tus padres.</div>' : ''}
      `;
    } catch (e) {
      content.innerHTML = `<div class="alert alert-danger">Error: ${e.message}</div>`;
    }
  }
};

window.ALUMNO_DASHBOARD = ALUMNO_DASHBOARD;
