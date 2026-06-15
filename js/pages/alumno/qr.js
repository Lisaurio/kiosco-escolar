const ALUMNO_QR = {
  async render(content, title) {
    title.textContent = 'Mi Código QR';
    content.innerHTML = '<div class="loading"><div class="spinner spinner-lg"></div><span>Cargando...</span></div>';

    try {
      const fresh = await API.me();
      const alumno = fresh.user;

      const qrData = JSON.stringify({
        id: alumno.id,
        nombre: alumno.nombre,
        codigo: alumno.codigoNumerico
      });

      content.innerHTML = `
        <div class="card text-center" style="max-width:400px;margin:0 auto">
          <div class="card-title mb-2">${alumno.nombre}</div>
          <div class="qr-container" id="qrCode"></div>
          <div class="mt-2">
            <div class="card-subtitle">O ingresá tu código numérico:</div>
            <div style="font-size:2rem;font-weight:800;letter-spacing:0.3em;color:var(--primary);font-family:monospace">
              ${alumno.codigoNumerico || '—'}
            </div>
          </div>
          <div class="mt-2">
            <div class="card-subtitle">Saldo disponible:</div>
            <div style="font-size:1.5rem;font-weight:800;color:var(--success)">$${(alumno.saldo || 0).toLocaleString()}</div>
          </div>
          <div class="mt-2 alert alert-info">
            Mostrá este código QR al kiosquero para comprar
          </div>
        </div>
      `;

      new QRCode(document.getElementById('qrCode'), {
        text: qrData,
        width: 220,
        height: 220,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
      });
    } catch (e) {
      content.innerHTML = `<div class="alert alert-danger">Error: ${e.message}</div>`;
    }
  }
};

window.ALUMNO_QR = ALUMNO_QR;
