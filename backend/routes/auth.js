const express = require('express');
const AuthController = require("../controllers/auth.controller.js");

const router = express.Router();

router.post("/signup", AuthController.signup);
router.post("/signin", AuthController.signIn)

module.exports = router;