const express = require('express');
const AuthController = require("../controllers/auth.controller.js");
const loginLimiter = require('../middleware/loginLimiter.js');

const router = express.Router();

router.post("/signup", AuthController.signup);
router.post("/signin", loginLimiter, AuthController.signIn)

module.exports = router;