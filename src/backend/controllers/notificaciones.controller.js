const db = require('../models/db');

exports.listar = async (req, res) => {
  try {
    const database = db.getDb();
    const notificaciones = database.data.notificaciones
      .filter(n => n.userId === req.user.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(notificaciones);
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
};

exports.marcarLeida = async (req, res) => {
  try {
    const database = db.getDb();
    const idx = database.data.notificaciones.findIndex(
      n => n.id === req.params.id && n.userId === req.user.id
    );
    if (idx === -1) return res.status(404).json({ error: 'Notificación no encontrada' });

    database.data.notificaciones[idx].leida = true;
    await database.write();

    res.json({ mensaje: 'Notificación marcada como leída' });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
};

exports.noLeidas = async (req, res) => {
  try {
    const database = db.getDb();
    const count = database.data.notificaciones.filter(
      n => n.userId === req.user.id && !n.leida
    ).length;
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
};

exports.suscribir = async (req, res) => {
  try {
    const database = db.getDb();
    const idx = database.data.usuarios.findIndex(u => u.id === req.user.id);
    if (idx === -1) return res.status(404).json({ error: 'Usuario no encontrado' });

    database.data.usuarios[idx].pushSubscription = req.body;
    await database.write();

    res.json({ mensaje: 'Suscripción registrada' });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
};
