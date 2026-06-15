const KIOSQUERO_ESCANEAR = {
  alumnoActual: null,
  productos: [],
  carrito: [],
  scanner: null,
  _productosCache: {},
  _codigo: '',
  _todosAlumnos: [],

  _cleanup() {
    const spacer = document.getElementById('cartBarSpacer');
    if (spacer) spacer.remove();
    this.stopScanner();
    this.carrito = [];
    this._codigo = '';
  },

  async render(content, title) {
    title.textContent = 'Nueva Venta';
    this._cleanup();
    this.alumnoActual = null;

    const stored = localStorage.getItem('scanAlumno');
    if (stored) {
      localStorage.removeItem('scanAlumno');
      this.mostrarSeleccionProductos(JSON.parse(stored));
      return;
    }

    content.innerHTML = `
      <div style="max-width:600px;margin:0 auto">
        <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.5rem">
          <input class="form-input" type="text" id="buscarAlumno" placeholder="🔍 Buscar alumno por nombre..." autofocus style="flex:1;font-size:1rem;padding:0.6rem 0.75rem;border-width:2px">
          <button class="btn btn-outline" id="btnToggleKeypad" style="font-size:1.1rem;padding:0.6rem 0.8rem" title="Ingresar código numérico">🔢</button>
          <button class="btn btn-outline" id="btnToggleQR" style="font-size:1.1rem;padding:0.6rem 0.8rem" title="Escanear QR">📷</button>
        </div>

        <div id="keypadPanel" style="display:none;margin-bottom:0.5rem">
          <div style="text-align:center">
            <div id="codigoDisplay" style="font-size:2.2rem;font-weight:800;font-family:monospace;letter-spacing:0.3em;padding:0.3rem;color:var(--text)">_ _ _ _ _ _</div>
            <div id="codigoError" class="form-error" style="display:none"></div>
          </div>
          <div class="keypad-grid" style="max-width:260px">
            <button class="keypad-btn" data-key="1">1</button>
            <button class="keypad-btn" data-key="2">2</button>
            <button class="keypad-btn" data-key="3">3</button>
            <button class="keypad-btn" data-key="4">4</button>
            <button class="keypad-btn" data-key="5">5</button>
            <button class="keypad-btn" data-key="6">6</button>
            <button class="keypad-btn" data-key="7">7</button>
            <button class="keypad-btn" data-key="8">8</button>
            <button class="keypad-btn" data-key="9">9</button>
            <button class="keypad-btn keypad-clear" data-key="clear">⌫</button>
            <button class="keypad-btn" data-key="0">0</button>
            <button class="keypad-btn keypad-enter" data-key="enter">↵</button>
          </div>
        </div>

        <div id="qrPanel" style="display:none;margin-bottom:0.5rem">
          <div id="scannerContainer" style="max-width:200px;margin:0 auto;aspect-ratio:1"></div>
          <p class="text-muted text-center" style="font-size:0.8rem">Escaneá el QR del alumno</p>
        </div>

        <div id="recientesSection" style="margin-bottom:0.5rem;display:none"></div>

        <div id="alumnosContainer">
          <div class="loading"><div class="spinner"></div><span>Cargando alumnos...</span></div>
        </div>
      </div>
    `;

    document.getElementById('btnToggleKeypad').onclick = () => {
      this.stopScanner();
      document.getElementById('qrPanel').style.display = 'none';
      const kp = document.getElementById('keypadPanel');
      kp.style.display = kp.style.display === 'none' ? 'block' : 'none';
      if (kp.style.display === 'block') this._codigo = '';
    };

    document.getElementById('btnToggleQR').onclick = () => {
      document.getElementById('keypadPanel').style.display = 'none';
      const qr = document.getElementById('qrPanel');
      qr.style.display = qr.style.display === 'none' ? 'block' : 'none';
      if (qr.style.display === 'block') this.startScanner();
      else this.stopScanner();
    };

    this.setupKeypad();
    this.mostrarRecientes();
    this.cargarAlumnos();
    this.precargarProductos();

    document.getElementById('buscarAlumno').oninput = () => this.filtrarAlumnos();
  },

  mostrarRecientes() {
    const recientes = this.obtenerRecientes();
    if (!recientes.length) return;
    const section = document.getElementById('recientesSection');
    section.style.display = 'block';
    section.innerHTML = `
      <div style="font-size:0.7rem;color:var(--text-secondary);margin-bottom:0.3rem;text-transform:uppercase;letter-spacing:0.05em;font-weight:600">Últimos</div>
      <div style="display:flex;gap:0.4rem;overflow-x:auto;padding-bottom:0.3rem">
        ${recientes.slice(0, 6).map(a => `
          <button class="btn btn-sm btn-outline" style="white-space:nowrap;flex-shrink:0;font-size:0.85rem" data-id="${a.id}">${a.nombre}</button>
        `).join('')}
      </div>
    `;
    section.querySelectorAll('[data-id]').forEach(btn => {
      btn.onclick = () => this.seleccionarAlumno(btn.dataset.id);
    });
  },

  setupKeypad() {
    document.querySelectorAll('#keypadPanel .keypad-btn').forEach(btn => {
      btn.onclick = () => {
        const key = btn.dataset.key;
        if (key === 'clear') {
          this._codigo = this._codigo.slice(0, -1);
          this.actualizarDisplay();
        } else if (key === 'enter') {
          this.buscarPorCodigo(this._codigo);
        } else {
          if (this._codigo.length < 6) {
            this._codigo += key;
            this.actualizarDisplay();
            document.getElementById('codigoError').style.display = 'none';
            if (this._codigo.length === 6) this.buscarPorCodigo(this._codigo);
          }
        }
      };
    });
  },

  actualizarDisplay() {
    const d = document.getElementById('codigoDisplay');
    if (!d) return;
    d.textContent = (this._codigo.padEnd(6, '_')).split('').join(' ');
  },

  async cargarAlumnos() {
    try {
      const usuarios = await API.getUsuarios('?rol=alumno');
      this._todosAlumnos = usuarios.filter(u => u.activo !== false);
      this.filtrarAlumnos();
    } catch (e) {
      document.getElementById('alumnosContainer').innerHTML = `<div class="alert alert-danger">Error: ${e.message}</div>`;
    }
  },

  filtrarAlumnos() {
    const q = (document.getElementById('buscarAlumno').value || '').toLowerCase().trim();
    const container = document.getElementById('alumnosContainer');

    let filtrados = this._todosAlumnos;
    if (q) filtrados = filtrados.filter(u => u.nombre.toLowerCase().includes(q));

    if (!filtrados.length) {
      container.innerHTML = '<div class="empty-state" style="padding:2rem 0"><p>' + (q ? 'Sin resultados' : 'Sin alumnos') + '</p></div>';
      return;
    }

    container.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:0.5rem">
        ${filtrados.map(a => `
          <button class="card alumno-card" data-id="${a.id}" style="border-color:${a.congelado ? 'var(--danger)' : 'var(--border)'} !important">
            <div class="ac-nombre">${a.nombre}</div>
            <div class="ac-code">#${a.codigoNumerico || '—'}</div>
            <div class="ac-saldo" style="color:${a.congelado ? 'var(--danger)' : 'var(--success)'}">$${(a.saldo || 0).toLocaleString()}</div>
          </button>
        `).join('')}
      </div>
      <div style="text-align:center;font-size:0.75rem;color:var(--text-secondary);margin-top:0.5rem">${filtrados.length} alumno(s)</div>
    `;

    container.querySelectorAll('.alumno-card').forEach(card => {
      card.onclick = () => this.seleccionarAlumno(card.dataset.id);
    });
  },

  async seleccionarAlumno(id) {
    try {
      const alumno = await API.getUsuario(id);
      if (!alumno) return;
      this.stopScanner();
      this.guardarReciente(alumno);
      this.mostrarSeleccionProductos(alumno);
    } catch {}
  },

  async buscarPorCodigo(codigo) {
    const errorEl = document.getElementById('codigoError');
    if (!codigo || codigo.length < 4) { errorEl.textContent = 'Min. 4 dígitos'; errorEl.style.display = 'block'; return; }
    try {
      const usuarios = await API.getUsuarios('?rol=alumno');
      const alumno = usuarios.find(u => u.codigoNumerico === codigo);
      if (!alumno) { errorEl.textContent = 'Código inválido'; errorEl.style.display = 'block'; return; }
      errorEl.style.display = 'none';
      this.stopScanner();
      document.getElementById('keypadPanel').style.display = 'none';
      document.getElementById('qrPanel').style.display = 'none';
      this.guardarReciente(alumno);
      this.mostrarSeleccionProductos(alumno);
    } catch (e) {
      errorEl.textContent = 'Error: ' + e.message;
      errorEl.style.display = 'block';
    }
  },

  startScanner() {
    const container = document.getElementById('scannerContainer');
    if (!container) return;
    try {
      this.scanner = new Html5Qrcode('scannerContainer');
      this.scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 160, height: 160 } },
        (text) => this.onScanSuccess(text),
        () => {}
      ).catch(() => {
        container.innerHTML = '<div class="alert alert-warning" style="font-size:0.85rem">Cámara no disponible</div>';
      });
    } catch {
      container.innerHTML = '<div class="alert alert-warning" style="font-size:0.85rem">Cámara no disponible</div>';
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
      if (!alumno || alumno.rol !== 'alumno') return;
      this.guardarReciente(alumno);
      document.getElementById('qrPanel').style.display = 'none';
      this.mostrarSeleccionProductos(alumno);
    } catch {}
  },

  obtenerRecientes() {
    try { return JSON.parse(localStorage.getItem('kioskoRecientes') || '[]'); } catch { return []; }
  },

  guardarReciente(alumno) {
    if (!alumno) return;
    const recientes = this.obtenerRecientes().filter(r => r.id !== alumno.id);
    recientes.unshift({ id: alumno.id, nombre: alumno.nombre, codigoNumerico: alumno.codigoNumerico, saldo: alumno.saldo });
    if (recientes.length > 8) recientes.length = 8;
    localStorage.setItem('kioskoRecientes', JSON.stringify(recientes));
  },

  async precargarProductos() {
    try {
      const user = AUTH.getUser();
      if (user.kioscoId) {
        const p = await API.getProductos(`?kioscoId=${user.kioscoId}&activo=true`);
        p.forEach(prod => { this._productosCache[prod.id] = prod; });
        this._productosCache._lista = p;
        this._productosCache._kioscoId = user.kioscoId;
      }
    } catch {}
  },

  async mostrarSeleccionProductos(alumno) {
    this.alumnoActual = alumno;
    this.carrito = [];
    const content = document.getElementById('pageContent');

    if (alumno.congelado) {
      content.innerHTML = `
        <div class="alert alert-danger" style="font-size:1.2rem;text-align:center;padding:2rem">
          ⚠️ ${alumno.nombre} — Cuenta congelada
          <button class="btn btn-primary btn-lg btn-block mt-2" onclick="KIOSQUERO_ESCANEAR.render(document.getElementById('pageContent'), document.getElementById('pageTitle'))">🔄 Otra venta</button>
        </div>
      `;
      return;
    }

    content.innerHTML = `
      <div id="ventaHeader" class="card mb-1" style="background:var(--primary);color:white;border:none;padding:0.65rem 1rem">
        <div class="flex items-center justify-between">
          <div>
            <div style="font-weight:700;font-size:1.05rem">${alumno.nombre}</div>
            <div style="font-size:0.8rem;opacity:0.9">Saldo: <strong>$${(alumno.saldo || 0).toLocaleString()}</strong></div>
          </div>
          <button class="btn btn-sm" style="background:rgba(255,255,255,0.2);color:white;border:none" onclick="KIOSQUERO_ESCANEAR.render(document.getElementById('pageContent'), document.getElementById('pageTitle'))">✕</button>
        </div>
      </div>

      <input class="form-input mb-1" type="text" id="filtroProductos" placeholder="🔍 Buscar producto..." autofocus style="font-size:1rem;padding:0.5rem 0.75rem;border-width:2px">

      <div id="categoriasTabs" class="tabs" style="margin-bottom:0.5rem;gap:0.25rem;overflow-x:auto;flex-wrap:nowrap">
        <button class="tab active" data-cat="todas">Todas</button>
      </div>

      <div class="kiosk-grid" id="productosList"></div>

      <div id="cartBar" style="display:none;position:fixed;bottom:0;left:0;right:0;background:var(--bg-card);border-top:2px solid var(--primary);padding:0.6rem 0.75rem;z-index:50;box-shadow:0 -2px 10px rgba(0,0,0,0.15)">
        <div class="flex items-center justify-between mb-1">
          <span style="font-weight:600;font-size:0.85rem" id="cartCount">0</span>
          <span style="font-weight:800;font-size:1.3rem;color:var(--primary)" id="cartTotal">$0</span>
        </div>
        <div id="cartItems" style="font-size:0.8rem;color:var(--text-secondary);margin-bottom:0.4rem;line-height:1.3"></div>
        <button class="btn btn-success btn-lg btn-block" id="btnConfirmar" style="font-size:1.1rem;padding:0.75rem">✅ Confirmar Venta</button>
      </div>
    `;

    const style = document.createElement('style');
    style.id = 'cartBarSpacer';
    style.textContent = 'body { padding-bottom: 120px; }';
    document.head.appendChild(style);

    try {
      let productos;
      if (this._productosCache._kioscoId === alumno.kioscoId && this._productosCache._lista) {
        productos = this._productosCache._lista;
      } else {
        productos = await API.getProductos(`?kioscoId=${alumno.kioscoId || ''}&activo=true`);
        this._productosCache._lista = productos;
        this._productosCache._kioscoId = alumno.kioscoId;
      }
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
      document.getElementById('filtroProductos').focus();

      document.getElementById('btnConfirmar').onclick = () => this.confirmarVenta();
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
      return `
        <button class="kiosk-product-btn ${enCarrito ? 'selected' : ''}" data-id="${p.id}">
          <span class="product-name">${p.nombre}</span>
          <span class="product-price">$${p.precio.toLocaleString()}</span>
          ${enCarrito ? `<span class="product-qty">${enCarrito.cantidad}</span>` : ''}
        </button>
      `;
    }).join('');

    if (!filtrados.length) {
      list.innerHTML = '<div class="empty-state" style="grid-column:1/-1;padding:2rem 0"><p>Sin productos</p></div>';
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
      this.carrito.push({ productoId: producto.id, nombre: producto.nombre, precio: producto.precio, cantidad: 1 });
    }

    this.actualizarCartBar();
    this.renderProductos(document.querySelector('#categoriasTabs .tab.active').dataset.cat);
  },

  actualizarCartBar() {
    const bar = document.getElementById('cartBar');
    if (this.carrito.length === 0) { bar.style.display = 'none'; return; }

    bar.style.display = 'block';
    const totalItems = this.carrito.reduce((s, i) => s + i.cantidad, 0);
    const totalSum = this.carrito.reduce((s, i) => s + i.precio * i.cantidad, 0);

    document.getElementById('cartCount').textContent = `${totalItems} prod. | $${totalSum.toLocaleString()}`;
    document.getElementById('cartTotal').textContent = `$${totalSum.toLocaleString()}`;
    document.getElementById('cartItems').textContent = this.carrito.map(i => `${i.nombre} x${i.cantidad}`).join(' + ');
  },

  async confirmarVenta() {
    const btn = document.getElementById('btnConfirmar');
    btn.disabled = true;
    btn.textContent = '⏳...';

    try {
      await API.registrarCompra({ alumnoId: this.alumnoActual.id, productos: this.carrito });

      const content = document.getElementById('pageContent');
      this._cleanup();

      content.innerHTML = `
        <div style="text-align:center;padding:2rem 1rem">
          <div style="font-size:3rem;margin-bottom:0.5rem">✅</div>
          <div style="font-size:1.5rem;font-weight:800;margin-bottom:0.25rem">Vendido a ${this.alumnoActual.nombre}</div>
          <div style="font-size:2rem;font-weight:800;color:var(--primary);margin:0.75rem 0">
            $${this.carrito.reduce((s,i) => s + i.precio * i.cantidad, 0).toLocaleString()}
          </div>
          <button class="btn btn-primary btn-lg btn-block" style="font-size:1.2rem;padding:1.2rem" onclick="KIOSQUERO_ESCANEAR.render(document.getElementById('pageContent'), document.getElementById('pageTitle'))">
            🔄 Nueva Venta
          </button>
        </div>
      `;
      this.carrito = [];
    } catch (e) {
      alert(e.message);
      btn.disabled = false;
      btn.textContent = '✅ Confirmar Venta';
    }
  }
};

window.KIOSQUERO_ESCANEAR = KIOSQUERO_ESCANEAR;
