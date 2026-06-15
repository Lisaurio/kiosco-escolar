const { v4: uuidv4 } = require('uuid');
const db = require('../models/db');

exports.listar = async (req, res) => {
  try {
    const database = db.getDb();
    const { escuelaId } = req.query;
    let kioscos = database.data.kioscos.filter(k => k.activo);
    if (escuelaId) kioscos = kioscos.filter(k => k.escuelaId === escuelaId);
    res.json(kioscos);
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
};

exports.obtener = async (req, res) => {
  try {
    const database = db.getDb();
    const kiosco = database.data.kioscos.find(k => k.id === req.params.id);
    if (!kiosco) return res.status(404).json({ error: 'Kiosco no encontrado' });
    res.json(kiosco);
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
};

exports.crear = async (req, res) => {
  try {
    const { nombre, escuelaId } = req.body;
    if (!nombre || !escuelaId) return res.status(400).json({ error: 'Nombre y escuela requeridos' });

    const kiosco = {
      id: uuidv4(),
      nombre,
      escuelaId,
      activo: true,
      createdAt: new Date().toISOString()
    };

    const database = db.getDb();
    database.data.kioscos.push(kiosco);
    await database.write();

    res.status(201).json(kiosco);
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
};

exports.actualizar = async (req, res) => {
  try {
    const database = db.getDb();
    const idx = database.data.kioscos.findIndex(k => k.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Kiosco no encontrado' });

    ['nombre', 'escuelaId', 'activo'].forEach(c => {
      if (req.body[c] !== undefined) database.data.kioscos[idx][c] = req.body[c];
    });

    await database.write();
    res.json(database.data.kioscos[idx]);
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
};

exports.eliminar = async (req, res) => {
  try {
    const database = db.getDb();
    const idx = database.data.kioscos.findIndex(k => k.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Kiosco no encontrado' });

    database.data.kioscos[idx].activo = false;
    await database.write();

    res.json({ mensaje: 'Kiosco eliminado' });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
};
