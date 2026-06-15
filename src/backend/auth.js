const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'k1osc0_esc0l4r_s3cr3t_k3y_2026';

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, rol: user.rol, nombre: user.nombre },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

function authMiddleware(rolesPermitidos = []) {
  return (req, res, next) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token requerido' });
    }

    const token = header.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;

      if (rolesPermitidos.length > 0 && !rolesPermitidos.includes(req.user.rol)) {
        return res.status(403).json({ error: 'No tienes permisos para esta acción' });
      }

      next();
    } catch (err) {
      return res.status(401).json({ error: 'Token inválido o expirado' });
    }
  };
}

module.exports = { generateToken, authMiddleware, JWT_SECRET };
