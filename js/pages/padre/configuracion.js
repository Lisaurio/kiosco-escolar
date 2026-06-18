const PADRE_CONFIG = {
  async render(content, title) {
    title.textContent = 'Configuración';
    content.innerHTML = '<div class="loading"><div class="spinner spinner-lg"></div><span>Cargando...</span></div>';

    try {
      const fresh = await API.me();
      const hijosIds = fresh.user.hijos || [];

      let hijosHtml = '';
      for (const id of hijosIds) {
        const h = await API.getUsuario(id);
        const productos = await API.getProductos(`?kioscoId=${h.kioscoId || ''}`);
        const bloqueados = h.productosBloqueados || [];

        hijosHtml += `
          <div class="card mb-2" data-alumno-id="${h.id}">
            <div class="card-header">
              <div>
                <div class="card-title">${h.nombre}</div>
                <div class="card-subtitle">Saldo: $${(h.saldo || 0).toLocaleString()}</div>
              </div>
              <button class="btn ${h.congelado ? 'btn-success' : 'btn-danger'} btn-sm toggle-freeze-btn">
                ${h.congelado ? '✔ Activar' : '❄ Congelar'}
              </button>
            </div>
            <div class="form-group">
              <label class="form-label">Límite diario de gasto</label>
              <div class="flex gap-1">
                <input class="form-input" type="number" id="limite_${h.id}" value="${h.limiteDiario || ''}" placeholder="Sin límite" style="max-width:200px">
                <button class="btn btn-primary btn-sm save-limit-btn" data-id="${h.id}">Guardar</button>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Productos bloqueados</label>
              <div class="flex gap-1" style="flex-wrap:wrap">
                ${productos.filter(p => p.activo).map(p => `
                  <button class="btn ${bloqueados.includes(p.id) ? 'btn-danger' : 'btn-outline'} btn-sm toggle-block-btn" data-prod-id="${p.id}" data-alumno-id="${h.id}">
                    ${bloqueados.includes(p.id) ? '🚫 ' : ''}${p.nombre}
                  </button>
                `).join('')}
              </div>
            </div>
          </div>
        `;
      }

      content.innerHTML = `
        <div class="card mb-2">
          <div class="card-title mb-1">Control Parental</div>
          <div class="card-subtitle mb-2">Configurá límites y bloqueos para cada hijo</div>
          ${hijosIds.length ? hijosHtml : '<div class="alert alert-info">No tenés hijos agregados aún.</div>'}
        </div>
      `;

      document.querySelectorAll('.save-limit-btn').forEach(btn => {
        btn.onclick = async () => {
          const id = btn.dataset.id;
          const limite = parseInt(document.getElementById(`limite_${id}`).value) || null;
          try {
            await API.actualizarUsuario(id, { limiteDiario: limite });
            btn.textContent = '✓ Guardado';
            setTimeout(() => { btn.textContent = 'Guardar'; }, 2000);
          } catch (e) {
            alert('Error: ' + e.message);
          }
        };
      });

      document.querySelectorAll('.toggle-block-btn').forEach(btn => {
        btn.onclick = async () => {
          const prodId = btn.dataset.prodId;
          const alumnoId = btn.dataset.alumnoId;
          try {
            const h = await API.getUsuario(alumnoId);
            const bloqueados = h.productosBloqueados || [];
            let nuevos;
            if (bloqueados.includes(prodId)) {
              nuevos = bloqueados.filter(b => b !== prodId);
            } else {
              nuevos = [...bloqueados, prodId];
            }
            await API.actualizarUsuario(alumnoId, { productosBloqueados: nuevos });
            btn.classList.toggle('btn-danger');
            btn.classList.toggle('btn-outline');
            if (nuevos.includes(prodId)) {
              btn.textContent = '🚫 ' + btn.textContent.replace('🚫 ', '');
            } else {
              btn.textContent = btn.textContent.replace('🚫 ', '');
            }
          } catch (e) {
            alert('Error: ' + e.message);
          }
        };
      });

      document.querySelectorAll('.toggle-freeze-btn').forEach(btn => {
        btn.onclick = async () => {
          const card = btn.closest('[data-alumno-id]');
          const id = card.dataset.alumnoId;
          try {
            const h = await API.getUsuario(id);
            const congelado = !h.congelado;
            await API.actualizarUsuario(id, { congelado });
            btn.textContent = congelado ? '✔ Activar' : '❄ Congelar';
            btn.className = `btn ${congelado ? 'btn-success' : 'btn-danger'} btn-sm toggle-freeze-btn`;
          } catch (e) {
            alert('Error: ' + e.message);
          }
        };
      });
    } catch (e) {
      content.innerHTML = `<div class="alert alert-danger">Error: ${e.message}</div>`;
    }
  }
};

window.PADRE_CONFIG = PADRE_CONFIG;
