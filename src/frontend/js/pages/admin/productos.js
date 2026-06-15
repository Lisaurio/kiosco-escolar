const ADMIN_PRODUCTOS = {
  async render(content, title) {
    title.textContent = 'Gestión de Productos';
    content.innerHTML = '<div class="loading"><div class="spinner spinner-lg"></div><span>Cargando...</span></div>';

    try {
      const [productos, kioscos, categorias] = await Promise.all([
        API.getProductos(),
        API.getKioscos(),
        API.getCategorias()
      ]);

      const kioscosMap = {};
      kioscos.forEach(k => kioscosMap[k.id] = k.nombre);

      content.innerHTML = `
        <div class="flex justify-between items-center mb-2">
          <div class="card-subtitle">${productos.length} productos</div>
          <button class="btn btn-primary" id="nuevoProductoBtn">+ Nuevo Producto</button>
        </div>
        <div class="card">
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Categoría</th>
                  <th>Precio</th>
                  <th>Kiosco</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                ${productos.map(p => `
                  <tr>
                    <td><strong>${p.nombre}</strong></td>
                    <td><span class="badge badge-info">${p.categoria}</span></td>
                    <td><strong>$${p.precio.toLocaleString()}</strong></td>
                    <td>${kioscosMap[p.kioscoId] || '—'}</td>
                    <td>${p.activo ? '<span class="badge badge-success">Activo</span>' : '<span class="badge badge-danger">Inactivo</span>'}</td>
                    <td>
                      <button class="btn btn-sm btn-outline editar-producto" data-id="${p.id}">✏️</button>
                      <button class="btn btn-sm ${p.activo ? 'btn-danger' : 'btn-success'} toggle-producto" data-id="${p.id}">${p.activo ? '🗑' : '✔'}</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;

      document.getElementById('nuevoProductoBtn').onclick = () => this.mostrarModal(null, kioscos, categorias);
      document.querySelectorAll('.editar-producto').forEach(btn => {
        btn.onclick = () => this.mostrarModal(btn.dataset.id, kioscos, categorias);
      });
      document.querySelectorAll('.toggle-producto').forEach(btn => {
        btn.onclick = async () => {
          try {
            const p = await API.getProducto(btn.dataset.id);
            await API.actualizarProducto(btn.dataset.id, { activo: !p.activo });
            this.render(content, title);
          } catch (e) { alert('Error: ' + e.message); }
        };
      });
    } catch (e) {
      content.innerHTML = `<div class="alert alert-danger">Error: ${e.message}</div>`;
    }
  },

  async mostrarModal(id = null, kioscos, categorias) {
    let producto = { nombre: '', categoria: '', precio: '', kioscoId: '' };
    if (id) producto = await API.getProducto(id);

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay open';
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-title">${id ? 'Editar' : 'Nuevo'} Producto</div>
        <form id="productoForm">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Nombre</label>
              <input class="form-input" type="text" id="prodNombre" value="${producto.nombre}" required>
            </div>
            <div class="form-group">
              <label class="form-label">Categoría</label>
              <input class="form-input" type="text" id="prodCategoria" value="${producto.categoria}" list="catList" required>
              <datalist id="catList">
                ${categorias.map(c => `<option value="${c}">`).join('')}
              </datalist>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Precio ($)</label>
              <input class="form-input" type="number" id="prodPrecio" value="${producto.precio}" min="1" required>
            </div>
            <div class="form-group">
              <label class="form-label">Kiosco</label>
              <select class="form-select" id="prodKiosco" required>
                <option value="">Seleccionar...</option>
                ${kioscos.map(k => `
                  <option value="${k.id}" ${producto.kioscoId === k.id ? 'selected' : ''}>${k.nombre}</option>
                `).join('')}
              </select>
            </div>
          </div>
          <div id="prodError" class="form-error" style="display:none"></div>
          <div class="modal-actions">
            <button type="button" class="btn btn-outline" id="cancelarProd">Cancelar</button>
            <button type="submit" class="btn btn-primary">${id ? 'Guardar' : 'Crear'}</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelector('#cancelarProd').onclick = () => overlay.remove();
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

    overlay.querySelector('#productoForm').onsubmit = async (e) => {
      e.preventDefault();
      const data = {
        nombre: document.getElementById('prodNombre').value,
        categoria: document.getElementById('prodCategoria').value,
        precio: parseInt(document.getElementById('prodPrecio').value),
        kioscoId: document.getElementById('prodKiosco').value
      };
      try {
        if (id) {
          await API.actualizarProducto(id, data);
        } else {
          await API.crearProducto(data);
        }
        overlay.remove();
        this.render(document.getElementById('pageContent'), document.getElementById('pageTitle'));
      } catch (err) {
        document.getElementById('prodError').textContent = err.message;
        document.getElementById('prodError').style.display = 'block';
      }
    };
  }
};

window.ADMIN_PRODUCTOS = ADMIN_PRODUCTOS;
