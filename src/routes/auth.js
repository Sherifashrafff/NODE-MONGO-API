const { Router } = require('express');
const { register } = require('../controllers/authController');
const { validateRegister } = require('../validators/authValidator');

const router = Router();

router.post('/register', validateRegister, register);

module.exports = router;
