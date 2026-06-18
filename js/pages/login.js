const LOGIN = {
  render(content, title) {
    title.textContent = 'Iniciar Sesión';
    content.innerHTML = `
      <div class="login-page">
        <div class="login-card">
          <div class="logo"><span>K</span>iosco Escolar</div>
          <p class="subtitle">Gestión de compras escolares sin efectivo</p>
          <form id="loginForm">
            <div class="form-group">
              <label class="form-label">Email</label>
              <input class="form-input" type="email" id="loginEmail" placeholder="tu@email.com" required autocomplete="email">
            </div>
            <div class="form-group">
              <label class="form-label">Contraseña</label>
              <input class="form-input" type="password" id="loginPassword" placeholder="••••••••" required autocomplete="current-password">
            </div>
            <div id="loginError" class="form-error mb-2" style="display:none"></div>
            <button type="submit" class="btn btn-primary btn-lg btn-block" id="loginBtn">Ingresar</button>
          </form>
          <p class="text-center mt-2" style="font-size:0.85rem;color:var(--text-secondary)">
            ¿No tenés cuenta? <a href="#/register">Registrate</a>
          </p>
          <div class="mt-3" style="font-size:0.75rem;color:var(--text-secondary);text-align:center;line-height:1.6">
            <strong>Demo:</strong><br>
            kiosco@kiosco.com / kiosco123 🛒<br>
            admin@kiosco.com / admin123<br>
            padre@kiosco.com / padre123<br>
            juan@kiosco.com / juan123
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  },

  bindEvents() {
    document.getElementById('loginForm').onsubmit = async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;
      const errorEl = document.getElementById('loginError');
      const btn = document.getElementById('loginBtn');

      btn.disabled = true;
      btn.textContent = 'Ingresando...';
      errorEl.style.display = 'none';

      try {
        await AUTH.login(email, password);
        window.location.hash = AUTH.redirectToDashboard();
      } catch (err) {
        errorEl.textContent = err.message;
        errorEl.style.display = 'block';
        btn.disabled = false;
        btn.textContent = 'Ingresar';
      }
    };
  }
};

window.LOGIN = LOGIN;
