const express = require('express');
const petController = require('../controllers/pet.controller.js');

const router = express.Router();

router.get('/', petController.getAllClients);

router.post('/add', petController.createPet);

module.exports = router;
