const router = require('express').Router();
const controller = require('../controllers/usuarios.controller');
const { authMiddleware } = require('../auth');

router.get('/', authMiddleware(['admin', 'kiosquero']), controller.listar);
router.get('/:id', authMiddleware(), controller.obtener);
router.post('/', authMiddleware(['admin']), controller.crear);
router.put('/:id', authMiddleware(), controller.actualizar);
router.delete('/:id', authMiddleware(['admin']), controller.eliminar);
router.post('/cargar-saldo', authMiddleware(['padre', 'admin']), controller.cargarSaldo);

module.exports = router;
