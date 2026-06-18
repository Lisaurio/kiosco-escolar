const KIOSQUERO_BUSCAR = {
  async render(content, title) {
    title.textContent = 'Buscar Alumno';
    content.innerHTML = `
      <div class="card" style="max-width:500px">
        <div class="form-group">
          <label class="form-label">Buscar por nombre</label>
          <input class="form-input" type="text" id="buscarInput" placeholder="Ingresá el nombre del alumno..." style="font-size:1.1rem">
        </div>
        <div id="buscarResultados"></div>
      </div>
    `;

    let timeout;
    document.getElementById('buscarInput').oninput = (e) => {
      clearTimeout(timeout);
      const q = e.target.value.trim();
      if (q.length < 2) {
        document.getElementById('buscarResultados').innerHTML = '';
        return;
      }
      timeout = setTimeout(() => this.buscar(q), 300);
    };
  },

  async buscar(query) {
    const resultados = document.getElementById('buscarResultados');
    resultados.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    try {
      const usuarios = await API.getUsuarios('?rol=alumno');
      const filtrados = usuarios.filter(u =>
        u.nombre.toLowerCase().includes(query.toLowerCase()) && u.activo
      );

      if (!filtrados.length) {
        resultados.innerHTML = '<div class="empty-state"><span class="empty-icon">🔍</span><p>No se encontraron alumnos</p></div>';
        return;
      }

      resultados.innerHTML = `
        <div class="card-subtitle mb-1">${filtrados.length} resultado(s)</div>
        ${filtrados.map(a => `
          <div class="card mb-1 alumno-card" data-id="${a.id}" style="cursor:pointer">
            <div class="flex items-center justify-between">
              <div>
                <div class="card-title">${a.nombre}</div>
                <div class="card-subtitle">Código: ${a.codigoNumerico || '—'}</div>
              </div>
              <div class="text-right">
                <div style="font-size:1.25rem;font-weight:800;color:${a.congelado ? 'var(--danger)' : 'var(--success)'}">
                  $${(a.saldo || 0).toLocaleString()}
                </div>
                <div class="card-subtitle">${a.congelado ? '❄ Congelado' : 'Activo'}</div>
              </div>
            </div>
          </div>
        `).join('')}
      `;

      document.querySelectorAll('.alumno-card').forEach(card => {
        card.onclick = async () => {
          const alumnoId = card.dataset.id;
          try {
            const alumno = await API.getUsuario(alumnoId);
            localStorage.setItem('scanAlumno', JSON.stringify(alumno));
            window.location.hash = '#/kiosquero/escanear';
          } catch (e) {
            alert('Error al cargar alumno');
          }
        };
      });
    } catch (e) {
      resultados.innerHTML = `<div class="alert alert-danger">Error: ${e.message}</div>`;
    }
  }
};

window.KIOSQUERO_BUSCAR = KIOSQUERO_BUSCAR;
