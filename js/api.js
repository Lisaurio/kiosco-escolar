const API = {
  _db() { return firebase.firestore(); },
  _col(name) { return this._db().collection(name); },
  _user() {
    try { return JSON.parse(sessionStorage.getItem('kiosco_user')); } catch { return null; }
  },
  _now() { return new Date().toISOString(); },

  async login(email, password) {
    const cred = await firebase.auth().signInWithEmailAndPassword(email, password);
    const doc = await this._col('usuarios').doc(cred.user.uid).get();
    if (!doc.exists) throw new Error('Usuario no encontrado');
    const user = { id: doc.id, ...doc.data() };
    if (user.activo === false) throw new Error('Usuario desactivado');
    sessionStorage.setItem('kiosco_user', JSON.stringify(user));
    const token = await cred.user.getIdToken();
    return { token, usuario: user };
  },

  async register(data) {
    const cred = await firebase.auth().createUserWithEmailAndPassword(data.email, data.password);
    const { password, ...userData } = data;
    const user = {
      ...userData,
      activo: true,
      createdAt: this._now(),
      updatedAt: this._now()
    };
    await this._col('usuarios').doc(cred.user.uid).set(user);
    const saved = { id: cred.user.uid, ...user };
    sessionStorage.setItem('kiosco_user', JSON.stringify(saved));
    return { token: 'firebase-token', usuario: saved };
  },

  async me() {
    const user = this._user();
    if (!user) throw new Error('No autenticado');
    return { user };
  },

  async getUsuarios(params = '') {
    const url = new URL('http://x' + params);
    let query = this._col('usuarios');
    const rol = url.searchParams.get('rol');
    if (rol) query = query.where('rol', '==', rol);
    const snap = await query.get();
    const list = [];
    snap.forEach(doc => {
      const { password, ...rest } = doc.data();
      list.push({ id: doc.id, ...rest });
    });
    return list;
  },

  async getUsuario(id) {
    const doc = await this._col('usuarios').doc(id).get();
    if (!doc.exists) throw new Error('Usuario no encontrado');
    const { password, ...safe } = doc.data();
    return { id: doc.id, ...safe };
  },

  async crearUsuario(data) {
    if (data.email && data.password) {
      const cred = await firebase.auth().createUserWithEmailAndPassword(data.email, data.password);
      const { password, ...userData } = data;
      userData.createdAt = this._now();
      userData.updatedAt = this._now();
      await this._col('usuarios').doc(cred.user.uid).set(userData);
      return { id: cred.user.uid, ...userData };
    }
    const ref = await this._col('usuarios').add({
      ...data,
      activo: data.activo !== false,
      createdAt: this._now(),
      updatedAt: this._now()
    });
    const doc = await ref.get();
    return { id: doc.id, ...doc.data() };
  },

  async actualizarUsuario(id, data) {
    const updates = { ...data, updatedAt: this._now() };
    delete updates.id;
    await this._col('usuarios').doc(id).update(updates);
    const doc = await this._col('usuarios').doc(id).get();
    const { password, ...safe } = doc.data();
    return { id: doc.id, ...safe };
  },

  async eliminarUsuario(id) {
    await this._col('usuarios').doc(id).update({ activo: false, updatedAt: this._now() });
    return { success: true };
  },

  async cargarSaldo(alumnoId, monto) {
    const ref = this._col('usuarios').doc(alumnoId);
    const snap = await ref.get();
    if (!snap.exists) throw new Error('Alumno no encontrado');
    const alumno = snap.data();
    const nuevo = (alumno.saldo || 0) + monto;
    await ref.update({ saldo: nuevo, updatedAt: this._now() });
    const notifData = { titulo: 'Saldo cargado', mensaje: `Se cargó $${monto.toLocaleString()} a tu cuenta`, leida: false, createdAt: this._now() };
    await this._col('notificaciones').add({ ...notifData, usuarioId: alumnoId });
    if (alumno.padreId) {
      await this._col('notificaciones').add({ ...notifData, usuarioId: alumno.padreId, mensaje: `Cargaste $${monto.toLocaleString()} a ${alumno.nombre}` });
    }
    return { saldo: nuevo };
  },

  async getProductos(params = '') {
    const url = new URL('http://x' + params);
    let query = this._col('productos').where('activo', '==', true);
    const kioscoId = url.searchParams.get('kioscoId');
    if (kioscoId) query = query.where('kioscoId', '==', kioscoId);
    const snap = await query.get();
    const list = [];
    snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
    return list;
  },

  async getProducto(id) {
    const doc = await this._col('productos').doc(id).get();
    if (!doc.exists) throw new Error('Producto no encontrado');
    return { id: doc.id, ...doc.data() };
  },

  async getProductoPorBarcode(codigo) {
    const snap = await this._col('productos')
      .where('codigoBarras', '==', codigo)
      .where('activo', '==', true)
      .limit(1)
      .get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return { id: doc.id, ...doc.data() };
  },

  async crearProducto(data) {
    const ref = await this._col('productos').add({
      ...data,
      activo: true,
      createdAt: this._now(),
      updatedAt: this._now()
    });
    const doc = await ref.get();
    return { id: doc.id, ...doc.data() };
  },

  async actualizarProducto(id, data) {
    const updates = { ...data, updatedAt: this._now() };
    delete updates.id;
    await this._col('productos').doc(id).update(updates);
    const doc = await this._col('productos').doc(id).get();
    return { id: doc.id, ...doc.data() };
  },

  async eliminarProducto(id) {
    await this._col('productos').doc(id).update({ activo: false, updatedAt: this._now() });
    return { success: true };
  },

  async getCategorias() {
    const snap = await this._col('productos').where('activo', '==', true).get();
    const cats = new Set();
    snap.forEach(doc => {
      if (doc.data().categoria) cats.add(doc.data().categoria);
    });
    return [...cats];
  },

  async registrarCompra(data) {
    const user = this._user();
    const alumnoRef = this._col('usuarios').doc(data.alumnoId);
    const alumnoSnap = await alumnoRef.get();
    if (!alumnoSnap.exists) throw new Error('Alumno no encontrado');
    const alumno = alumnoSnap.data();

    const total = data.productos.reduce((s, p) => s + p.precio * p.cantidad, 0);
    if ((alumno.saldo || 0) < total) throw new Error('Saldo insuficiente');

    await alumnoRef.update({ saldo: (alumno.saldo || 0) - total, updatedAt: this._now() });

    const now = this._now();
    const compra = {
      alumnoId: data.alumnoId,
      alumnoNombre: alumno.nombre,
      kioscoId: alumno.kioscoId,
      productos: data.productos,
      total,
      fecha: now,
      createdAt: now,
      creadoPor: user?.id || 'unknown'
    };
    const compraRef = await this._col('compras').add(compra);

    if (alumno.padreId) {
      await this._col('notificaciones').add({
        usuarioId: alumno.padreId,
        titulo: 'Compra realizada',
        mensaje: `${alumno.nombre} compró ${data.productos.map(p => `${p.nombre} x${p.cantidad}`).join(', ')} por $${total.toLocaleString()}`,
        leida: false,
        createdAt: this._now()
      });
    }

    return { id: compraRef.id, ...compra };
  },

  async getHistorial(params = '') {
    const url = new URL('http://x' + params);
    let query = this._col('compras');
    const alumnoId = url.searchParams.get('alumnoId');
    if (alumnoId) query = query.where('alumnoId', '==', alumnoId);
    query = query.orderBy('fecha', 'desc');
    const snap = await query.get();
    const list = [];
    snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
    return list;
  },

  async getVentasDia() {
    const hoy = this._now().slice(0, 10);
    const snap = await this._col('compras').get();
    const ventas = [];
    snap.forEach(doc => {
      const c = doc.data();
      if (c.fecha && c.fecha.slice(0, 10) === hoy) {
        ventas.push({ id: doc.id, ...c });
      }
    });
    const total = ventas.reduce((s, v) => s + (v.total || 0), 0);
    return { ventas, total, cantidad: ventas.length };
  },

  async getRanking() {
    const snap = await this._col('compras').get();
    const counts = {};
    snap.forEach(doc => {
      const c = doc.data();
      (c.productos || []).forEach(p => {
        counts[p.productoId] = (counts[p.productoId] || 0) + (p.cantidad || 1);
      });
    });
    const prodSnap = await this._col('productos').get();
    const prods = {};
    prodSnap.forEach(doc => { prods[doc.id] = doc.data().nombre; });
    return Object.entries(counts)
      .map(([id, cant]) => ({ productoId: id, nombre: prods[id] || '?', cantidad: cant }))
      .sort((a, b) => b.cantidad - a.cantidad);
  },

  async getEscuelas() {
    const snap = await this._col('escuelas').get();
    const list = [];
    snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
    return list;
  },

  async getEscuela(id) {
    const doc = await this._col('escuelas').doc(id).get();
    if (!doc.exists) throw new Error('Escuela no encontrada');
    return { id: doc.id, ...doc.data() };
  },

  async crearEscuela(data) {
    const ref = await this._col('escuelas').add({
      ...data,
      activo: true,
      createdAt: this._now()
    });
    const doc = await ref.get();
    return { id: doc.id, ...doc.data() };
  },

  async actualizarEscuela(id, data) {
    delete data.id;
    await this._col('escuelas').doc(id).update(data);
    const doc = await this._col('escuelas').doc(id).get();
    return { id: doc.id, ...doc.data() };
  },

  async eliminarEscuela(id) {
    await this._col('escuelas').doc(id).update({ activo: false });
    return { success: true };
  },

  async getKioscos() {
    const snap = await this._col('kioscos').get();
    const list = [];
    snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
    return list;
  },

  async getKiosco(id) {
    const doc = await this._col('kioscos').doc(id).get();
    if (!doc.exists) throw new Error('Kiosco no encontrado');
    return { id: doc.id, ...doc.data() };
  },

  async crearKiosco(data) {
    const ref = await this._col('kioscos').add({
      ...data,
      activo: true,
      createdAt: this._now()
    });
    const doc = await ref.get();
    return { id: doc.id, ...doc.data() };
  },

  async actualizarKiosco(id, data) {
    delete data.id;
    await this._col('kioscos').doc(id).update(data);
    const doc = await this._col('kioscos').doc(id).get();
    return { id: doc.id, ...doc.data() };
  },

  async eliminarKiosco(id) {
    await this._col('kioscos').doc(id).update({ activo: false });
    return { success: true };
  },

  async getNotificaciones() {
    const user = this._user();
    if (!user) return [];
    const snap = await this._col('notificaciones')
      .where('usuarioId', '==', user.id)
      .orderBy('createdAt', 'desc')
      .get();
    const list = [];
    snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
    return list;
  },

  async getNoLeidas() {
    const list = await this.getNotificaciones();
    return { count: list.filter(n => !n.leida).length };
  },

  async marcarLeida(id) {
    await this._col('notificaciones').doc(id).update({ leida: true });
    return { success: true };
  },

  suscribirPush() {
    return Promise.resolve({ success: true });
  },

  async getDashboard() {
    const user = this._user();
    const hoy = this._now().slice(0, 10);
    const mes = hoy.slice(0, 7);

    const comprasSnap = await this._col('compras').get();
    const compras = [];
    comprasSnap.forEach(doc => compras.push(doc.data()));

    const filtradas = user?.rol === 'admin'
      ? compras
      : compras.filter(c => c.kioscoId === user?.kioscoId);

    const ventasHoy = filtradas
      .filter(c => c.fecha && c.fecha.slice(0, 10) === hoy)
      .reduce((s, c) => s + (c.total || 0), 0) || 0;

    const comprasCount = filtradas
      .filter(c => c.fecha && c.fecha.slice(0, 10) === hoy)
      .length;

    const ventasMes = filtradas
      .filter(c => c.fecha && c.fecha.slice(0, 7) === mes)
      .reduce((s, c) => s + (c.total || 0), 0) || 0;

    const usuariosSnap = await this._col('usuarios').get();
    let alumnosActivos = 0;
    let totalCargado = 0;
    usuariosSnap.forEach(doc => {
      const u = doc.data();
      if (u.rol === 'alumno' && u.activo !== false) {
        alumnosActivos++;
        totalCargado += (u.saldo || 0);
      }
    });

    const counts = {};
    filtradas.forEach(c => {
      (c.productos || []).forEach(p => {
        counts[p.productoId] = (counts[p.productoId] || 0) + (p.cantidad || 1);
      });
    });

    const prodSnap = await this._col('productos').get();
    const prods = {};
    prodSnap.forEach(doc => { prods[doc.id] = doc.data().nombre; });

    const masVendidos = Object.entries(counts)
      .map(([id, cant]) => ({ productoId: id, nombre: prods[id] || '?', cantidad: cant }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);

    return { ventasHoy, comprasCount, ventasMes, alumnosActivos, masVendidos, totalCargado };
  },

  async getEstadisticas() {
    const comprasSnap = await this._col('compras').get();
    const escuelasSnap = await this._col('escuelas').get();
    const usuariosSnap = await this._col('usuarios').get();
    const kioscosSnap = await this._col('kioscos').get();

    const escuelas = {};
    escuelasSnap.forEach(d => { escuelas[d.id] = d.data().nombre; });
    const kioscos = {};
    kioscosSnap.forEach(d => { kioscos[d.id] = { nombre: d.data().nombre, escuelaId: d.data().escuelaId }; });
    const alumnos = {};
    usuariosSnap.forEach(d => {
      const u = d.data();
      if (u.rol === 'alumno') alumnos[d.id] = u;
    });

    let totalVentas = 0;
    let totalCompras = 0;
    const ventasPorDia = {};
    const porEscuela = {};

    comprasSnap.forEach(doc => {
      const c = doc.data();
      const t = c.total || 0;
      totalVentas += t;
      totalCompras++;

      if (c.fecha) {
        const dia = c.fecha.slice(0, 10);
        ventasPorDia[dia] = (ventasPorDia[dia] || 0) + t;
      }

      if (c.kioscoId && kioscos[c.kioscoId]) {
        const escId = kioscos[c.kioscoId].escuelaId;
        if (escId && escuelas[escId]) {
          porEscuela[escuelas[escId]] = (porEscuela[escuelas[escId]] || 0) + t;
        }
      }
    });

    return { totalVentas, totalCompras, ventasPorDia, porEscuela };
  }
};

window.API = API;
