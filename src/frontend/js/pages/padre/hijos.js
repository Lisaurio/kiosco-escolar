const PADRE_HIJOS = {
  async render(content, title) {
    title.textContent = 'Mis Hijos';
    content.innerHTML = '<div class="loading"><div class="spinner spinner-lg"></div><span>Cargando...</span></div>';

    try {
      const fresh = await API.me();
      const hijosIds = fresh.user.hijos || [];
      const escuelas = await API.getEscuelas();
      const escuelasMap = {};
      escuelas.forEach(e => escuelasMap[e.id] = e.nombre);

      let hijosHtml = '';
      if (hijosIds.length) {
        for (const id of hijosIds) {
          const h = await API.getUsuario(id);
          const escuela = escuelasMap[h.escuelaId] || '—';
          hijosHtml += `
            <div class="card">
              <div class="flex items-center justify-between">
                <div>
                  <div class="card-title">${h.nombre}</div>
                  <div class="card-subtitle">Escuela: ${escuela}</div>
                  <div class="card-subtitle">Código: <strong>${h.codigoNumerico || '—'}</strong></div>
                </div>
                <div class="text-right">
                  <div style="font-size:1.5rem;font-weight:800;color:var(--primary)">$${(h.saldo || 0).toLocaleString()}</div>
                  <div class="card-subtitle">Saldo disponible</div>
                  ${h.congelado ? '<span class="badge badge-danger mt-1">CONGELADO</span>' : '<span class="badge badge-success mt-1">ACTIVO</span>'}
                </div>
              </div>
            </div>
          `;
        }
      } else {
        hijosHtml = '<div class="alert alert-info">No agregaste hijos aún. Un administrador debe crear los alumnos y asignarlos a tu cuenta.</div>';
      }

      content.innerHTML = `
        <div class="stats-grid">
          <div class="stat-card primary">
            <span class="stat-icon">👶</span>
            <div class="stat-label">Hijos</div>
            <div class="stat-value">${hijosIds.length}</div>
          </div>
          <div class="stat-card success">
            <span class="stat-icon">💰</span>
            <div class="stat-label">Saldo Total</div>
            <div class="stat-value">$${(await Promise.all(hijosIds.map(id => API.getUsuario(id)))).reduce((s, h) => s + (h.saldo || 0), 0).toLocaleString()}</div>
          </div>
        </div>
        <div class="flex flex-col gap-2" id="hijosList">
          ${hijosHtml}
        </div>
      `;
    } catch (e) {
      content.innerHTML = `<div class="alert alert-danger">Error: ${e.message}</div>`;
    }
  }
};

window.PADRE_HIJOS = PADRE_HIJOS;
