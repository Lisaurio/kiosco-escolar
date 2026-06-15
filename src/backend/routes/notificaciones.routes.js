const router = require('express').Router();
const controller = require('../controllers/notificaciones.controller');
const { authMiddleware } = require('../auth');

router.get('/', authMiddleware(), controller.listar);
router.get('/no-leidas', authMiddleware(), controller.noLeidas);
router.put('/:id/leida', authMiddleware(), controller.marcarLeida);
router.post('/suscribir', authMiddleware(), controller.suscribir);

module.exports = router;
