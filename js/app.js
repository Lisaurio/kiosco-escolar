const APP = {
  currentPage: null,
  pages: {},

  async init() {
    await AUTH.init();
    this.renderShell();
    this.setupTheme();
    this.setupMenuToggle();
    this.setupNotifPanel();

    window.addEventListener('hashchange', () => this.route());
    this.route();
  },

  renderShell() {
    const root = document.getElementById('app');
    root.innerHTML = `
      <div class="app-layout" id="appLayout">
        <aside class="sidebar" id="sidebar">
          <div class="sidebar-logo"><span>K</span>iosco Escolar</div>
          <nav class="sidebar-nav" id="sidebarNav"></nav>
        </aside>
        <div class="sidebar-overlay" id="sidebarOverlay"></div>
        <main class="main-content" id="mainContent">
          <header class="topbar" id="topbar">
            <button class="menu-toggle" id="menuToggle" aria-label="Abrir menú">☰</button>
            <h1 class="topbar-title" id="pageTitle">Cargando...</h1>
            <div class="topbar-actions">
              <button class="notif-badge" id="notifBtn" data-count="0" aria-label="Notificaciones">🔔</button>
              <button class="theme-toggle" id="themeToggle" aria-label="Cambiar tema">🌙</button>
              <div class="user-info" id="userInfo">
                <div class="user-avatar" id="userAvatar">A</div>
                <span id="userName">Usuario</span>
              </div>
            </div>
          </header>
          <div id="pageContent"></div>
        </main>
      </div>
      <div class="notif-overlay" id="notifOverlay"></div>
      <div class="notif-panel" id="notifPanel">
        <div class="notif-panel-header">
          <h3>Notificaciones</h3>
          <button class="btn btn-sm btn-outline" id="closeNotifPanel">Cerrar</button>
        </div>
        <div class="notif-panel-body" id="notifList">
          <div class="loading"><div class="spinner"></div><span>Cargando...</span></div>
        </div>
      </div>
    `;
  },

  setupTheme() {
    const saved = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    document.getElementById('themeToggle').textContent = saved === 'dark' ? '☀️' : '🌙';

    document.getElementById('themeToggle').onclick = () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
      document.getElementById('themeToggle').textContent = next === 'dark' ? '☀️' : '🌙';
    };
  },

  setupMenuToggle() {
    const toggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    toggle.onclick = () => {
      sidebar.classList.toggle('open');
      overlay.classList.toggle('open');
    };

    overlay.onclick = () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('open');
    };
  },

  setupNotifPanel() {
    const btn = document.getElementById('notifBtn');
    const panel = document.getElementById('notifPanel');
    const overlay = document.getElementById('notifOverlay');
    const close = document.getElementById('closeNotifPanel');

    const open = () => {
      panel.classList.add('open');
      overlay.classList.add('open');
      this.loadNotificaciones();
    };

    const closePanel = () => {
      panel.classList.remove('open');
      overlay.classList.remove('open');
    };

    btn.onclick = open;
    overlay.onclick = closePanel;
    close.onclick = closePanel;
  },

  async loadNotificaciones() {
    const list = document.getElementById('notifList');
    try {
      const notifs = await API.getNotificaciones();
      if (!notifs.length) {
        list.innerHTML = '<div class="empty-state"><span class="empty-icon">🔔</span><p>Sin notificaciones</p></div>';
        return;
      }
      list.innerHTML = notifs.map(n => `
        <div class="notif-item ${n.leida ? '' : 'unread'}" data-id="${n.id}">
          <div class="notif-title">${n.titulo}</div>
          <div class="notif-body">${n.mensaje}</div>
          <div class="notif-time">${new Date(n.createdAt).toLocaleString()}</div>
        </div>
      `).join('');

      list.querySelectorAll('.notif-item.unread').forEach(el => {
        el.onclick = async () => {
          try {
            await API.marcarLeida(el.dataset.id);
            el.classList.remove('unread');
            this.updateNotifCount();
          } catch {}
        };
      });
    } catch (e) {
      list.innerHTML = '<div class="empty-state"><p>Error al cargar notificaciones</p></div>';
    }
  },

  async updateNotifCount() {
    try {
      const { count } = await API.getNoLeidas();
      document.getElementById('notifBtn').dataset.count = count;
    } catch {}
  },

  updateUserUI() {
    const user = AUTH.getUser();
    if (!user) return;
    document.getElementById('userAvatar').textContent = user.nombre.charAt(0).toUpperCase();
    document.getElementById('userName').textContent = user.nombre;
  },

  async route() {
    const hash = window.location.hash || '#/login';

    if (hash === '#/register') {
      document.getElementById('topbar').style.display = 'none';
      document.getElementById('sidebar').style.display = 'none';
      try {
        await import('./pages/register.js');
        window.REGISTER.render(document.getElementById('pageContent'), document.getElementById('pageTitle'));
      } catch {}
      return;
    }

    if (!AUTH.isLoggedIn()) {
      this.loadPage('login');
      return;
    }

    let page = hash.replace('#/', '').replace('/', '_');

    if (!hash || hash === '#/' || hash === '#/login') {
      const user = AUTH.getUser();
      if (user) {
        window.location.hash = AUTH.redirectToDashboard();
        return;
      }
      this.loadPage('login');
      return;
    }

    this.updateUserUI();
    this.updateNotifCount();
    this.renderSidebar();
    this.loadPage(page);
  },

  getNavItems() {
    const user = AUTH.getUser();
    if (!user) return [];

    const items = {
      admin: [
        { section: 'General', links: [
          { href: '#/admin/dashboard', icon: '📊', label: 'Dashboard' }
        ]},
        { section: 'Gestión', links: [
          { href: '#/admin/escuelas', icon: '🏫', label: 'Escuelas' },
          { href: '#/admin/kioscos', icon: '🏪', label: 'Kioscos' },
          { href: '#/admin/usuarios', icon: '👥', label: 'Usuarios' },
          { href: '#/admin/productos', icon: '🍬', label: 'Productos' }
        ]},
        { section: 'Reportes', links: [
          { href: '#/admin/reportes', icon: '📈', label: 'Estadísticas' }
        ]}
      ],
      kiosquero: [
        { section: 'VENTAS', links: [
          { href: '#/kiosquero/escanear', icon: '🛒', label: 'Nueva Venta', cls: 'nav-venta' },
          { href: '#/kiosquero/dashboard', icon: '📊', label: 'Resumen' },
          { href: '#/kiosquero/buscar', icon: '🔍', label: 'Buscar Alumno' },
          { href: '#/kiosquero/ventas', icon: '📋', label: 'Ventas del Día' }
        ]}
      ],
      padre: [
        { section: 'Control', links: [
          { href: '#/padre/dashboard', icon: '📊', label: 'Dashboard' },
          { href: '#/padre/hijos', icon: '👶', label: 'Mis Hijos' },
          { href: '#/padre/cargar-saldo', icon: '💰', label: 'Cargar Saldo' },
          { href: '#/padre/historial', icon: '📜', label: 'Historial' },
          { href: '#/padre/configuracion', icon: '⚙️', label: 'Configuración' }
        ]}
      ],
      alumno: [
        { section: 'Mi Cuenta', links: [
          { href: '#/alumno/dashboard', icon: '📊', label: 'Mi Saldo' },
          { href: '#/alumno/qr', icon: '📱', label: 'Mi QR' }
        ]}
      ]
    };

    return items[user.rol] || [];
  },

  renderSidebar() {
    const nav = document.getElementById('sidebarNav');
    const items = this.getNavItems();
    const currentHash = window.location.hash;

    nav.innerHTML = items.map(section => `
      <div class="sidebar-section">
        <div class="sidebar-section-title">${section.section}</div>
        ${section.links.map(link => {
          let cls = currentHash === link.href ? 'active' : '';
          if (link.cls) cls += (cls ? ' ' : '') + link.cls;
          return `<a href="${link.href}" class="${cls}"><span class="nav-icon">${link.icon}</span>${link.label}</a>`;
        }).join('')}
      </div>
    `).join('');

    nav.innerHTML += `
      <div class="sidebar-section" style="margin-top:auto;padding-top:1rem;border-top:1px solid rgba(255,255,255,0.1)">
        <a href="#" id="logoutBtn" style="color:#EF4444;">
          <span class="nav-icon">🚪</span>
          Cerrar Sesión
        </a>
      </div>
    `;

    document.getElementById('logoutBtn').onclick = (e) => {
      e.preventDefault();
      AUTH.logout();
    };
  },

  async loadPage(pageName) {
    const content = document.getElementById('pageContent');
    const title = document.getElementById('pageTitle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    sidebar.classList.remove('open');
    overlay.classList.remove('open');

    if (pageName === 'login') {
      document.getElementById('topbar').style.display = 'none';
      document.getElementById('sidebar').style.display = 'none';
      await import('./pages/login.js');
      window.LOGIN.render(content, title);
      return;
    }

    document.getElementById('topbar').style.display = 'flex';
    document.getElementById('sidebar').style.display = 'block';

    const user = AUTH.getUser();
    if (!user) {
      window.location.hash = '#/login';
      return;
    }

    const validRoles = {
      admin: ['admin_dashboard', 'admin_escuelas', 'admin_kioscos', 'admin_usuarios', 'admin_productos', 'admin_reportes'],
      kiosquero: ['kiosquero_dashboard', 'kiosquero_escanear', 'kiosquero_buscar', 'kiosquero_ventas'],
      padre: ['padre_dashboard', 'padre_hijos', 'padre_cargar-saldo', 'padre_historial', 'padre_configuracion'],
      alumno: ['alumno_dashboard', 'alumno_qr']
    };

    if (!validRoles[user.rol]?.includes(pageName)) {
      window.location.hash = AUTH.redirectToDashboard();
      return;
    }

    const pageMap = {
      admin_dashboard: { js: './pages/admin/dashboard.js', fn: 'ADMIN_DASHBOARD' },
      admin_escuelas: { js: './pages/admin/escuelas.js', fn: 'ADMIN_ESCUELAS' },
      admin_kioscos: { js: './pages/admin/kioscos.js', fn: 'ADMIN_KIOSCOS' },
      admin_usuarios: { js: './pages/admin/usuarios.js', fn: 'ADMIN_USUARIOS' },
      admin_productos: { js: './pages/admin/productos.js', fn: 'ADMIN_PRODUCTOS' },
      admin_reportes: { js: './pages/admin/reportes.js', fn: 'ADMIN_REPORTES' },
      kiosquero_dashboard: { js: './pages/kiosquero/dashboard.js', fn: 'KIOSQUERO_DASHBOARD' },
      kiosquero_escanear: { js: './pages/kiosquero/escanear.js', fn: 'KIOSQUERO_ESCANEAR' },
      kiosquero_buscar: { js: './pages/kiosquero/buscar.js', fn: 'KIOSQUERO_BUSCAR' },
      kiosquero_ventas: { js: './pages/kiosquero/ventas.js', fn: 'KIOSQUERO_VENTAS' },
      padre_dashboard: { js: './pages/padre/dashboard.js', fn: 'PADRE_DASHBOARD' },
      padre_hijos: { js: './pages/padre/hijos.js', fn: 'PADRE_HIJOS' },
      'padre_cargar-saldo': { js: './pages/padre/cargar-saldo.js', fn: 'PADRE_CARGAR' },
      padre_historial: { js: './pages/padre/historial.js', fn: 'PADRE_HISTORIAL' },
      padre_configuracion: { js: './pages/padre/configuracion.js', fn: 'PADRE_CONFIG' },
      alumno_dashboard: { js: './pages/alumno/dashboard.js', fn: 'ALUMNO_DASHBOARD' },
      alumno_qr: { js: './pages/alumno/qr.js', fn: 'ALUMNO_QR' }
    };

    const page = pageMap[pageName];
    if (!page) {
      content.innerHTML = '<div class="empty-state"><span class="empty-icon">❓</span><p>Página no encontrada</p></div>';
      title.textContent = 'Error 404';
      return;
    }

    try {
      await import(page.js);
      const fn = window[page.fn];
      if (fn && fn.render) {
        fn.render(content, title);
      } else {
        throw new Error('Page module not found');
      }
    } catch (e) {
      content.innerHTML = `<div class="loading"><div class="spinner spinner-lg"></div><span>Cargando ${pageName}...</span></div>`;
      setTimeout(() => this.loadPage(pageName), 500);
    }
  },

};

document.addEventListener('DOMContentLoaded', () => APP.init());
