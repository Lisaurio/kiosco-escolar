const DB = {
  _data: null,
  _lsKey: 'kiosco_db',

  _load() {
    if (this._data) return;
    try {
      const raw = localStorage.getItem(this._lsKey);
      if (raw) { this._data = JSON.parse(raw); return; }
    } catch {}
    this._seed();
  },

  _save() {
    localStorage.setItem(this._lsKey, JSON.stringify(this._data));
  },

  _seed() {
    this._data = {
      usuarios: [
        { id: 'u1', email: 'admin@kiosco.com', password: 'admin123', nombre: 'Admin', rol: 'admin', activo: true },
        { id: 'u2', email: 'kiosco@kiosco.com', password: 'kiosco123', nombre: 'Kiosco Central', rol: 'kiosquero', kioscoId: 'k1', activo: true },
        { id: 'u3', email: 'padre@kiosco.com', password: 'padre123', nombre: 'Carlos Pérez', rol: 'padre', hijos: ['u4', 'u5'], activo: true },
        { id: 'u4', email: 'juan@kiosco.com', password: 'juan123', nombre: 'Juan Pérez', rol: 'alumno', codigoNumerico: '123456', kioscoId: 'k1', saldo: 1500, productosBloqueados: [], congelado: false, padreId: 'u3', escuelaId: 'e1', activo: true },
        { id: 'u5', email: 'maria@kiosco.com', password: 'maria123', nombre: 'María Pérez', rol: 'alumno', codigoNumerico: '789012', kioscoId: 'k1', saldo: 200, productosBloqueados: [], congelado: false, padreId: 'u3', escuelaId: 'e1', activo: true },
        { id: 'u6', email: null, nombre: 'Ana López', rol: 'alumno', codigoNumerico: '345678', kioscoId: 'k1', saldo: 3200, productosBloqueados: [], congelado: false, padreId: null, escuelaId: 'e1', activo: true },
        { id: 'u7', email: null, nombre: 'Pedro García', rol: 'alumno', codigoNumerico: '901234', kioscoId: 'k1', saldo: 150, productosBloqueados: [], congelado: false, padreId: null, escuelaId: 'e1', activo: true },
        { id: 'u8', email: null, nombre: 'Lucía Fernández', rol: 'alumno', codigoNumerico: '567890', kioscoId: 'k1', saldo: 850, productosBloqueados: [], congelado: false, padreId: null, escuelaId: 'e1', activo: true },
        { id: 'u9', email: null, nombre: 'Sofía Martínez', rol: 'alumno', codigoNumerico: '432109', kioscoId: 'k1', saldo: 2100, productosBloqueados: [], congelado: false, padreId: null, escuelaId: 'e1', activo: true },
        { id: 'u10', email: null, nombre: 'Mateo Rodríguez', rol: 'alumno', codigoNumerico: '876543', kioscoId: 'k1', saldo: 600, productosBloqueados: [], congelado: true, padreId: null, escuelaId: 'e1', activo: true },
      ],
      productos: [
        { id: 'p1', nombre: 'Alfajor', precio: 800, categoria: 'Golosinas', kioscoId: 'k1', activo: true },
        { id: 'p2', nombre: 'Caramelo', precio: 100, categoria: 'Golosinas', kioscoId: 'k1', activo: true },
        { id: 'p3', nombre: 'Chicle', precio: 100, categoria: 'Golosinas', kioscoId: 'k1', activo: true },
        { id: 'p4', nombre: 'Galletitas', precio: 500, categoria: 'Snacks', kioscoId: 'k1', activo: true },
        { id: 'p5', nombre: 'Papas Fritas', precio: 600, categoria: 'Snacks', kioscoId: 'k1', activo: true },
        { id: 'p6', nombre: 'Agua', precio: 400, categoria: 'Bebidas', kioscoId: 'k1', activo: true },
        { id: 'p7', nombre: 'Jugo', precio: 500, categoria: 'Bebidas', kioscoId: 'k1', activo: true },
        { id: 'p8', nombre: 'Gaseosa', precio: 700, categoria: 'Bebidas', kioscoId: 'k1', activo: true },
        { id: 'p9', nombre: 'Pizza', precio: 1500, categoria: 'Comida', kioscoId: 'k1', activo: true },
        { id: 'p10', nombre: 'Sandwich', precio: 1200, categoria: 'Comida', kioscoId: 'k1', activo: true },
        { id: 'p11', nombre: 'Empanada', precio: 500, categoria: 'Comida', kioscoId: 'k1', activo: true },
      ],
      compras: [
        { id: 'c1', alumnoId: 'u4', kioscoId: 'k1', productos: [{ productoId: 'p1', nombre: 'Alfajor', precio: 800, cantidad: 1 }], total: 800, fecha: new Date(Date.now() - 3600000).toISOString(), creadoPor: 'u2' },
        { id: 'c2', alumnoId: 'u6', kioscoId: 'k1', productos: [{ productoId: 'p6', nombre: 'Agua', precio: 400, cantidad: 2 }], total: 800, fecha: new Date(Date.now() - 7200000).toISOString(), creadoPor: 'u2' },
        { id: 'c3', alumnoId: 'u5', kioscoId: 'k1', productos: [{ productoId: 'p2', nombre: 'Caramelo', precio: 100, cantidad: 3 }], total: 300, fecha: new Date(Date.now() - 10800000).toISOString(), creadoPor: 'u2' },
      ],
      escuelas: [
        { id: 'e1', nombre: 'Escuela Primaria N°1' },
        { id: 'e2', nombre: 'Escuela Secundaria N°3' },
      ],
      kioscos: [
        { id: 'k1', nombre: 'Kiosco Central', escuelaId: 'e1' },
        { id: 'k2', nombre: 'Kiosco Secundaria', escuelaId: 'e2' },
      ],
      notificaciones: [
        { id: 'n1', usuarioId: 'u3', titulo: 'Compra realizada', cuerpo: 'Juan compró Alfajor por $800', leida: false, fecha: new Date(Date.now() - 3600000).toISOString() },
      ],
    };
    this._save();
  },

  reset() {
    localStorage.removeItem(this._lsKey);
    this._data = null;
    this._load();
  },

  // Generic helpers
  getAll(collection) { this._load(); return this._data[collection] || []; },
  getById(collection, id) { return this.getAll(collection).find(i => i.id === id) || null; },
  query(collection, fn) { return this.getAll(collection).filter(fn); },
  insert(collection, item) {
    this._load();
    item.id = item.id || crypto.randomUUID ? crypto.randomUUID() : 'id_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    this._data[collection].push(item);
    this._save();
    return item;
  },
  update(collection, id, changes) {
    this._load();
    const idx = this._data[collection].findIndex(i => i.id === id);
    if (idx === -1) return null;
    this._data[collection][idx] = { ...this._data[collection][idx], ...changes };
    this._save();
    return this._data[collection][idx];
  },
  delete(collection, id) {
    this._load();
    this._data[collection] = this._data[collection].filter(i => i.id !== id);
    this._save();
  },
};

window.DB = DB;
