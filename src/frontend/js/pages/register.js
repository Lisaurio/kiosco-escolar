const REGISTER = {
  render(content, title) {
    title.textContent = 'Registrarse';
    content.innerHTML = `
      <div class="login-page">
        <div class="login-card">
          <div class="logo"><span>K</span>iosco Escolar</div>
          <p class="subtitle">Crear cuenta nueva</p>
          <form id="registerForm">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Nombre</label>
                <input class="form-input" type="text" id="regNombre" placeholder="Tu nombre" required>
              </div>
              <div class="form-group">
                <label class="form-label">Teléfono</label>
                <input class="form-input" type="tel" id="regTelefono" placeholder="+54 11 1234 5678">
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Email</label>
              <input class="form-input" type="email" id="regEmail" placeholder="tu@email.com" required>
            </div>
            <div class="form-group">
              <label class="form-label">Contraseña</label>
              <input class="form-input" type="password" id="regPassword" placeholder="Mínimo 6 caracteres" required minlength="6">
            </div>
            <div class="form-group">
              <label class="form-label">Tipo de cuenta</label>
              <select class="form-select" id="regRol">
                <option value="">Seleccionar...</option>
                <option value="padre">Padre/Madre</option>
                <option value="kiosquero">Kiosquero</option>
              </select>
            </div>
            <div id="registerError" class="form-error mb-2" style="display:none"></div>
            <button type="submit" class="btn btn-primary btn-lg btn-block" id="registerBtn">Crear Cuenta</button>
          </form>
          <p class="text-center mt-2" style="font-size:0.85rem;color:var(--text-secondary)">
            ¿Ya tenés cuenta? <a href="#/login">Iniciar Sesión</a>
          </p>
        </div>
      </div>
    `;

    this.bindEvents();
  },

  bindEvents() {
    document.getElementById('registerForm').onsubmit = async (e) => {
      e.preventDefault();
      const nombre = document.getElementById('regNombre').value;
      const email = document.getElementById('regEmail').value;
      const password = document.getElementById('regPassword').value;
      const telefono = document.getElementById('regTelefono').value;
      const rol = document.getElementById('regRol').value;
      const errorEl = document.getElementById('registerError');
      const btn = document.getElementById('registerBtn');

      if (!rol) {
        errorEl.textContent = 'Seleccioná un tipo de cuenta';
        errorEl.style.display = 'block';
        return;
      }

      btn.disabled = true;
      btn.textContent = 'Creando cuenta...';
      errorEl.style.display = 'none';

      try {
        const data = await API.register({ nombre, email, password, telefono, rol });
        AUTH.login(data.token, data.user);
        window.location.hash = AUTH.redirectToDashboard();
      } catch (err) {
        errorEl.textContent = err.message;
        errorEl.style.display = 'block';
        btn.disabled = false;
        btn.textContent = 'Crear Cuenta';
      }
    };
  }
};

window.REGISTER = REGISTER;
