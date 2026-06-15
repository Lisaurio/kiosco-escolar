const router = require('express').Router();
const controller = require('../controllers/reportes.controller');
const { authMiddleware } = require('../auth');

router.get('/dashboard', authMiddleware(['admin', 'kiosquero']), controller.dashboard);
router.get('/estadisticas', authMiddleware(['admin']), controller.estadisticas);

module.exports = router;
