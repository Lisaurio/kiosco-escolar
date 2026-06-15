const { v4: uuidv4 } = require('uuid');
const db = require('../models/db');

exports.listar = async (req, res) => {
  try {
    const database = db.getDb();
    const { kioscoId, activo, categoria } = req.query;
    let productos = [...database.data.productos];

    if (kioscoId) productos = productos.filter(p => p.kioscoId === kioscoId);
    if (activo !== undefined) productos = productos.filter(p => p.activo === (activo === 'true'));
    if (categoria) productos = productos.filter(p => p.categoria === categoria);

    res.json(productos);
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
};

exports.obtener = async (req, res) => {
  try {
    const database = db.getDb();
    const producto = database.data.productos.find(p => p.id === req.params.id);
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(producto);
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
};

exports.crear = async (req, res) => {
  try {
    const { nombre, categoria, precio, kioscoId } = req.body;
    if (!nombre || !categoria || !precio || !kioscoId) {
      return res.status(400).json({ error: 'Campos requeridos: nombre, categoria, precio, kioscoId' });
    }

    const producto = {
      id: uuidv4(),
      nombre,
      categoria,
      precio: Number(precio),
      foto: req.body.foto || '',
      activo: true,
      kioscoId,
      createdAt: new Date().toISOString()
    };

    const database = db.getDb();
    database.data.productos.push(producto);
    await database.write();

    res.status(201).json(producto);
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
};

exports.actualizar = async (req, res) => {
  try {
    const database = db.getDb();
    const idx = database.data.productos.findIndex(p => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Producto no encontrado' });

    const campos = ['nombre', 'categoria', 'precio', 'foto', 'activo'];
    campos.forEach(c => {
      if (req.body[c] !== undefined) {
        database.data.productos[idx][c] = req.body[c];
      }
    });

    await database.write();
    res.json(database.data.productos[idx]);
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
};

exports.eliminar = async (req, res) => {
  try {
    const database = db.getDb();
    const idx = database.data.productos.findIndex(p => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Producto no encontrado' });

    database.data.productos[idx].activo = false;
    await database.write();

    res.json({ mensaje: 'Producto desactivado' });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
};

exports.categorias = async (req, res) => {
  try {
    const database = db.getDb();
    const categorias = [...new Set(database.data.productos.map(p => p.categoria))];
    res.json(categorias);
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
};
