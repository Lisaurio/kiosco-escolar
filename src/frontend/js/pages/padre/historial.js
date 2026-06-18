const PADRE_HISTORIAL = {
  async render(content, title) {
    title.textContent = 'Historial de Compras';
    content.innerHTML = '<div class="loading"><div class="spinner spinner-lg"></div><span>Cargando historial...</span></div>';

    try {
      const fresh = await API.me();
      const hijosIds = fresh.user.hijos || [];
      let allCompras = [];

      const nombresMap = {};
      for (const hid of hijosIds) {
        const compras = await API.getHistorial(`?alumnoId=${hid}`);
        allCompras = allCompras.concat(compras);
        if (!nombresMap[hid]) {
          const h = await API.getUsuario(hid);
          nombresMap[hid] = h.nombre;
        }
      }

      allCompras.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

      content.innerHTML = `
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Todas las Compras</div>
              <div class="card-subtitle">${allCompras.length} compras registradas</div>
            </div>
            <div class="flex gap-1">
              <select class="form-select form-select-sm" id="historialFiltro" style="width:auto">
                <option value="">Todos los hijos</option>
                ${hijosIds.map(id => `<option value="${id}">${nombresMap[id] || id}</option>`).join('')}
              </select>
            </div>
          </div>
          ${allCompras.length ? `
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Alumno</th>
                  <th>Productos</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody id="historialBody">
                ${allCompras.map(c => `
                  <tr data-alumno="${c.alumnoId}">
                    <td>${new Date(c.fecha).toLocaleString()}</td>
                    <td><strong>${c.alumnoNombre || '—'}</strong></td>
                    <td>
                      ${(c.productos || []).map(i => `${i.nombre} x${i.cantidad} ($${(i.precio * i.cantidad).toLocaleString()})`).join('<br>')}
                    </td>
                    <td><strong>$${c.total.toLocaleString()}</strong></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          <div class="mt-2" style="font-size:0.9rem;font-weight:700;text-align:right">
            Total: $${allCompras.reduce((s, c) => s + c.total, 0).toLocaleString()}
          </div>
          ` : '<div class="empty-state"><span class="empty-icon">📜</span><p>No hay compras registradas</p></div>'}
        </div>
      `;

      const filtro = document.getElementById('historialFiltro');
      if (filtro) {
        filtro.onchange = () => {
          const val = filtro.value;
          document.querySelectorAll('#historialBody tr').forEach(tr => {
            tr.style.display = !val || tr.dataset.alumno === val ? '' : 'none';
          });
        };
      }
    } catch (e) {
      content.innerHTML = `<div class="alert alert-danger">Error: ${e.message}</div>`;
    }
  }
};

window.PADRE_HISTORIAL = PADRE_HISTORIAL;
