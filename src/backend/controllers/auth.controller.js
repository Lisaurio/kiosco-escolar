const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../models/db');
const { generateToken } = require('../auth');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }

    const database = db.getDb();
    const usuario = database.data.usuarios.find(u => u.email === email && u.activo);

    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    if (usuario.rol === 'alumno' && usuario.congelado) {
      return res.status(403).json({ error: 'Cuenta congelada. Contacta a tus padres.' });
    }

    const valid = await bcrypt.compare(password, usuario.password);
    if (!valid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = generateToken(usuario);

    database.data.auditoria.push({
      id: uuidv4(),
      usuarioId: usuario.id,
      accion: 'login',
      detalle: `Inicio de sesión: ${usuario.email}`,
      ip: req.ip,
      createdAt: new Date().toISOString()
    });
    await database.write();

    const userData = {
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      rol: usuario.rol,
      telefono: usuario.telefono
    };

    if (usuario.rol === 'padre') {
      userData.hijos = usuario.hijos || [];
    }
    if (usuario.rol === 'alumno') {
      userData.saldo = usuario.saldo;
      userData.congelado = usuario.congelado;
      userData.limiteDiario = usuario.limiteDiario;
      userData.productosBloqueados = usuario.productosBloqueados;
      userData.codigoNumerico = usuario.codigoNumerico;
      userData.codigoQR = usuario.codigoQR;
    }
    if (usuario.rol === 'kiosquero') {
      userData.kioscoId = usuario.kioscoId;
    }

    res.json({
      token,
      user: userData
    });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
};

exports.register = async (req, res) => {
  try {
    const { email, password, nombre, telefono, rol } = req.body;

    if (!email || !password || !nombre || !rol) {
      return res.status(400).json({ error: 'Todos los campos requeridos' });
    }

    const rolesValidos = ['padre', 'kiosquero'];
    if (!rolesValidos.includes(rol)) {
      return res.status(400).json({ error: 'Rol inválido' });
    }

    const database = db.getDb();
    const existe = database.data.usuarios.find(u => u.email === email);
    if (existe) {
      return res.status(400).json({ error: 'El email ya está registrado' });
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

    if (rol === 'padre') {
      usuario.hijos = [];
    }

    database.data.usuarios.push(usuario);
    await database.write();

    const token = generateToken(usuario);

    const userData = {
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      rol: usuario.rol,
      telefono: usuario.telefono
    };
    if (usuario.rol === 'padre') userData.hijos = usuario.hijos || [];

    res.status(201).json({
      token,
      user: userData
    });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
};

exports.me = async (req, res) => {
  try {
    const database = db.getDb();
    const usuario = database.data.usuarios.find(u => u.id === req.user.id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const { password, ...userData } = usuario;
    res.json({ user: userData });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
};
