const router = require('express').Router();
const controller = require('../controllers/compras.controller');
const { authMiddleware } = require('../auth');

router.post('/', authMiddleware(['kiosquero']), controller.registrar);
router.get('/', authMiddleware(), controller.historial);
router.get('/ventas-dia', authMiddleware(['kiosquero', 'admin']), controller.ventasDia);
router.get('/ranking', authMiddleware(['kiosquero', 'admin']), controller.ranking);

module.exports = router;
