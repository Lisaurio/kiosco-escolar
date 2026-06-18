window.seedFirestore = async function () {
  const db = firebase.firestore();

  const USUARIOS_DEMO = [
    { email: 'admin@kiosco.com', password: 'admin123', nombre: 'Admin', rol: 'admin' },
    { email: 'kiosco@kiosco.com', password: 'kiosco123', nombre: 'Kiosco Central', rol: 'kiosquero', kioscoId: null },
    { email: 'padre@kiosco.com', password: 'padre123', nombre: 'Carlos Pérez', rol: 'padre', hijos: [] },
    { email: 'juan@kiosco.com', password: 'juan123', nombre: 'Juan Pérez', rol: 'alumno', codigoNumerico: '123456', saldo: 1500, productosBloqueados: [], congelado: false, padreId: null, escuelaId: null, kioscoId: null },
    { email: 'maria@kiosco.com', password: 'maria123', nombre: 'María Pérez', rol: 'alumno', codigoNumerico: '789012', saldo: 200, productosBloqueados: [], congelado: false, padreId: null, escuelaId: null, kioscoId: null },
  ];

  const PRODUCTOS_DEMO = [
    { nombre: 'Alfajor', precio: 800, categoria: 'Golosinas', kioscoId: null, codigoBarras: '7791234567890' },
    { nombre: 'Caramelo', precio: 100, categoria: 'Golosinas', kioscoId: null, codigoBarras: '7791234567891' },
    { nombre: 'Chicle', precio: 100, categoria: 'Golosinas', kioscoId: null, codigoBarras: '' },
    { nombre: 'Galletitas', precio: 500, categoria: 'Snacks', kioscoId: null, codigoBarras: '7791234567892' },
    { nombre: 'Papas Fritas', precio: 600, categoria: 'Snacks', kioscoId: null, codigoBarras: '7791234567893' },
    { nombre: 'Agua', precio: 400, categoria: 'Bebidas', kioscoId: null, codigoBarras: '7791234567894' },
    { nombre: 'Jugo', precio: 500, categoria: 'Bebidas', kioscoId: null, codigoBarras: '7791234567895' },
    { nombre: 'Gaseosa', precio: 700, categoria: 'Bebidas', kioscoId: null, codigoBarras: '7791234567896' },
    { nombre: 'Pizza', precio: 1500, categoria: 'Comida', kioscoId: null, codigoBarras: '' },
    { nombre: 'Sandwich', precio: 1200, categoria: 'Comida', kioscoId: null, codigoBarras: '' },
    { nombre: 'Empanada', precio: 500, categoria: 'Comida', kioscoId: null, codigoBarras: '' },
  ];

  const ESCUELAS_DEMO = [
    { nombre: 'Escuela Primaria N°1', activo: true },
    { nombre: 'Escuela Secundaria N°3', activo: true },
  ];

  const KIOSCOS_DEMO = [
    { nombre: 'Kiosco Central', escuelaId: null, activo: true },
    { nombre: 'Kiosco Secundaria', escuelaId: null, activo: true },
  ];

  const log = (msg) => console.log('✅ ' + msg);

  const escuelaIds = [];
  for (const e of ESCUELAS_DEMO) {
    const ref = await db.collection('escuelas').add(e);
    escuelaIds.push(ref.id);
    log(`Escuela: ${e.nombre}`);
  }

  const kioscoIds = [];
  for (let i = 0; i < KIOSCOS_DEMO.length; i++) {
    const k = { ...KIOSCOS_DEMO[i], escuelaId: escuelaIds[i] };
    const ref = await db.collection('kioscos').add(k);
    kioscoIds.push(ref.id);
    log(`Kiosco: ${k.nombre}`);
  }

  const userIds = [];
  for (const u of USUARIOS_DEMO) {
    try {
      const cred = await firebase.auth().createUserWithEmailAndPassword(u.email, u.password);
      const uid = cred.user.uid;
      userIds.push(uid);
      const profile = {
        email: u.email,
        nombre: u.nombre,
        rol: u.rol,
        activo: true,
        telefono: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      if (u.rol === 'kiosquero') profile.kioscoId = kioscoIds[0];
      if (u.rol === 'alumno') {
        profile.codigoNumerico = u.codigoNumerico;
        profile.saldo = u.saldo || 0;
        profile.productosBloqueados = u.productosBloqueados || [];
        profile.congelado = u.congelado || false;
        profile.escuelaId = escuelaIds[0];
        profile.kioscoId = kioscoIds[0];
        profile.limiteDiario = null;
        profile.codigoQR = uid;
      }
      await db.collection('usuarios').doc(uid).set(profile);
      log(`Usuario: ${u.email} (${u.rol}) — pass: ${u.password}`);

      await cred.user.sendEmailVerification().catch(() => {});
    } catch (e) {
      if (e.code === 'auth/email-already-in-use') {
        log(`Usuario ya existe: ${u.email} (omitido)`);
      } else {
        console.error(`❌ Error creando ${u.email}:`, e.message);
      }
    }
  }

  const padreId = userIds[2];
  const alumnoIds = userIds.slice(3);
  if (padreId && alumnoIds.length) {
    await db.collection('usuarios').doc(padreId).update({ hijos: alumnoIds });
    for (const aid of alumnoIds) {
      await db.collection('usuarios').doc(aid).update({ padreId });
    }
    log('Padre vinculado a hijos');
  }

  for (const p of PRODUCTOS_DEMO) {
    const prod = {
      ...p,
      kioscoId: kioscoIds[0],
      activo: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await db.collection('productos').add(prod);
    log(`Producto: ${p.nombre} — código: ${p.codigoBarras || '(sin código)'}`);
  }

  console.log('%c🎉 DATOS DE DEMO CREADOS EN FIRESTORE', 'font-size:1.3rem;font-weight:bold;color:#4F46E5');
  console.log('%c📌 Usuarios de prueba:', 'font-weight:bold');
  console.log('  admin@kiosco.com / admin123     (admin)');
  console.log('  kiosco@kiosco.com / kiosco123   (kiosquero)');
  console.log('  padre@kiosco.com  / padre123    (padre)');
  console.log('  juan@kiosco.com   / juan123     (alumno)');
  console.log('  maria@kiosco.com  / maria123    (alumno)');
};
