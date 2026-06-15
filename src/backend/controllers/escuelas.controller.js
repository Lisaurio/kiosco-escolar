const { v4: uuidv4 } = require('uuid');
const db = require('../models/db');

exports.listar = async (req, res) => {
  try {
    const database = db.getDb();
    res.json(database.data.escuelas.filter(e => e.activo));
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
};

exports.obtener = async (req, res) => {
  try {
    const database = db.getDb();
    const escuela = database.data.escuelas.find(e => e.id === req.params.id);
    if (!escuela) return res.status(404).json({ error: 'Escuela no encontrada' });
    res.json(escuela);
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
};

exports.crear = async (req, res) => {
  try {
    const { nombre, direccion } = req.body;
    if (!nombre) return res.status(400).json({ error: 'Nombre requerido' });

    const escuela = {
      id: uuidv4(),
      nombre,
      direccion: direccion || '',
      activo: true,
      createdAt: new Date().toISOString()
    };

    const database = db.getDb();
    database.data.escuelas.push(escuela);
    await database.write();

    res.status(201).json(escuela);
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
};

exports.actualizar = async (req, res) => {
  try {
    const database = db.getDb();
    const idx = database.data.escuelas.findIndex(e => e.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Escuela no encontrada' });

    ['nombre', 'direccion', 'activo'].forEach(c => {
      if (req.body[c] !== undefined) database.data.escuelas[idx][c] = req.body[c];
    });

    await database.write();
    res.json(database.data.escuelas[idx]);
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
};

exports.eliminar = async (req, res) => {
  try {
    const database = db.getDb();
    const idx = database.data.escuelas.findIndex(e => e.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Escuela no encontrada' });

    database.data.escuelas[idx].activo = false;
    await database.write();

    res.json({ mensaje: 'Escuela eliminada' });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
};
