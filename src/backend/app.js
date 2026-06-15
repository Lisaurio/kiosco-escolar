const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./models/db');

const authRoutes = require('./routes/auth.routes');
const usuariosRoutes = require('./routes/usuarios.routes');
const productosRoutes = require('./routes/productos.routes');
const comprasRoutes = require('./routes/compras.routes');
const escuelasRoutes = require('./routes/escuelas.routes');
const kioscosRoutes = require('./routes/kioscos.routes');
const notificacionesRoutes = require('./routes/notificaciones.routes');
const reportesRoutes = require('./routes/reportes.routes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, '../frontend')));

app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/compras', comprasRoutes);
app.use('/api/escuelas', escuelasRoutes);
app.use('/api/kioscos', kioscosRoutes);
app.use('/api/notificaciones', notificacionesRoutes);
app.use('/api/reportes', reportesRoutes);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

module.exports = app;
