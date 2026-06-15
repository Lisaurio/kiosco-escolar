const router = require('express').Router();
const controller = require('../controllers/escuelas.controller');
const { authMiddleware } = require('../auth');

router.get('/', authMiddleware(), controller.listar);
router.get('/:id', authMiddleware(), controller.obtener);
router.post('/', authMiddleware(['admin']), controller.crear);
router.put('/:id', authMiddleware(['admin']), controller.actualizar);
router.delete('/:id', authMiddleware(['admin']), controller.eliminar);

module.exports = router;
