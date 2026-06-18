const PADRE_CARGAR = {
  async render(content, title) {
    title.textContent = 'Cargar Saldo';
    content.innerHTML = '<div class="loading"><div class="spinner spinner-lg"></div><span>Cargando...</span></div>';

    try {
      const fresh = await API.me();
      const hijosIds = fresh.user.hijos || [];

      if (!hijosIds.length) {
        content.innerHTML = '<div class="alert alert-warning">No tenés hijos agregados. Contactá al administrador.</div>';
        return;
      }

      let options = '';
      for (const id of hijosIds) {
        const h = await API.getUsuario(id);
        options += `<option value="${h.id}">${h.nombre} — $${(h.saldo || 0).toLocaleString()}</option>`;
      }

      const montos = [500, 1000, 2000, 5000, 10000];

      content.innerHTML = `
        <div class="card" style="max-width:500px">
          <div class="card-title mb-2">Cargar saldo a tu hijo</div>
          <form id="cargarSaldoForm">
            <div class="form-group">
              <label class="form-label">Hijo</label>
              <select class="form-select" id="saldoAlumnoId" required>${options}</select>
            </div>
            <div class="form-group">
              <label class="form-label">Monto a cargar</label>
              <div class="flex gap-1 mb-1" style="flex-wrap:wrap">
                ${montos.map(m => `
                  <button type="button" class="btn btn-outline btn-sm monto-btn" data-monto="${m}">$${m.toLocaleString()}</button>
                `).join('')}
              </div>
              <input class="form-input" type="number" id="saldoMonto" min="1" step="1" placeholder="O ingresá un monto personalizado" required>
            </div>
            <div id="cargarError" class="form-error mb-2" style="display:none"></div>
            <div id="cargarSuccess" class="alert alert-success mb-2" style="display:none"></div>
            <button type="submit" class="btn btn-success btn-lg btn-block" id="cargarBtn">Cargar Saldo</button>
          </form>
        </div>
      `;

      document.querySelectorAll('.monto-btn').forEach(btn => {
        btn.onclick = () => {
          document.getElementById('saldoMonto').value = btn.dataset.monto;
          document.querySelectorAll('.monto-btn').forEach(b => b.classList.remove('btn-primary'));
          btn.classList.add('btn-primary');
        };
      });

      document.getElementById('cargarSaldoForm').onsubmit = async (e) => {
        e.preventDefault();
        const alumnoId = document.getElementById('saldoAlumnoId').value;
        const monto = parseInt(document.getElementById('saldoMonto').value);
        const errorEl = document.getElementById('cargarError');
        const successEl = document.getElementById('cargarSuccess');
        const btn = document.getElementById('cargarBtn');

        if (!monto || monto <= 0) {
          errorEl.textContent = 'Ingresá un monto válido';
          errorEl.style.display = 'block';
          return;
        }

        btn.disabled = true;
        btn.textContent = 'Cargando...';
        errorEl.style.display = 'none';
        successEl.style.display = 'none';

        try {
          await API.cargarSaldo(alumnoId, monto);
          successEl.textContent = '✅ Saldo cargado correctamente';
          successEl.style.display = 'block';
          document.getElementById('saldoMonto').value = '';

          const select = document.getElementById('saldoAlumnoId');
          const h = await API.getUsuario(alumnoId);
          select.options[select.selectedIndex].text = `${h.nombre} — $${(h.saldo || 0).toLocaleString()}`;

          btn.disabled = false;
          btn.textContent = 'Cargar Saldo';
        } catch (err) {
          errorEl.textContent = err.message;
          errorEl.style.display = 'block';
          btn.disabled = false;
          btn.textContent = 'Cargar Saldo';
        }
      };
    } catch (e) {
      content.innerHTML = `<div class="alert alert-danger">Error: ${e.message}</div>`;
    }
  }
};

window.PADRE_CARGAR = PADRE_CARGAR;
