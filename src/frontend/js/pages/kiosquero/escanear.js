const KIOSQUERO_ESCANEAR = {
  alumnoActual: null,
  productos: [],
  carrito: [],
  scanner: null,

  async render(content, title) {
    title.textContent = 'Nueva Venta';
    this.alumnoActual = null;
    this.carrito = [];
    this.productos = [];

    const stored = localStorage.getItem('scanAlumno');
    if (stored) {
      localStorage.removeItem('scanAlumno');
      const alumno = JSON.parse(stored);
      this.mostrarSeleccionProductos(alumno);
      return;
    }

    content.innerHTML = `
      <div class="card text-center" style="max-width:500px;margin:0 auto">
        <div style="font-size:2rem;margin-bottom:0.5rem">📷</div>
        <div class="card-title mb-2">Identificar Alumno</div>

        <div class="tabs" id="scanTabs" style="justify-content:center">
          <button class="tab active" data-tab="qr">📷 Escanear QR</button>
          <button class="tab" data-tab="codigo">🔢 Código</button>
        </div>

        <div id="scanContent">
          <div class="scanner-container" id="scannerContainer" style="max-width:280px;margin:0.5rem auto"></div>
          <p class="text-muted" style="font-size:0.85rem">Escaneá el QR del alumno</p>
        </div>

        <div id="codigoError" class="form-error text-center" style="display:none"></div>
        <a href="#/kiosquero/buscar" class="btn btn-outline btn-lg mt-2">🔍 Buscar por nombre</a>
      </div>
    `;

    document.querySelectorAll('#scanTabs .tab').forEach(tab => {
      tab.onclick = () => {
        document.querySelectorAll('#scanTabs .tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        if (tab.dataset.tab === 'codigo') {
          this.stopScanner();
          document.getElementById('scanContent').innerHTML = `
            <div class="form-group" style="max-width:280px;margin:0.5rem auto">
              <input class="form-input" type="text" id="codigoInput" placeholder="Código de 6 dígitos" maxlength="6" style="font-size:1.5rem;text-align:center;letter-spacing:0.3em;font-family:monospace">
              <button class="btn btn-primary btn-lg btn-block mt-1" id="buscarPorCodigo">Buscar</button>
            </div>
          `;
          document.getElementById('buscarPorCodigo').onclick = () => this.buscarPorCodigo();
          document.getElementById('codigoInput').onkeydown = (e) => { if (e.key === 'Enter') this.buscarPorCodigo(); };
          document.getElementById('codigoInput').focus();
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
    if (!codigo) { errorEl.textContent = 'Ingresá un código'; errorEl.style.display = 'block'; return; }
    try {
      const usuarios = await API.getUsuarios('?rol=alumno');
      const alumno = usuarios.find(u => u.codigoNumerico === codigo);
      if (!alumno) { errorEl.textContent = 'Alumno no encontrado'; errorEl.style.display = 'block'; return; }
      errorEl.style.display = 'none';
      this.stopScanner();
      this.mostrarSeleccionProductos(alumno);
    } catch (e) {
      errorEl.textContent = 'Error: ' + e.message;
      errorEl.style.display = 'block';
    }
  },

  startScanner() {
    document.getElementById('scanContent').innerHTML = `
      <div class="scanner-container" id="scannerContainer" style="max-width:280px;margin:0.5rem auto"></div>
      <p class="text-muted" style="font-size:0.85rem">Escaneá el QR del alumno</p>
    `;
    try {
      this.scanner = new Html5Qrcode('scannerContainer');
      this.scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 200, height: 200 } },
        (text) => this.onScanSuccess(text),
        () => {}
      ).catch(() => {
        document.getElementById('scanContent').innerHTML = '<div class="alert alert-warning">Cámara no disponible. Usá el código numérico.</div>';
      });
    } catch {
      document.getElementById('scanContent').innerHTML = '<div class="alert alert-warning">Cámara no disponible. Usá el código numérico.</div>';
    }
  },

  stopScanner() {
    if (this.scanner) { try { this.scanner.stop(); } catch {} this.scanner = null; }
  },

  async onScanSuccess(text) {
    this.stopScanner();
    try {
      const data = JSON.parse(text);
      const alumno = await API.getUsuario(data.id);
      if (!alumno || alumno.rol !== 'alumno') {
        document.getElementById('scanContent').innerHTML = '<div class="alert alert-danger">QR inválido</div>';
        return;
      }
      this.mostrarSeleccionProductos(alumno);
    } catch {
      document.getElementById('scanContent').innerHTML = '<div class="alert alert-danger">QR inválido</div>';
    }
  },

  async mostrarSeleccionProductos(alumno) {
    this.alumnoActual = alumno;
    this.carrito = [];
    const content = document.getElementById('pageContent');

    if (alumno.congelado) {
      content.innerHTML = `
        <div class="alert alert-danger" style="font-size:1.2rem;text-align:center;padding:2rem">
          ⚠️ ${alumno.nombre} — Cuenta congelada
        </div>
        <button class="btn btn-primary btn-lg btn-block" onclick="KIOSQUERO_ESCANEAR.render(document.getElementById('pageContent'), document.getElementById('pageTitle'))">
          🔄 Nueva Venta
        </button>
      `;
      return;
    }

    content.innerHTML = `
      <div id="ventaHeader">
        <div class="card mb-1" style="background:var(--primary);color:white;border:none">
          <div class="flex items-center justify-between">
            <div>
              <div style="font-size:1.3rem;font-weight:700">${alumno.nombre}</div>
              <div style="font-size:0.9rem;opacity:0.9">Saldo: <strong>$${(alumno.saldo || 0).toLocaleString()}</strong></div>
            </div>
            <button class="btn" style="background:rgba(255,255,255,0.2);color:white;border:none" onclick="KIOSQUERO_ESCANEAR.render(document.getElementById('pageContent'), document.getElementById('pageTitle'))">
              ✕ Cambiar
            </button>
          </div>
        </div>
      </div>

      <div class="card mb-1">
        <input class="form-input" type="text" id="filtroProductos" placeholder="🔍 Buscar producto..." style="font-size:1.05rem;border:none;padding:0.5rem 0" autofocus>
      </div>

      <div id="categoriasTabs" class="tabs" style="margin-bottom:0.5rem;gap:0.25rem;overflow-x:auto;flex-wrap:nowrap">
        <button class="tab active" data-cat="todas">Todas</button>
      </div>

      <div class="kiosk-grid" id="productosList"></div>

      <div id="cartBar" style="display:none;position:sticky;bottom:0;background:var(--bg-card);border:2px solid var(--primary);border-radius:var(--radius) var(--radius) 0 0;padding:1rem;margin-top:1rem;box-shadow:0 -4px 12px rgba(0,0,0,0.15);z-index:10">
        <div class="flex items-center justify-between mb-1">
          <span class="card-title" id="cartCount">0 productos</span>
          <span style="font-size:1.5rem;font-weight:800;color:var(--primary)" id="cartTotal">$0</span>
        </div>
        <div id="cartItems" style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:0.5rem"></div>
        <div class="flex gap-1">
          <button class="btn btn-success btn-lg" id="btnConfirmar" style="flex:2;font-size:1.2rem">✅ Confirmar</button>
          <button class="btn btn-outline btn-lg" id="btnCancelar" style="flex:1">✕</button>
        </div>
      </div>
    `;

    try {
      const productos = await API.getProductos(`?kioscoId=${alumno.kioscoId || ''}&activo=true`);
      this.productos = productos;

      const cats = [...new Set(productos.map(p => p.categoria))];
      const tabsEl = document.getElementById('categoriasTabs');
      cats.forEach(c => {
        const btn = document.createElement('button');
        btn.className = 'tab';
        btn.dataset.cat = c;
        btn.textContent = c;
        btn.onclick = () => {
          tabsEl.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
          btn.classList.add('active');
          this.renderProductos(btn.dataset.cat);
        };
        tabsEl.appendChild(btn);
      });

      this.renderProductos('todas');

      document.getElementById('filtroProductos').oninput = () => {
        const activeCat = document.querySelector('#categoriasTabs .tab.active');
        this.renderProductos(activeCat ? activeCat.dataset.cat : 'todas');
      };

      document.getElementById('btnConfirmar').onclick = () => this.confirmarVenta();
      document.getElementById('btnCancelar').onclick = () => { this.carrito = []; this.actualizarCartBar(); };

    } catch (e) {
      document.getElementById('productosList').innerHTML = `<div class="alert alert-danger">Error: ${e.message}</div>`;
    }
  },

  renderProductos(categoria) {
    const filtro = (document.getElementById('filtroProductos').value || '').toLowerCase();
    const bloqueados = this.alumnoActual.productosBloqueados || [];

    const filtrados = this.productos.filter(p => {
      if (bloqueados.includes(p.id)) return false;
      if (categoria !== 'todas' && p.categoria !== categoria) return false;
      if (filtro && !p.nombre.toLowerCase().includes(filtro)) return false;
      return true;
    });

    const list = document.getElementById('productosList');
    list.innerHTML = filtrados.map(p => {
      const enCarrito = this.carrito.find(c => c.productoId === p.id);
      const qty = enCarrito ? enCarrito.cantidad : 0;
      return `
        <button class="kiosk-product-btn ${qty > 0 ? 'selected' : ''}" data-id="${p.id}">
          <span class="product-name">${p.nombre}</span>
          <span class="product-price">$${p.precio.toLocaleString()}</span>
          <span class="product-qty" id="qty_${p.id}">${qty > 0 ? qty : ''}</span>
        </button>
      `;
    }).join('');

    if (!filtrados.length) {
      list.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><p>Sin productos</p></div>';
    }

    list.querySelectorAll('.kiosk-product-btn').forEach(btn => {
      btn.onclick = () => this.agregarAlCarrito(btn.dataset.id);
    });
  },

  agregarAlCarrito(productoId) {
    const existe = this.carrito.find(c => c.productoId === productoId);
    const producto = this.productos.find(p => p.id === productoId);
    if (!producto) return;

    if (existe) {
      existe.cantidad++;
    } else {
      this.carrito.push({
        productoId: producto.id,
        nombre: producto.nombre,
        precio: producto.precio,
        cantidad: 1
      });
    }

    const qtyEl = document.getElementById(`qty_${productoId}`);
    if (qtyEl) {
      const item = this.carrito.find(c => c.productoId === productoId);
      qtyEl.textContent = item.cantidad;
      qtyEl.closest('.kiosk-product-btn').classList.add('selected');
    }

    this.actualizarCartBar();
  },

  actualizarCartBar() {
    const bar = document.getElementById('cartBar');
    const count = document.getElementById('cartCount');
    const total = document.getElementById('cartTotal');
    const items = document.getElementById('cartItems');

    if (this.carrito.length === 0) {
      bar.style.display = 'none';
      return;
    }

    bar.style.display = 'block';
    const totalSum = this.carrito.reduce((s, i) => s + i.precio * i.cantidad, 0);
    const totalItems = this.carrito.reduce((s, i) => s + i.cantidad, 0);

    count.textContent = `${totalItems} producto${totalItems !== 1 ? 's' : ''}`;
    total.textContent = `$${totalSum.toLocaleString()}`;
    items.innerHTML = this.carrito.map(i =>
      `<span>${i.nombre} x${i.cantidad} <strong>$${(i.precio * i.cantidad).toLocaleString()}</strong></span>`
    ).join(' • ');

    this.actualizarCategorias();
    this.renderProductos(document.querySelector('#categoriasTabs .tab.active').dataset.cat);
  },

  actualizarCategorias() {
    this.productos.forEach(p => {
      const qty = this.carrito.find(c => c.productoId === p.id);
      const el = document.getElementById(`qty_${p.id}`);
      if (el) {
        el.textContent = qty ? qty.cantidad : '';
        el.closest('.kiosk-product-btn').classList.toggle('selected', !!qty);
      }
    });
  },

  async confirmarVenta() {
    const btn = document.getElementById('btnConfirmar');
    btn.disabled = true;
    btn.textContent = '⏳ Procesando...';

    try {
      const data = await API.registrarCompra({
        alumnoId: this.alumnoActual.id,
        productos: this.carrito
      });

      const total = data.compra.total;
      const saldo = data.saldoRestante;
      const content = document.getElementById('pageContent');

      content.innerHTML = `
        <div class="card text-center" style="max-width:400px;margin:2rem auto;padding:2rem">
          <div style="font-size:3rem;margin-bottom:1rem">✅</div>
          <div class="card-title" style="font-size:1.5rem">Venta Registrada</div>
          <div style="font-size:1rem;color:var(--text-secondary);margin:0.5rem 0">${this.alumnoActual.nombre}</div>
          <div style="font-size:2rem;font-weight:800;color:var(--primary);margin:1rem 0">
            Total: $${total.toLocaleString()}
          </div>
          <div style="font-size:1.1rem;color:var(--success)">
            Saldo restante: $${saldo.toLocaleString()}
          </div>
          <button class="btn btn-primary btn-lg btn-block mt-3" id="btnNuevaVenta" style="font-size:1.2rem;padding:1.2rem">
            🔄 Nueva Venta
          </button>
        </div>
      `;

      document.getElementById('btnNuevaVenta').onclick = () => {
        this.render(content, document.getElementById('pageTitle'));
      };

    } catch (e) {
      const items = document.getElementById('cartItems');
      items.innerHTML += `<div class="alert alert-danger mt-1" style="font-size:0.85rem">${e.message}</div>`;
      btn.disabled = false;
      btn.textContent = '✅ Confirmar';
    }
  }
};

window.KIOSQUERO_ESCANEAR = KIOSQUERO_ESCANEAR;
