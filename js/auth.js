const AUTH = {
  login(email, password) {
    return API.login(email, password).then(res => {
      sessionStorage.setItem('kiosco_user', JSON.stringify(res.usuario));
      return res.usuario;
    });
  },

  logout() {
    sessionStorage.removeItem('kiosco_user');
    window.location.hash = '#/login';
  },

  getUser() {
    try { return JSON.parse(sessionStorage.getItem('kiosco_user')); } catch { return null; }
  },

  isLoggedIn() { return !!this.getUser(); },

  redirectToDashboard() {
    const user = this.getUser();
    if (!user) return '#/login';
    const routes = {
      admin: '#/admin/dashboard',
      kiosquero: '#/kiosquero/escanear',
      padre: '#/padre/dashboard',
      alumno: '#/alumno/dashboard'
    };
    return routes[user.rol] || '#/login';
  }
};

window.AUTH = AUTH;
