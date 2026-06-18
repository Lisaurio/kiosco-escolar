const AUTH = {
  _ready: false,
  _readyPromise: null,
  _readyResolve: null,

  init() {
    if (this._readyPromise) return this._readyPromise;
    this._readyPromise = new Promise(resolve => {
      this._readyResolve = resolve;
    });
    firebase.auth().onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const doc = await firebase.firestore().collection('usuarios').doc(firebaseUser.uid).get();
          if (doc.exists) {
            sessionStorage.setItem('kiosco_user', JSON.stringify({ id: doc.id, ...doc.data() }));
          }
        } catch (e) {
          console.error('Error al cargar perfil:', e);
        }
      } else {
        sessionStorage.removeItem('kiosco_user');
      }
      this._ready = true;
      if (this._readyResolve) {
        this._readyResolve();
        this._readyResolve = null;
      }
    });
    return this._readyPromise;
  },

  login(email, password) {
    return API.login(email, password).then(res => {
      sessionStorage.setItem('kiosco_user', JSON.stringify(res.usuario));
      return res.usuario;
    });
  },

  logout() {
    firebase.auth().signOut();
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
