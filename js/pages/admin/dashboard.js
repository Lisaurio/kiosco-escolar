const ADMIN_DASHBOARD = {
  async render(content, title) {
    title.textContent = 'Panel de Administración';
    content.innerHTML = '<div class="loading"><div class="spinner spinner-lg"></div><span>Cargando dashboard...</span></div>';

    try {
      const [dashboard, escuelas, kioscos, usuarios] = await Promise.all([
        API.getDashboard(),
        API.getEscuelas(),
        API.getKioscos(),
        API.getUsuarios()
      ]);

      const stats = {
        escuelas: escuelas.length,
        kioscos: kioscos.length,
        padres: usuarios.filter(u => u.rol === 'padre').length,
        alumnos: usuarios.filter(u => u.rol === 'alumno' && u.activo).length,
        kiosqueros: usuarios.filter(u => u.rol === 'kiosquero').length
      };

      content.innerHTML = `
        <div class="stats-grid">
          <div class="stat-card primary">
            <span class="stat-icon">💰</span>
            <div class="stat-label">Ventas Hoy</div>
            <div class="stat-value">$${(dashboard.ventasHoy || 0).toLocaleString()}</div>
          </div>
          <div class="stat-card success">
            <span class="stat-icon">📈</span>
            <div class="stat-label">Ventas del Mes</div>
            <div class="stat-value">$${(dashboard.ventasMes || 0).toLocaleString()}</div>
          </div>
          <div class="stat-card warning">
            <span class="stat-icon">💳</span>
            <div class="stat-label">Saldo Total Cargado</div>
            <div class="stat-value">$${(dashboard.totalCargado || 0).toLocaleString()}</div>
          </div>
          <div class="stat-card">
            <span class="stat-icon">👶</span>
            <div class="stat-label">Alumnos Activos</div>
            <div class="stat-value">${dashboard.alumnosActivos}</div>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-icon">🏫</span>
            <div class="stat-label">Escuelas</div>
            <div class="stat-value">${stats.escuelas}</div>
          </div>
          <div class="stat-card">
            <span class="stat-icon">🏪</span>
            <div class="stat-label">Kioscos</div>
            <div class="stat-value">${stats.kioscos}</div>
          </div>
          <div class="stat-card">
            <span class="stat-icon">👨‍👩‍👧</span>
            <div class="stat-label">Padres</div>
            <div class="stat-value">${stats.padres}</div>
          </div>
          <div class="stat-card">
            <span class="stat-icon">👨‍💼</span>
            <div class="stat-label">Kiosqueros</div>
            <div class="stat-value">${stats.kiosqueros}</div>
          </div>
        </div>

        <div class="grid grid-2">
          <div class="card">
            <div class="card-title mb-1">Productos Más Vendidos</div>
            ${dashboard.masVendidos && dashboard.masVendidos.length ? `
            <div class="table-container">
              <table>
                <thead><tr><th>#</th><th>Producto</th><th>Cantidad</th></tr></thead>
                <tbody>
                  ${dashboard.masVendidos.map((p, i) => `
                    <tr><td>${i + 1}</td><td>${p.nombre}</td><td><strong>${p.cantidad}</strong></td></tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            ` : '<div class="empty-state"><p>Sin ventas aún</p></div>'}
          </div>

          <div class="card">
            <div class="card-title mb-1">Acceso Rápido</div>
            <div class="flex flex-col gap-1">
              <a href="#/admin/escuelas" class="btn btn-outline btn-lg btn-block">🏫 Gestionar Escuelas</a>
              <a href="#/admin/kioscos" class="btn btn-outline btn-lg btn-block">🏪 Gestionar Kioscos</a>
              <a href="#/admin/usuarios" class="btn btn-outline btn-lg btn-block">👥 Gestionar Usuarios</a>
              <a href="#/admin/productos" class="btn btn-outline btn-lg btn-block">🍬 Gestionar Productos</a>
              <a href="#/admin/reportes" class="btn btn-outline btn-lg btn-block">📈 Estadísticas</a>
            </div>
          </div>
        </div>
      `;
    } catch (e) {
      content.innerHTML = `<div class="alert alert-danger">Error: ${e.message}</div>`;
    }
  }
};

window.ADMIN_DASHBOARD = ADMIN_DASHBOARD;
