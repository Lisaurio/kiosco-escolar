const ADMIN_ESCUELAS = {
  async render(content, title) {
    title.textContent = 'Gestión de Escuelas';
    content.innerHTML = '<div class="loading"><div class="spinner spinner-lg"></div><span>Cargando...</span></div>';

    try {
      const escuelas = await API.getEscuelas();

      content.innerHTML = `
        <div class="flex justify-between items-center mb-2">
          <div class="card-subtitle">${escuelas.length} escuelas registradas</div>
          <button class="btn btn-primary" id="nuevaEscuelaBtn">+ Nueva Escuela</button>
        </div>
        <div id="escuelasList">
          ${escuelas.map(e => `
            <div class="card mb-1">
              <div class="flex items-center justify-between">
                <div>
                  <div class="card-title">${e.nombre}</div>
                  <div class="card-subtitle">${e.direccion || 'Sin dirección'}</div>
                </div>
                <div class="flex gap-1">
                  <button class="btn btn-sm btn-outline editar-escuela" data-id="${e.id}">✏️ Editar</button>
                  <button class="btn btn-sm btn-danger eliminar-escuela" data-id="${e.id}">🗑</button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `;

      document.getElementById('nuevaEscuelaBtn').onclick = () => this.mostrarModal();
      document.querySelectorAll('.editar-escuela').forEach(btn => {
        btn.onclick = () => this.mostrarModal(btn.dataset.id);
      });
      document.querySelectorAll('.eliminar-escuela').forEach(btn => {
        btn.onclick = async () => {
          if (confirm('¿Eliminar escuela?')) {
            await API.eliminarEscuela(btn.dataset.id);
            this.render(content, title);
          }
        };
      });
    } catch (e) {
      content.innerHTML = `<div class="alert alert-danger">Error: ${e.message}</div>`;
    }
  },

  async mostrarModal(id = null) {
    let escuela = { nombre: '', direccion: '' };
    if (id) escuela = await API.getEscuela(id);

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay open';
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-title">${id ? 'Editar' : 'Nueva'} Escuela</div>
        <form id="escuelaForm">
          <div class="form-group">
            <label class="form-label">Nombre</label>
            <input class="form-input" type="text" id="escuelaNombre" value="${escuela.nombre}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Dirección</label>
            <input class="form-input" type="text" id="escuelaDireccion" value="${escuela.direccion || ''}">
          </div>
          <div id="escuelaError" class="form-error" style="display:none"></div>
          <div class="modal-actions">
            <button type="button" class="btn btn-outline" id="cancelarEscuela">Cancelar</button>
            <button type="submit" class="btn btn-primary">${id ? 'Guardar' : 'Crear'}</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelector('#cancelarEscuela').onclick = () => overlay.remove();
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

    overlay.querySelector('#escuelaForm').onsubmit = async (e) => {
      e.preventDefault();
      const data = {
        nombre: document.getElementById('escuelaNombre').value,
        direccion: document.getElementById('escuelaDireccion').value
      };
      try {
        if (id) {
          await API.actualizarEscuela(id, data);
        } else {
          await API.crearEscuela(data);
        }
        overlay.remove();
        this.render(document.getElementById('pageContent'), document.getElementById('pageTitle'));
      } catch (err) {
        document.getElementById('escuelaError').textContent = err.message;
        document.getElementById('escuelaError').style.display = 'block';
      }
    };
  }
};

window.ADMIN_ESCUELAS = ADMIN_ESCUELAS;
