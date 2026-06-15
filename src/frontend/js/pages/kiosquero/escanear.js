const KIOSQUERO_ESCANEAR = {
  alumnoActual: null,
  productos: [],
  selected: [],
  scanner: null,

  async render(content, title) {
    title.textContent = 'Escanear QR';
    this.alumnoActual = null;
    this.selected = [];

    const stored = localStorage.getItem('scanAlumno');
    if (stored) {
      localStorage.removeItem('scanAlumno');
      const alumno = JSON.parse(stored);
      this.cargarAlumno(alumno);
      return;
    }

    content.innerHTML = `
      <div class="mb-2">
        <div class="tabs" id="scanTabs">
          <button class="tab active" data-tab="qr">📷 Escanear QR</button>
          <button class="tab" data-tab="codigo">🔢 Código Numérico</button>
        </div>
      </div>
      <div id="scanContent">
        <div class="scanner-container" id="scannerContainer"></div>
        <p class="text-center mt-1 text-muted">Escaneá el QR del alumno</p>
      </div>
      <div id="alumnoInfo" style="display:none"></div>
      <div id="productosGrid" style="display:none"></div>
      <div id="ventaResumen" style="display:none"></div>
    `;

    document.querySelectorAll('#scanTabs .tab').forEach(tab => {
      tab.onclick = () => {
        document.querySelectorAll('#scanTabs .tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        if (tab.dataset.tab === 'codigo') {
          this.stopScanner();
          document.getElementById('scanContent').innerHTML = `
            <div class="card" style="max-width:400px;margin:0 auto">
              <div class="form-group">
                <label class="form-label">Código numérico del alumno</label>
                <input class="form-input" type="text" id="codigoInput" placeholder="Ingresá el código de 6 dígitos" maxlength="6" style="font-size:1.5rem;text-align:center;letter-spacing:0.3em;font-family:monospace">
              </div>
              <button class="btn btn-primary btn-lg btn-block" id="buscarPorCodigo">Buscar Alumno</button>
              <div id="codigoError" class="form-error mt-1 text-center" style="display:none"></div>
            </div>
          `;
          document.getElementById('buscarPorCodigo').onclick = () => this.buscarPorCodigo();
          document.getElementById('codigoInput').onkeydown = (e) => {
            if (e.key === 'Enter') this.buscarPorCodigo();
          };
        } else {
          this.startScanner();
        }
      };
    });

    this.startScanner();
  },

  async buscarPorCodigo() {
    const codigo = document.getElementById('codigoInput').value.trim();
    const errorEl = document.getElementById('codigoError');
    if (!codigo) {
      errorEl.textContent = 'Ingresá un código';
      errorEl.style.display = 'block';
      return;
    }

    try {
      const usuarios = await API.getUsuarios('?rol=alumno');
      const alumno = usuarios.find(u => u.codigoNumerico === codigo);
      if (!alumno) {
        errorEl.textContent = 'Alumno no encontrado';
        errorEl.style.display = 'block';
        return;
      }
      errorEl.style.display = 'none';
      this.stopScanner();
      this.cargarAlumno(alumno);
    } catch (e) {
      errorEl.textContent = 'Error: ' + e.message;
      errorEl.style.display = 'block';
    }
  },

  startScanner() {
    document.getElementById('scanContent').innerHTML = `
      <div class="scanner-container" id="scannerContainer"></div>
      <p class="text-center mt-1 text-muted">Escaneá el QR del alumno</p>
    `;

    try {
      this.scanner = new Html5Qrcode('scannerContainer');
      this.scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => this.onScanSuccess(decodedText),
        () => {}
      ).catch(() => {
        document.getElementById('scanContent').innerHTML = '<div class="alert alert-warning">No se pudo acceder a la cámara. Usá el código numérico.</div>';
      });
    } catch (e) {
      document.getElementById('scanContent').innerHTML = '<div class="alert alert-warning">Cámara no disponible. Usá el código numérico.</div>';
    }
  },

  stopScanner() {
    if (this.scanner) {
      try { this.scanner.stop(); } catch {}
      this.scanner = null;
    }
  },

  async onScanSuccess(decodedText) {
    this.stopScanner();
    try {
      const data = JSON.parse(decodedText);
      const alumno = await API.getUsuario(data.id);
      if (!alumno || alumno.rol !== 'alumno') {
        document.getElementById('scanContent').innerHTML = '<div class="alert alert-danger">QR inválido</div>';
        return;
      }
      this.cargarAlumno(alumno);
    } catch {
      document.getElementById('scanContent').innerHTML = '<div class="alert alert-danger">QR inválido</div>';
    }
  },

  async cargarAlumno(alumno) {
    this.alumnoActual = alumno;
    this.selected = [];

    if (alumno.congelado) {
      document.getElementById('alumnoInfo').innerHTML = `
        <div class="alert alert-danger">⚠️ ${alumno.nombre} — Cuenta congelada</div>
      `;
      document.getElementById('alumnoInfo').style.display = 'block';
      document.getElementById('productosGrid').style.display = 'none';
      document.getElementById('ventaResumen').style.display = 'none';
      return;
    }

    document.getElementById('alumnoInfo').innerHTML = `
      <div class="card mb-2">
        <div class="flex items-center justify-between">
          <div>
            <div class="card-title" style="font-size:1.25rem">${alumno.nombre}</div>
            <div class="card-subtitle">Saldo: <strong style="color:var(--success);font-size:1.1rem">$${(alumno.saldo || 0).toLocaleString()}</strong></div>
          </div>
          <button class="btn btn-outline btn-sm" id="cambiarAlumno">✕ Cambiar alumno</button>
        </div>
      </div>
    `;
    document.getElementById('alumnoInfo').style.display = 'block';

    document.getElementById('cambiarAlumno').onclick = () => {
      this.alumnoActual = null;
      this.selected = [];
      document.getElementById('alumnoInfo').style.display = 'none';
      document.getElementById('productosGrid').style.display = 'none';
      document.getElementById('ventaResumen').style.display = 'none';
      this.startScanner();
    };

    try {
      const productos = await API.getProductos(`?kioscoId=${alumno.kioscoId || ''}&activo=true`);
      this.productos = productos;

      document.getElementById('productosGrid').innerHTML = `
        <div class="card">
          <div class="card-header">
            <div class="card-title">Productos</div>
            <span style="font-size:0.85rem;color:var(--text-secondary)" id="selectedCount">0 seleccionados</span>
          </div>
          <div class="kiosk-grid" id="productosList">
            ${productos.map(p => {
              const bloqueado = (alumno.productosBloqueados || []).includes(p.id);
              return bloqueado ? '' : `
                <button class="kiosk-product-btn" data-id="${p.id}" data-precio="${p.precio}" data-nombre="${p.nombre}">
                  <span class="product-name">${p.nombre}</span>
                  <span class="product-price">$${p.precio.toLocaleString()}</span>
                  <span class="product-qty" id="qty_${p.id}">0</span>
                </button>
              `;
            }).filter(Boolean).join('')}
          </div>
        </div>
        <div id="ventaConfirmacion" style="display:none" class="card mt-2">
          <div id="ventaResumenItems"></div>
          <div class="flex gap-1 mt-2">
            <button class="btn btn-success btn-lg btn-block" id="confirmarVenta">✅ Confirmar Venta</button>
            <button class="btn btn-outline btn-lg" id="cancelarVenta">✕ Cancelar</button>
          </div>
        </div>
      `;
      document.getElementById('productosGrid').style.display = 'block';

      document.querySelectorAll('.kiosk-product-btn').forEach(btn => {
        btn.onclick = () => {
          const id = btn.dataset.id;
          const idx = this.selected.findIndex(s => s.productoId === id);
          if (idx >= 0) {
            this.selected.splice(idx, 1);
            btn.classList.remove('selected');
          } else {
            this.selected.push({
              productoId: id,
              nombre: btn.dataset.nombre,
              precio: parseInt(btn.dataset.precio),
              cantidad: 1
            });
            btn.classList.add('selected');
          }
          this.actualizarResumen();
        };
      });

    } catch (e) {
      document.getElementById('productosGrid').innerHTML = `<div class="alert alert-danger">Error: ${e.message}</div>`;
      document.getElementById('productosGrid').style.display = 'block';
    }
  },

  actualizarResumen() {
    document.getElementById('selectedCount').textContent = `${this.selected.length} seleccionados`;

    this.selected.forEach(s => {
      const el = document.getElementById(`qty_${s.productoId}`);
      if (el) el.textContent = '1';
    });

    if (this.selected.length === 0) {
      document.getElementById('ventaConfirmacion').style.display = 'none';
      return;
    }

    const total = this.selected.reduce((sum, s) => sum + s.precio, 0);
    document.getElementById('ventaResumenItems').innerHTML = `
      <div class="card-title mb-1">Resumen de Venta</div>
      ${this.selected.map(s => `
        <div class="flex items-center justify-between" style="padding:0.5rem 0;border-bottom:1px solid var(--border)">
          <span>${s.nombre}</span>
          <span><strong>$${s.precio.toLocaleString()}</strong></span>
        </div>
      `).join('')}
      <div class="flex items-center justify-between" style="padding:0.75rem 0;font-size:1.2rem">
        <span><strong>Total</strong></span>
        <span><strong style="color:var(--primary)">$${total.toLocaleString()}</strong></span>
      </div>
    `;
    document.getElementById('ventaConfirmacion').style.display = 'block';

    document.getElementById('confirmarVenta').onclick = () => this.confirmarVenta();
    document.getElementById('cancelarVenta').onclick = () => {
      this.selected = [];
      document.querySelectorAll('.kiosk-product-btn').forEach(b => b.classList.remove('selected'));
      document.getElementById('ventaConfirmacion').style.display = 'none';
      document.getElementById('selectedCount').textContent = '0 seleccionados';
    };
  },

  async confirmarVenta() {
    const btn = document.getElementById('confirmarVenta');
    btn.disabled = true;
    btn.textContent = 'Procesando...';

    try {
      const data = await API.registrarCompra({
        alumnoId: this.alumnoActual.id,
        productos: this.selected
      });

      document.getElementById('ventaConfirmacion').innerHTML = `
        <div class="alert alert-success">✅ Venta registrada</div>
        <div style="font-size:1.1rem"><strong>Total:</strong> $${data.compra.total.toLocaleString()}</div>
        <div style="font-size:1.1rem"><strong>Saldo restante:</strong> $${data.saldoRestante.toLocaleString()}</div>
        <button class="btn btn-primary btn-lg btn-block mt-2" id="nuevaVentaBtn">🔄 Nueva Venta</button>
      `;

      document.getElementById('nuevaVentaBtn').onclick = () => {
        this.alumnoActual = null;
        this.selected = [];
        this.render(document.getElementById('pageContent'), document.getElementById('pageTitle'));
      };
    } catch (e) {
      document.getElementById('ventaConfirmacion').innerHTML += `
        <div class="alert alert-danger mt-1">Error: ${e.message}</div>
      `;
      btn.disabled = false;
      btn.textContent = '✅ Confirmar Venta';
    }
  }
};

window.KIOSQUERO_ESCANEAR = KIOSQUERO_ESCANEAR;
