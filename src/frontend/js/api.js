const API = {
  _user() { return JSON.parse(sessionStorage.getItem('kiosco_user') || 'null'); },
  _filterByKiosco(items) {
    const user = this._user();
    if (!user || user.rol === 'admin') return items;
    return items.filter(i => i.kioscoId === user.kioscoId || i.kioscoId === user.kioscoId);
  },

  login(email, password) {
    const user = DB.query('usuarios', u => u.email === email && u.password === password && u.activo !== false)[0];
    if (!user) return Promise.reject(new Error('Credenciales inválidas'));
    const { password: _, ...safe } = user;
    sessionStorage.setItem('kiosco_user', JSON.stringify(user));
    return Promise.resolve({ token: 'demo-token', usuario: safe });
  },

  register(data) {
    const exists = DB.query('usuarios', u => u.email === data.email)[0];
    if (exists) return Promise.reject(new Error('Email ya registrado'));
    const user = DB.insert('usuarios', { ...data, activo: true });
    const { password: _, ...safe } = user;
    sessionStorage.setItem('kiosco_user', JSON.stringify(user));
    return Promise.resolve({ token: 'demo-token', usuario: safe });
  },

  me() {
    const user = this._user();
    if (!user) return Promise.reject(new Error('No autenticado'));
    const { password: _, ...safe } = user;
    return Promise.resolve(safe);
  },

  getUsuarios(params = '') {
    let list = DB.getAll('usuarios').map(u => { const { password, ...rest } = u; return rest; });
    const url = new URL('http://x' + params);
    if (url.searchParams.get('rol')) list = list.filter(u => u.rol === url.searchParams.get('rol'));
    return Promise.resolve(list);
  },

  getUsuario(id) {
    const u = DB.getById('usuarios', id);
    if (!u) return Promise.reject(new Error('Usuario no encontrado'));
    const { password, ...safe } = u;
    return Promise.resolve(safe);
  },

  crearUsuario(data) {
    const user = DB.insert('usuarios', data);
    const { password, ...safe } = user;
    return Promise.resolve(safe);
  },

  actualizarUsuario(id, data) {
    const user = DB.update('usuarios', id, data);
    if (!user) return Promise.reject(new Error('Usuario no encontrado'));
    const { password, ...safe } = user;
    return Promise.resolve(safe);
  },

  eliminarUsuario(id) { DB.delete('usuarios', id); return Promise.resolve({ success: true }); },

  cargarSaldo(alumnoId, monto) {
    const alumno = DB.getById('usuarios', alumnoId);
    if (!alumno) return Promise.reject(new Error('Alumno no encontrado'));
    const nuevo = (alumno.saldo || 0) + monto;
    DB.update('usuarios', alumnoId, { saldo: nuevo });
    DB.insert('notificaciones', { usuarioId: alumnoId, titulo: 'Saldo cargado', cuerpo: `Se cargó $${monto.toLocaleString()} a tu cuenta`, leida: false, fecha: new Date().toISOString() });
    return Promise.resolve({ saldo: nuevo });
  },

  getProductos(params = '') {
    let list = DB.getAll('productos').filter(p => p.activo !== false);
    const url = new URL('http://x' + params);
    if (url.searchParams.get('kioscoId')) list = list.filter(p => p.kioscoId === url.searchParams.get('kioscoId'));
    if (url.searchParams.get('activo')) list = list.filter(p => p.activo !== false);
    return Promise.resolve(list);
  },

  getProducto(id) {
    const p = DB.getById('productos', id);
    if (!p) return Promise.reject(new Error('Producto no encontrado'));
    return Promise.resolve(p);
  },

  crearProducto(data) { return Promise.resolve(DB.insert('productos', data)); },
  actualizarProducto(id, data) {
    const p = DB.update('productos', id, data);
    if (!p) return Promise.reject(new Error('Producto no encontrado'));
    return Promise.resolve(p);
  },
  eliminarProducto(id) { DB.delete('productos', id); return Promise.resolve({ success: true }); },
  getCategorias() {
    const cats = [...new Set(DB.getAll('productos').map(p => p.categoria).filter(Boolean))];
    return Promise.resolve(cats);
  },

  registrarCompra(data) {
    const user = this._user();
    const alumno = DB.getById('usuarios', data.alumnoId);
    if (!alumno) return Promise.reject(new Error('Alumno no encontrado'));
    const total = data.productos.reduce((s, p) => s + p.precio * p.cantidad, 0);
    if ((alumno.saldo || 0) < total) return Promise.reject(new Error('Saldo insuficiente'));
    DB.update('usuarios', data.alumnoId, { saldo: (alumno.saldo || 0) - total });
    const compra = DB.insert('compras', {
      alumnoId: data.alumnoId,
      kioscoId: alumno.kioscoId,
      productos: data.productos,
      total,
      fecha: new Date().toISOString(),
      creadoPor: user?.id || 'unknown',
    });
    if (alumno.padreId) {
      DB.insert('notificaciones', {
        usuarioId: alumno.padreId,
        titulo: 'Compra realizada',
        cuerpo: `${alumno.nombre} compró ${data.productos.map(p => `${p.nombre} x${p.cantidad}`).join(', ')} por $${total.toLocaleString()}`,
        leida: false,
        fecha: new Date().toISOString(),
      });
    }
    return Promise.resolve(compra);
  },

  getHistorial(params = '') {
    let list = DB.getAll('compras');
    const url = new URL('http://x' + params);
    if (url.searchParams.get('alumnoId')) list = list.filter(c => c.alumnoId === url.searchParams.get('alumnoId'));
    list.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    return Promise.resolve(list);
  },

  getVentasDia() {
    const hoy = new Date().toISOString().slice(0, 10);
    const ventas = DB.getAll('compras').filter(c => c.fecha.slice(0, 10) === hoy);
    return Promise.resolve(ventas);
  },

  getRanking() {
    const ventas = DB.getAll('compras');
    const counts = {};
    ventas.forEach(c => {
      c.productos.forEach(p => {
        counts[p.productoId] = (counts[p.productoId] || 0) + p.cantidad;
      });
    });
    const prods = DB.getAll('productos');
    const ranking = Object.entries(counts)
      .map(([id, cant]) => ({ productoId: id, nombre: (prods.find(p => p.id === id) || {}).nombre || '?', cantidad: cant }))
      .sort((a, b) => b.cantidad - a.cantidad);
    return Promise.resolve(ranking);
  },

  getEscuelas() { return Promise.resolve(DB.getAll('escuelas')); },
  getEscuela(id) { return Promise.resolve(DB.getById('escuelas', id)); },
  crearEscuela(data) { return Promise.resolve(DB.insert('escuelas', data)); },
  actualizarEscuela(id, data) { return Promise.resolve(DB.update('escuelas', id, data)); },
  eliminarEscuela(id) { DB.delete('escuelas', id); return Promise.resolve({ success: true }); },

  getKioscos(params = '') {
    let list = DB.getAll('kioscos');
    return Promise.resolve(list);
  },
  getKiosco(id) { return Promise.resolve(DB.getById('kioscos', id)); },
  crearKiosco(data) { return Promise.resolve(DB.insert('kioscos', data)); },
  actualizarKiosco(id, data) { return Promise.resolve(DB.update('kioscos', id, data)); },
  eliminarKiosco(id) { DB.delete('kioscos', id); return Promise.resolve({ success: true }); },

  getNotificaciones() {
    const user = this._user();
    if (!user) return Promise.resolve([]);
    let list = DB.query('notificaciones', n => n.usuarioId === user.id);
    list.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    return Promise.resolve(list);
  },
  getNoLeidas() { return this.getNotificaciones().then(list => list.filter(n => !n.leida)); },
  marcarLeida(id) { DB.update('notificaciones', id, { leida: true }); return Promise.resolve({ success: true }); },
  suscribirPush() { return Promise.resolve({ success: true }); },

  getDashboard() {
    const user = this._user();
    const hoy = new Date().toISOString().slice(0, 10);
    const compras = user.rol === 'admin' ? DB.getAll('compras') : DB.query('compras', c => c.kioscoId === user.kioscoId);
    const ventasHoy = compras.filter(c => c.fecha.slice(0, 10) === hoy).reduce((s, c) => s + c.total, 0);
    const comprasCount = compras.filter(c => c.fecha.slice(0, 10) === hoy).length;
    const ventasMes = compras.filter(c => c.fecha.slice(0, 7) === hoy.slice(0, 7)).reduce((s, c) => s + c.total, 0);
    const alumnosActivos = DB.query('usuarios', u => u.rol === 'alumno' && u.activo !== false).length;

    const counts = {};
    compras.forEach(c => c.productos.forEach(p => { counts[p.productoId] = (counts[p.productoId] || 0) + p.cantidad; }));
    const prods = DB.getAll('productos');
    const masVendidos = Object.entries(counts)
      .map(([id, cant]) => ({ productoId: id, nombre: (prods.find(p => p.id === id) || {}).nombre || '?', cantidad: cant }))
      .sort((a, b) => b.cantidad - a.cantidad).slice(0, 5);

    return Promise.resolve({ ventasHoy, comprasCount, ventasMes, alumnosActivos, masVendidos });
  },

  getEstadisticas() {
    const compras = DB.getAll('compras');
    const ventasPorDia = {};
    compras.forEach(c => {
      const dia = c.fecha.slice(0, 10);
      ventasPorDia[dia] = (ventasPorDia[dia] || 0) + c.total;
    });
    const ventas = Object.entries(ventasPorDia).map(([fecha, total]) => ({ fecha, total })).sort((a, b) => a.fecha.localeCompare(b.fecha));
    return Promise.resolve({ ventas });
  },
};

window.API = API;
