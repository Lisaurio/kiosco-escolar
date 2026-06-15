const ADMIN_KIOSCOS = {
  async render(content, title) {
    title.textContent = 'Gestión de Kioscos';
    content.innerHTML = '<div class="loading"><div class="spinner spinner-lg"></div><span>Cargando...</span></div>';

    try {
      const [kioscos, escuelas] = await Promise.all([
        API.getKioscos(),
        API.getEscuelas()
      ]);

      const escuelasMap = {};
      escuelas.forEach(e => escuelasMap[e.id] = e.nombre);

      content.innerHTML = `
        <div class="flex justify-between items-center mb-2">
          <div class="card-subtitle">${kioscos.length} kioscos registrados</div>
          <button class="btn btn-primary" id="nuevoKioscoBtn">+ Nuevo Kiosco</button>
        </div>
        <div id="kioscosList">
          ${kioscos.map(k => `
            <div class="card mb-1">
              <div class="flex items-center justify-between">
                <div>
                  <div class="card-title">${k.nombre}</div>
                  <div class="card-subtitle">${escuelasMap[k.escuelaId] || '—'}</div>
                </div>
                <div class="flex gap-1">
                  <button class="btn btn-sm btn-outline editar-kiosco" data-id="${k.id}">✏️</button>
                  <button class="btn btn-sm btn-danger eliminar-kiosco" data-id="${k.id}">🗑</button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `;

      document.getElementById('nuevoKioscoBtn').onclick = () => this.mostrarModal(null, escuelas);
      document.querySelectorAll('.editar-kiosco').forEach(btn => {
        btn.onclick = () => this.mostrarModal(btn.dataset.id, escuelas);
      });
      document.querySelectorAll('.eliminar-kiosco').forEach(btn => {
        btn.onclick = async () => {
          if (confirm('¿Eliminar kiosco?')) {
            await API.eliminarKiosco(btn.dataset.id);
            this.render(content, title);
          }
        };
      });
    } catch (e) {
      content.innerHTML = `<div class="alert alert-danger">Error: ${e.message}</div>`;
    }
  },

  async mostrarModal(id = null, escuelas) {
    let kiosco = { nombre: '', escuelaId: '' };
    if (id) kiosco = await API.getKiosco(id);

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay open';
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-title">${id ? 'Editar' : 'Nuevo'} Kiosco</div>
        <form id="kioscoForm">
          <div class="form-group">
            <label class="form-label">Nombre</label>
            <input class="form-input" type="text" id="kioscoNombre" value="${kiosco.nombre}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Escuela</label>
            <select class="form-select" id="kioscoEscuela" required>
              <option value="">Seleccionar...</option>
              ${escuelas.map(e => `
                <option value="${e.id}" ${kiosco.escuelaId === e.id ? 'selected' : ''}>${e.nombre}</option>
              `).join('')}
            </select>
          </div>
          <div id="kioscoError" class="form-error" style="display:none"></div>
          <div class="modal-actions">
            <button type="button" class="btn btn-outline" id="cancelarKiosco">Cancelar</button>
            <button type="submit" class="btn btn-primary">${id ? 'Guardar' : 'Crear'}</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelector('#cancelarKiosco').onclick = () => overlay.remove();
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

    overlay.querySelector('#kioscoForm').onsubmit = async (e) => {
      e.preventDefault();
      const data = {
        nombre: document.getElementById('kioscoNombre').value,
        escuelaId: document.getElementById('kioscoEscuela').value
      };
      try {
        if (id) {
          await API.actualizarKiosco(id, data);
        } else {
          await API.crearKiosco(data);
        }
        overlay.remove();
        this.render(document.getElementById('pageContent'), document.getElementById('pageTitle'));
      } catch (err) {
        document.getElementById('kioscoError').textContent = err.message;
        document.getElementById('kioscoError').style.display = 'block';
      }
    };
  }
};

window.ADMIN_KIOSCOS = ADMIN_KIOSCOS;
