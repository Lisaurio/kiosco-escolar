const API = {
  baseUrl: '/api',

  async request(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers
      },
      ...options
    };

    if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
      config.body = JSON.stringify(config.body);
    }

    const res = await fetch(`${this.baseUrl}${endpoint}`, config);
    const data = await res.json();

    if (!res.ok) {
      if (res.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.hash = '#/login';
      }
      throw new Error(data.error || 'Error del servidor');
    }

    return data;
  },

  get(endpoint) { return this.request(endpoint); },
  post(endpoint, body) { return this.request(endpoint, { method: 'POST', body }); },
  put(endpoint, body) { return this.request(endpoint, { method: 'PUT', body }); },
  delete(endpoint) { return this.request(endpoint, { method: 'DELETE' }); },

  // Auth
  login(email, password) { return this.post('/auth/login', { email, password }); },
  register(data) { return this.post('/auth/register', data); },
  me() { return this.get('/auth/me'); },

  // Usuarios
  getUsuarios(params = '') { return this.get(`/usuarios${params}`); },
  getUsuario(id) { return this.get(`/usuarios/${id}`); },
  crearUsuario(data) { return this.post('/usuarios', data); },
  actualizarUsuario(id, data) { return this.put(`/usuarios/${id}`, data); },
  eliminarUsuario(id) { return this.delete(`/usuarios/${id}`); },
  cargarSaldo(alumnoId, monto) { return this.post('/usuarios/cargar-saldo', { alumnoId, monto }); },

  // Productos
  getProductos(params = '') { return this.get(`/productos${params}`); },
  getProducto(id) { return this.get(`/productos/${id}`); },
  crearProducto(data) { return this.post('/productos', data); },
  actualizarProducto(id, data) { return this.put(`/productos/${id}`, data); },
  eliminarProducto(id) { return this.delete(`/productos/${id}`); },
  getCategorias() { return this.get('/productos/categorias'); },

  // Compras
  registrarCompra(data) { return this.post('/compras', data); },
  getHistorial(params = '') { return this.get(`/compras${params}`); },
  getVentasDia() { return this.get('/compras/ventas-dia'); },
  getRanking() { return this.get('/compras/ranking'); },

  // Escuelas
  getEscuelas() { return this.get('/escuelas'); },
  getEscuela(id) { return this.get(`/escuelas/${id}`); },
  crearEscuela(data) { return this.post('/escuelas', data); },
  actualizarEscuela(id, data) { return this.put(`/escuelas/${id}`, data); },
  eliminarEscuela(id) { return this.delete(`/escuelas/${id}`); },

  // Kioscos
  getKioscos(params = '') { return this.get(`/kioscos${params}`); },
  getKiosco(id) { return this.get(`/kioscos/${id}`); },
  crearKiosco(data) { return this.post('/kioscos', data); },
  actualizarKiosco(id, data) { return this.put(`/kioscos/${id}`, data); },
  eliminarKiosco(id) { return this.delete(`/kioscos/${id}`); },

  // Notificaciones
  getNotificaciones() { return this.get('/notificaciones'); },
  getNoLeidas() { return this.get('/notificaciones/no-leidas'); },
  marcarLeida(id) { return this.put(`/notificaciones/${id}/leida`); },
  suscribirPush(sub) { return this.post('/notificaciones/suscribir', sub); },

  // Reportes
  getDashboard() { return this.get('/reportes/dashboard'); },
  getEstadisticas(params = '') { return this.get(`/reportes/estadisticas${params}`); }
};
