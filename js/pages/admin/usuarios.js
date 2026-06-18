const ADMIN_USUARIOS = {
  async render(content, title) {
    title.textContent = 'Gestión de Usuarios';
    content.innerHTML = '<div class="loading"><div class="spinner spinner-lg"></div><span>Cargando...</span></div>';

    try {
      const [usuarios, escuelas, kioscos] = await Promise.all([
        API.getUsuarios(),
        API.getEscuelas(),
        API.getKioscos()
      ]);

      const rolLabels = { admin: 'Admin', kiosquero: 'Kiosquero', padre: 'Padre/Madre', alumno: 'Alumno' };
      const escuelasMap = {};
      escuelas.forEach(e => escuelasMap[e.id] = e.nombre);
      const kioscosMap = {};
      kioscos.forEach(k => kioscosMap[k.id] = k.nombre);

      const tabs = ['todos', 'alumno', 'padre', 'kiosquero'];

      content.innerHTML = `
        <div class="flex justify-between items-center mb-2">
          <div class="tabs" id="userTabs">
            ${tabs.map(t => `
              <button class="tab ${t === 'todos' ? 'active' : ''}" data-tab="${t}">${t === 'todos' ? 'Todos' : rolLabels[t]}</button>
            `).join('')}
          </div>
          <button class="btn btn-primary" id="nuevoUsuarioBtn">+ Nuevo Usuario</button>
        </div>
        <div class="card">
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Escuela</th>
                  <th>Kiosco</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody id="usuariosBody">
                ${usuarios.map(u => `
                  <tr data-rol="${u.rol}">
                    <td><strong>${u.nombre}</strong></td>
                    <td>${u.email}</td>
                    <td><span class="badge badge-info">${rolLabels[u.rol] || u.rol}</span></td>
                    <td>${escuelasMap[u.escuelaId] || '—'}</td>
                    <td>${kioscosMap[u.kioscoId] || '—'}</td>
                    <td>${u.activo ? '<span class="badge badge-success">Activo</span>' : '<span class="badge badge-danger">Inactivo</span>'} ${u.congelado ? '<span class="badge badge-warning">Congelado</span>' : ''}</td>
                    <td>
                      <button class="btn btn-sm btn-outline editar-usuario" data-id="${u.id}">✏️</button>
                      <button class="btn btn-sm btn-danger eliminar-usuario" data-id="${u.id}">🗑</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;

      document.querySelectorAll('#userTabs .tab').forEach(tab => {
        tab.onclick = () => {
          document.querySelectorAll('#userTabs .tab').forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          const rol = tab.dataset.tab;
          document.querySelectorAll('#usuariosBody tr').forEach(tr => {
            tr.style.display = rol === 'todos' || tr.dataset.rol === rol ? '' : 'none';
          });
        };
      });

      document.getElementById('nuevoUsuarioBtn').onclick = () => this.mostrarModal(null, escuelas, kioscos);
      document.querySelectorAll('.editar-usuario').forEach(btn => {
        btn.onclick = () => this.mostrarModal(btn.dataset.id, escuelas, kioscos);
      });
      document.querySelectorAll('.eliminar-usuario').forEach(btn => {
        btn.onclick = async () => {
          if (confirm('¿Desactivar usuario?')) {
            await API.eliminarUsuario(btn.dataset.id);
            this.render(content, title);
          }
        };
      });
    } catch (e) {
      content.innerHTML = `<div class="alert alert-danger">Error: ${e.message}</div>`;
    }
  },

  async mostrarModal(id = null, escuelas, kioscos) {
    let usuario = { nombre: '', email: '', password: '', rol: 'alumno', telefono: '', escuelaId: '', kioscoId: '' };
    if (id) {
      const u = await API.getUsuario(id);
      usuario = { ...u, password: '' };
    }

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay open';
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-title">${id ? 'Editar' : 'Nuevo'} Usuario</div>
        <form id="usuarioForm">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Nombre</label>
              <input class="form-input" type="text" id="userNombre" value="${usuario.nombre}" required>
            </div>
            <div class="form-group">
              <label class="form-label">Rol</label>
              <select class="form-select" id="userRol" ${id ? 'disabled' : ''}>
                <option value="alumno" ${usuario.rol === 'alumno' ? 'selected' : ''}>Alumno</option>
                <option value="padre" ${usuario.rol === 'padre' ? 'selected' : ''}>Padre/Madre</option>
                <option value="kiosquero" ${usuario.rol === 'kiosquero' ? 'selected' : ''}>Kiosquero</option>
                <option value="admin" ${usuario.rol === 'admin' ? 'selected' : ''}>Admin</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Email</label>
            <input class="form-input" type="email" id="userEmail" value="${usuario.email}" required>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Contraseña ${id ? '(dejar vacío para no cambiar)' : ''}</label>
              <input class="form-input" type="password" id="userPassword" ${id ? '' : 'required'} minlength="6">
            </div>
            <div class="form-group">
              <label class="form-label">Teléfono</label>
              <input class="form-input" type="text" id="userTelefono" value="${usuario.telefono || ''}">
            </div>
          </div>
          <div class="form-row" id="escuelaKioscoRow">
            <div class="form-group">
              <label class="form-label">Escuela</label>
              <select class="form-select" id="userEscuela">
                <option value="">Sin escuela</option>
                ${escuelas.map(e => `
                  <option value="${e.id}" ${usuario.escuelaId === e.id ? 'selected' : ''}>${e.nombre}</option>
                `).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Kiosco</label>
              <select class="form-select" id="userKiosco">
                <option value="">Sin kiosco</option>
                ${kioscos.map(k => `
                  <option value="${k.id}" ${usuario.kioscoId === k.id ? 'selected' : ''}>${k.nombre}</option>
                `).join('')}
              </select>
            </div>
          </div>
          <div id="userError" class="form-error" style="display:none"></div>
          <div class="modal-actions">
            <button type="button" class="btn btn-outline" id="cancelarUser">Cancelar</button>
            <button type="submit" class="btn btn-primary">${id ? 'Guardar' : 'Crear'}</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(overlay);

    const userRol = document.getElementById('userRol');
    const escuelaKioscoRow = document.getElementById('escuelaKioscoRow');
    const toggleEscuelaKiosco = () => {
      const rol = userRol.value;
      escuelaKioscoRow.style.display = (rol === 'alumno' || rol === 'kiosquero') ? 'grid' : 'none';
    };
    toggleEscuelaKiosco();
    userRol.onchange = toggleEscuelaKiosco;

    overlay.querySelector('#cancelarUser').onclick = () => overlay.remove();
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

    overlay.querySelector('#usuarioForm').onsubmit = async (e) => {
      e.preventDefault();
      const data = {
        nombre: document.getElementById('userNombre').value,
        email: document.getElementById('userEmail').value,
        password: document.getElementById('userPassword').value || '123456',
        rol: document.getElementById('userRol').value,
        telefono: document.getElementById('userTelefono').value,
        escuelaId: document.getElementById('userEscuela').value,
        kioscoId: document.getElementById('userKiosco').value
      };

      if (id && !document.getElementById('userPassword').value) {
        delete data.password;
      }

      try {
        if (id) {
          await API.actualizarUsuario(id, data);
        } else {
          await API.crearUsuario(data);
        }
        overlay.remove();
        this.render(document.getElementById('pageContent'), document.getElementById('pageTitle'));
      } catch (err) {
        document.getElementById('userError').textContent = err.message;
        document.getElementById('userError').style.display = 'block';
      }
    };
  }
};

window.ADMIN_USUARIOS = ADMIN_USUARIOS;
