const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../models/db');

exports.listar = async (req, res) => {
  try {
    const database = db.getDb();
    const { rol, escuelaId, kioscoId } = req.query;
    let usuarios = database.data.usuarios.filter(u => u.activo);

    if (rol) usuarios = usuarios.filter(u => u.rol === rol);
    if (escuelaId) usuarios = usuarios.filter(u => u.escuelaId === escuelaId);
    if (kioscoId) usuarios = usuarios.filter(u => u.kioscoId === kioscoId);

    const sinPassword = usuarios.map(({ password, ...u }) => u);
    res.json(sinPassword);
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
};

exports.obtener = async (req, res) => {
  try {
    const database = db.getDb();
    const usuario = database.data.usuarios.find(u => u.id === req.params.id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    const { password, ...userData } = usuario;
    res.json(userData);
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
};

exports.crear = async (req, res) => {
  try {
    const { email, password, nombre, telefono, rol, escuelaId, kioscoId } = req.body;

    if (!email || !password || !nombre || !rol) {
      return res.status(400).json({ error: 'Campos requeridos faltantes' });
    }

    const database = db.getDb();
    const existe = database.data.usuarios.find(u => u.email === email);
    if (existe) {
      return res.status(400).json({ error: 'El email ya existe' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const usuario = {
      id: uuidv4(),
      email,
      password: hashedPassword,
      nombre,
      rol,
      telefono: telefono || '',
      activo: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (rol === 'alumno') {
      usuario.escuelaId = escuelaId || '';
      usuario.kioscoId = kioscoId || '';
      usuario.saldo = 0;
      usuario.limiteDiario = null;
      usuario.productosBloqueados = [];
      usuario.congelado = false;
      usuario.codigoQR = uuidv4();
      usuario.codigoNumerico = String(Math.floor(100000 + Math.random() * 900000));
    }

    if (rol === 'kiosquero') {
      usuario.kioscoId = kioscoId || '';
    }

    database.data.usuarios.push(usuario);
    await database.write();

    const { password: _, ...userData } = usuario;
    res.status(201).json(userData);
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
};

exports.actualizar = async (req, res) => {
  try {
    const database = db.getDb();
    const idx = database.data.usuarios.findIndex(u => u.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const campos = ['nombre', 'telefono', 'activo', 'escuelaId', 'kioscoId', 'saldo', 'limiteDiario', 'productosBloqueados', 'congelado'];
    campos.forEach(c => {
      if (req.body[c] !== undefined) {
        database.data.usuarios[idx][c] = req.body[c];
      }
    });

    if (req.body.password) {
      database.data.usuarios[idx].password = await bcrypt.hash(req.body.password, 10);
    }

    if (database.data.usuarios[idx].rol === 'padre' && req.body.agregarHijo) {
      if (!database.data.usuarios[idx].hijos.includes(req.body.agregarHijo)) {
        database.data.usuarios[idx].hijos.push(req.body.agregarHijo);
      }
    }

    database.data.usuarios[idx].updatedAt = new Date().toISOString();
    await database.write();

    const { password, ...userData } = database.data.usuarios[idx];
    res.json(userData);
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
};

exports.eliminar = async (req, res) => {
  try {
    const database = db.getDb();
    const idx = database.data.usuarios.findIndex(u => u.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    database.data.usuarios[idx].activo = false;
    database.data.usuarios[idx].updatedAt = new Date().toISOString();
    await database.write();

    res.json({ mensaje: 'Usuario eliminado' });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
};

exports.cargarSaldo = async (req, res) => {
  try {
    const { alumnoId, monto } = req.body;
    if (!alumnoId || !monto || monto <= 0) {
      return res.status(400).json({ error: 'Datos inválidos' });
    }

    const database = db.getDb();
    const alumno = database.data.usuarios.find(u => u.id === alumnoId && u.rol === 'alumno');
    if (!alumno) {
      return res.status(404).json({ error: 'Alumno no encontrado' });
    }

    alumno.saldo = (alumno.saldo || 0) + monto;
    alumno.updatedAt = new Date().toISOString();
    await database.write();

    res.json({ saldo: alumno.saldo, mensaje: `Saldo cargado: $${monto.toLocaleString()}` });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
};
