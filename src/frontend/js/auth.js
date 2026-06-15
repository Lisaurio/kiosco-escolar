const AUTH = {
  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  getToken() {
    return localStorage.getItem('token');
  },

  isLoggedIn() {
    return !!this.getToken();
  },

  hasRole(...roles) {
    const user = this.getUser();
    return user && roles.includes(user.rol);
  },

  login(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.hash = '#/login';
  },

  redirectToDashboard() {
    const user = this.getUser();
    if (!user) return '#/login';
    const routes = {
      admin: '#/admin/dashboard',
      kiosquero: '#/kiosquero/dashboard',
      padre: '#/padre/dashboard',
      alumno: '#/alumno/dashboard'
    };
    return routes[user.rol] || '#/login';
  }
};
