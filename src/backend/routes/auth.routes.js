const router = require('express').Router();
const controller = require('../controllers/auth.controller');
const { authMiddleware } = require('../auth');

router.post('/login', controller.login);
router.post('/register', controller.register);
router.get('/me', authMiddleware(), controller.me);

module.exports = router;
