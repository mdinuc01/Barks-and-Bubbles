const express = require('express');
const petController = require('../controllers/pet.controller.js');
const verifyToken = require('../middleware/authJwt.js');

const router = express.Router();
router.use(verifyToken)
router.get('/', petController.getAllClients);

router.post('/add', petController.createPet);

module.exports = router;
