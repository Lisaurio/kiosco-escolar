const router = require('express').Router();
const controller = require('../controllers/productos.controller');
const { authMiddleware } = require('../auth');

router.get('/', authMiddleware(), controller.listar);
router.get('/categorias', authMiddleware(), controller.categorias);
router.get('/:id', authMiddleware(), controller.obtener);
router.post('/', authMiddleware(['admin', 'kiosquero']), controller.crear);
router.put('/:id', authMiddleware(['admin', 'kiosquero']), controller.actualizar);
router.delete('/:id', authMiddleware(['admin']), controller.eliminar);

module.exports = router;
