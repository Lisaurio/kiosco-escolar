const { v4: uuidv4 } = require('uuid');
const db = require('../models/db');
const webpush = require('web-push');

exports.registrar = async (req, res) => {
  try {
    const { alumnoId, productos } = req.body;

    if (!alumnoId || !productos || !productos.length) {
      return res.status(400).json({ error: 'Datos de compra inválidos' });
    }

    const database = db.getDb();
    const alumno = database.data.usuarios.find(u => u.id === alumnoId && u.rol === 'alumno');

    if (!alumno) {
      return res.status(404).json({ error: 'Alumno no encontrado' });
    }

    if (alumno.congelado) {
      return res.status(403).json({ error: 'Cuenta congelada' });
    }

    const hoy = new Date().toDateString();
    const gastadoHoy = database.data.compras
      .filter(c => c.alumnoId === alumnoId && new Date(c.createdAt).toDateString() === hoy)
      .reduce((sum, c) => sum + c.total, 0);

    let total = 0;
    const items = [];

    for (const item of productos) {
      const producto = database.data.productos.find(p => p.id === item.productoId && p.activo);
      if (!producto) continue;

      if (alumno.productosBloqueados && alumno.productosBloqueados.includes(producto.id)) {
        continue;
      }

      const cantidad = item.cantidad || 1;
      const subtotal = producto.precio * cantidad;
      total += subtotal;
      items.push({
        productoId: producto.id,
        nombre: producto.nombre,
        precio: producto.precio,
        cantidad
      });
    }

    if (items.length === 0) {
      return res.status(400).json({ error: 'No hay productos válidos para comprar' });
    }

    if (alumno.limiteDiario && (gastadoHoy + total) > alumno.limiteDiario) {
      return res.status(403).json({
        error: `Límite diario de $${alumno.limiteDiario.toLocaleString()} excedido. Gastado hoy: $${gastadoHoy.toLocaleString()}`
      });
    }

    if ((alumno.saldo || 0) < total) {
      return res.status(403).json({ error: 'Saldo insuficiente' });
    }

    alumno.saldo -= total;
    alumno.updatedAt = new Date().toISOString();

    const compra = {
      id: uuidv4(),
      alumnoId,
      kiosqueroId: req.user.id,
      items,
      total,
      createdAt: new Date().toISOString()
    };

    database.data.compras.push(compra);

    const padre = database.data.usuarios.find(u =>
      u.rol === 'padre' && u.hijos && u.hijos.includes(alumnoId)
    );

    if (padre) {
      const detalle = items.map(i => `- ${i.nombre} $${(i.precio * i.cantidad).toLocaleString()}`).join('\n');
      const notif = {
        id: uuidv4(),
        userId: padre.id,
        titulo: `${alumno.nombre} compró:`,
        mensaje: `${detalle}\n\nTotal: $${total.toLocaleString()}\nSaldo restante: $${alumno.saldo.toLocaleString()}`,
        leida: false,
        createdAt: new Date().toISOString()
      };
      database.data.notificaciones.push(notif);
    }

    database.data.auditoria.push({
      id: uuidv4(),
      usuarioId: req.user.id,
      accion: 'compra',
      detalle: `Compra de $${total.toLocaleString()} - Alumno: ${alumno.nombre}`,
      ip: req.ip,
      createdAt: new Date().toISOString()
    });

    await database.write();

    res.status(201).json({
      compra,
      saldoRestante: alumno.saldo,
      mensaje: 'Compra registrada exitosamente'
    });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
};

exports.historial = async (req, res) => {
  try {
    const database = db.getDb();
    const { alumnoId, kioscoId, desde, hasta } = req.query;
    let compras = [...database.data.compras];

    if (alumnoId) compras = compras.filter(c => c.alumnoId === alumnoId);
    if (desde) compras = compras.filter(c => new Date(c.createdAt) >= new Date(desde));
    if (hasta) compras = compras.filter(c => new Date(c.createdAt) <= new Date(hasta));

    compras.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const resultado = compras.map(c => {
      const alumno = database.data.usuarios.find(u => u.id === c.alumnoId);
      return { ...c, alumnoNombre: alumno ? alumno.nombre : 'Desconocido' };
    });

    res.json(resultado);
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
};

exports.ventasDia = async (req, res) => {
  try {
    const database = db.getDb();
    const hoy = new Date().toDateString();

    const ventasHoy = database.data.compras.filter(
      c => new Date(c.createdAt).toDateString() === hoy
    );

    const total = ventasHoy.reduce((sum, c) => sum + c.total, 0);
    const cantidad = ventasHoy.length;

    res.json({ total, cantidad, ventas: ventasHoy });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
};

exports.ranking = async (req, res) => {
  try {
    const database = db.getDb();
    const conteo = {};

    database.data.compras.forEach(c => {
      c.items.forEach(item => {
        if (!conteo[item.nombre]) {
          conteo[item.nombre] = { nombre: item.nombre, cantidad: 0, total: 0 };
        }
        conteo[item.nombre].cantidad += item.cantidad;
        conteo[item.nombre].total += item.precio * item.cantidad;
      });
    });

    const ranking = Object.values(conteo).sort((a, b) => b.cantidad - a.cantidad);
    res.json(ranking);
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
};
