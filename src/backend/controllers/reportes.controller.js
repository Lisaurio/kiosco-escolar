const db = require('../models/db');

exports.dashboard = async (req, res) => {
  try {
    const database = db.getDb();
    const ahora = new Date();
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const hoy = ahora.toDateString();

    const ventasHoy = database.data.compras
      .filter(c => new Date(c.createdAt).toDateString() === hoy)
      .reduce((sum, c) => sum + c.total, 0);

    const ventasMes = database.data.compras
      .filter(c => new Date(c.createdAt) >= inicioMes)
      .reduce((sum, c) => sum + c.total, 0);

    const totalCargado = database.data.usuarios
      .filter(u => u.rol === 'alumno')
      .reduce((sum, u) => sum + (u.saldo || 0), 0);

    const alumnosActivos = database.data.usuarios.filter(
      u => u.rol === 'alumno' && u.activo && !u.congelado
    ).length;

    const conteo = {};
    database.data.compras.forEach(c => {
      c.items.forEach(item => {
        if (!conteo[item.nombre]) conteo[item.nombre] = 0;
        conteo[item.nombre] += item.cantidad;
      });
    });
    const masVendidos = Object.entries(conteo)
      .map(([nombre, cantidad]) => ({ nombre, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 10);

    const comprasCount = database.data.compras
      .filter(c => new Date(c.createdAt).toDateString() === hoy).length;

    res.json({
      ventasHoy,
      ventasMes,
      totalCargado,
      alumnosActivos,
      masVendidos,
      comprasCount
    });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
};

exports.estadisticas = async (req, res) => {
  try {
    const database = db.getDb();
    const { desde, hasta } = req.query;

    let compras = [...database.data.compras];
    if (desde) compras = compras.filter(c => new Date(c.createdAt) >= new Date(desde));
    if (hasta) compras = compras.filter(c => new Date(c.createdAt) <= new Date(hasta));

    const ventasPorDia = {};
    compras.forEach(c => {
      const dia = new Date(c.createdAt).toDateString();
      if (!ventasPorDia[dia]) ventasPorDia[dia] = 0;
      ventasPorDia[dia] += c.total;
    });

    const totalVentas = compras.reduce((sum, c) => sum + c.total, 0);
    const totalCompras = compras.length;

    const porEscuela = {};
    compras.forEach(c => {
      const alumno = database.data.usuarios.find(u => u.id === c.alumnoId);
      if (alumno) {
        const escuela = database.data.escuelas.find(e => e.id === alumno.escuelaId);
        const nombre = escuela ? escuela.nombre : 'Sin escuela';
        if (!porEscuela[nombre]) porEscuela[nombre] = 0;
        porEscuela[nombre] += c.total;
      }
    });

    res.json({
      totalVentas,
      totalCompras,
      ventasPorDia,
      porEscuela
    });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
};
